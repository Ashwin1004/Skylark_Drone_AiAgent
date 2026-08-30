import React from 'react';
import { TrendingUp, Activity, PieChart, DollarSign, Award, Target } from 'lucide-react';

interface Props {
  onSelectPrompt: (prompt: string) => void;
  isLoading: boolean;
}

export const WelcomeScreen: React.FC<Props> = ({ onSelectPrompt, isLoading }) => {
  const promptList = [
    {
      category: 'Pipeline',
      prompt: 'How is our pipeline looking this quarter?',
      icon: TrendingUp,
      color: 'text-emerald-400'
    },
    {
      category: 'Operations',
      prompt: 'How many active work orders do we have?',
      icon: Activity,
      color: 'text-cyan-400'
    },
    {
      category: 'Sectors',
      prompt: 'How is the Energy sector performing?',
      icon: PieChart,
      color: 'text-purple-400'
    },
    {
      category: 'Revenue',
      prompt: 'What money is pending billing or collection?',
      icon: DollarSign,
      color: 'text-amber-400'
    },
    {
      category: 'Opportunities',
      prompt: 'What are our biggest high-probability opportunities?',
      icon: Target,
      color: 'text-sky-400'
    },
    {
      category: 'Leadership',
      prompt: 'Prepare a leadership update.',
      icon: Award,
      color: 'text-teal-400'
    }
  ];

  return (
    <div className="flex-1 flex flex-col justify-center items-center p-6 overflow-y-auto max-w-3xl mx-auto w-full text-center">
      
      {/* ChatGPT-Style Focused Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 mb-1.5 tracking-tight">
          Skylark BI
        </h1>
        <p className="text-sm font-medium text-slate-300 mb-1">
          How can I help with your business today?
        </p>
        <p className="text-xs text-slate-500">
          Ask about sales, operations, sectors, billing, or leadership.
        </p>
      </div>

      {/* 6 Interactive Prompt Cards (Grid 2 cols on md) */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-2.5 text-left">
        {promptList.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectPrompt(item.prompt)}
              disabled={isLoading}
              className="p-3.5 rounded-xl bg-[#0b0f19] hover:bg-slate-800/60 border border-slate-800/80 text-xs transition-all shadow-sm group disabled:opacity-50 flex items-start gap-3"
            >
              <Icon className={`w-4 h-4 ${item.color} shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] uppercase font-mono text-slate-500 block font-semibold mb-0.5">
                  {item.category}
                </span>
                <span className="text-slate-200 group-hover:text-cyan-300 transition-colors font-medium leading-snug block">
                  {item.prompt}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
