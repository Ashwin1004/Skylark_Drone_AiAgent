import React, { useState, useEffect } from 'react';
import { Edit2 } from 'lucide-react';

interface RenameModalProps {
  isOpen: boolean;
  initialTitle: string;
  onSave: (newTitle: string) => void;
  onCancel: () => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  initialTitle,
  onSave,
  onCancel
}) => {
  const [title, setTitle] = useState(initialTitle);

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(title.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-[#0d1322] border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 space-y-4">
        
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 shrink-0">
            <Edit2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Rename Conversation</h3>
            <p className="text-xs text-slate-400">Enter a descriptive title for this conversation session.</p>
          </div>
        </div>

        <div>
          <input
            type="text"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-950 text-slate-100 border border-slate-800 focus:border-cyan-500/80 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim()}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-40 shadow-md shadow-cyan-600/20 transition-all"
          >
            Save Title
          </button>
        </div>

      </form>
    </div>
  );
};
