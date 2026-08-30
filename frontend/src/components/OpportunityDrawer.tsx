import React from 'react';
import { X, TrendingUp, Layers, Award, ArrowRight, ShieldCheck, DollarSign } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0b0f19] border-l border-slate-800 h-full flex flex-col shadow-2xl p-6 select-none overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold block mb-1">
              Commercial Opportunity
            </span>
            <h2 className="text-lg font-bold text-slate-100">{opportunity.name}</h2>
            <p className="text-xs text-slate-400">{opportunity.company}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Opportunity Valuation Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-0.5">Contract Value</span>
            <span className="text-xl font-bold font-mono text-slate-100">{opportunity.value}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-0.5">Weighted Forecast</span>
            <span className="text-xl font-bold font-mono text-emerald-400">{opportunity.weighted}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-0.5">Closure Probability</span>
            <span className="text-base font-bold font-mono text-cyan-400">{opportunity.probability}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-0.5">Pipeline Stage</span>
            <span className="text-xs font-semibold text-slate-200">{opportunity.stage}</span>
          </div>
        </div>

        {/* Strategic Analysis & Observations */}
        <div className="space-y-4 text-xs text-slate-300 border-b border-slate-800 pb-6 mb-6">
          <div>
            <h4 className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Business Significance
            </h4>
            <p className="text-slate-400 leading-relaxed">
              This opportunity represents a major commercial anchor contract within the <strong className="text-slate-200">{opportunity.sector}</strong> domain. Successfully closing this deal will expand Skylark's drone survey footprint.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Recommended Executive Action
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Prioritize commercial negotiations and finalize scope SLA definitions. Engage technical survey teams for rapid pre-deployment resource allocation.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            onLaunchQuery(`What are our biggest high-probability opportunities?`);
            onClose();
          }}
          className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          <span>Analyze Opportunity via Agent</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

      </div>
    </div>
  );
};
