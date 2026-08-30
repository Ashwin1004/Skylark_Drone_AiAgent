import React, { useState, useRef, useEffect } from 'react';
import { 
  Edit3, 
  Search, 
  PanelLeft, 
  MoreHorizontal, 
  ChevronDown, 
  MessageSquare, 
  Star, 
  Edit2, 
  Trash2, 
  Pin,
  Archive,
  Sparkles
} from 'lucide-react';
import { HealthResponse } from '../types';

export interface SavedConversation {
  id: string;
  title: string;
  pinned?: boolean;
  archived?: boolean;
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
  onToggleArchiveConversation?: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onNewChat,
  savedConversations,
  activeConversationId,
  onSelectSavedConversation,
  onTogglePinConversation,
  onRenameConversation,
  onDeleteConversation,
  onOpenCommandPalette,
  onToggleArchiveConversation
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activePopover, setActivePopover] = useState<'pinned' | 'recents' | 'archived' | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [isPinnedExpanded, setIsPinnedExpanded] = useState(true);
  const [isArchivedView, setIsArchivedView] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);

  // Close floating popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setActivePopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unarchivedConversations = savedConversations.filter(c => !c.archived);
  const archivedConversations = savedConversations.filter(c => c.archived);

  const filteredConversations = unarchivedConversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter(c => c.pinned);
  const recentConversations = filteredConversations.filter(c => !c.pinned);

  /* Collapsed Sidebar */
  if (isCollapsed) {
    return (
      <aside className="w-16 bg-[#12100f] text-[#ece7e1] flex flex-col items-center py-4 space-y-4 h-full shrink-0 select-none relative z-20 border-r border-[#262220] transition-all duration-200">
        
        {/* Toggle Expand Icon */}
        <button
          onClick={() => {
            setIsCollapsed(false);
            setActivePopover(null);
          }}
          title="Open sidebar"
          className="p-2 rounded-xl text-[#a69c94] hover:text-white hover:bg-[#262220] transition-colors"
        >
          <PanelLeft className="w-5 h-5" />
        </button>

        {/* New Chat Icon */}
        <button
          onClick={() => {
            onNewChat();
            setActivePopover(null);
          }}
          title="New chat"
          className="p-2 rounded-xl text-[#d4c8be] hover:text-white hover:bg-[#262220] transition-colors"
        >
          <Edit3 className="w-5 h-5" />
        </button>

        {/* Search Icon */}
        <button
          onClick={() => {
            setIsCollapsed(false);
            setIsSearchOpen(true);
            setActivePopover(null);
          }}
          title="Search conversations"
          className="p-2 rounded-xl text-[#a69c94] hover:text-white hover:bg-[#262220] transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Pinned Icon Button (📌) */}
        <button
          onClick={() => setActivePopover(activePopover === 'pinned' ? null : 'pinned')}
          title="Pinned conversations"
          className={`p-2 rounded-xl transition-colors ${
            activePopover === 'pinned' ? 'bg-[#262220] text-white' : 'text-[#a69c94] hover:text-white hover:bg-[#262220]'
          }`}
        >
          <Pin className="w-5 h-5" />
        </button>

        {/* Recent Icon Button (💬) */}
        <button
          onClick={() => setActivePopover(activePopover === 'recents' ? null : 'recents')}
          title="Recent conversations"
          className={`p-2 rounded-xl transition-colors ${
            activePopover === 'recents' ? 'bg-[#262220] text-white' : 'text-[#a69c94] hover:text-white hover:bg-[#262220]'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        {/* Archived Icon Button (📦) */}
        <button
          onClick={() => setActivePopover(activePopover === 'archived' ? null : 'archived')}
          title="Archived conversations"
          className={`p-2 rounded-xl transition-colors ${
            activePopover === 'archived' ? 'bg-[#262220] text-white' : 'text-[#a69c94] hover:text-white hover:bg-[#262220]'
          }`}
        >
          <Archive className="w-5 h-5" />
        </button>

        {/* FLOATING POPOVER DROPDOWN MENU */}
        {activePopover && (
          <div
            ref={popoverRef}
            className={`absolute left-[72px] ${
              activePopover === 'pinned' ? 'top-[120px]' : activePopover === 'recents' ? 'top-[160px]' : 'top-[200px]'
            } z-50 w-72 bg-[#201d1b] border border-[#36302d] rounded-2xl shadow-2xl p-3.5 animate-in fade-in zoom-in-95 duration-150 text-white space-y-2 max-h-96 overflow-y-auto`}
          >
            {/* Popover Header Title */}
            <div className="text-sm font-bold text-[#a69c94] px-2 pt-1 pb-2 border-b border-[#2b2725] uppercase tracking-wider">
              {activePopover === 'pinned' && 'Pinned'}
              {activePopover === 'recents' && 'Recents'}
              {activePopover === 'archived' && 'Archived'}
            </div>

            {/* Pinned Popover List */}
            {activePopover === 'pinned' && (
              <div className="space-y-1">
                {pinnedConversations.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-[#786e66] italic text-center">
                    No pinned conversations
                  </div>
                ) : (
                  pinnedConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        onSelectSavedConversation(conv);
                        setActivePopover(null);
                      }}
                      className={`w-full text-left truncate px-3 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${
                        activeConversationId === conv.id
                          ? 'bg-[#2b2725] text-white font-semibold'
                          : 'text-[#d4c8be] hover:text-white hover:bg-[#2b2725]'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 text-white shrink-0 stroke-[1.75]" />
                      <span className="truncate">{conv.title}</span>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Recents Popover List */}
            {activePopover === 'recents' && (
              <div className="space-y-1">
                {recentConversations.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-[#786e66] italic text-center">
                    No recent conversations
                  </div>
                ) : (
                  recentConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        onSelectSavedConversation(conv);
                        setActivePopover(null);
                      }}
                      className={`w-full text-left truncate px-3 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${
                        activeConversationId === conv.id
                          ? 'bg-[#2b2725] text-white font-semibold'
                          : 'text-[#d4c8be] hover:text-white hover:bg-[#2b2725]'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 text-[#a69c94] shrink-0 stroke-[1.75]" />
                      <span className="truncate">{conv.title}</span>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Archived Popover List */}
            {activePopover === 'archived' && (
              <div className="space-y-1">
                {archivedConversations.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-[#786e66] italic text-center">
                    No archived conversations
                  </div>
                ) : (
                  archivedConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        onSelectSavedConversation(conv);
                        setActivePopover(null);
                      }}
                      className={`w-full text-left truncate px-3 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-between ${
                        activeConversationId === conv.id
                          ? 'bg-[#2b2725] text-white font-semibold'
                          : 'text-[#d4c8be] hover:text-white hover:bg-[#2b2725]'
                      }`}
                    >
                      <span className="truncate flex items-center gap-3">
                        <Archive className="w-4 h-4 text-[#a69c94] shrink-0" />
                        <span className="truncate">{conv.title}</span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}

          </div>
        )}

      </aside>
    );
  }

  /* Full Expanded Sidebar (Larger Word Size) */
  return (
    <aside className="w-68 sm:w-72 bg-[#12100f] text-[#ece7e1] flex flex-col h-full shrink-0 select-none relative z-10 border-r border-[#262220] transition-all duration-200">
      
      {/* Header Top Row */}
      <div className="p-4 flex items-center justify-between">
        <button 
          onClick={onNewChat}
          className="text-lg font-extrabold text-white tracking-tight hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <span>Skylark Agent</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            title="Search conversations"
            className="p-1.5 rounded-lg text-[#a69c94] hover:text-white hover:bg-[#262220] transition-colors"
          >
            <Search className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => setIsCollapsed(true)}
            title="Close sidebar"
            className="p-1.5 rounded-lg text-[#a69c94] hover:text-white hover:bg-[#262220] transition-colors"
          >
            <PanelLeft className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Optional Search Bar Overlay */}
      {isSearchOpen && (
        <div className="px-4 pb-2 animate-in fade-in duration-150">
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chat history..."
            className="w-full bg-[#201d1b] text-white placeholder-[#8c7f76] text-sm rounded-xl px-3 py-2 border border-[#36302d] focus:outline-none focus:border-[#a88975]"
          />
        </div>
      )}

      {/* Primary Actions: New Chat & Archived Button */}
      <div className="px-3 py-2 space-y-1 border-b border-[#262220]/80">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#201d1b] text-white transition-colors text-left font-semibold text-sm sm:text-base"
        >
          <Edit3 className="w-4.5 h-4.5 text-white shrink-0" />
          <span>New chat</span>
        </button>

        <button
          onClick={() => setIsArchivedView(!isArchivedView)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm sm:text-base transition-colors ${
            isArchivedView ? 'bg-[#201d1b] text-white font-semibold' : 'text-[#d4c8be] hover:text-white hover:bg-[#201d1b]'
          }`}
        >
          <span className="flex items-center gap-3">
            <Archive className="w-4.5 h-4.5 text-[#a69c94] shrink-0" />
            <span>Archived</span>
          </span>
          <span className="text-xs font-mono text-[#8c7f76]">
            ({archivedConversations.length})
          </span>
        </button>
      </div>

      {/* Conversations Thread Lists */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 text-sm">
        
        {isArchivedView ? (
          /* ARCHIVED VIEW */
          <div>
            <div className="px-3 mb-2 text-xs font-bold uppercase tracking-wider text-[#a69c94]">
              Archived Conversations
            </div>
            <div className="space-y-1">
              {archivedConversations.length === 0 ? (
                <div className="px-3 py-2 text-xs text-[#786e66] italic">
                  No archived conversations
                </div>
              ) : (
                archivedConversations.map((conv) => (
                  <div key={conv.id} className="relative group/item">
                    <button
                      onClick={() => onSelectSavedConversation(conv)}
                      className={`w-full text-left truncate px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-between pr-8 ${
                        activeConversationId === conv.id
                          ? 'bg-[#262220] text-white font-semibold'
                          : 'text-[#d4c8be] hover:text-white hover:bg-[#1a1716]'
                      }`}
                      title={conv.title}
                    >
                      <span className="truncate flex items-center gap-2.5">
                        <Archive className="w-4 h-4 text-[#a69c94] shrink-0" />
                        <span className="truncate">{conv.title}</span>
                      </span>
                    </button>

                    {/* Unarchive Action */}
                    {onToggleArchiveConversation && (
                      <button
                        onClick={() => onToggleArchiveConversation(conv.id)}
                        title="Unarchive conversation"
                        className="absolute right-1 top-2 p-1 rounded hover:bg-[#36302d] text-[#8c7f76] hover:text-white opacity-0 group-hover/item:opacity-100 transition-opacity text-xs"
                      >
                        Unarchive
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* STANDARD PINNED & RECENTS VIEW */
          <>
            {/* PINNED SECTION */}
            <div>
              <button
                onClick={() => setIsPinnedExpanded(!isPinnedExpanded)}
                className="w-full flex items-center justify-between px-3 mb-2 text-xs font-bold uppercase tracking-wider text-[#a69c94] hover:text-white transition-colors"
              >
                <span>Pinned</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isPinnedExpanded ? '' : '-rotate-90'}`} />
              </button>

              {isPinnedExpanded && (
                <div className="space-y-1">
                  {pinnedConversations.length === 0 ? (
                    <div className="px-3 py-1 text-xs text-[#786e66] italic">
                      No pinned conversations
                    </div>
                  ) : (
                    pinnedConversations.map((conv) => (
                      <div key={conv.id} className="relative group/item">
                        <button
                          onClick={() => onSelectSavedConversation(conv)}
                          className={`w-full text-left truncate px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-between pr-8 ${
                            activeConversationId === conv.id
                              ? 'bg-[#262220] text-white font-semibold'
                              : 'text-[#d4c8be] hover:text-white hover:bg-[#1a1716]'
                          }`}
                          title={conv.title}
                        >
                          <span className="truncate flex items-center gap-2.5">
                            <MessageSquare className="w-4 h-4 text-[#d4c8be] shrink-0 stroke-[1.75]" />
                            <span className="truncate">{conv.title}</span>
                          </span>
                        </button>

                        {/* ⋯ Context Menu Trigger */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(menuOpenId === conv.id ? null : conv.id);
                          }}
                          className="absolute right-1.5 top-2 p-1 rounded hover:bg-[#36302d] text-[#8c7f76] hover:text-white opacity-0 group-hover/item:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Context Dropdown Menu */}
                        {menuOpenId === conv.id && (
                          <div className="absolute right-0 top-8 z-50 w-40 bg-[#201d1b] border border-[#36302d] rounded-xl shadow-2xl py-1.5 text-xs text-white animate-in fade-in duration-100">
                            <button
                              onClick={() => {
                                onRenameConversation(conv);
                                setMenuOpenId(null);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-[#2b2725] flex items-center gap-2.5"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#e2b897]" /> Rename
                            </button>
                            <button
                              onClick={() => {
                                onTogglePinConversation(conv.id);
                                setMenuOpenId(null);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-[#2b2725] flex items-center gap-2.5"
                            >
                              <Star className="w-3.5 h-3.5 text-[#e2b897]" /> Unpin
                            </button>
                            {onToggleArchiveConversation && (
                              <button
                                onClick={() => {
                                  onToggleArchiveConversation(conv.id);
                                  setMenuOpenId(null);
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-[#2b2725] flex items-center gap-2.5 text-[#a69c94]"
                              >
                                <Archive className="w-3.5 h-3.5" /> Archive
                              </button>
                            )}
                            <button
                              onClick={() => {
                                onDeleteConversation(conv);
                                setMenuOpenId(null);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-rose-950/40 text-rose-300 flex items-center gap-2.5"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* RECENTS SECTION */}
            <div>
              <div className="px-3 mb-2 text-xs font-bold uppercase tracking-wider text-[#a69c94]">
                Recents
              </div>
              <div className="space-y-1">
                {recentConversations.length === 0 ? (
                  <div className="px-3 py-1 text-xs text-[#786e66] italic">
                    No recent conversations
                  </div>
                ) : (
                  recentConversations.map((conv) => (
                    <div key={conv.id} className="relative group/item">
                      <button
                        onClick={() => onSelectSavedConversation(conv)}
                        className={`w-full text-left truncate px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-between pr-8 ${
                          activeConversationId === conv.id
                            ? 'bg-[#262220] text-white font-semibold'
                            : 'text-[#d4c8be] hover:text-white hover:bg-[#1a1716]'
                        }`}
                        title={conv.title}
                      >
                        <span className="truncate flex items-center gap-2.5">
                          <MessageSquare className="w-4 h-4 text-[#a69c94] shrink-0 stroke-[1.75]" />
                          <span className="truncate">{conv.title}</span>
                        </span>
                      </button>

                      {/* ⋯ Context Menu Trigger */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === conv.id ? null : conv.id);
                        }}
                        className="absolute right-1.5 top-2 p-1 rounded hover:bg-[#36302d] text-[#8c7f76] hover:text-white opacity-0 group-hover/item:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {/* Context Dropdown Menu */}
                      {menuOpenId === conv.id && (
                        <div className="absolute right-0 top-8 z-50 w-40 bg-[#201d1b] border border-[#36302d] rounded-xl shadow-2xl py-1.5 text-xs text-white animate-in fade-in duration-100">
                          <button
                            onClick={() => {
                              onRenameConversation(conv);
                              setMenuOpenId(null);
                            }}
                            className="w-full text-left px-3.5 py-2 hover:bg-[#2b2725] flex items-center gap-2.5"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#e2b897]" /> Rename
                          </button>
                          <button
                            onClick={() => {
                              onTogglePinConversation(conv.id);
                              setMenuOpenId(null);
                            }}
                            className="w-full text-left px-3.5 py-2 hover:bg-[#2b2725] flex items-center gap-2.5"
                          >
                            <Star className="w-3.5 h-3.5 text-[#e2b897]" /> Pin
                          </button>
                          {onToggleArchiveConversation && (
                            <button
                              onClick={() => {
                                onToggleArchiveConversation(conv.id);
                                setMenuOpenId(null);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-[#2b2725] flex items-center gap-2.5 text-[#a69c94]"
                            >
                              <Archive className="w-3.5 h-3.5" /> Archive
                            </button>
                          )}
                          <button
                            onClick={() => {
                              onDeleteConversation(conv);
                              setMenuOpenId(null);
                            }}
                            className="w-full text-left px-3.5 py-2 hover:bg-rose-950/40 text-rose-300 flex items-center gap-2.5"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

      </div>

    </aside>
  );
};
