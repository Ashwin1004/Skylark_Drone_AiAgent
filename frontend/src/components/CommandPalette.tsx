import React, { useState, useEffect } from 'react';
import { Search, Plus, Home, MessageSquare, TrendingUp, PieChart, FileText, X, LucideIcon } from 'lucide-react';
import { SavedConversation } from './Sidebar';

interface RouteItem {
  type: 'route';
  label: string;
  icon: LucideIcon;
  action: () => void;
  category: string;
}

interface ConvItem {
  type: 'conv';
  data: SavedConversation;
}

type PaletteItem = RouteItem | ConvItem;

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateHome: () => void;
  onNewChat: () => void;
  onSelectTab: (tab: string) => void;
  savedConversations: SavedConversation[];
  onSelectSavedConversation: (conv: SavedConversation) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigateHome,
  onNewChat,
  onSelectTab,
  savedConversations,
  onSelectSavedConversation
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setQuery('');
    setSelectedIndex(0);
  }, [isOpen]);

  if (!isOpen) return null;

  const routes: RouteItem[] = [
    { type: 'route', label: 'New conversation', icon: Plus, action: onNewChat, category: 'Actions' },
    { type: 'route', label: 'Executive Overview', icon: Home, action: onNavigateHome, category: 'Workspace' },
    { type: 'route', label: 'Ask BI Agent', icon: MessageSquare, action: onNewChat, category: 'Workspace' },
    { type: 'route', label: 'Sales Pipeline Analytics', icon: TrendingUp, action: () => onSelectTab('pipeline'), category: 'Workspace' },
    { type: 'route', label: 'Sector Intelligence', icon: PieChart, action: () => onSelectTab('sectors'), category: 'Workspace' },
    { type: 'route', label: 'Leadership Brief Report', icon: FileText, action: () => onSelectTab('leadership'), category: 'Workspace' },
  ];

  const filteredRoutes = routes.filter(r =>
    r.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredConversations = savedConversations.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase())
  );

  const allItems: PaletteItem[] = [
    ...filteredRoutes,
    ...filteredConversations.map(c => ({ type: 'conv' as const, data: c }))
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, allItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allItems.length) % Math.max(1, allItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = allItems[selectedIndex];
      if (selected) {
        if (selected.type === 'route') {
          selected.action();
        } else {
          onSelectSavedConversation(selected.data);
        }
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-start justify-center pt-24 px-4 select-none animate-in fade-in duration-150">
      
      <div className="w-full max-w-xl bg-[#0d1322] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Search Header Input */}
        <div className="p-3.5 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-4 h-4 text-cyan-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, views, or conversations... (Esc to cancel)"
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
          />
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {allItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 font-mono">
              No matching commands or conversations found.
            </div>
          ) : (
            allItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              if (item.type === 'route') {
                const Icon = item.icon;
                return (
                  <button
                    key={`route-${idx}`}
                    onClick={() => {
                      item.action();
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                      isSelected ? 'bg-cyan-950/80 text-cyan-200 border border-cyan-700/50' : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-cyan-400" />
                      <span>{item.label}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{item.category}</span>
                  </button>
                );
              } else {
                return (
                  <button
                    key={`conv-${item.data.id}`}
                    onClick={() => {
                      onSelectSavedConversation(item.data);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                      isSelected ? 'bg-slate-800 text-slate-100 border border-slate-700' : 'text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <MessageSquare className="w-4 h-4 text-sky-400 shrink-0" />
                      <span className="truncate">{item.data.title}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Conversation</span>
                  </button>
                );
              }
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-slate-950/60 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 flex items-center justify-between px-4">
          <span>Navigation: ↑ ↓ Arrow Keys</span>
          <span>Execute: Enter</span>
        </div>

      </div>

    </div>
  );
};
