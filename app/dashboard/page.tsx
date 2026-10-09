'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { TopHeader } from '@/components/navigation/TopHeader';
import { StoriesTray } from '@/components/stories/StoriesTray';
import { CopilotBanner } from '@/components/copilot/CopilotBanner';
import { ChatList } from '@/components/chat/ChatList';
import { BottomNav } from '@/components/navigation/BottomNav';

export default function DashboardPage() {
  const { theme } = useTheme();

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <TopHeader title="NexusChat" subtitle="Chats" />

      <main className="flex-1 flex flex-col pt-16 pb-20 max-w-4xl mx-auto w-full">
        {/* 24h Moments Status Stories Tray */}
        <StoriesTray />

        {/* Gemini AI Copilot Card */}
        <CopilotBanner />

        {/* Chats Stream */}
        <ChatList />
      </main>

      <BottomNav />
    </div>
  );
}
