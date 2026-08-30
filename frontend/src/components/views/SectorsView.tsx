import React from 'react';
import { PieChart, ArrowRight } from 'lucide-react';

interface Props {
  onLaunchQuery: (query: string) => void;
}

export const SectorsView: React.FC<Props> = ({ onLaunchQuery }) => {
  const sectors = [
    {
      title: 'Powerline & Energy',
      pipeline: '₹8.50 Cr',
      activeOps: 2,
      description: 'Thermal inspection & corridor survey mapping for power transmission lines.',
      query: 'How is the Energy sector performing?'
    },
    {
      title: 'Mining & Excavation',
      pipeline: '₹2.73 Cr',
      activeOps: 1,
      description: 'Stockpile volumetric measurement & pit contour survey models.',
      query: 'How is the Mining sector performing?'
    },
    {
      title: 'Renewables (Solar & Wind)',
      pipeline: '₹63.20 L',
      activeOps: 1,
      description: 'Solar panel defect detection & thermal efficiency scanning.',
      query: 'How is the Renewables sector performing?'
    },
    {
      title: 'Railways & Corridor Infra',
      pipeline: '₹1.00 Cr',
      activeOps: 0,
      description: 'Dedicated freight corridor monitoring & slope stability surveys.',
      query: 'How is the Railways sector performing?'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-200 select-none bg-slate-50 text-slate-900">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Sector Intelligence</h1>
          <p className="text-xs text-slate-500">
            Sector performance breakdown across sales pipeline and operational work orders.
          </p>
        </div>
        <button
          onClick={() => onLaunchQuery('How is the Energy sector performing?')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-xs transition-all self-start"
        >
          <PieChart className="w-3.5 h-3.5" />
          <span>Analyze Energy Sector via Agent</span>
        </button>
      </div>

      {/* Sector Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sectors.map((sec, idx) => (
          <div
            key={idx}
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-purple-300 transition-all shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-slate-900">{sec.title}</h3>
                <PieChart className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">{sec.description}</p>
              
              <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Open Pipeline</span>
                  <span className="text-slate-900 font-bold">{sec.pipeline}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Active Work Orders</span>
                  <span className="text-sky-600 font-bold">{sec.activeOps} Active</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onLaunchQuery(sec.query)}
              className="text-xs text-purple-600 hover:text-purple-700 font-mono font-medium flex items-center gap-1.5 self-start"
            >
              <span>Analyze Sector via Agent</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
};
