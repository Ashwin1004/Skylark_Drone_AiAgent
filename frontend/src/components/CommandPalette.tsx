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
    { type: 'route', label: 'Ask Skylark Agent', icon: MessageSquare, action: onNewChat, category: 'Workspace' },
    { type: 'route', label: 'Executive Overview', icon: Home, action: onNavigateHome, category: 'Workspace' },
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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-24 px-4 select-none animate-in fade-in duration-150">
      
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col text-slate-900">
        
        {/* Search Header Input */}
        <div className="p-3.5 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-4 h-4 text-sky-600 shrink-0" />
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
            className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
          />
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {allItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 font-mono">
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
                      isSelected ? 'bg-sky-50 text-sky-900 font-medium border border-sky-200' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-sky-600" />
                      <span>{item.label}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{item.category}</span>
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
                      isSelected ? 'bg-slate-100 text-slate-900 border border-slate-200' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <MessageSquare className="w-4 h-4 text-sky-500 shrink-0" />
                      <span className="truncate">{item.data.title}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Conversation</span>
                  </button>
                );
              }
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[10px] font-mono text-slate-500 flex items-center justify-between px-4">
          <span>Navigation: ↑ ↓ Arrow Keys</span>
          <span>Execute: Enter</span>
        </div>

      </div>

    </div>
  );
};
