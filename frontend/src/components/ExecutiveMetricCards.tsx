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
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1 font-mono">
            <span>Open Pipeline</span>
            <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="text-base font-extrabold text-slate-900 font-mono tracking-tight">{openPipeline}</div>
        </div>
      )}

      {weightedPipeline && (
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1 font-mono">
            <span>Weighted Forecast</span>
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-base font-extrabold text-emerald-700 font-mono tracking-tight">{weightedPipeline}</div>
        </div>
      )}

      {activeWorkOrders !== undefined && (
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1 font-mono">
            <span>Active Work Orders</span>
            <Activity className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-base font-extrabold text-slate-900 font-mono tracking-tight">{activeWorkOrders} Ops</div>
        </div>
      )}
    </div>
  );
};
