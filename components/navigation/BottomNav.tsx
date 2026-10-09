'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useChat } from '@/context/ChatContext';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { unreadTotal } = useChat();

  const isChats = pathname.startsWith('/dashboard') || pathname.startsWith('/chat');
  const isStories = pathname.startsWith('/stories');
  const isCalls = pathname.startsWith('/calls');
  const isSettings = pathname.startsWith('/settings');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-xl border-t border-surface-container-highest/40 pb-safe shadow-2xl">
      <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-around">
        {/* Chats Tab */}
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all ${
            isChats ? 'text-primary scale-105' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <div className="relative">
            <span
              className="material-symbols-outlined text-[24px]"
              style={isChats ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              chat_bubble
            </span>
            {unreadTotal > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 bg-primary-container text-on-primary-container font-label-sm text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
                {unreadTotal}
              </span>
            )}
          </div>
          <span className="font-label-sm text-[11px] font-medium tracking-tight">Chats</span>
        </Link>

        {/* Stories Tab */}
        <Link
          href="/stories"
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all ${
            isStories ? 'text-primary scale-105' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={isStories ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            auto_stories
          </span>
          <span className="font-label-sm text-[11px] font-medium tracking-tight">Moments</span>
        </Link>

        {/* Calls Tab */}
        <Link
          href="/calls"
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all ${
            isCalls ? 'text-primary scale-105' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={isCalls ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            call
          </span>
          <span className="font-label-sm text-[11px] font-medium tracking-tight">Calls</span>
        </Link>

        {/* Settings Tab */}
        <Link
          href="/settings"
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all ${
            isSettings ? 'text-primary scale-105' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={isSettings ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            settings
          </span>
          <span className="font-label-sm text-[11px] font-medium tracking-tight">Settings</span>
        </Link>
      </div>
    </nav>
  );
};
