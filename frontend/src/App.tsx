import React, { useState, useEffect, useRef } from 'react';
import { Sidebar, SavedConversation } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewView } from './components/views/OverviewView';
import { PipelineView } from './components/views/PipelineView';
import { SectorsView } from './components/views/SectorsView';
import { LeadershipView } from './components/views/LeadershipView';
import { ChatInterface } from './components/ChatInterface';
import { MetadataDrawer } from './components/MetadataDrawer';
import { CommandPalette } from './components/CommandPalette';
import { ConfirmModal } from './components/ConfirmModal';
import { RenameModal } from './components/RenameModal';
import { Message, ChatResponse, HealthResponse } from './types';
import { sendChatMessage, checkBackendHealth } from './services/api';

const STORAGE_KEY = 'skylark_saved_conversations';

function generateTitle(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('pipeline') || q.includes('funnel')) return 'Pipeline Review';
  if (q.includes('high-value') || q.includes('high value') || (q.includes('deal') && q.includes('risk')) || q.includes('vulnerable')) return 'High-Value Deal Risks';
  if (q.includes('energy') && q.includes('sector')) return 'Energy Sector Analysis';
  if (q.includes('sector') || q.includes('sectors')) return 'Sector Analysis';
  if (q.includes('opportunity') || q.includes('opportunities')) return 'Opportunity Analysis';
  if (q.includes('work order') || q.includes('active work') || q.includes('operation')) return 'Active Operations';
  if (q.includes('leadership') || q.includes('brief') || q.includes('executive')) return 'Leadership Brief';
  if (q.includes('billing') || q.includes('collection') || q.includes('pending')) return 'Billing & Receivables';
  
  const words = question.trim().split(' ');
  return words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '');
}

