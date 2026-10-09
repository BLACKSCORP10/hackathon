'use client';

import React, { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { useCall } from '@/context/CallContext';
import { useTheme } from '@/context/ThemeContext';
import { useAvatarPreview } from '@/context/AvatarPreviewContext';
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble';
import { ChatInputBar } from '@/components/chat/ChatInputBar';

export default function ActiveChatThreadPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = (params?.id as string) || '';
  const { user } = useAuth();
  const { getChatBackgroundStyle } = useTheme();
  const { openAvatarPreview } = useAvatarPreview();
  const {
    activeChat,
    messages,
    isAiThinking,
    selectChat,
    sendMessage,
    deleteMessage,
    markAsRead,
    reactToMessage,
    isLoadingMessages,
  } = useChat();
  const { startCall } = useCall();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize and select chat on mount or route change
  useEffect(() => {
    if (chatId) {
      selectChat(chatId);
      markAsRead(chatId);
    }
  }, [chatId]);

  // Smooth scroll to bottom when new messages or AI thinking arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (chatId) {
      markAsRead(chatId);
    }
  }, [messages, isAiThinking, chatId]);

  const handleInitiateCall = (type: 'audio' | 'video') => {
    if (!activeChat) return;
    const targetUserId =
      activeChat.participants?.find((p) => p !== user?.uid) || activeChat.id;

    startCall(
      {
        uid: targetUserId,
        name: activeChat.name || 'Nexus Contact',
        avatarUrl:
          activeChat.avatarUrl ||
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBDmyBN5eU3P6Db79C6OvqxLwjGYPnL_j1bLCf1PSowDZQzYUqnMS9hLlcRJa-jSqVB0IMKREmx2xvZBUbo6-1KJv-4LAqHQC8kn9do6g4hwhkQVY-E7tSRb0ipQV1O1P5nhK872-Ir4eAWtch96NIhKmwh9byJj8aTF5uwIRIHFBol8cWq9bfpaYYQmWOgcT0sIeKOINsdtQstUSG_8Z8KP-VcryFeKFt-d7-e1n4Smya4lt3HFPevoA',
      },
      type
    );
  };

  const handleAvatarClick = () => {
    if (!activeChat) return;
    openAvatarPreview({
      name: activeChat.name || 'Nexus Contact',
      avatarUrl:
        activeChat.avatarUrl ||
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBDmyBN5eU3P6Db79C6OvqxLwjGYPnL_j1bLCf1PSowDZQzYUqnMS9hLlcRJa-jSqVB0IMKREmx2xvZBUbo6-1KJv-4LAqHQC8kn9do6g4hwhkQVY-E7tSRb0ipQV1O1P5nhK872-Ir4eAWtch96NIhKmwh9byJj8aTF5uwIRIHFBol8cWq9bfpaYYQmWOgcT0sIeKOINsdtQstUSG_8Z8KP-VcryFeKFt-d7-e1n4Smya4lt3HFPevoA',
      username: activeChat.name ? activeChat.name.toLowerCase().replace(/\s+/g, '_') : 'contact',
      bio: activeChat.roleBadge ? `Role: ${activeChat.roleBadge} · Verified E2EE Signal Node` : 'Direct peer encrypted messaging channel.',
      statusText: 'Online · WebRTC & E2EE Active',
      isOnline: true,
    });
  };

  const handleSendMessage = (
    text: string,
    type: 'text' | 'image' | 'voice' | 'code' | 'file' | 'ai' = 'text',
    mediaUrl?: string,
    mediaMeta?: any
  ) => {
    sendMessage(text, type, mediaUrl, mediaMeta);
  };

  return (
    <div
      className="flex flex-col min-h-screen bg-slate-950 text-slate-100 transition-all duration-300"
      style={getChatBackgroundStyle()}
    >
      {/* Sticky Active Chat Glassmorphic Header */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl px-4 py-3 flex flex-col gap-1.5 shadow-2xl pt-safe border-b border-white/10">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => router.push('/dashboard')}
              aria-label="Go back"
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all -ml-1 flex-shrink-0 active:scale-95 border border-transparent hover:border-white/10"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
            </button>

            {/* Profile Avatar with DP Modal Pop-up trigger */}
            <button
              type="button"
              onClick={handleAvatarClick}
              className="relative flex-shrink-0 cursor-pointer group focus:outline-none"
              title="View full profile picture & info"
            >
              <img
                alt={activeChat?.name || 'Contact'}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/40 group-hover:ring-indigo-400 group-hover:scale-105 transition-all bg-slate-800 shadow-md"
                src={
                  activeChat?.avatarUrl ||
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuBDmyBN5eU3P6Db79C6OvqxLwjGYPnL_j1bLCf1PSowDZQzYUqnMS9hLlcRJa-jSqVB0IMKREmx2xvZBUbo6-1KJv-4LAqHQC8kn9do6g4hwhkQVY-E7tSRb0ipQV1O1P5nhK872-Ir4eAWtch96NIhKmwh9byJj8aTF5uwIRIHFBol8cWq9bfpaYYQmWOgcT0sIeKOINsdtQstUSG_8Z8KP-VcryFeKFt-d7-e1n4Smya4lt3HFPevoA'
                }
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-slate-950 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </button>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-100 truncate">
                  {activeChat?.name || 'Nexus Contact'}
                </span>
                {activeChat?.roleBadge && (
                  <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] flex-shrink-0 border border-indigo-500/30">
                    {activeChat.roleBadge}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[11px] text-emerald-400 truncate">
                  Online · WebRTC & E2EE Active
                </span>
              </div>
            </div>
          </div>

          {/* Action Utilities */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleInitiateCall('audio')}
              aria-label="Start Audio Call"
              className="w-9 h-9 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-center text-slate-300 active:scale-95 transition-all hover:bg-indigo-600 hover:text-white shadow-md"
              title="Encrypted Audio Call (Open Relay TURN)"
            >
              <span className="material-symbols-outlined text-[19px]">call</span>
            </button>
            <button
              onClick={() => handleInitiateCall('video')}
              aria-label="Start Video Call"
              className="w-9 h-9 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-center text-slate-300 active:scale-95 transition-all hover:bg-indigo-600 hover:text-white shadow-md"
              title="Encrypted Video Call (Open Relay TURN)"
            >
              <span className="material-symbols-outlined text-[19px]">videocam</span>
            </button>
            <button
              onClick={() => router.push('/settings')}
              aria-label="Chat settings"
              className="w-9 h-9 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-center text-slate-300 active:scale-95 transition-all hover:bg-slate-800 hover:text-white shadow-md"
            >
              <span className="material-symbols-outlined text-[19px]">info</span>
            </button>
          </div>
        </div>

        {/* Security E2EE Pill */}
        <div className="flex items-center justify-center pt-0.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-slate-400 font-mono text-[10px] border border-white/10 shadow-sm">
            <span className="material-symbols-outlined text-[13px] text-emerald-400">lock</span>
            <span>Deterministic 1-on-1 Room · Real-Time Firestore Sync · Gemini AI Supported</span>
          </div>
        </div>
      </header>

      {/* Main Message Stream */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 flex flex-col gap-3.5">
        {/* Date / System Encryption Marker */}
        <div className="flex flex-col items-center gap-1 my-1">
          <div className="px-3.5 py-1 rounded-full bg-slate-900/60 backdrop-blur-md text-slate-400 font-mono text-[11px] shadow-sm flex items-center gap-1.5 border border-white/10">
            <span className="material-symbols-outlined text-[14px] text-indigo-400">verified_user</span>
            <span>Messages & calls synchronized with sub-100ms Firestore latency</span>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoadingMessages ? (
          <div className="py-12 flex justify-center items-center text-slate-500 gap-2">
            <span className="material-symbols-outlined animate-spin text-2xl text-indigo-400">refresh</span>
            <span className="font-mono text-xs text-slate-400">Decrypting signal packets...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center gap-3 text-slate-500 bg-slate-900/40 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <span className="material-symbols-outlined text-3xl">chat_bubble_outline</span>
            </div>
            <p className="text-sm font-bold text-slate-200">No messages yet</p>
            <p className="text-xs max-w-xs text-slate-400 leading-relaxed">
              Send an encrypted message, attach a photo, record a voice note, or type <code className="text-indigo-400">@gemini</code> to start the conversation.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessageBubble
              key={msg.id}
              message={msg}
              onReact={(msgId, emoji) => reactToMessage(msgId, emoji)}
              onDelete={(msgId) => deleteMessage(msgId)}
            />
          ))
        )}

        {/* Live Gemini AI Thinking Indicator */}
        {isAiThinking && (
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-indigo-500/30 max-w-sm shadow-xl animate-fade-in self-start">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shrink-0">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-indigo-300">Gemini 2.5 Flash</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[11px] text-slate-400">Generating intelligent response</span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Chat Input Bar */}
      <ChatInputBar onSendMessage={handleSendMessage} />
    </div>
  );
}

