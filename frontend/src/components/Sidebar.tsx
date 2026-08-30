import React, { useState } from 'react';
import { 
  Home,
  Plus, 
  MessageSquare, 
  TrendingUp, 
  PieChart, 
  FileText, 
  Search,
  Star,
  MoreHorizontal,
  Edit2,
  Trash2,
  Database,
  Cpu,
  UserCheck
} from 'lucide-react';
import { HealthResponse } from '../types';

export interface SavedConversation {
  id: string;
  title: string;
  pinned?: boolean;
  timestamp: string;
  messages: any[];
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  health: HealthResponse | null;
  onSelectPrompt: (prompt: string) => void;
  onNewChat: () => void;
  onNavigateHome: () => void;
  savedConversations: SavedConversation[];
  activeConversationId: string | null;
  onSelectSavedConversation: (conv: SavedConversation) => void;
  onTogglePinConversation: (id: string) => void;
  onRenameConversation: (conv: SavedConversation) => void;
  onDeleteConversation: (conv: SavedConversation) => void;
  onOpenCommandPalette: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  health,
  onSelectPrompt,
  onNewChat,
  onNavigateHome,
  savedConversations,
  activeConversationId,
  onSelectSavedConversation,
  onTogglePinConversation,
  onRenameConversation,
  onDeleteConversation,
  onOpenCommandPalette
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const isMondayLive = health?.monday_connected;
  const groqModel = health?.details?.groq_model || 'openai/gpt-oss-120b';

  const filteredConversations = savedConversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter(c => c.pinned);
  const recentConversations = filteredConversations.filter(c => !c.pinned);

  return (
    <aside className="w-64 bg-[#0b0f19] border-r border-slate-800/60 flex flex-col h-full shrink-0 select-none text-slate-300 relative">
      
      {/* Brand Header */}
      <div 
        onClick={onNavigateHome}
        className="p-4 border-b border-slate-800/50 flex items-center justify-between cursor-pointer hover:bg-slate-900/40 transition-colors group"
      >
        <div>
          <h1 className="text-sm font-bold text-slate-100 tracking-tight group-hover:text-cyan-400 transition-colors">
            Skylark BI
          </h1>
          <p className="text-[11px] text-slate-400 font-sans">Executive Intelligence</p>
        </div>
      </div>

      {/* New Conversation Action & Cmd+K Quick Search */}
      <div className="p-3 space-y-2 border-b border-slate-800/50">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-xs font-medium text-white transition-all shadow-md shadow-cyan-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>New conversation</span>
        </button>

        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-900 border border-slate-800 text-[11px] text-slate-400 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Search className="w-3 h-3 text-slate-500" />
            <span>Search or jump...</span>
          </span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] font-mono text-slate-400 border border-slate-700">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Search Input Filter */}
      <div className="px-3 pt-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter conversations..."
          className="w-full bg-slate-950/60 text-slate-200 placeholder-slate-500 text-[11px] rounded-lg px-2.5 py-1.5 border border-slate-800/80 focus:border-cyan-500/60 focus:outline-none"
        />
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 text-xs">
        
