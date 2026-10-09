'use client';

import React, { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { useCall } from '@/context/CallContext';
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble';
import { ChatInputBar } from '@/components/chat/ChatInputBar';

export default function ActiveChatThreadPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = (params?.id as string) || '';
  const { user } = useAuth();
  const {
    activeChat,
    messages,
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

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (chatId) {
      markAsRead(chatId);
    }
  }, [messages, chatId]);

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
                src={
                  activeChat?.avatarUrl ||
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuBDmyBN5eU3P6Db79C6OvqxLwjGYPnL_j1bLCf1PSowDZQzYUqnMS9hLlcRJa-jSqVB0IMKREmx2xvZBUbo6-1KJv-4LAqHQC8kn9do6g4hwhkQVY-E7tSRb0ipQV1O1P5nhK872-Ir4eAWtch96NIhKmwh9byJj8aTF5uwIRIHFBol8cWq9bfpaYYQmWOgcT0sIeKOINsdtQstUSG_8Z8KP-VcryFeKFt-d7-e1n4Smya4lt3HFPevoA'
                }
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-tertiary shadow-[0_0_8px_rgba(78,222,163,0.8)]" />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-headline-md text-headline-md text-on-surface truncate">
                  {activeChat?.name || 'Nexus Contact'}
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
                  Online · WebRTC & E2EE Active
                </span>
              </div>
            </div>
          </div>

          {/* Action Utilities */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleInitiateCall('audio')}
              aria-label="Start Audio Call"
              className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant active:scale-95 transition-all hover:bg-surface-container-high hover:text-on-surface"
              title="Encrypted Audio Call"
            >
              <span className="material-symbols-outlined text-[20px]">call</span>
            </button>
            <button
              onClick={() => handleInitiateCall('video')}
              aria-label="Start Video Call"
              className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant active:scale-95 transition-all hover:bg-surface-container-high hover:text-on-surface"
              title="Encrypted Video Call"
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
            <span>Deterministic 1-on-1 Room · Real-Time Firestore Sync</span>
          </div>
        </div>
      </header>

      {/* Main Message Stream */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 flex flex-col gap-4">
        {/* Date / System Encryption Marker */}
        <div className="flex flex-col items-center gap-1 my-2">
          <div className="px-3 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-sm text-xs shadow-sm flex items-center gap-1.5 border border-surface-container-highest/40">
            <span className="material-symbols-outlined text-[13px] text-primary">verified_user</span>
            <span>Messages and WebRTC calls are synchronized with sub-100ms Firestore latency</span>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoadingMessages ? (
          <div className="py-12 flex justify-center items-center text-outline gap-2">
            <span className="material-symbols-outlined animate-spin text-2xl">refresh</span>
            <span className="text-body-sm font-mono text-xs">Decrypting signal packets...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center gap-3 text-outline">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-3xl">chat_bubble_outline</span>
            </div>
            <p className="text-sm font-semibold text-on-surface">No messages yet</p>
            <p className="text-xs max-w-xs text-on-surface-variant">
              Send an encrypted message, attach a photo, or record a voice note to start the 1-on-1 direct conversation.
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

        <div ref={messagesEndRef} />
      </main>

      {/* Chat Input Bar */}
      <ChatInputBar onSendMessage={handleSendMessage} />
    </div>
  );
}
