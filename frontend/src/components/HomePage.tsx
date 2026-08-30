import React from 'react';
import { 
  TrendingUp, 
  Layers, 
  Activity, 
  PieChart, 
  ArrowRight, 
  MessageSquare, 
  Sparkles,
  Award,
  DollarSign
} from 'lucide-react';
import { HealthResponse } from '../types';

interface HomePageProps {
  health: HealthResponse | null;
  onLaunchQuery: (prompt: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onLaunchQuery }) => {
  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-200 select-none">
      
      {/* Executive Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-slate-800/80 p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 font-mono text-xs mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" /> SKYLARK BI PLATFORM V1.0
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight mb-3">
            Executive Intelligence &amp;<br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-teal-300 bg-clip-text text-transparent">
              Decision Workspace
            </span>
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            Query live commercial pipeline and operational execution data directly from Monday.com. Math is 100% deterministically computed in Python/Pandas and formatted into executive narratives via Groq.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onLaunchQuery('How is our pipeline looking this quarter?')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-medium text-xs shadow-lg shadow-cyan-600/20 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask BI Agent</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onLaunchQuery('Prepare a leadership update.')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700/80 font-medium text-xs transition-all shadow-sm"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Generate Leadership Update</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div>
        <h2 className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold mb-3">
          High-Level Executive Metrics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div 
            onClick={() => onLaunchQuery('How is our pipeline looking this quarter?')}
            className="group cursor-pointer bg-[#0c1220] hover:bg-[#101729] p-4 rounded-xl border border-slate-800/80 hover:border-cyan-500/40 transition-all shadow-sm"
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
            className="group cursor-pointer bg-[#0c1220] hover:bg-[#101729] p-4 rounded-xl border border-slate-800/80 hover:border-emerald-500/40 transition-all shadow-sm"
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
            className="group cursor-pointer bg-[#0c1220] hover:bg-[#101729] p-4 rounded-xl border border-slate-800/80 hover:border-sky-500/40 transition-all shadow-sm"
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
            className="group cursor-pointer bg-[#0c1220] hover:bg-[#101729] p-4 rounded-xl border border-slate-800/80 hover:border-amber-500/40 transition-all shadow-sm"
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

      {/* Sector Quick Launchpads Grid */}
      <div>
        <h2 className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold mb-3">
          Explore Key Sectors
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <div 
            onClick={() => onLaunchQuery('How is the Energy sector performing?')}
            className="group cursor-pointer p-4 rounded-xl bg-[#0c1220] hover:bg-[#101729] border border-slate-800/80 hover:border-purple-500/40 transition-all shadow-sm flex items-start justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <PieChart className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-200 group-hover:text-purple-300 transition-colors">
                  Powerline &amp; Energy
                </h3>
              </div>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                Transmission line thermal inspections &amp; corridor mapping.
              </p>
              <span className="text-[11px] text-purple-400 font-mono flex items-center gap-1 font-medium">
                Analyze Sector <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>

          <div 
            onClick={() => onLaunchQuery('How is the Mining sector performing?')}
            className="group cursor-pointer p-4 rounded-xl bg-[#0c1220] hover:bg-[#101729] border border-slate-800/80 hover:border-emerald-500/40 transition-all shadow-sm flex items-start justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <PieChart className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-200 group-hover:text-emerald-300 transition-colors">
                  Mining &amp; Excavation
                </h3>
              </div>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                Volumetric stockpile calculations &amp; pit survey mapping.
              </p>
              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 font-medium">
                Analyze Sector <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>

          <div 
            onClick={() => onLaunchQuery('What are our biggest high-probability opportunities?')}
            className="group cursor-pointer p-4 rounded-xl bg-[#0c1220] hover:bg-[#101729] border border-slate-800/80 hover:border-cyan-500/40 transition-all shadow-sm flex items-start justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                  Strategic Deals
                </h3>
              </div>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                Top high-probability opportunities ranked by weighted value.
              </p>
              <span className="text-[11px] text-cyan-400 font-mono flex items-center gap-1 font-medium">
                View Opportunities <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
