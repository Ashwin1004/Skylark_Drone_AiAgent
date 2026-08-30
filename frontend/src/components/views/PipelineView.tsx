import React, { useState } from 'react';
import { TrendingUp, Layers, Target, ArrowRight, Search, Filter } from 'lucide-react';
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
    { name: 'Powerline', value: 8.50, color: '#0284c7' },
    { name: 'Mining', value: 2.73, color: '#059669' },
    { name: 'Railways', value: 1.00, color: '#9333ea' }
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
    <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-200 select-none bg-slate-50 text-slate-900">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sales Pipeline Intelligence</h1>
          <p className="text-xs text-slate-500">
            Open commercial pipeline, stage breakdowns, weighted forecast, and top deals.
          </p>
        </div>
        <button
          onClick={() => onLaunchQuery("How is our pipeline looking this quarter?")}
          className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>Ask Agent About Pipeline</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs text-slate-500 font-mono flex items-center justify-between">
            <span>Total Open Pipeline</span>
            <TrendingUp className="w-4 h-4 text-sky-600" />
          </span>
          <div className="text-2xl font-bold text-slate-900 font-mono">₹12.23 Cr</div>
          <span className="text-[11px] text-slate-500 font-mono">3 Active Deals</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs text-slate-500 font-mono flex items-center justify-between">
            <span>Weighted Pipeline</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </span>
          <div className="text-2xl font-bold text-emerald-700 font-mono">₹7.55 Cr</div>
          <span className="text-[11px] text-slate-500 font-mono">Probability-adjusted</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs text-slate-500 font-mono flex items-center justify-between">
            <span>Average Deal Size</span>
            <Target className="w-4 h-4 text-purple-600" />
          </span>
          <div className="text-2xl font-bold text-slate-900 font-mono">₹4.08 Cr</div>
          <span className="text-[11px] text-slate-500 font-mono">High enterprise value</span>
        </div>
      </div>

      {/* Chart & Filter Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-xs uppercase font-mono tracking-wider text-slate-700 font-bold">
            Pipeline by Sector (₹ Cr)
          </h3>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px', color: '#0f172a' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {sectorChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs uppercase font-mono tracking-wider text-slate-700 font-bold mb-3">
              Filter Pipeline
            </h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-500 font-mono block mb-1">Search Opportunity</label>
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search by deal or client..."
                    className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-lg pl-8 pr-2.5 py-1.5 text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-mono block mb-1">Filter by Stage</label>
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-sky-500 font-sans"
                >
                  <option value="All">All Stages</option>
                  <option value="Proposal Sent">Proposal Sent</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Qualified Lead">Qualified Lead</option>
                </select>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            Showing {filteredDeals.length} of {topDeals.length} deals
          </div>
        </div>
      </div>

      {/* Deals Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800">
            Open Commercial Deals
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">Click row for opportunity details</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[10px] uppercase font-mono text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3">Opportunity</th>
                <th className="p-3">Client</th>
                <th className="p-3">Sector</th>
                <th className="p-3">Stage</th>
                <th className="p-3 text-right">Value</th>
                <th className="p-3 text-right">Probability</th>
                <th className="p-3 text-right">Weighted Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredDeals.map((deal, idx) => (
                <tr 
                  key={idx}
                  onClick={() => handleRowClick(deal)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="p-3 font-semibold text-slate-900">{deal.name}</td>
                  <td className="p-3 text-slate-600">{deal.company}</td>
                  <td className="p-3">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-200">
                      {deal.sector}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded text-[10px] font-mono border border-sky-200 font-medium">
                      {deal.stage}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">{deal.value}</td>
                  <td className="p-3 text-right font-mono text-emerald-700 font-bold">{deal.probability}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-700">{deal.weighted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <OpportunityDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        opportunity={selectedOpportunity}
        onLaunchQuery={onLaunchQuery}
      />

    </div>
  );
};
