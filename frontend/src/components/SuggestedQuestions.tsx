import React from 'react';
import { TrendingUp, Layers, Zap, Activity, DollarSign, Users, Award } from 'lucide-react';

interface Props {
  onSelect: (question: string) => void;
  disabled?: boolean;
}

const SUGGESTIONS = [
  {
    icon: <TrendingUp className="w-4 h-4 text-cyan-400" />,
    label: "Pipeline Performance",
    question: "How is our pipeline looking this quarter?"
  },
  {
    icon: <Layers className="w-4 h-4 text-emerald-400" />,
    label: "Sector Deep-Dive",
    question: "How is the Energy sector performing?"
  },
  {
    icon: <Zap className="w-4 h-4 text-amber-400" />,
    label: "Strategic Deals",
    question: "What are our biggest high-probability opportunities?"
  },
  {
    icon: <Activity className="w-4 h-4 text-sky-400" />,
    label: "Work Order Ops",
    question: "How many active work orders do we currently have?"
  },
  {
    icon: <DollarSign className="w-4 h-4 text-purple-400" />,
    label: "Billing & Cash",
    question: "How much money is pending billing or collection?"
  },
  {
    icon: <Users className="w-4 h-4 text-rose-400" />,
    label: "Cross-Board Upsell",
    question: "Which customers have active work orders but no active deals?"
  },
  {
    icon: <Award className="w-4 h-4 text-yellow-400" />,
    label: "Founder Mode",
    question: "Prepare a leadership update."
  }
];

export const SuggestedQuestions: React.FC<Props> = ({ onSelect, disabled }) => {
  return (
    <div className="w-full max-w-4xl mx-auto my-6 px-4">
      <div className="text-center mb-6">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider font-mono">Suggested Executive Queries</h3>
        <p className="text-xs text-slate-400 mt-1">Select a prompt below to run dynamic Monday.com business analytics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SUGGESTIONS.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(item.question)}
            disabled={disabled}
            className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-cyan-500/40 transition-all text-left group shadow-sm disabled:opacity-50 disabled:pointer-events-none"
          >
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 group-hover:border-cyan-500/30 transition-colors">
              {item.icon}
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors block">
                {item.label}
              </span>
              <span className="text-xs text-slate-400 line-clamp-2 mt-0.5 font-sans leading-relaxed">
                "{item.question}"
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
