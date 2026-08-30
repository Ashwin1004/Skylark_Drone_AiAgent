import React, { useState } from 'react';
import { 
  TrendingUp, 
  Activity, 
  PieChart, 
  DollarSign, 
  Award, 
  Target, 
  Sparkles,
  Send,
  ArrowRight
} from 'lucide-react';

interface Props {
  onSelectPrompt: (prompt: string) => void;
  isLoading: boolean;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
}

export const WelcomeScreen: React.FC<Props> = ({ onSelectPrompt, isLoading, inputRef }) => {
  const [localInput, setLocalInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localInput.trim() || isLoading) return;
    onSelectPrompt(localInput.trim());
    setLocalInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const promptList = [
    {
      category: 'Pipeline',
      prompt: 'How is our pipeline looking this quarter?',
      subtitle: 'Overview of total pipeline, weighted forecast & open deals count',
      icon: TrendingUp,
      color: 'text-[#059669]',
      borderColor: 'hover:border-[#059669]/50'
    },
    {
      category: 'Deal Risks',
      prompt: 'Which deals need executive attention?',
      subtitle: 'High-value deals, risk thresholds & low probability items',
      icon: Target,
      color: 'text-[#dc2626]',
      borderColor: 'hover:border-[#dc2626]/50'
    },
    {
      category: 'Sectors',
      prompt: 'Which sectors are driving pipeline growth?',
      subtitle: 'Energy, Mining, Renewables & Railways sector performance',
      icon: PieChart,
      color: 'text-[#7c3aed]',
      borderColor: 'hover:border-[#7c3aed]/50'
    },
    {
      category: 'Operations',
      prompt: 'How many active work orders do we have?',
      subtitle: 'Active client operations, revenue value & sector distribution',
      icon: Activity,
      color: 'text-[#0284c7]',
      borderColor: 'hover:border-[#0284c7]/50'
    },
    {
      category: 'Billing',
      prompt: "What's currently pending billing?",
      subtitle: 'Completed work orders awaiting invoice generation & priority items',
      icon: DollarSign,
      color: 'text-[#d97706]',
      borderColor: 'hover:border-[#d97706]/50'
    },
    {
      category: 'Leadership Brief',
      prompt: 'Prepare a leadership brief',
      subtitle: 'Comprehensive cross-board summary, risks & strategic focus areas',
      icon: Award,
      color: 'text-[#0d9488]',
      borderColor: 'hover:border-[#0d9488]/50'
    }
  ];

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 max-w-4xl mx-auto w-full text-center my-auto animate-in fade-in duration-300">
      
      {/* AI Assistant Hero Greeting */}
      <div className="mb-6 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#e8e1d5] border border-[#d8cdbc] text-[#4a3d37] text-xs font-semibold font-mono mb-1 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#a85507]" /> Skylark Agent
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#211a17] tracking-tight">
          Meet Your Business Intelligence Agent.
        </h1>
        
        <p className="text-sm sm:text-base font-medium text-[#5c504a] max-w-xl mx-auto leading-relaxed">
          Ask Skylark about your pipeline, operations, revenue, risks, opportunities, or strategy.
        </p>
      </div>

      {/* Center Prominent AI Input Box */}
      <form onSubmit={handleSubmit} className="w-full max-w-2xl mb-8 relative group">
        <div className="relative bg-white text-[#211a17] border border-[#dcd4c8] focus-within:border-[#8c7365] focus-within:ring-2 focus-within:ring-[#e8dfd3] rounded-2xl p-3.5 shadow-md transition-all duration-200">
          <textarea
            ref={inputRef}
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your business..."
            rows={2}
            disabled={isLoading}
            className="w-full bg-transparent text-[#211a17] placeholder-[#a3978c] px-3 py-1.5 text-sm focus:outline-none resize-none"
          />
          <div className="flex items-center justify-end pt-2.5 px-2 border-t border-[#f0eae1]">
            <button
              type="submit"
              disabled={!localInput.trim() || isLoading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#4a3d37] hover:bg-[#3b2e2a] text-[#f5f2eb] font-semibold text-xs disabled:opacity-30 transition-all shadow-sm"
            >
              <span>Ask Agent</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </form>

      {/* 6 Quick Suggestion Prompt Cards */}
      <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-left">
        {promptList.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectPrompt(item.prompt)}
              disabled={isLoading}
              className={`p-4 rounded-xl bg-white hover:bg-[#faf7f2] border border-[#e2dcd3] ${item.borderColor} text-xs transition-all duration-200 shadow-2xs group disabled:opacity-50 flex flex-col justify-between h-full min-h-[110px]`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-mono text-[#8c7f76] font-semibold tracking-wider">
                    {item.category}
                  </span>
                  <Icon className={`w-4 h-4 ${item.color} shrink-0 opacity-80 group-hover:opacity-100 transition-opacity`} />
                </div>
                <h3 className="text-[#211a17] group-hover:text-[#8c5220] transition-colors font-medium leading-snug mb-1 text-xs">
                  {item.prompt}
                </h3>
              </div>
              <div className="flex items-center text-[10px] text-[#786a62] group-hover:text-[#211a17] font-sans mt-2">
                <span className="truncate">{item.subtitle}</span>
                <ArrowRight className="w-3 h-3 ml-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[#8c5220]" />
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
};
