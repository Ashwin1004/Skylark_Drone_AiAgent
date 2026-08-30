import React from 'react';
import { TrendingUp, Layers, Activity } from 'lucide-react';
import { ChatResponse } from '../types';

interface Props {
  metadata: ChatResponse;
}

export const ExecutiveMetricCards: React.FC<Props> = ({ metadata }) => {
  const { intent, metrics } = metadata;

  // Show metric cards for key BI intents
  if (!['pipeline_overview', 'work_order_analysis', 'leadership_update', 'opportunity_analysis'].includes(intent)) {
    return null;
  }

  const openPipeline = metrics.open_pipeline_formatted || metrics.total_pipeline_formatted;
  const weightedPipeline = metrics.weighted_pipeline_formatted;
  const activeWorkOrders = metrics.active_work_orders ?? metrics.operations_summary?.active_work_orders;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
      {openPipeline && (
        <div className="bg-[#0b0f19] p-3 rounded-lg border border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>Open Pipeline</span>
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-base font-bold text-slate-100 font-mono tracking-tight">{openPipeline}</div>
        </div>
      )}

      {weightedPipeline && (
        <div className="bg-[#0b0f19] p-3 rounded-lg border border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>Weighted Forecast</span>
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-base font-bold text-emerald-400 font-mono tracking-tight">{weightedPipeline}</div>
        </div>
      )}

      {activeWorkOrders !== undefined && (
        <div className="bg-[#0b0f19] p-3 rounded-lg border border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>Active Work Orders</span>
            <Activity className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-base font-bold text-slate-100 font-mono tracking-tight">{activeWorkOrders} Ops</div>
        </div>
      )}
    </div>
  );
};
