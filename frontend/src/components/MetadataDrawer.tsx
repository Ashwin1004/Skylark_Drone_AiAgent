import React, { useState } from 'react';
import { X, Shield, Code, Calculator, Filter, Database, ArrowRight, Cpu, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { ChatResponse } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  metadata: ChatResponse | null;
}

export const MetadataDrawer: React.FC<Props> = ({ isOpen, onClose, metadata }) => {
  const [activeTab, setActiveTab] = useState<'flow' | 'explain' | 'quality' | 'json'>('flow');

  if (!isOpen || !metadata) return null;

  const { intent, data_sources, data_quality, explainability, metrics } = metadata;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-xl bg-[#0d1322] border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100">Analysis Metadata & Architecture</h2>
              <p className="text-xs text-slate-400">Transparent system verification and audit report</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-4 bg-slate-950/40 text-xs font-medium">
          <button
            onClick={() => setActiveTab('flow')}
            className={`py-3 px-3.5 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'flow'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" /> Pipeline Diagram
          </button>

          <button
            onClick={() => setActiveTab('explain')}
            className={`py-3 px-3.5 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'explain'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" /> Calculation Method
          </button>

          <button
            onClick={() => setActiveTab('quality')}
            className={`py-3 px-3.5 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'quality'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Data Quality ({data_quality.score}%)
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`py-3 px-3.5 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'json'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" /> Raw JSON
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          
          {/* Flow Diagram Tab */}
          {activeTab === 'flow' && (
            <div className="space-y-6">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs uppercase font-mono tracking-wider text-cyan-400 font-semibold">
                  System Processing Pipeline Architecture
                </h4>
                
                <div className="space-y-3 pt-2 text-xs font-mono">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-200">
                      <Database className="w-4 h-4 text-cyan-400" />
                      <span>1. Monday.com GraphQL API v2023-10</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">LIVE</span>
                  </div>
                  
                  <div className="flex justify-center text-slate-600">↓</div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-200">
                      <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                      <span>2. Data Cleaning & Quality Auditor</span>
                    </div>
                    <span className="text-[10px] text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">{data_quality.score}% Score</span>
                  </div>

                  <div className="flex justify-center text-slate-600">↓</div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-200">
                      <Calculator className="w-4 h-4 text-emerald-400" />
                      <span>3. Deterministic Pandas Analytics Engine</span>
                    </div>
                    <span className="text-[10px] text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">100% Math</span>
                  </div>

                  <div className="flex justify-center text-slate-600">↓</div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-200">
                      <Cpu className="w-4 h-4 text-purple-400" />
                      <span>4. Groq LLM Executive Explanation</span>
                    </div>
                    <span className="text-[10px] text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">AI Summary</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase font-mono text-slate-500 block mb-1">Query Intent</label>
                <span className="inline-block bg-slate-900 text-cyan-300 font-mono text-xs px-3 py-1 rounded border border-slate-800">
                  {intent}
                </span>
              </div>

              <div>
                <label className="text-xs uppercase font-mono text-slate-500 block mb-1">Data Sources Queried</label>
                <div className="flex flex-wrap gap-2">
                  {data_sources.map((src, i) => (
                    <span key={i} className="bg-slate-950 text-slate-200 text-xs px-2.5 py-1 rounded border border-slate-800">
                      {src}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Calculation Method Tab */}
          {activeTab === 'explain' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs uppercase font-mono text-slate-500 block mb-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-cyan-400" /> Active Filters & Timeframe Bounds
                </label>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono space-y-1 text-slate-300">
                  <p>Timeframe Bound: <span className="text-cyan-300">{explainability.timeframe_resolved}</span></p>
                  {Object.entries(explainability.filters_applied || {}).map(([k, v]) => (
                    v ? <p key={k}>{k}: <span className="text-slate-200">{String(v)}</span></p> : null
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs uppercase font-mono text-slate-500 block mb-1">Deterministic Calculation Method</label>
                <p className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
                  {explainability.calculation_method}
                </p>
              </div>

              {explainability.assumptions && explainability.assumptions.length > 0 && (
                <div>
                  <label className="text-xs uppercase font-mono text-slate-500 block mb-1">System Assumptions</label>
                  <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                    {explainability.assumptions.map((asm, i) => (
                      <li key={i}>{asm}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Quality Tab */}
          {activeTab === 'quality' && (
            <div className="space-y-5">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-mono">Data Quality Audit Score</span>
                  <div className="text-3xl font-bold text-slate-100 font-mono mt-0.5">{data_quality.score}%</div>
                </div>
                <div className="text-right text-xs text-slate-400 font-mono">
                  <p className="text-slate-200 font-semibold">{data_quality.valid_records} / {data_quality.total_records}</p>
                  <p>Valid Records</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase font-mono text-slate-500 mb-2">Audit Breakdown</h4>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <span className="text-slate-500 block">Missing Values</span>
                    <span className="text-slate-200 text-base font-bold">{data_quality.missing_values_count}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                    <span className="text-slate-500 block">Missing/Bad Dates</span>
                    <span className="text-slate-200 text-base font-bold">{data_quality.invalid_dates_count}</span>
                  </div>
                </div>
              </div>

              {data_quality.deductions && data_quality.deductions.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase font-mono text-amber-400 mb-2">Deductions & Caveats</h4>
                  <ul className="space-y-2">
                    {data_quality.deductions.map((d, i) => (
                      <li key={i} className="bg-amber-950/30 text-amber-300 text-xs p-3 rounded-lg border border-amber-800/40 flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* JSON Tab */}
          {activeTab === 'json' && (
            <div>
              <label className="text-xs uppercase font-mono text-slate-500 block mb-2">Pre-Computed Deterministic Metrics (Pandas Output)</label>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto max-h-96">
                {JSON.stringify(metrics, null, 2)}
              </pre>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
