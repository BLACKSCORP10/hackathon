'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useChat } from '@/context/ChatContext';
import { useTheme } from '@/context/ThemeContext';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { unreadTotal } = useChat();
  const { theme } = useTheme();

  const isChats = pathname.startsWith('/dashboard') || pathname.startsWith('/chat');
  const isStories = pathname.startsWith('/stories');
  const isCalls = pathname.startsWith('/calls');
  const isSettings = pathname.startsWith('/settings');

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.3)] transition-all ${
      theme === 'dark' ? 'bg-slate-950/85 border-white/10' : 'bg-white/90 border-slate-200'
    }`}>
      <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-around">
        {/* Chats Tab */}
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all group ${
            isChats
              ? 'text-indigo-400 scale-105 drop-shadow-[0_0_12px_rgba(99,102,241,0.5)]'
              : 'text-slate-400 hover:text-slate-200'
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
              <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 bg-indigo-500 text-white font-label-sm text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/50">
                {unreadTotal}
              </span>
            )}
          </div>
          <span className="font-label-sm text-[11px] font-medium tracking-tight">Chats</span>
        </Link>

        {/* Stories Tab */}
        <Link
          href="/stories"
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all group ${
            isStories
              ? 'text-indigo-400 scale-105 drop-shadow-[0_0_12px_rgba(99,102,241,0.5)]'
              : 'text-slate-400 hover:text-slate-200'
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
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all group ${
            isCalls
              ? 'text-indigo-400 scale-105 drop-shadow-[0_0_12px_rgba(99,102,241,0.5)]'
              : 'text-slate-400 hover:text-slate-200'
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
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all group ${
            isSettings
              ? 'text-indigo-400 scale-105 drop-shadow-[0_0_12px_rgba(99,102,241,0.5)]'
              : 'text-slate-400 hover:text-slate-200'
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
