import React, { useState, useEffect, useRef } from 'react';
import { Sidebar, SavedConversation } from './components/Sidebar';
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
import { sendChatMessage, checkBackendHealth, checkRequestStatus } from './services/api';

const STORAGE_KEY = 'skylark_saved_conversations';
const ACTIVE_REQ_KEY = 'skylark_active_request';

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
  const [loadingStatusText, setLoadingStatusText] = useState<string>('Analyzing your business data...');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [activeMetadata, setActiveMetadata] = useState<ChatResponse | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Workspace Views: 'ask' (default AI chat) | 'home' | 'pipeline' | 'sectors' | 'leadership'
  const [activeTab, setActiveTab] = useState<string>('ask');

  // Synchronously initialize saved conversations from localStorage to prevent wiping on reload
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to load saved conversations from localStorage', e);
      return [];
    }
  });

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

  // Poll backend health
  useEffect(() => {
    checkBackendHealth().then(setHealth);
    const interval = setInterval(() => {
      checkBackendHealth().then(setHealth);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Interrupted Request Recovery on Page Reload
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ACTIVE_REQ_KEY);
      if (raw) {
        const reqData = JSON.parse(raw);
        if (reqData && reqData.query && (reqData.status === 'loading' || reqData.status === 'retrying' || reqData.status === 'connecting')) {
          console.log('Interrupted request detected on mount. Recovering...', reqData);
          
          if (reqData.requestId) {
            checkRequestStatus(reqData.requestId).then(res => {
              if (res.status === 'completed' && res.response) {
                const assistantMsg: Message = {
                  id: (Date.now() + 1).toString(),
                  role: 'assistant',
                  content: res.response.answer,
                  responseMetadata: res.response,
                  timestamp: new Date().toISOString(),
                };
                setMessages(prev => {
                  const existingUser = prev.some(m => m.content === reqData.query);
                  if (!existingUser) {
                    return [...prev, { id: Date.now().toString(), role: 'user', content: reqData.query, timestamp: new Date().toISOString() }, assistantMsg];
                  }
                  return [...prev, assistantMsg];
                });
                localStorage.removeItem(ACTIVE_REQ_KEY);
              } else {
                // Resume query smoothly
                handleSendMessage(reqData.query, reqData.requestId);
              }
            });
          } else {
            handleSendMessage(reqData.query);
          }
        }
      }
    } catch (e) {
      console.error('Failed to recover request on reload', e);
    }
  }, []);

  // Persist conversations helper with functional update & safety fallback
  const persistConversations = (list: SavedConversation[]) => {
    setSavedConversations(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to persist conversations', e);
    }
  };

  // Save current conversation session safely without losing existing conversations
  const saveConversationSession = (newMessages: Message[], convId: string | null) => {
    if (newMessages.length === 0) return;

    const id = convId || Date.now().toString();

    setSavedConversations(prevList => {
      let currentList = prevList;
      if (currentList.length === 0) {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) currentList = JSON.parse(raw);
        } catch (e) {}
      }

      const existing = currentList.find(c => c.id === id);
      const firstUserMsg = newMessages.find(m => m.role === 'user');
      const title = existing ? existing.title : (firstUserMsg ? generateTitle(firstUserMsg.content) : 'BI Analysis');

      const updatedItem: SavedConversation = {
        id,
        title,
        pinned: existing?.pinned || false,
        archived: existing?.archived || false,
        timestamp: new Date().toISOString(),
        messages: newMessages,
      };

      const filtered = currentList.filter(c => c.id !== id);
      const updatedList = [updatedItem, ...filtered].slice(0, 20);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      } catch (e) {
        console.error('Failed to persist conversations', e);
      }

      return updatedList;
    });

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
    localStorage.removeItem(ACTIVE_REQ_KEY);
  };

  const handleSendMessage = async (query: string, existingRequestId?: string) => {
    if (!query || !query.trim() || (isLoading && !existingRequestId)) return;

    if (activeTab !== 'ask') {
      setActiveTab('ask');
    }

    const requestId = existingRequestId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req_${Date.now()}`);

    // Check if user message is already in thread
    const userAlreadyInThread = messages.some(m => m.content.trim() === query.trim());
    let nextMessages = messages;

    if (!userAlreadyInThread) {
      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: query.trim(),
        timestamp: new Date().toISOString(),
      };
      nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
    }

    setIsLoading(true);
    setLoadingStatusText('Analyzing your business data...');

    // Persist active request to localStorage for page reload resilience
    localStorage.setItem(ACTIVE_REQ_KEY, JSON.stringify({
      requestId,
      conversationId: activeConversationId,
      query: query.trim(),
      status: 'loading',
      timestamp: new Date().toISOString()
    }));

    // Cold start status timer
    const coldStartTimer = setTimeout(() => {
      setLoadingStatusText("Connecting to Skylark's analysis service...");
    }, 4000);

    const longWaitTimer = setTimeout(() => {
      setLoadingStatusText("Analysis is taking a little longer than usual...");
    }, 8000);

    abortControllerRef.current = new AbortController();

    try {
      const response: ChatResponse = await sendChatMessage(
        query.trim(),
        messages,
        abortControllerRef.current.signal,
        requestId,
        (msg) => setLoadingStatusText(msg)
      );

      clearTimeout(coldStartTimer);
      clearTimeout(longWaitTimer);

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
      localStorage.removeItem(ACTIVE_REQ_KEY);
    } catch (err: any) {
      clearTimeout(coldStartTimer);
      clearTimeout(longWaitTimer);

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
        localStorage.removeItem(ACTIVE_REQ_KEY);
      } else {
        // Perform backend health check before deciding error type
        const currentHealth = await checkBackendHealth();
        const isBackendUp = currentHealth.status === 'healthy' || currentHealth.status === 'degraded' || currentHealth.monday_connected;

        let errorText = "Analysis was interrupted. You can retry.";
        if (!isBackendUp) {
          errorText = "The analysis service is currently unavailable.";
        }

        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: errorText,
          error: true,
          timestamp: new Date().toISOString(),
        };
        const finalMessages = [...nextMessages, errorMsg];
        setMessages(finalMessages);
        saveConversationSession(finalMessages, activeConversationId);
        localStorage.removeItem(ACTIVE_REQ_KEY);
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
    localStorage.removeItem(ACTIVE_REQ_KEY);
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
        onSelectPrompt={(prompt) => handleSendMessage(prompt)}
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
        {activeTab === 'home' && (
          <OverviewView 
            health={health}
            onLaunchQuery={(query: string) => handleSendMessage(query)} 
          />
        )}
        {activeTab === 'pipeline' && (
          <PipelineView onLaunchQuery={(query: string) => handleSendMessage(query)} />
        )}
        {activeTab === 'sectors' && (
          <SectorsView onLaunchQuery={(query: string) => handleSendMessage(query)} />
        )}
        {activeTab === 'leadership' && (
          <LeadershipView onLaunchQuery={(query: string) => handleSendMessage(query)} />
        )}
        {activeTab === 'ask' && (
          <ChatInterface
            messages={messages}
            isLoading={isLoading}
            loadingStatusText={loadingStatusText}
            onSendMessage={(query: string) => handleSendMessage(query)}
            onStopGeneration={handleStopGeneration}
            onInspectMetadata={handleInspectMetadata}
            inputRef={chatInputRef}
          />
        )}
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
