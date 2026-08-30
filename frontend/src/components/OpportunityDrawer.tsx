import React from 'react';
import { X, TrendingUp, Layers, ArrowRight, DollarSign } from 'lucide-react';

interface OpportunityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: {
    name: string;
    company: string;
    sector: string;
    stage: string;
    value: string;
    probability: string;
    weighted: string;
  } | null;
  onLaunchQuery: (query: string) => void;
}

export const OpportunityDrawer: React.FC<OpportunityDrawerProps> = ({
  isOpen,
  onClose,
  opportunity,
  onLaunchQuery
}) => {
  if (!isOpen || !opportunity) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl p-6 select-none overflow-y-auto text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 mb-1 inline-block">
              {opportunity.sector}
            </span>
            <h2 className="text-lg font-bold text-slate-900">{opportunity.name}</h2>
            <p className="text-xs text-slate-500">{opportunity.company}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Commercial Details */}
        <div className="space-y-4 font-mono text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Contract Value</span>
              <span className="text-base font-bold text-slate-900">{opportunity.value}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Closure Probability</span>
              <span className="text-base font-bold text-emerald-700">{opportunity.probability}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Weighted Pipeline</span>
              <span className="text-sm font-bold text-emerald-700">{opportunity.weighted}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block">Deal Stage</span>
              <span className="text-sm font-bold text-sky-700">{opportunity.stage}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 font-sans text-xs text-slate-600">
            <h4 className="font-bold text-slate-900 uppercase font-mono text-[11px]">Recommended Strategy</h4>
            <p>
              This enterprise opportunity represents <strong>{opportunity.value}</strong> in potential commercial revenue. Engage key procurement stakeholders to accelerate stage progression.
            </p>
          </div>

          <button
            onClick={() => {
              onClose();
              onLaunchQuery(`Tell me about the ${opportunity.name} deal for ${opportunity.company}`);
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <span>Analyze Opportunity with Skylark Agent</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
