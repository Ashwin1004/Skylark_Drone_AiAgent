import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingPipeline: React.FC = () => {
  return (
    <div className="flex items-center gap-2.5 my-3 px-2 text-xs font-sans text-slate-400">
      <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0" />
      <span className="text-slate-300">Analyzing your business data...</span>
    </div>
  );
};
