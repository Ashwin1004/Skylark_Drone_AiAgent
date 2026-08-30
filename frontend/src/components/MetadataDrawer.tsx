import React, { useState } from 'react';
import { X, Shield, Code, Calculator, Filter, Database, FileSpreadsheet, Cpu } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-xl bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 text-slate-900">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-sky-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Analysis Metadata & Architecture</h2>
              <p className="text-xs text-slate-500">Transparent system verification and audit report</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-4 bg-slate-50 text-xs font-medium">
          <button
            onClick={() => setActiveTab('flow')}
            className={`py-3 px-3.5 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'flow'
                ? 'border-sky-600 text-sky-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" /> Pipeline Diagram
          </button>

          <button
            onClick={() => setActiveTab('explain')}
            className={`py-3 px-3.5 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'explain'
                ? 'border-sky-600 text-sky-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" /> Calculation Method
          </button>

          <button
            onClick={() => setActiveTab('quality')}
            className={`py-3 px-3.5 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'quality'
                ? 'border-sky-600 text-sky-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Data Quality ({data_quality.score}%)
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`py-3 px-3.5 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'json'
                ? 'border-sky-600 text-sky-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" /> Raw JSON
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-700">
          
          {/* Flow Diagram Tab */}
          {activeTab === 'flow' && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs uppercase font-mono tracking-wider text-sky-700 font-semibold">
                  System Processing Pipeline Architecture
                </h4>
                
                <div className="space-y-3 pt-2 text-xs font-mono">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-2 text-slate-800">
                      <Database className="w-4 h-4 text-sky-600" />
                      <span>1. Monday.com GraphQL API</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">LIVE</span>
                  </div>
                  
                  <div className="flex justify-center text-slate-400">↓</div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-2 text-slate-800">
                      <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                      <span>2. Data Cleaning Auditor</span>
                    </div>
                    <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold">{data_quality.score}% Score</span>
                  </div>

                  <div className="flex justify-center text-slate-400">↓</div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-2 text-slate-800">
                      <Calculator className="w-4 h-4 text-emerald-600" />
                      <span>3. Deterministic Pandas Engine</span>
                    </div>
                    <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">100% Math</span>
                  </div>

                  <div className="flex justify-center text-slate-400">↓</div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-2 text-slate-800">
                      <Cpu className="w-4 h-4 text-purple-600" />
                      <span>4. Groq LLM Explanation</span>
                    </div>
                    <span className="text-[10px] text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-bold">AI Summary</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase font-mono text-slate-400 block mb-1">Query Intent</label>
                <span className="inline-block bg-sky-50 text-sky-800 font-mono text-xs px-3 py-1 rounded border border-sky-200 font-bold">
                  {intent}
                </span>
              </div>

              <div>
                <label className="text-xs uppercase font-mono text-slate-400 block mb-1">Data Sources Queried</label>
                <div className="flex flex-wrap gap-2">
                  {data_sources.map((src, i) => (
                    <span key={i} className="bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded border border-slate-200 font-medium">
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
                <label className="text-xs uppercase font-mono text-slate-400 block mb-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-sky-600" /> Active Filters & Timeframe Bounds
                </label>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-mono space-y-1 text-slate-800">
                  <p>Timeframe Bound: <span className="text-sky-700 font-bold">{explainability.timeframe_resolved}</span></p>
                  {Object.entries(explainability.filters_applied || {}).map(([k, v]) => (
                    v ? <p key={k}>{k}: <span className="text-slate-900">{String(v)}</span></p> : null
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs uppercase font-mono text-slate-400 block mb-1">Deterministic Calculation Method</label>
                <p className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans">
                  {explainability.calculation_method}
                </p>
              </div>

              {explainability.assumptions && explainability.assumptions.length > 0 && (
                <div>
                  <label className="text-xs uppercase font-mono text-slate-400 block mb-1">System Assumptions</label>
                  <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
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
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-mono">Data Quality Audit Score</span>
                  <div className="text-3xl font-bold text-slate-900 font-mono mt-0.5">{data_quality.score}%</div>
                </div>
                <div className="text-right text-xs text-slate-500 font-mono">
                  <p className="text-slate-900 font-semibold">{data_quality.valid_records} / {data_quality.total_records}</p>
                  <p>Valid Records</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase font-mono text-slate-400 mb-2">Audit Breakdown</h4>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-50 p-3 rounded border border-slate-200">
                    <span className="text-slate-500 block">Missing Values</span>
                    <span className="text-slate-900 text-base font-bold">{data_quality.missing_values_count}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded border border-slate-200">
                    <span className="text-slate-500 block">Missing/Bad Dates</span>
                    <span className="text-slate-900 text-base font-bold">{data_quality.invalid_dates_count}</span>
                  </div>
                </div>
              </div>

              {data_quality.deductions && data_quality.deductions.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase font-mono text-amber-700 mb-2">Deductions & Caveats</h4>
                  <ul className="space-y-2">
                    {data_quality.deductions.map((d, i) => (
                      <li key={i} className="bg-amber-50 text-amber-900 text-xs p-3 rounded-lg border border-amber-200 flex items-start gap-2">
                        <span className="text-amber-600 font-bold">•</span>
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
              <label className="text-xs uppercase font-mono text-slate-400 block mb-2">Pre-Computed Deterministic Metrics (Pandas Output)</label>
              <pre className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs font-mono text-sky-300 overflow-x-auto max-h-96">
                {JSON.stringify(metrics, null, 2)}
              </pre>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
