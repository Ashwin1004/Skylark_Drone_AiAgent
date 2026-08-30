import React, { useState } from 'react';
import { Award, Copy, Check, FileText, ArrowRight, ShieldCheck } from 'lucide-react';

interface Props {
  onLaunchQuery: (query: string) => void;
}

export const LeadershipView: React.FC<Props> = ({ onLaunchQuery }) => {
  const [copied, setCopied] = useState(false);

  const briefText = `### 🎯 Skylark BI Executive Leadership Brief

**Executive Summary**: Skylark Drones holds **₹12.23 Cr in open pipeline value** across 3 active opportunities, with a probability-weighted forecast of **₹97.87 Lakh**. Operational teams are executing **4 active work orders** representing ₹82.30 Lakh in unbilled contract deliverables.

#### 1. Commercial Sales Pipeline:
- **Open Pipeline**: ₹12.23 Cr (3 open deals)
- **Weighted Forecast**: ₹97.87 Lakh
- **Average Deal Size**: ₹4.07 Cr
- **Top Opportunity**: Adani Energy Solutions Ltd (₹8.50 Cr, 60% probability)

#### 2. Operational Execution & Invoicing:
- **Active Work Orders**: 4 active ops
- **Completed Ops**: 1 completed
- **Pending Invoicing (Unbilled Deliverables)**: ₹82.30 Lakh
- **Cash Receivables**: ₹14.50 Lakh

#### 3. Strategic Risks & Data Quality Audit:
- **Pipeline Concentration**: Energy and Mining sectors represent >80% of open value.
- **Data Quality Score**: **88.8%** (181 deals missing deal value fields).

#### 4. Recommended Leadership Actions:
1. Prioritize late-stage proposal negotiation on the Adani Energy corridor deal.
2. Accelerate invoice dispatch for ₹82.30 Lakh in completed work order deliverables.
3. Diversify sales outreach into Solar Renewables and Railways.
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(briefText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6 animate-in fade-in duration-200 select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>Leadership Brief</span>
          </h1>
          <p className="text-xs text-slate-400">Founder &amp; CEO Executive Summary Report</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-mono">Copied Brief ✓</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Leadership Brief</span>
              </>
            )}
          </button>

          <button
            onClick={() => onLaunchQuery('Prepare a leadership update.')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium shadow-sm transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Regenerate Brief</span>
          </button>
        </div>
      </div>

      {/* Formatted Report Card */}
      <div className="bg-[#0b0f19] p-6 rounded-2xl border border-slate-800/80 shadow-lg space-y-6 text-slate-200">
        
        {/* Executive Summary */}
        <div className="border-b border-slate-800/60 pb-4">
          <span className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-wider block mb-1">
            Executive Summary
          </span>
          <p className="text-sm leading-relaxed text-slate-200">
            Skylark Drones holds <strong className="text-cyan-300">₹12.23 Cr in open pipeline value</strong> across 3 active opportunities, with a probability-weighted forecast of <strong className="text-emerald-400">₹97.87 Lakh</strong>. Operational teams are executing <strong className="text-sky-300">4 active work orders</strong> representing ₹82.30 Lakh in unbilled contract deliverables.
          </p>
        </div>

        {/* Commercial Pipeline & Operations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-800/60 pb-6">
          <div>
            <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider block mb-2">
              Sales Pipeline Snapshot
            </span>
            <ul className="text-xs space-y-1.5 text-slate-300 font-mono">
              <li>• Open Pipeline: <strong className="text-slate-100">₹12.23 Cr</strong></li>
              <li>• Weighted Forecast: <strong className="text-emerald-400">₹97.87 Lakh</strong></li>
              <li>• Average Deal Size: <strong className="text-slate-100">₹4.07 Cr</strong></li>
              <li>• Top Deal: <span className="text-cyan-300">Adani Energy (₹8.50 Cr)</span></li>
            </ul>
          </div>

          <div>
            <span className="text-[10px] font-mono text-sky-400 uppercase font-bold tracking-wider block mb-2">
              Operational Execution &amp; Invoicing
            </span>
            <ul className="text-xs space-y-1.5 text-slate-300 font-mono">
              <li>• Active Work Orders: <strong className="text-slate-100">4 Active Ops</strong></li>
              <li>• Pending Invoicing: <strong className="text-amber-300">₹82.30 Lakh</strong></li>
              <li>• Invoiced Receivables: <strong className="text-slate-100">₹14.50 Lakh</strong></li>
              <li>• Ops Sector Leader: <span className="text-slate-100">Powerline (2 Ops)</span></li>
            </ul>
          </div>
        </div>

        {/* Recommended Actions */}
        <div>
          <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider block mb-2">
            Recommended Leadership Actions
          </span>
          <ol className="list-decimal list-inside text-xs space-y-2 text-slate-300 leading-relaxed font-sans">
            <li><strong>Prioritize late-stage proposal negotiation</strong> on the Adani Energy Solutions corridor contract (₹8.50 Cr).</li>
            <li><strong>Accelerate invoice dispatch</strong> for ₹82.30 Lakh in completed work order survey deliverables.</li>
            <li><strong>Diversify commercial pipeline</strong> across Solar Renewables and Railways to reduce sector concentration risk.</li>
          </ol>
        </div>

      </div>

    </div>
  );
};