export const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [activeMetadata, setActiveMetadata] = useState<ChatResponse | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Workspace Views: 'ask' (default AI chat) | 'home' | 'pipeline' | 'sectors' | 'leadership'
  const [activeTab, setActiveTab] = useState<string>('ask');

  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Command Palette & Modals State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<SavedConversation | null>(null);
  const [renameCandidate, setRenameCandidate] = useState<SavedConversation | null>(null);

  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Global Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load saved conversations on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSavedConversations(JSON.parse(raw));
      }
    } catch (e) {
      console.error('Failed to load saved conversations', e);
    }
  }, []);

  // Poll backend health
  useEffect(() => {
    checkBackendHealth().then(setHealth);
    const interval = setInterval(() => {
      checkBackendHealth().then(setHealth);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Persist conversations helper
  const persistConversations = (list: SavedConversation[]) => {
    setSavedConversations(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to persist conversations', e);
    }
  };

  // Save current conversation session
  const saveConversationSession = (newMessages: Message[], convId: string | null) => {
    if (newMessages.length === 0) return;

    const id = convId || Date.now().toString();
    const existing = savedConversations.find(c => c.id === id);
    const firstUserMsg = newMessages.find(m => m.role === 'user');
    const title = existing ? existing.title : (firstUserMsg ? generateTitle(firstUserMsg.content) : 'BI Analysis');

    const updatedItem: SavedConversation = {
      id,
      title,
      pinned: existing?.pinned || false,
      timestamp: new Date().toISOString(),
      messages: newMessages,
    };

    const filtered = savedConversations.filter(c => c.id !== id);
    const list = [updatedItem, ...filtered].slice(0, 20);
    persistConversations(list);

    if (!activeConversationId) {
      setActiveConversationId(id);
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  const handleSendMessage = async (query: string) => {
    if (!query || !query.trim() || isLoading) return;

    if (activeTab !== 'ask') {
      setActiveTab('ask');
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query.trim(),
      timestamp: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      const response: ChatResponse = await sendChatMessage(query.trim(), messages, abortControllerRef.current.signal);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        responseMetadata: response,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...nextMessages, assistantMsg];
      setMessages(finalMessages);
      saveConversationSession(finalMessages, activeConversationId);
    } catch (err: any) {
      if (err.message === 'Generation stopped by user.') {
        const stoppedMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '⏹️ *Generation stopped by user.*',
          timestamp: new Date().toISOString(),
        };
        const finalMessages = [...nextMessages, stoppedMsg];
        setMessages(finalMessages);
        saveConversationSession(finalMessages, activeConversationId);
      } else {
        const cleanErrorDetail = typeof err.message === 'string' && err.message.trim()
          ? err.message
          : 'The BI service could not process this request. Please verify server status.';

        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ **Unable to complete the analysis**\n\n${cleanErrorDetail}\n\nPlease verify that your backend server is running.`,
          error: true,
          timestamp: new Date().toISOString(),
        };
        const finalMessages = [...nextMessages, errorMsg];
        setMessages(finalMessages);
        saveConversationSession(finalMessages, activeConversationId);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleNewChat = () => {
    setActiveTab('ask');
    setMessages([]);
    setActiveConversationId(null);
  };

  const handleNavigateHome = () => {
    setActiveTab('home');
  };

  const handleSelectSavedConversation = (conv: SavedConversation) => {
    setActiveTab('ask');
    setActiveConversationId(conv.id);
    setMessages(conv.messages || []);
  };

  const handleTogglePinConversation = (id: string) => {
    const list = savedConversations.map(c => 
      c.id === id ? { ...c, pinned: !c.pinned } : c
    );
    persistConversations(list);
  };

  const handleToggleArchiveConversation = (id: string) => {
    const list = savedConversations.map(c => 
      c.id === id ? { ...c, archived: !c.archived } : c
    );
    persistConversations(list);
  };

  const handleRenameConversation = (newTitle: string) => {
    if (!renameCandidate) return;
    const list = savedConversations.map(c =>
      c.id === renameCandidate.id ? { ...c, title: newTitle } : c
    );
    persistConversations(list);
    setRenameCandidate(null);
  };

  const handleDeleteConversation = () => {
    if (!deleteCandidate) return;
    const list = savedConversations.filter(c => c.id !== deleteCandidate.id);
    persistConversations(list);

    if (activeConversationId === deleteCandidate.id) {
      handleNewChat();
    }
    setDeleteCandidate(null);
  };

  const handleInspectMetadata = (meta: ChatResponse) => {
    setActiveMetadata(meta);
    setIsDrawerOpen(true);
  };

  return (
    <div className="flex h-screen bg-[#f3eee6] text-[#211a17] font-sans overflow-hidden">
      
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
        onSelectPrompt={handleSendMessage}
        onNewChat={handleNewChat}
        onNavigateHome={handleNavigateHome}
        savedConversations={savedConversations}
        activeConversationId={activeConversationId}
        onSelectSavedConversation={handleSelectSavedConversation}
        onTogglePinConversation={handleTogglePinConversation}
        onRenameConversation={(conv) => setRenameCandidate(conv)}
        onDeleteConversation={(conv) => setDeleteCandidate(conv)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onToggleArchiveConversation={handleToggleArchiveConversation}
      />

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden flex flex-col relative bg-[#f3eee6]">
          <ChatInterface
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onStopGeneration={handleStopGeneration}
            onInspectMetadata={handleInspectMetadata}
            inputRef={chatInputRef}
          />
        </main>

      {/* Audit & Explainability Metadata Slide-over Drawer */}
      <MetadataDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        metadata={activeMetadata}
      />

      {/* Global Cmd+K Search Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateHome={handleNavigateHome}
        onNewChat={handleNewChat}
        onSelectTab={setActiveTab}
        savedConversations={savedConversations}
        onSelectSavedConversation={handleSelectSavedConversation}
      />

      {/* Confirmation Modal for Deleting Conversation */}
      <ConfirmModal
        isOpen={!!deleteCandidate}
        title="Delete Conversation"
        message={`Are you sure you want to delete "${deleteCandidate?.title}"? This action cannot be undone.`}
        onConfirm={handleDeleteConversation}
        onCancel={() => setDeleteCandidate(null)}
      />

      {/* Modal for Renaming Conversation */}
      <RenameModal
        isOpen={!!renameCandidate}
        initialTitle={renameCandidate?.title || ''}
        onSave={handleRenameConversation}
        onCancel={() => setRenameCandidate(null)}
      />

    </div>
  );
};

export default App;
