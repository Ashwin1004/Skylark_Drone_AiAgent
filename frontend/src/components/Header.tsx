import React from 'react';
import { Plus } from 'lucide-react';
import { HealthResponse } from '../types';

interface HeaderProps {
  health: HealthResponse | null;
  onNewChat: () => void;
  onNavigateHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNewChat, onNavigateHome }) => {
  return (
    <header className="bg-[#0b0f19] border-b border-slate-800/60 sticky top-0 z-30 px-6 py-2.5 flex items-center justify-between text-xs select-none">
      
      {/* Clickable Section Title → Navigates Home */}
      <div className="flex items-center gap-3">
        <span 
          onClick={onNavigateHome}
          className="font-bold text-slate-100 hover:text-cyan-400 cursor-pointer transition-colors"
        >
          Skylark BI
        </span>
        <span className="text-slate-600">/</span>
        <span className="text-slate-400">Executive Agent</span>
      </div>

      {/* New Conversation Action */}
      <div className="flex items-center gap-4 text-slate-400">
        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white transition-all shadow-md shadow-cyan-600/20 text-xs font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New conversation</span>
        </button>
      </div>
    </header>
  );
};
