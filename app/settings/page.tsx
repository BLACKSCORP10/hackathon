'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { TopHeader } from '@/components/navigation/TopHeader';
import { BottomNav } from '@/components/navigation/BottomNav';

export default function SettingsPage() {
  const { user, logout, updateProfileData } = useAuth();

  const [aiAssistantEnabled, setAiAssistantEnabled] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [lastSeenOption, setLastSeenOption] = useState('My Contacts');
  const [disappearingTimer, setDisappearingTimer] = useState('24 Hours');
  const [customStatus, setCustomStatus] = useState(user?.statusText || '🚀 Shipping NexusChat v1.0 · Do Not Disturb');
  const [isEditingStatus, setIsEditingStatus] = useState(false);

  const defaultAvatar =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBfpDzwR2xsNv-nsDiy8QJclKg9hzaA5jd1kdt99vR7jPAQs7lZv5vgSDaWYMhGBFv8Ei5ezRYpDb_wAr3lxlYpw8f1qiS29oJ2P6AuVne7dMFwLILfdkLxBonarXmqdT-fgwxrcciUyl8XN29J9Qzkg1NNk2FlFeMbplyopjX2HVtWSHqczvwBI-yU2C6Lqtz9vj-edQeNxEaj3poxvGbhIAuyi2eO9XjNTiCQFGtefBCjPKttKXgFsA';

  const handleSaveStatus = async () => {
    setIsEditingStatus(false);
    if (user?.uid) {
      await updateProfileData({ statusText: customStatus });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <TopHeader title="NexusChat" subtitle="Settings" showBack />

      <main className="flex-1 flex flex-col pt-16 pb-24 max-w-2xl mx-auto w-full px-4 py-4 gap-6">
        {/* Header Profile Card */}
        <section className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-5 shadow-xl flex flex-col gap-4 relative overflow-hidden border border-white/10">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-lg">
                <img
                  className="w-full h-full rounded-full object-cover bg-slate-800"
                  src={user?.avatarUrl || defaultAvatar}
                  alt={user?.name || 'User Profile'}
                />
              </div>
              <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-400 ring-2 ring-slate-950 shadow-sm" />
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-slate-100 truncate">
                  {user?.name || 'Nexus Operative'}
                </span>
                <span
                  className="material-symbols-outlined text-indigo-400 text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
              </div>
              <span className="text-xs text-indigo-300 font-mono">
                @{user?.username || user?.email?.split('@')[0] || 'node'}
              </span>
              <span className="text-xs text-slate-400 truncate mt-0.5">
                {user?.email || 'Authenticated Firebase Node'}
              </span>
            </div>
          </div>

          {/* Live Custom Status Badge */}
          <div className="bg-slate-950/60 backdrop-blur-md rounded-2xl p-3 flex items-center justify-between gap-3 border border-white/10">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
              {isEditingStatus ? (
                <input
                  type="text"
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value)}
                  onBlur={handleSaveStatus}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveStatus()}
                  autoFocus
                  className="w-full bg-slate-900 text-xs text-slate-100 px-2 py-1 rounded-lg border border-indigo-500 focus:outline-none"
                />
              ) : (
                <span className="text-xs text-slate-300 truncate">{user?.statusText || customStatus}</span>
              )}
            </div>
            <button
              onClick={() => {
                if (isEditingStatus) handleSaveStatus();
                else setIsEditingStatus(true);
              }}
              aria-label="Edit custom status"
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center shrink-0 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">{isEditingStatus ? 'check' : 'edit'}</span>
            </button>
          </div>
        </section>

        {/* Section 1: Nexus AI Copilot Settings */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-400 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
              <h2 className="text-sm font-bold text-slate-100">Gemini AI Settings</h2>
            </div>
            <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
              Active Engine
            </span>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-5 shadow-xl flex flex-col gap-4 border border-white/10">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-sm text-indigo-300 font-semibold">Gemini 2.5 Flash Assistant</span>
                <span className="text-xs text-slate-400">Inline @gemini chat reasoning, summarization & query execution</span>
              </div>
              <button
                type="button"
                onClick={() => setAiAssistantEnabled(!aiAssistantEnabled)}
                className={`w-11 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer flex items-center ${
                  aiAssistantEnabled ? 'bg-indigo-600 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
              </button>
            </div>

            {/* Feature Demonstration Box */}
            <div className="bg-slate-950/60 rounded-2xl p-3.5 flex flex-col gap-2 border border-white/5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-[18px]">summarize</span>
                <span className="text-xs text-slate-200 font-semibold">Summarize Unread Messages</span>
              </div>
              <p className="text-xs text-slate-400">Live synthetic brief across active Firestore channels:</p>
              <div className="bg-slate-900/80 rounded-xl p-2.5 flex flex-col gap-1.5 font-mono text-[11px] text-slate-300 border border-white/5">
                <div className="flex items-baseline gap-2">
                  <span className="text-emerald-400 text-xs">•</span>
                  <span>Cloud Firestore real-time snapshot synchronization active</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-emerald-400 text-xs">•</span>
                  <span>Direct peer nodes online and discoverable in directory</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-emerald-400 text-xs">•</span>
                  <span>Open Relay TURN WebRTC cross-network calling configured</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Privacy & Encryption Controls */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <span className="material-symbols-outlined text-emerald-400 text-[20px]">security</span>
            <h2 className="text-sm font-bold text-slate-100">Privacy & Encryption</h2>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-5 shadow-xl flex flex-col gap-4 border border-white/10">
            {/* Read Receipts */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm text-slate-200 font-medium">Read Receipts</span>
                <span className="text-xs text-slate-400">Send & receive read checkmarks across all chats</span>
              </div>
              <button
                type="button"
                onClick={() => setReadReceipts(!readReceipts)}
                className={`w-11 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer flex items-center ${
                  readReceipts ? 'bg-emerald-600 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
              </button>
            </div>

            {/* Last Seen & Online */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm text-slate-200 font-medium">Last Seen & Online</span>
                <span className="text-xs text-slate-400">Who can view your real-time presence</span>
              </div>
              <button
                onClick={() => {
                  setLastSeenOption((prev) => (prev === 'My Contacts' ? 'Everyone' : prev === 'Everyone' ? 'Nobody' : 'My Contacts'));
                }}
                className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-1 text-xs text-indigo-300 transition-colors border border-white/5"
              >
                <span>{lastSeenOption}</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>

            {/* Disappearing Timer */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm text-slate-200 font-medium">Default Disappearing Timer</span>
                <span className="text-xs text-slate-400">24-hour auto-expiring moments & messages</span>
              </div>
              <button
                onClick={() => {
                  setDisappearingTimer((prev) => (prev === '24 Hours' ? '7 Days' : prev === '7 Days' ? 'Off' : '24 Hours'));
                }}
                className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-1 text-xs text-violet-300 transition-colors border border-white/5"
              >
                <span className="material-symbols-outlined text-[16px]">timer</span>
                <span>{disappearingTimer}</span>
              </button>
            </div>

            {/* Identity Key Fingerprint */}
            <div className="bg-slate-950/60 rounded-2xl p-3.5 flex flex-col gap-1 border border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-400 text-[18px]">key</span>
                  <span className="text-xs text-slate-200 font-medium">Firebase Auth UID</span>
                </div>
                <span className="font-mono text-[10px] text-emerald-400 flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-xs">verified</span>
                  Verified
                </span>
              </div>
              <span className="font-mono text-[10px] text-slate-400 break-all">
                {user?.uid || 'Not signed in'}
              </span>
            </div>
          </div>
        </section>

        {/* Section 3: Sign Out */}
        <section className="bg-slate-900/60 backdrop-blur-xl rounded-3xl overflow-hidden shadow-xl border border-white/10">
          <div
            onClick={logout}
            className="flex items-center px-5 py-4 hover:bg-rose-500/10 transition cursor-pointer text-rose-400"
          >
            <span className="material-symbols-outlined text-xl mr-3">logout</span>
            <span className="text-sm font-semibold">Disconnect Firebase Node (Sign Out)</span>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