        {/* PINNED CONVERSATIONS */}
        {pinnedConversations.length > 0 && (
          <div>
            <div className="px-2 mb-1 text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>Pinned</span>
            </div>
            <div className="space-y-0.5">
              {pinnedConversations.map((conv) => (
                <div key={conv.id} className="relative group/item">
                  <button
                    onClick={() => onSelectSavedConversation(conv)}
                    className={`w-full text-left truncate px-2.5 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between pr-7 ${
                      activeConversationId === conv.id && activeTab === 'ask'
                        ? 'bg-slate-800/90 text-slate-100 font-medium border border-slate-700/60'
                        : 'text-slate-300 hover:text-slate-100 hover:bg-slate-900/60'
                    }`}
                    title={conv.title}
                  >
                    <span className="truncate flex items-center gap-1.5">
                      <span className="text-amber-400 text-[10px]">★</span>
                      <span className="truncate">{conv.title}</span>
                    </span>
                  </button>

                  {/* ⋯ Context Menu Trigger */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(menuOpenId === conv.id ? null : conv.id);
                    }}
                    className="absolute right-1 top-1.5 p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 opacity-0 group-hover/item:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>

                  {/* Context Dropdown Menu */}
                  {menuOpenId === conv.id && (
                    <div className="absolute right-0 top-7 z-50 w-36 bg-[#0f1524] border border-slate-700 rounded-lg shadow-xl py-1 text-xs text-slate-200 animate-in fade-in duration-100">
                      <button
                        onClick={() => {
                          onRenameConversation(conv);
                          setMenuOpenId(null);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Edit2 className="w-3 h-3 text-cyan-400" /> Rename
                      </button>
                      <button
                        onClick={() => {
                          onTogglePinConversation(conv.id);
                          setMenuOpenId(null);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Star className="w-3 h-3 text-amber-400" /> Unpin
                      </button>
                      <button
                        onClick={() => {
                          onDeleteConversation(conv);
                          setMenuOpenId(null);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-rose-950/60 text-rose-300 flex items-center gap-2"
                      >
                        <Trash2 className="w-3 h-3 text-rose-400" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RECENT CONVERSATIONS */}
        {recentConversations.length > 0 && (
          <div>
            <div className="px-2 mb-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Recent
            </div>
            <div className="space-y-0.5">
              {recentConversations.map((conv) => (
                <div key={conv.id} className="relative group/item">
                  <button
                    onClick={() => onSelectSavedConversation(conv)}
                    className={`w-full text-left truncate px-2.5 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between pr-7 ${
                      activeConversationId === conv.id && activeTab === 'ask'
                        ? 'bg-slate-800/90 text-slate-100 font-medium border border-slate-700/60'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                    title={conv.title}
                  >
                    <span className="truncate">{conv.title}</span>
                  </button>

                  {/* ⋯ Context Menu Trigger */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(menuOpenId === conv.id ? null : conv.id);
                    }}
                    className="absolute right-1 top-1.5 p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 opacity-0 group-hover/item:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>

                  {/* Context Dropdown Menu */}
                  {menuOpenId === conv.id && (
                    <div className="absolute right-0 top-7 z-50 w-36 bg-[#0f1524] border border-slate-700 rounded-lg shadow-xl py-1 text-xs text-slate-200 animate-in fade-in duration-100">
                      <button
                        onClick={() => {
                          onRenameConversation(conv);
                          setMenuOpenId(null);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Edit2 className="w-3 h-3 text-cyan-400" /> Rename
                      </button>
                      <button
                        onClick={() => {
                          onTogglePinConversation(conv.id);
                          setMenuOpenId(null);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Star className="w-3 h-3 text-amber-400" /> Pin
                      </button>
                      <button
                        onClick={() => {
                          onDeleteConversation(conv);
                          setMenuOpenId(null);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-rose-950/60 text-rose-300 flex items-center gap-2"
                      >
                        <Trash2 className="w-3 h-3 text-rose-400" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WORKSPACE NAVIGATION */}
        <div>
          <div className="px-2 mb-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
            Workspace
          </div>
          <nav className="space-y-0.5">
            <button
              onClick={onNavigateHome}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                activeTab === 'home'
                  ? 'bg-slate-800 text-slate-100 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Home className="w-3.5 h-3.5 text-cyan-400" />
              <span>Executive Overview</span>
            </button>

            <button
              onClick={onNewChat}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                activeTab === 'ask' && !activeConversationId
                  ? 'bg-slate-800 text-slate-100 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
              <span>Ask BI Agent</span>
            </button>

            <button
              onClick={() => setActiveTab('pipeline')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                activeTab === 'pipeline'
                  ? 'bg-slate-800 text-slate-100 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sales Pipeline</span>
            </button>

            <button
              onClick={() => setActiveTab('sectors')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                activeTab === 'sectors'
                  ? 'bg-slate-800 text-slate-100 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <PieChart className="w-3.5 h-3.5 text-purple-400" />
              <span>Sector Insights</span>
            </button>

            <button
              onClick={() => setActiveTab('leadership')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                activeTab === 'leadership'
                  ? 'bg-slate-800 text-slate-100 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Leadership Brief</span>
            </button>
          </nav>
        </div>

        {/* CONNECTED SYSTEMS */}
        <div>
          <div className="px-2 mb-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
            Connected Systems
          </div>
          <div className="space-y-1 text-[11px] font-mono">
            <div className="px-2.5 py-1 rounded bg-slate-900/50 border border-slate-800/50 flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Database className="w-3 h-3 text-cyan-400" /> Monday.com
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${isMondayLive ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
            </div>
            <div className="px-2.5 py-1 rounded bg-slate-900/50 border border-slate-800/50 flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-purple-400" /> Groq
              </span>
              <span className="text-[10px] text-slate-300 truncate max-w-[80px]" title={groqModel}>
                {groqModel}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Account / User Footer */}
      <div className="p-3 border-t border-slate-800/60 flex items-center gap-2.5 text-xs text-slate-400 bg-slate-950/40">
        <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 text-xs font-bold font-mono">
          EX
        </div>
        <div className="truncate">
          <span className="block text-slate-200 font-medium text-[11px] truncate">Executive Workspace</span>
          <span className="block text-[10px] text-slate-500 font-mono">Skylark Drones</span>
        </div>
      </div>

    </aside>
  );
};
