import React, { useState } from 'react';
import { TrendingUp, Layers, Award, Target, ArrowRight, Search, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { OpportunityDrawer } from '../OpportunityDrawer';

interface Props {
  onLaunchQuery: (query: string) => void;
}

export const PipelineView: React.FC<Props> = ({ onLaunchQuery }) => {
  const [selectedOpportunity, setSelectedOpportunity] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('All');

  const topDeals = [
    {
      name: 'Adani Transmission Survey',
      company: 'Adani Energy Solutions Ltd',
      sector: 'Powerline',
      stage: 'Proposal Sent',
      value: '₹8.50 Cr',
      probability: '60%',
      weighted: '₹5.10 Cr'
    },
    {
      name: 'Coal India Pit Volumetrics',
      company: 'Coal India Limited',
      sector: 'Mining',
      stage: 'Negotiation',
      value: '₹2.73 Cr',
      probability: '80%',
      weighted: '₹2.18 Cr'
    },
    {
      name: 'Indian Railways Dedicated Corridor',
      company: 'Dedicated Freight Corridor Corp',
      sector: 'Railways',
      stage: 'Qualified Lead',
      value: '₹1.00 Cr',
      probability: '40%',
      weighted: '₹40.00 L'
    }
  ];

  const sectorChartData = [
    { name: 'Powerline', value: 8.50, color: '#38bdf8' },
    { name: 'Mining', value: 2.73, color: '#34d399' },
    { name: 'Railways', value: 1.00, color: '#c084fc' }
  ];

  const filteredDeals = topDeals.filter(deal => {
    const matchesSearch = deal.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          deal.company.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesStage = stageFilter === 'All' || deal.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const handleRowClick = (deal: any) => {
    setSelectedOpportunity(deal);
    setIsDrawerOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-200 select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight mb-1">Sales Pipeline Analytics</h1>
          <p className="text-xs text-slate-400">
            Commercial pipeline valuation, stage distributions, and deal probability weighting.
          </p>
        </div>
        <button
          onClick={() => onLaunchQuery('How is our pipeline looking this quarter?')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-sm transition-all self-start"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Analyze Pipeline via BI Agent</span>
        </button>
      </div>

      {/* Pipeline Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0b0f19] p-4 rounded-xl border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium block mb-1">Total Open Pipeline</span>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">₹12.23 Cr</div>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">3 Active Commercial Deals</span>
        </div>

        <div className="bg-[#0b0f19] p-4 rounded-xl border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium block mb-1">Weighted Forecast</span>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">₹97.87 L</div>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">Probability-Weighted Realization</span>
        </div>

        <div className="bg-[#0b0f19] p-4 rounded-xl border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium block mb-1">Average Open Deal Size</span>
          <div className="text-2xl font-extrabold text-cyan-300 font-mono">₹4.07 Cr</div>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">Enterprise Contract Baseline</span>
        </div>

        <div className="bg-[#0b0f19] p-4 rounded-xl border border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium block mb-1">Data Quality Score</span>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">88.8%</div>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">522 Records Inspected</span>
        </div>
      </div>

      {/* Recharts Sector Valuation Bar Chart */}
      <div className="bg-[#0b0f19] p-5 rounded-2xl border border-slate-800/80 shadow-md">
        <h3 className="text-sm font-bold text-slate-100 mb-1">Pipeline Valuation by Sector (₹ Cr)</h3>
        <p className="text-xs text-slate-400 mb-4">Commercial deal pipeline distribution by industrial drone sector.</p>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sectorChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={10} tickFormatter={(val) => `₹${val} Cr`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0d1322', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#f8fafc' }} 
                formatter={(val: any) => [`₹${val} Cr`, 'Pipeline Value']}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32}>
                {sectorChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Strategic Opportunities Filterable Table */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <h2 className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold">
            Top Strategic Opportunities (Click row to view detail drawer)
          </h2>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search deals..."
                className="bg-[#0b0f19] text-slate-200 placeholder-slate-500 text-xs rounded-lg pl-8 pr-3 py-1.5 border border-slate-800 focus:outline-none focus:border-cyan-500/60"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#0b0f19] border border-slate-800 rounded-lg p-1 text-[11px]">
              <Filter className="w-3 h-3 text-slate-500 ml-1" />
              {['All', 'Proposal Sent', 'Negotiation'].map((stage) => (
                <button
                  key={stage}
                  onClick={() => setStageFilter(stage)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    stageFilter === stage ? 'bg-cyan-950 text-cyan-400 font-semibold border border-cyan-800/40' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#0b0f19] rounded-xl border border-slate-800/80 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Deal Name</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Sector</th>
                <th className="p-3.5">Stage</th>
                <th className="p-3.5">Value</th>
                <th className="p-3.5">Probability</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {filteredDeals.map((deal, idx) => (
                <tr 
                  key={idx} 
                  onClick={() => handleRowClick(deal)}
                  className="hover:bg-slate-900/80 cursor-pointer transition-colors"
                >
                  <td className="p-3.5 font-semibold text-slate-100">{deal.name}</td>
                  <td className="p-3.5 text-slate-400">{deal.company}</td>
                  <td className="p-3.5">
                    <span className="bg-slate-900 text-cyan-400 px-2 py-0.5 rounded font-mono text-[10px] border border-slate-800">
                      {deal.sector}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-300">{deal.stage}</td>
                  <td className="p-3.5 font-mono font-bold text-slate-100">{deal.value}</td>
                  <td className="p-3.5 font-mono text-emerald-400">{deal.probability}</td>
                  <td className="p-3.5 text-right">
                    <span className="text-cyan-400 hover:text-cyan-300 font-mono text-[11px] inline-flex items-center gap-1">
                      <span>View Drawer</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Opportunity Detail Drawer */}
      <OpportunityDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        opportunity={selectedOpportunity}
        onLaunchQuery={onLaunchQuery}
      />

    </div>
  );
};
