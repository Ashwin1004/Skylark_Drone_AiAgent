import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Copy, 
  Check, 
  Square,
  Share2
} from 'lucide-react';
import { Message } from '../types';
import { WelcomeScreen } from './WelcomeScreen';
import { AIResponseCharts } from './AIResponseCharts';
import { InvoicingPriorityCards } from './InvoicingPriorityCards';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onStopGeneration?: () => void;
  onInspectMetadata: (meta: any) => void;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onStopGeneration,
  onInspectMetadata,
}) => {
  const [input, setInput] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [sharedLink, setSharedLink] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const handleCopyMessageText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleShareChat = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?chat=${Date.now()}`;
    navigator.clipboard.writeText(shareUrl);
    setSharedLink(true);
    setTimeout(() => setSharedLink(false), 2500);
  };

  if (messages.length === 0) {
    return (
      <WelcomeScreen 
        onSelectPrompt={onSendMessage} 
        isLoading={isLoading} 
        inputRef={textareaRef}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f3eee6] overflow-hidden relative">
      
      {/* Top Action Bar (Share Button) */}
      <div className="bg-[#f3eee6]/90 backdrop-blur-xs border-b border-[#e2dcd3] px-6 py-2 flex items-center justify-between z-10">
        <div className="text-xs sm:text-sm font-semibold text-[#4a3d37] flex items-center gap-2 font-mono">
          <Sparkles className="w-4 h-4 text-[#8c5220]" />
          <span>Skylark Chat Session</span>
        </div>

        <button
          onClick={handleShareChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#e2dcd3] hover:bg-[#faf7f2] text-[#4a3d37] text-xs font-semibold transition-colors shadow-2xs"
        >
          {sharedLink ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#059669]" />
              <span className="text-[#059669]">Link Copied! ✓</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-[#786a62]" />
              <span>Share</span>
            </>
          )}
        </button>
      </div>

      {/* Scrollable Chat Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-4xl mx-auto w-full">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={index}
              className={`flex items-start gap-3 text-sm sm:text-base animate-in fade-in duration-200 ${
                isUser ? 'justify-end' : 'justify-start'
              }`}
            >
              {/* Bot Avatar */}
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-[#4a3d37] border border-[#5c4c45] flex items-center justify-center text-[#f5f2eb] shrink-0 shadow-xs mt-0.5">
                  <Bot className="w-4 h-4 text-[#e2b897]" />
                </div>
              )}

              {/* Message Content Container */}
              <div
                className={`max-w-2xl space-y-3 ${
                  isUser
                    ? 'bg-[#3b2e2a] text-[#f8f6f0] rounded-2xl rounded-tr-none px-4 py-3 shadow-sm text-sm sm:text-base'
                    : 'bg-white border border-[#e2dcd3] text-[#211a17] rounded-2xl rounded-tl-none p-5 sm:p-6 shadow-2xs w-full'
                }`}
              >
                {/* Structured Content Rendering */}
                {isUser ? (
                  <div className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                    {msg.content}
                  </div>
                ) : (
                  <div className="prose prose-slate max-w-none text-sm sm:text-base text-[#211a17] leading-relaxed">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ node, ...props }) => (
                          <h1 className="text-lg font-extrabold text-[#111827] mt-3 mb-2 tracking-tight border-b border-[#f0eae1] pb-1" {...props} />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2 className="text-base font-extrabold text-[#111827] mt-3 mb-1.5 tracking-tight" {...props} />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3 className="text-sm font-extrabold text-[#111827] mt-2.5 mb-1 uppercase tracking-wider font-mono" {...props} />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong className="font-extrabold text-[#111827]" {...props} />
                        ),
                        p: ({ node, ...props }) => (
                          <p className="text-sm sm:text-base mb-2.5 leading-relaxed text-[#211a17]" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul className="list-disc list-inside space-y-1.5 mb-3 text-sm sm:text-base text-[#211a17]" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol className="list-decimal list-inside space-y-1.5 mb-3 text-sm sm:text-base text-[#211a17]" {...props} />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="leading-relaxed text-sm sm:text-base" {...props} />
                        ),
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto my-3 border border-[#e2dcd3] rounded-lg">
                            <table className="w-full text-left text-xs sm:text-sm border-collapse" {...props} />
                          </div>
                        ),
                        th: ({ node, ...props }) => (
                          <th className="bg-[#f5f0e8] p-2.5 font-extrabold text-[#111827] border-b border-[#e2dcd3] uppercase text-xs tracking-wider" {...props} />
                        ),
                        td: ({ node, ...props }) => (
                          <td className="p-2.5 border-b border-[#f0eae1] text-xs sm:text-sm text-[#211a17]" {...props} />
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}

                {/* AI Assistant Special Enriched Analytics Components */}
                {!isUser && msg.responseMetadata && (
                  <div className="space-y-4 pt-2 border-t border-[#f0eae1]">
                    
                    {/* Recharts Data Visualization */}
                    <AIResponseCharts metadata={msg.responseMetadata} />

                    {/* Invoicing Priority Highlight Cards */}
                    <InvoicingPriorityCards metadata={msg.responseMetadata} />

                    {/* Message Action Toolbar */}
                    <div className="flex items-center justify-start pt-2 text-xs text-[#786a62] font-mono border-t border-[#f0eae1]">
                      <button
                        onClick={() => handleCopyMessageText(msg.content, index)}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-[#f5f0e8] hover:bg-[#e8dfd3] text-[#4a3d37] transition-colors"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="w-3 h-3 text-[#059669]" />
                            <span className="text-[#059669]">Copied ✓</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-[#786a62]" />
                            <span>Copy Message</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                )}
              </div>

              {/* User Avatar */}
              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-[#e8e1d5] border border-[#dcd4c8] flex items-center justify-center text-[#4a3d37] shrink-0 shadow-xs mt-0.5 font-bold text-xs">
                  <User className="w-4 h-4 text-[#4a3d37]" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Thinking Indicator */}
        {isLoading && (
          <div className="flex items-center gap-3 text-xs text-[#786a62] font-mono animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-[#4a3d37] flex items-center justify-center text-[#f5f2eb]">
              <Sparkles className="w-4 h-4 text-[#e2b897] animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Bottom Input Bar */}
      <div className="p-4 bg-[#f3eee6] border-t border-[#e2dcd3] sticky bottom-0">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
          <div className="relative bg-white text-[#211a17] border border-[#dcd4c8] focus-within:border-[#8c7365] focus-within:ring-2 focus-within:ring-[#e8dfd3] rounded-2xl p-2.5 shadow-md transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your business..."
              rows={1}
              disabled={isLoading}
              className="w-full bg-transparent text-[#211a17] placeholder-[#a3978c] px-3 py-1.5 text-sm sm:text-base focus:outline-none resize-none max-h-40"
            />
            <div className="flex items-center justify-between pt-2 px-2 border-t border-[#f0eae1]">
              <span className="text-[11px] font-mono text-[#8c7f76]">
                Shift + Enter for new line
              </span>

              {isLoading ? (
                /* Stop Generation Button */
                <button
                  type="button"
                  onClick={onStopGeneration}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-800 hover:bg-rose-900 text-white font-semibold text-xs transition-all shadow-sm animate-in fade-in duration-150"
                >
                  <span>Stop</span>
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : (
                /* Send Button */
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4a3d37] hover:bg-[#3b2e2a] text-[#f5f2eb] font-semibold text-xs disabled:opacity-30 transition-all shadow-sm"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

    </div>
  );
};
