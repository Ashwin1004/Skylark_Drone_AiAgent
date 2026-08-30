import React from 'react';
import { ShieldAlert, ShieldCheck, Info } from 'lucide-react';
import { DataQualityReport } from '../types';

interface Props {
  report: DataQualityReport;
  onOpenDrawer?: () => void;
}

export const DataQualityBadge: React.FC<Props> = ({ report, onOpenDrawer }) => {
  const score = report.score ?? 100;
  
  let badgeColor = "bg-emerald-950/80 text-emerald-400 border-emerald-800/60";
  let icon = <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;

  if (score < 80) {
    badgeColor = "bg-rose-950/80 text-rose-400 border-rose-800/60";
    icon = <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />;
  } else if (score < 95) {
    badgeColor = "bg-amber-950/80 text-amber-300 border-amber-800/60";
    icon = <Info className="w-3.5 h-3.5 text-amber-300" />;
  }

  return (
    <button
      onClick={onOpenDrawer}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border ${badgeColor} hover:opacity-90 transition-opacity cursor-pointer shadow-sm`}
      title="Click to view detailed data quality report and explainability"
    >
      {icon}
      <span>Data Quality: <strong className="font-bold">{score}%</strong></span>
      {report.deductions && report.deductions.length > 0 && (
        <span className="ml-1 w-1.5 h-1.5 rounded-full bg-current"></span>
      )}
    </button>
  );
};
