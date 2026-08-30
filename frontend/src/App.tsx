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
  if (q.includes('pipeline') || q.includes('funnel')) return 'Pipeline performance';
  if (q.includes('sector') || q.includes('energy')) return 'Energy sector analysis';
  if (q.includes('opportunity') || q.includes('opportunities')) return 'High-probability deals';
  if (q.includes('work order') || q.includes('active work')) return 'Active operations';
  if (q.includes('leadership') || q.includes('executive')) return 'Leadership brief';
  if (q.includes('billing') || q.includes('collection')) return 'Billing & cash';
  
  const words = question.trim().split(' ');
  return words.slice(0, 3).join(' ') + (words.length > 3 ? '...' : '');
}

export const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [activeMetadata, setActiveMetadata] = useState<ChatResponse | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Workspace Views: 'home' | 'ask' | 'pipeline' | 'sectors' | 'leadership'
  const [activeTab, setActiveTab] = useState<string>('ask');

  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Command Palette & Modals State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<SavedConversation | null>(null);
  const [renameCandidate, setRenameCandidate] = useState<SavedConversation | null>(null);

  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);

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

    try {
      const response: ChatResponse = await sendChatMessage(query.trim(), messages);

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
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setActiveTab('ask');
    setMessages([]);
    setIsLoading(false);
    setActiveMetadata(null);
    setIsDrawerOpen(false);
    setActiveConversationId(null);
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 50);
  };

  const handleNavigateHome = () => {
    setActiveTab('home');
  };

  const handleSelectSavedConversation = (conv: SavedConversation) => {
    setActiveTab('ask');
    setMessages(conv.messages || []);
    setActiveConversationId(conv.id);
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 50);
  };

  const handleTogglePinConversation = (id: string) => {
    const list = savedConversations.map(c => 
      c.id === id ? { ...c, pinned: !c.pinned } : c
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
    <div className="flex h-screen bg-[#080c14] text-slate-100 font-sans overflow-hidden">
      
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
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header */}
        <Header 
          health={health} 
          onNewChat={handleNewChat} 
          onNavigateHome={handleNavigateHome}
        />

        {/* Dynamic Workspace Views */}
        <main className="flex-1 overflow-hidden flex flex-col relative bg-[#080c14]">
          {activeTab === 'home' ? (
            <OverviewView health={health} onLaunchQuery={handleSendMessage} />
          ) : activeTab === 'pipeline' ? (
            <PipelineView onLaunchQuery={handleSendMessage} />
          ) : activeTab === 'sectors' ? (
            <SectorsView onLaunchQuery={handleSendMessage} />
          ) : activeTab === 'leadership' ? (
            <LeadershipView onLaunchQuery={handleSendMessage} />
          ) : (
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              onInspectMetadata={handleInspectMetadata}
              inputRef={chatInputRef}
            />
          )}
        </main>
      </div>

      {/* Analysis Side Panel */}
      <MetadataDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        metadata={activeMetadata}
      />

      {/* Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateHome={handleNavigateHome}
        onNewChat={handleNewChat}
        onSelectTab={(tab) => setActiveTab(tab)}
        savedConversations={savedConversations}
        onSelectSavedConversation={handleSelectSavedConversation}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteCandidate}
        title="Delete Conversation?"
        message={`This conversation "${deleteCandidate?.title || ''}" will be permanently removed.`}
        confirmText="Delete Permanently"
        onConfirm={handleDeleteConversation}
        onCancel={() => setDeleteCandidate(null)}
      />

      {/* Rename Conversation Modal */}
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
