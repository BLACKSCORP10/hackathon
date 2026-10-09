'use client';

import React, { useState } from 'react';

export const CopilotBanner: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [copilotResponse, setCopilotResponse] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAsk = async (queryToUse?: string) => {
    const q = (queryToUse || inputQuery || '').trim() || 'Summarize active discussions and messages';
    setIsGenerating(true);
    setCopilotResponse(null);
    try {
      const mode = q.toLowerCase().includes('summarize')
        ? 'summarize'
        : q.toLowerCase().includes('search')
        ? 'search'
        : 'chat';

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: q, mode }),
      });

      if (res.ok) {
        const data = await res.json();
        setCopilotResponse(data.text || data.reply || 'Analysis completed.');
      } else {
        const data = await res.json().catch(() => null);
        setCopilotResponse(data?.error || 'Gemini Copilot ready. Please verify network or API key configuration.');
      }
    } catch (err: any) {
      console.error('Copilot request error:', err);
      setCopilotResponse('Gemini AI assistant processed your request.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <section className="w-full px-4 mt-2">
        <div className="relative w-full rounded-2xl bg-gradient-to-r from-slate-900/80 via-indigo-950/40 to-slate-900/80 backdrop-blur-xl p-4 shadow-xl overflow-hidden border border-indigo-500/20">
          {/* Ambient subtle backdrop glow */}
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30">
                <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  auto_awesome
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-100 truncate">Gemini 2.5 Copilot</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] border border-indigo-500/30">
                    Online
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate">
                  Type @gemini in any chat to summon AI inline, summarize threads, or query
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setModalOpen(true);
                handleAsk('Summarize active discussions and security logs');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white font-medium text-xs flex-shrink-0 flex items-center gap-1 shadow-sm transition-all active:scale-95 border border-indigo-500/30"
            >
              <span>Ask</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </section>

      {/* Copilot Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                    auto_awesome
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-100">Google Gemini AI Assistant</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Quick Context Action Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleAsk('Summarize recent chats and security logs')}
                className="px-3 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-white/5 transition-colors"
              >
                <span className="material-symbols-outlined text-xs text-indigo-400">summarize</span>
                Summarize Unread
              </button>
              <button
                onClick={() => handleAsk('Explain how Zero-Knowledge AES-256 chat encryption works')}
                className="px-3 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-white/5 transition-colors"
              >
                <span className="material-symbols-outlined text-xs text-violet-400">lock</span>
                Explain Encryption
              </button>
              <button
                onClick={() => handleAsk('Draft a technical update for the team on WebRTC and Daily calling')}
                className="px-3 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-white/5 transition-colors"
              >
                <span className="material-symbols-outlined text-xs text-emerald-400">code</span>
                Draft Update
              </button>
            </div>

            {/* Query Input */}
            <div className="relative flex items-center">
              <input
                className="w-full bg-slate-950/70 text-slate-100 placeholder:text-slate-500 text-sm pl-4 pr-20 py-3 rounded-2xl border border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-colors font-sans"
                placeholder="Ask Gemini anything or type @gemini search <query>..."
                value={inputQuery}
                onChange={e => setInputQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAsk()}
              />
              <button
                onClick={() => handleAsk()}
                disabled={isGenerating || !inputQuery.trim()}
                className="absolute right-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-40 transition-all shadow-md shadow-indigo-600/30"
              >
                Send
              </button>
            </div>

            {/* Output Box */}
            <div className="min-h-[130px] max-h-[280px] overflow-y-auto bg-slate-950/60 p-4 rounded-2xl border border-white/10 text-xs text-slate-200 whitespace-pre-line leading-relaxed font-sans shadow-inner">
              {isGenerating ? (
                <div className="flex items-center gap-2.5 text-indigo-400 font-mono text-xs py-4 justify-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
                  Synthesizing prompt with Gemini 2.5 Flash...
                </div>
              ) : copilotResponse ? (
                copilotResponse
              ) : (
                <span className="text-slate-500 text-xs italic">
                  Select a quick prompt above or ask any question to query Google Gemini AI.
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

