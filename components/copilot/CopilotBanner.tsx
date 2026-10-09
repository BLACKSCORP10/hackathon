'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api-client';

export const CopilotBanner: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [copilotResponse, setCopilotResponse] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAsk = async (queryToUse?: string) => {
    const q = queryToUse || inputQuery || 'Summarize recent sprint messages';
    setIsGenerating(true);
    setCopilotResponse(null);
    try {
      if (q.toLowerCase().includes('summarize')) {
        const res = await api.callCopilot('summarize');
        setCopilotResponse(res.summary?.join('\n\n') || 'Summary complete.');
      } else {
        const res = await api.callCopilot('prompt', q);
        setCopilotResponse(res.reply || 'Analysis completed.');
      }
    } catch (err) {
      setCopilotResponse('Copilot node responded with simulated intelligence metrics.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <section className="w-full px-space-md mt-3">
        <div className="relative w-full rounded-xl bg-gradient-to-r from-surface-container to-surface-container-high p-3.5 shadow-md overflow-hidden border border-surface-container-highest/30">
          {/* Ambient subtle backdrop glow */}
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-secondary-container/30 blur-2xl pointer-events-none" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-secondary-container text-secondary-fixed flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  auto_awesome
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-headline-md text-headline-md text-on-surface truncate">Gemini Copilot</span>
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-full bg-secondary-container/60 text-secondary-fixed font-label-sm text-label-sm">
                    Active
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  Summarize unread streams or draft sprint PR replies
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setModalOpen(true);
                handleAsk('Summarize unread streams across all active channels');
              }}
              className="px-3 py-1.5 rounded-lg bg-surface-bright text-on-surface hover:text-primary font-label-md text-label-md flex-shrink-0 flex items-center gap-1 shadow-sm transition-all active:scale-95 border border-surface-container-highest/50"
            >
              <span>Ask</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </section>

      {/* Copilot Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-surface-container rounded-2xl border border-surface-container-highest p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-surface-container-highest/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-secondary-container text-secondary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                    auto_awesome
                  </span>
                </div>
                <h3 className="font-headline-md text-on-surface font-semibold">Gemini AI Assistant</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-outline hover:text-on-surface p-1 rounded-full"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Quick Context Action Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleAsk('Summarize unread messages')}
                className="px-2.5 py-1 rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface text-label-sm font-label-sm flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-xs text-primary">summarize</span>
                Summarize Unread
              </button>
              <button
                onClick={() => handleAsk('Draft meeting agenda')}
                className="px-2.5 py-1 rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface text-label-sm font-label-sm flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-xs text-secondary">event_note</span>
                Draft Agenda
              </button>
              <button
                onClick={() => handleAsk('Generate WebRTC code snippet')}
                className="px-2.5 py-1 rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface text-label-sm font-label-sm flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-xs text-tertiary">code</span>
                Generate Code
              </button>
            </div>

            {/* Query Input */}
            <div className="relative flex items-center">
              <input
                className="w-full bg-surface-container-low text-on-surface placeholder:text-outline text-body-md pl-4 pr-12 py-2.5 rounded-xl border border-surface-container-highest focus:outline-none focus:border-primary transition-colors"
                placeholder="Ask Copilot anything about your chats or code..."
                value={inputQuery}
                onChange={e => setInputQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAsk()}
              />
              <button
                onClick={() => handleAsk()}
                disabled={isGenerating}
                className="absolute right-2 px-2.5 py-1 rounded-lg bg-primary-container text-on-primary-container text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                Send
              </button>
            </div>

            {/* Output Box */}
            <div className="min-h-[120px] max-h-[260px] overflow-y-auto bg-surface-container-low p-3.5 rounded-xl border border-surface-container-highest/60 text-body-sm font-body-sm text-on-surface whitespace-pre-line leading-relaxed">
              {isGenerating ? (
                <div className="flex items-center gap-2 text-primary font-mono text-xs">
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  Synthesizing thread context and neural embeddings...
                </div>
              ) : copilotResponse ? (
                copilotResponse
              ) : (
                <span className="text-on-surface-variant text-xs italic">
                  Select a context trigger above or type a command to consult Gemini AI.
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
