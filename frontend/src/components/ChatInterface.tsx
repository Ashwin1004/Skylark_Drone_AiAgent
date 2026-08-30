import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Copy, Check, Info, User, Bot } from 'lucide-react';
import { Message, ChatResponse } from '../types';
import { ExecutiveMetricCards } from './ExecutiveMetricCards';
import { InvoicingPriorityCards } from './InvoicingPriorityCards';
import { LoadingPipeline } from './LoadingPipeline';
import { WelcomeScreen } from './WelcomeScreen';

interface Props {
  messages: Message[];
  onSendMessage: (query: string) => void;
  isLoading: boolean;
  onInspectMetadata: (metadata: ChatResponse) => void;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
}

export const ChatInterface: React.FC<Props> = ({
  messages,
  onSendMessage,
  isLoading,
  onInspectMetadata,
  inputRef
}) => {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full px-4 py-4">
      
      {/* Conversation Timeline OR Welcome Prompt Cards */}
      <div className="flex-1 overflow-y-auto space-y-6 pb-6 pr-1 flex flex-col">
        {messages.length === 0 ? (
          <WelcomeScreen onSelectPrompt={onSendMessage} isLoading={isLoading} />
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="h-7 w-7 rounded-lg bg-sky-950/80 border border-sky-800/60 flex items-center justify-center text-cyan-400 shrink-0 mt-1 shadow-sm">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 shadow-sm border transition-all ${
                  msg.role === 'user'
                    ? 'bg-sky-600 text-white border-sky-500/30 rounded-tr-none text-sm'
                    : msg.error
                    ? 'bg-rose-950/30 border-rose-800/80 text-rose-200 rounded-tl-none'
                    : 'bg-[#0b0f19] border-slate-800/80 text-slate-100 rounded-tl-none'
                }`}
              >
                {/* Assistant Message Header Actions */}
                {msg.role === 'assistant' && msg.responseMetadata && (
                  <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-slate-800/60 text-xs">
                    <span className="font-semibold text-slate-300 text-[11px] font-mono">
                      Skylark BI
                    </span>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleCopyText(msg.id, msg.content)}
                        className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors text-xs"
                        title="Copy business response"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-mono">Copied ✓</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => onInspectMetadata(msg.responseMetadata!)}
                        className="text-slate-400 hover:text-cyan-300 font-mono flex items-center gap-1 text-xs transition-colors"
                      >
                        <Info className="w-3.5 h-3.5" /> View Analysis
                      </button>
                    </div>
                  </div>
                )}

                {/* Render Compact Executive Metric Cards */}
                {msg.role === 'assistant' && msg.responseMetadata && (
                  <ExecutiveMetricCards metadata={msg.responseMetadata} />
                )}

                {/* Render Invoicing Priorities Cards when billing analytics present */}
                {msg.role === 'assistant' && msg.responseMetadata?.metrics?.priority_work_orders && (
                  <InvoicingPriorityCards metadata={msg.responseMetadata} />
                )}

                {/* Response Narrative */}
                {msg.role === 'assistant' ? (
                  <div className="prose prose-invert prose-sm max-w-none prose-headings:font-semibold prose-headings:text-slate-100 prose-a:text-cyan-400 prose-strong:text-cyan-200 prose-code:text-cyan-300 text-xs sm:text-sm leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="h-7 w-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-1 shadow-sm">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Subtle ChatGPT Loading Indicator */}
        {isLoading && <LoadingPipeline />}

        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Bottom ChatGPT Composer */}
      <form onSubmit={handleSubmit} className="relative mt-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your business..."
          rows={2}
          disabled={isLoading}
          className="w-full bg-[#0b0f19] text-slate-100 placeholder-slate-500 border border-slate-800/80 focus:border-cyan-500/80 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/20 resize-none shadow-lg transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="absolute right-3 top-3 p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-30 transition-all shadow-sm"
          title="Send query"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
        <div className="text-[10px] text-slate-600 mt-1 text-center font-mono">
          Enter to send · Shift + Enter for new line
        </div>
      </form>
    </div>
  );
};
