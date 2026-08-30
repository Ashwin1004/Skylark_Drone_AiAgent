import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { ChatResponse } from '../types';

interface Props {
  metadata: ChatResponse;
}

export const AIResponseCharts: React.FC<Props> = ({ metadata }) => {
  const metrics = metadata?.metrics || {};

  // 1. Stage Distribution Data
  const stageDist = metrics.stage_distribution || {};
  const stageData = Object.entries(stageDist).map(([stage, count]) => ({
    name: stage,
    value: Number(count) || 0,
  })).filter(item => item.value > 0);

  // 2. Sector Distribution Data
  const sectorDist = metrics.sector_summary || metrics.sector_breakdown || {};
  const sectorData = Object.entries(sectorDist).map(([sector, val]: [string, any]) => ({
    name: sector,
    value: typeof val === 'number' ? val : (val?.open_pipeline_value || val?.deals_count || 1),
  })).filter(item => item.value > 0);

  // 3. Top Deals Data
  const topDeals = Array.isArray(metrics.top_deals) ? metrics.top_deals : [];

  const COLORS = ['#0284c7', '#059669', '#9333ea', '#d97706', '#dc2626', '#4f46e5'];

  if (stageData.length === 0 && sectorData.length === 0 && topDeals.length === 0) {
    return null;
  }

  return (
    <div className="my-4 space-y-4">
      
      {/* Stage Breakdown Chart */}
      {stageData.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-slate-700 font-mono uppercase tracking-wider">
              Pipeline Stage Breakdown (Deals Count)
            </h4>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0284c7' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {stageData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Sector Distribution Chart */}
      {sectorData.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-slate-700 font-mono uppercase tracking-wider">
              Sector Distribution
            </h4>
          </div>
          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {sectorData.map((_, index) => (
                    <Cell key={`cell-pie-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
};
