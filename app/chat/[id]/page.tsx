'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChat } from '@/context/ChatContext';
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble';
import { ChatInputBar } from '@/components/chat/ChatInputBar';

export default function ActiveChatThreadPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = (params?.id as string) || 'chat-sarah';
  const { activeChat, messages, selectChat, sendMessage, reactToMessage, isLoadingMessages } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [callModalOpen, setCallModalOpen] = useState<'audio' | 'video' | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    selectChat(chatId);
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let timer: any;
    if (callModalOpen) {
      setCallDuration(0);
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callModalOpen]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSendMessage = (
    text: string,
    type: 'text' | 'image' | 'voice' | 'code' | 'file' = 'text',
    mediaUrl?: string,
    mediaMeta?: any
  ) => {
    sendMessage(text, type, mediaUrl, mediaMeta);
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Sticky Active Chat Sub-Header */}
      <header className="sticky top-0 z-40 bg-surface-container-low/95 backdrop-blur-xl px-4 py-3 flex flex-col gap-1 shadow-md pt-safe border-b border-surface-container-highest/40">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => router.push('/dashboard')}
              aria-label="Go back"
              className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors -ml-1 flex-shrink-0 active:scale-95"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back_ios_new</span>
            </button>

            <div className="relative flex-shrink-0">
              <img
                alt={activeChat?.name || 'Contact'}
                className="w-10 h-10 rounded-full object-cover ring-1 ring-surface-container-highest"
                src={activeChat?.avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDmyBN5eU3P6Db79C6OvqxLwjGYPnL_j1bLCf1PSowDZQzYUqnMS9hLlcRJa-jSqVB0IMKREmx2xvZBUbo6-1KJv-4LAqHQC8kn9do6g4hwhkQVY-E7tSRb0ipQV1O1P5nhK872-Ir4eAWtch96NIhKmwh9byJj8aTF5uwIRIHFBol8cWq9bfpaYYQmWOgcT0sIeKOINsdtQstUSG_8Z8KP-VcryFeKFt-d7-e1n4Smya4lt3HFPevoA'}
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-tertiary shadow-[0_0_8px_rgba(78,222,163,0.8)]" />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-headline-md text-headline-md text-on-surface truncate">
                  {activeChat?.name || 'Sarah Chen'}
                </span>
                {activeChat?.roleBadge && (
                  <span className="px-1.5 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-[10px] flex-shrink-0">
                    {activeChat.roleBadge}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                <span className="font-label-sm text-xs text-tertiary truncate">
                  Online · typing<span className="animate-bounce inline-block">.</span>
                  <span className="animate-bounce inline-block [animation-delay:0.2s]">.</span>
                  <span className="animate-bounce inline-block [animation-delay:0.4s]">.</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Utilities */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCallModalOpen('audio')}
              aria-label="Start Audio Call"
              className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant active:scale-95 transition-all hover:bg-surface-container-high hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[20px]">call</span>
            </button>
            <button
              onClick={() => setCallModalOpen('video')}
              aria-label="Start Video Call"
              className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant active:scale-95 transition-all hover:bg-surface-container-high hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[20px]">videocam</span>
            </button>
            <button
              onClick={() => router.push('/settings')}
              aria-label="Chat settings"
              className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant active:scale-95 transition-all hover:bg-surface-container-high hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[20px]">info</span>
            </button>
          </div>
        </div>

        {/* Security E2EE Pill */}
        <div className="flex items-center justify-center pt-0.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-surface-container-highest/60 backdrop-blur-sm text-on-surface-variant font-label-sm text-[11px] border border-surface-container-highest">
            <span className="material-symbols-outlined text-[13px] text-tertiary">lock</span>
            <span>End-to-End Encrypted (AES-256 GCM) · Zero-Knowledge</span>
          </div>
        </div>
      </header>

      {/* Main Message Stream */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 flex flex-col gap-4">
        {/* Date / System Encryption Marker */}
        <div className="flex flex-col items-center gap-1 my-2">
          <div className="px-3 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-sm text-xs shadow-sm flex items-center gap-1.5 border border-surface-container-highest/40">
            <span className="material-symbols-outlined text-[13px] text-primary">verified_user</span>
            <span>Today · Messages & calls are end-to-end encrypted</span>
          </div>
          <div className="flex items-center gap-1 text-on-surface-variant/70 font-label-sm text-[11px]">
            <span className="material-symbols-outlined text-[12px]">schedule</span>
            <span>24h auto-delete enabled</span>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoadingMessages ? (
          <div className="py-12 flex justify-center items-center text-outline gap-2">
            <span className="material-symbols-outlined animate-spin text-2xl">refresh</span>
            <span className="text-body-sm font-mono text-xs">Decrypting signal packets...</span>
          </div>
        ) : (
          messages.map(msg => (
            <ChatMessageBubble
              key={msg.id}
              message={msg}
              onReact={(msgId, emoji) => reactToMessage(msgId, emoji)}
            />
          ))
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Chat Input Bar */}
      <ChatInputBar onSendMessage={handleSendMessage} />

      {/* Call Simulator Modal */}
      {callModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-sm bg-surface-container rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-between text-center gap-6 border border-surface-container-highest h-[480px]">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs uppercase tracking-widest text-primary font-mono">
                {callModalOpen === 'audio' ? 'Encrypted Audio Call' : 'Encrypted Video Stream'}
              </span>
              <span className="text-sm font-mono text-tertiary">{formatDuration(callDuration)}</span>
            </div>

            <div className="relative flex flex-col items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <img
                  alt={activeChat?.name || 'Contact'}
                  className="w-28 h-28 rounded-full object-cover ring-4 ring-primary/40 relative z-10 shadow-2xl"
                  src={activeChat?.avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDmyBN5eU3P6Db79C6OvqxLwjGYPnL_j1bLCf1PSowDZQzYUqnMS9hLlcRJa-jSqVB0IMKREmx2xvZBUbo6-1KJv-4LAqHQC8kn9do6g4hwhkQVY-E7tSRb0ipQV1O1P5nhK872-Ir4eAWtch96NIhKmwh9byJj8aTF5uwIRIHFBol8cWq9bfpaYYQmWOgcT0sIeKOINsdtQstUSG_8Z8KP-VcryFeKFt-d7-e1n4Smya4lt3HFPevoA'}
                />
              </div>
              <h3 className="text-xl font-bold text-on-surface">{activeChat?.name || 'Sarah Chen'}</h3>
              <p className="text-xs text-on-surface-variant font-mono">Signal Peer Node: node-eu-west-9</p>
            </div>

            {/* Call Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => alert('Microphone toggled.')}
                className="w-12 h-12 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center shadow-md active:scale-95"
              >
                <span className="material-symbols-outlined">mic</span>
              </button>
              <button
                onClick={() => setCallModalOpen(null)}
                className="w-16 h-16 rounded-full bg-error text-white flex items-center justify-center shadow-xl active:scale-95"
              >
                <span className="material-symbols-outlined text-3xl">call_end</span>
              </button>
              <button
                onClick={() => alert('Speaker output toggled.')}
                className="w-12 h-12 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center shadow-md active:scale-95"
              >
                <span className="material-symbols-outlined">volume_up</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
