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
    { stage: 'Proposal Sent', value: 8.50, color: '#38bdf8' },
    { stage: 'Negotiation', value: 2.73, color: '#34d399' },
    { stage: 'Qualified Lead', value: 1.00, color: '#c084fc' }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-200 select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Executive Overview</h1>
            <span className="bg-cyan-950/80 text-cyan-400 text-[10px] px-2 py-0.5 rounded font-mono border border-cyan-800/50 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Live Monday.com
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time business signals and deterministic commercial analytics.
          </p>
        </div>
      </div>

      {/* Ask Skylark Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative max-w-2xl">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Ask Skylark BI anything (e.g., 'How is our pipeline looking this quarter?')..."
            className="w-full bg-[#0b0f19] text-slate-100 placeholder-slate-500 text-xs rounded-xl pl-10 pr-28 py-3 border border-slate-800/80 focus:border-cyan-500/80 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 shadow-lg transition-all"
          />
          <button
            type="submit"
            disabled={!searchInput.trim()}
            className="absolute right-2 text-xs bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-medium px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-sm"
          >
            <span>Ask</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </form>

      {/* Key Business Signals (4 KPI Cards) */}
      <div>
        <h2 className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold mb-3">
          Key Business Signals
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div 
            onClick={() => onLaunchQuery('How is our pipeline looking this quarter?')}
            className="group cursor-pointer bg-[#0b0f19] hover:bg-[#0f1524] p-4 rounded-xl border border-slate-800/80 hover:border-cyan-500/40 transition-all shadow-sm"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-medium">Open Pipeline</span>
              <TrendingUp className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-extrabold text-slate-100 font-mono tracking-tight mb-1">₹12.23 Cr</div>
            <p className="text-[11px] text-slate-500">Across 3 open deals this quarter</p>
          </div>

          <div 
            onClick={() => onLaunchQuery('How is our pipeline looking this quarter?')}
            className="group cursor-pointer bg-[#0b0f19] hover:bg-[#0f1524] p-4 rounded-xl border border-slate-800/80 hover:border-emerald-500/40 transition-all shadow-sm"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-medium">Weighted Forecast</span>
              <Layers className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono tracking-tight mb-1">₹97.87 L</div>
            <p className="text-[11px] text-slate-500">Weighted by closure probability</p>
          </div>

          <div 
            onClick={() => onLaunchQuery('How many active work orders do we have?')}
            className="group cursor-pointer bg-[#0b0f19] hover:bg-[#0f1524] p-4 rounded-xl border border-slate-800/80 hover:border-sky-500/40 transition-all shadow-sm"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-medium">Active Work Orders</span>
              <Activity className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-extrabold text-slate-100 font-mono tracking-tight mb-1">4 Active</div>
            <p className="text-[11px] text-slate-500">Drone survey &amp; mapping ops</p>
          </div>

          <div 
            onClick={() => onLaunchQuery('What money is pending billing or collection?')}
            className="group cursor-pointer bg-[#0b0f19] hover:bg-[#0f1524] p-4 rounded-xl border border-slate-800/80 hover:border-amber-500/40 transition-all shadow-sm"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-medium">Pending Billing</span>
              <DollarSign className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-extrabold text-amber-300 font-mono tracking-tight mb-1">₹82.30 L</div>
            <p className="text-[11px] text-slate-500">Unbilled milestone deliverables</p>
          </div>

        </div>
      </div>

      {/* Recharts Pipeline by Stage Visualization */}
      <div className="bg-[#0b0f19] p-5 rounded-2xl border border-slate-800/80 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Pipeline Value by Stage (₹ Cr)</h3>
            <p className="text-xs text-slate-400">Distribution of commercial deal value across active pipeline stages.</p>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            3 Active Deals
          </span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={stageData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(val) => `₹${val} Cr`} />
              <YAxis type="category" dataKey="stage" stroke="#94a3b8" fontSize={11} width={90} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0d1322', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#f8fafc' }} 
                formatter={(value: any) => [`₹${value} Cr`, 'Deal Value']}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
                {stageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* What Needs Attention Section */}
      <div>
        <h2 className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold mb-3">
          What Needs Attention
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="p-5 rounded-xl bg-[#0b0f19] border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-200">Pipeline Concentration</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Tender and Powerline opportunities represent a significant percentage of open high-value deal pipeline. Prioritizing top-tier deal negotiation is essential.
              </p>
            </div>
            <button
              onClick={() => onLaunchQuery('What are our biggest high-probability opportunities?')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium font-mono flex items-center gap-1.5 self-start"
            >
              <span>Explore High-Probability Deals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-5 rounded-xl bg-[#0b0f19] border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-200">Pending Billing Milestone Opportunity</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                ₹82.30 Lakh in completed drone mapping deliverables is awaiting invoice dispatch. Review unbilled work order deliverables to accelerate cash collection.
              </p>
            </div>
            <button
              onClick={() => onLaunchQuery('What money is pending billing or collection?')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium font-mono flex items-center gap-1.5 self-start"
            >
              <span>Review Receivables &amp; Invoicing</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};
