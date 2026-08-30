import React, { useState } from 'react';
import { 
  TrendingUp, 
  Layers, 
  Activity, 
  DollarSign, 
  ArrowRight, 
  Sparkles, 
  Search,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { HealthResponse } from '../../types';

interface Props {
  health: HealthResponse | null;
  onLaunchQuery: (query: string) => void;
}

export const OverviewView: React.FC<Props> = ({ health, onLaunchQuery }) => {
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    onLaunchQuery(searchInput.trim());
    setSearchInput('');
  };

  const stageData = [
    { stage: 'Proposal Sent', value: 8.50, color: '#a85507' },
    { stage: 'Negotiation', value: 2.73, color: '#059669' },
    { stage: 'Qualified Lead', value: 1.00, color: '#7c3aed' }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-200 select-none bg-[#f3eee6] text-[#211a17]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2dcd3] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-[#211a17] tracking-tight">Executive Overview</h1>
            <span className="bg-[#e8e1d5] text-[#4a3d37] text-[10px] px-2 py-0.5 rounded font-mono border border-[#d8cdbc] flex items-center gap-1 font-semibold">
              <Sparkles className="w-2.5 h-2.5 text-[#a85507]" /> Skylark Agent
            </span>
          </div>
          <p className="text-xs text-[#786a62]">
            Real-time business signals and deterministic commercial analytics.
          </p>
        </div>
      </div>

      {/* Ask Skylark Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative max-w-2xl">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#8c7f76] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Ask Skylark Agent anything about pipeline, work orders, billing..."
            className="w-full bg-white text-[#211a17] placeholder-[#a3978c] border border-[#dcd4c8] focus:border-[#8c7365] rounded-xl pl-10 pr-24 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#e8dfd3] shadow-2xs transition-all"
          />
          <button
            type="submit"
            disabled={!searchInput.trim()}
            className="absolute right-2 px-3 py-1.5 bg-[#4a3d37] hover:bg-[#3b2e2a] text-[#f5f2eb] rounded-lg text-xs font-semibold disabled:opacity-40 transition-all shadow-xs"
          >
            Ask Agent
          </button>
        </div>
      </form>

      {/* Executive Key Signals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-xl bg-white border border-[#e2dcd3] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#786a62] font-mono">
            <span>Open Pipeline</span>
            <TrendingUp className="w-4 h-4 text-[#a85507]" />
          </div>
          <div className="text-2xl font-bold text-[#211a17] font-mono">₹12.23 Cr</div>
          <p className="text-[11px] text-[#786a62]">Across 3 active open deals</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#e2dcd3] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#786a62] font-mono">
            <span>Weighted Forecast</span>
            <Layers className="w-4 h-4 text-[#059669]" />
          </div>
          <div className="text-2xl font-bold text-[#059669] font-mono">₹7.55 Cr</div>
          <p className="text-[11px] text-[#786a62]">Probability-adjusted revenue</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#e2dcd3] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#786a62] font-mono">
            <span>Active Work Orders</span>
            <Activity className="w-4 h-4 text-[#7c3aed]" />
          </div>
          <div className="text-2xl font-bold text-[#211a17] font-mono">3 Ops</div>
          <p className="text-[11px] text-[#786a62]">₹8.50 L total operational value</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#e2dcd3] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#786a62] font-mono">
            <span>Pending Billing</span>
            <DollarSign className="w-4 h-4 text-[#d97706]" />
          </div>
          <div className="text-2xl font-bold text-[#d97706] font-mono">₹8.50 L</div>
          <p className="text-[11px] text-[#b45309] font-medium">3 work orders require invoicing</p>
        </div>

      </div>

      {/* Visual Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Stage Chart */}
        <div className="p-5 rounded-xl bg-white border border-[#e2dcd3] shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase font-mono tracking-wider text-[#4a3d37] font-bold">
              Pipeline Stage Breakdown (₹ Cr)
            </h3>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="stage" stroke="#786a62" fontSize={11} tickLine={false} />
                <YAxis stroke="#786a62" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#dcd4c8', borderRadius: '8px', fontSize: '11px', color: '#211a17' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {stageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attention Items */}
        <div className="p-5 rounded-xl bg-white border border-[#e2dcd3] shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs uppercase font-mono tracking-wider text-[#b45309] font-bold mb-3 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-[#d97706]" /> Executive Priority Signals
            </h3>
            
            <div className="space-y-3">
              <div 
                onClick={() => onLaunchQuery("What money is pending billing or collection?")}
                className="p-3 rounded-lg bg-[#fef3c7]/50 border border-[#fde68a] hover:border-[#f59e0b] transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#92400e] mb-1">
                  <span>Pending Invoicing Action</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#d97706] group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-xs text-[#78350f]">
                  ₹8.50 L in completed work orders is currently unbilled across 3 operations.
                </p>
              </div>

              <div 
                onClick={() => onLaunchQuery("Show me high-value deals with low closure probability")}
                className="p-3 rounded-lg bg-[#e0f2fe]/50 border border-[#bae6fd] hover:border-[#0284c7] transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#075985] mb-1">
                  <span>Pipeline Concentration</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#0284c7] group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-xs text-[#0369a1]">
                  Proposal stage holds 69.5% of total pipeline. Review closing milestones.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#f0eae1] flex justify-end">
            <button 
              onClick={() => onLaunchQuery("Prepare a leadership update.")}
              className="text-xs text-[#4a3d37] hover:text-[#211a17] font-semibold flex items-center gap-1"
            >
              Generate Full Leadership Brief →
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
