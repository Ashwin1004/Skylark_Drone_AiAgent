import React from 'react';
import { DollarSign, AlertCircle, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { ChatResponse } from '../types';

interface InvoicingPriorityCardsProps {
  metadata: ChatResponse;
}

export const InvoicingPriorityCards: React.FC<InvoicingPriorityCardsProps> = ({ metadata }) => {
  const metrics = metadata.metrics || {};
  const priorityList = metrics.priority_work_orders || [];
  const totalUnbilled = metrics.total_unbilled_formatted || '₹0';
  const affectedCount = metrics.work_orders_with_unbilled_count || 0;

  if (!priorityList || priorityList.length === 0) return null;

  return (
    <div className="my-4 p-4 rounded-2xl bg-gradient-to-b from-[#0e1628] to-[#090d18] border border-slate-800 shadow-lg select-none space-y-4">
      
      {/* Header Metric Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400 font-bold shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-wider block">
              Pending Billing Total
            </span>
            <span className="text-xl font-extrabold text-slate-100 font-mono tracking-tight">
              {totalUnbilled}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">
            {affectedCount} Work Orders Affected
          </span>
        </div>
      </div>

      {/* Top Invoicing Priority Items */}
      <div>
        <h4 className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2">
          Top Invoicing Priorities
        </h4>

        <div className="space-y-2">
          {priorityList.slice(0, 5).map((item: any, idx: number) => {
            const isHigh = item.priority === 'HIGH';
            const isMed = item.priority === 'MEDIUM';

            return (
              <div 
                key={idx}
                className="p-3 rounded-xl bg-[#0b0f19] border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                      isHigh 
                        ? 'bg-rose-950/80 text-rose-300 border-rose-800/60'
                        : isMed
                        ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}>
                      {item.priority} PRIORITY
                    </span>
                    <span className="text-xs font-bold text-slate-100 truncate">{item.work_order}</span>
                  </div>

                  <p className="text-[11px] text-slate-400 truncate">
                    Customer: <strong className="text-slate-200">{item.customer}</strong> · Sector: {item.sector}
                  </p>

                  <p className="text-[10px] text-slate-500 leading-snug">
                    {item.reason}
                  </p>
                </div>

                <div className="sm:text-right shrink-0">
                  <span className="text-xs text-slate-500 block text-[10px]">Unbilled Value</span>
                  <span className="text-sm font-extrabold text-amber-300 font-mono block">
                    {item.unbilled_amount_formatted}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Status: {item.execution_status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
