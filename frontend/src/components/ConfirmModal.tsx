import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Delete',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#0d1322] border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 space-y-4">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">{title}</h3>
            <p className="text-xs text-slate-400">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/80">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition-all"
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
};
