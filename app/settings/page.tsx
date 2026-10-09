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
    <div className="flex flex-col min-h-screen bg-surface">
      <TopHeader title="NexusChat" subtitle="Settings" showBack />

      <main className="flex-1 flex flex-col pt-16 pb-24 max-w-2xl mx-auto w-full px-4 py-4 gap-6">
        {/* Header Profile Card */}
        <section className="bg-surface-container rounded-2xl p-5 shadow-md flex flex-col gap-4 relative overflow-hidden border border-surface-container-highest/40">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-primary via-secondary to-tertiary shadow-lg">
                <img
                  className="w-full h-full rounded-full object-cover bg-surface"
                  src={user?.avatarUrl || defaultAvatar}
                  alt={user?.name || 'User Profile'}
                />
              </div>
              <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-tertiary ring-2 ring-surface shadow-sm" />
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-headline-md text-headline-md text-on-surface font-semibold truncate">
                  {user?.name || 'Nexus Operative'}
                </span>
                <span
                  className="material-symbols-outlined text-primary text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
              </div>
              <span className="font-label-sm text-xs text-primary-fixed-dim font-mono">
                @{user?.username || user?.email?.split('@')[0] || 'node'}
              </span>
              <span className="font-body-sm text-xs text-on-surface-variant truncate mt-0.5">
                {user?.email || 'Authenticated Firebase Node'}
              </span>
            </div>
          </div>

          {/* Live Custom Status Badge */}
          <div className="bg-surface-container-high rounded-xl p-3 flex items-center justify-between gap-3 border border-surface-container-highest/50">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="flex h-2 w-2 rounded-full bg-tertiary shrink-0 animate-pulse" />
              {isEditingStatus ? (
                <input
                  type="text"
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value)}
                  onBlur={handleSaveStatus}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveStatus()}
                  autoFocus
                  className="w-full bg-surface-container-low text-xs text-on-surface px-2 py-1 rounded border border-primary focus:outline-none"
                />
              ) : (
                <span className="font-body-sm text-xs text-on-surface truncate">{user?.statusText || customStatus}</span>
              )}
            </div>
            <button
              onClick={() => {
                if (isEditingStatus) handleSaveStatus();
                else setIsEditingStatus(true);
              }}
              aria-label="Edit custom status"
              className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-bright text-on-surface-variant flex items-center justify-center shrink-0 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">{isEditingStatus ? 'check' : 'edit'}</span>
            </button>
          </div>
        </section>

        {/* Section 1: Nexus AI Copilot Settings */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Gemini AI Settings</h2>
            </div>
            <span className="font-label-sm text-[11px] px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold">
              Active Engine
            </span>
          </div>

          <div className="bg-surface-container rounded-2xl p-5 shadow-md flex flex-col gap-4 border border-surface-container-highest/40">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-label-md text-sm text-primary font-semibold">Gemini AI Assistant</span>
                <span className="font-body-sm text-xs text-on-surface-variant">Real-time context extraction & automation</span>
              </div>
              <button
                type="button"
                onClick={() => setAiAssistantEnabled(!aiAssistantEnabled)}
                className={`w-11 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer flex items-center ${
                  aiAssistantEnabled ? 'bg-primary-container justify-end' : 'bg-surface-container-highest justify-start'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-on-primary shadow-sm" />
              </button>
            </div>

            {/* Feature Demonstration Box */}
            <div className="bg-surface-container-low rounded-xl p-3.5 flex flex-col gap-2 border border-surface-container-highest/50">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-[18px]">summarize</span>
                <span className="font-label-md text-xs text-on-surface font-semibold">Summarize Unread Messages</span>
              </div>
              <p className="font-body-sm text-xs text-on-surface-variant">Live synthetic brief across active Firestore channels:</p>
              <div className="bg-surface-container-high rounded-lg p-2.5 flex flex-col gap-1.5 font-mono text-[11px] text-on-surface">
                <div className="flex items-baseline gap-2">
                  <span className="text-tertiary text-xs">•</span>
                  <span>Cloud Firestore real-time snapshot synchronization active</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-tertiary text-xs">•</span>
                  <span>Direct peer nodes online and discoverable in directory</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-tertiary text-xs">•</span>
                  <span>Zero-Knowledge AES-256 E2EE envelope verified</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Privacy & Encryption Controls */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <span className="material-symbols-outlined text-tertiary text-[20px]">security</span>
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Privacy & Encryption</h2>
          </div>

          <div className="bg-surface-container rounded-2xl p-5 shadow-md flex flex-col gap-4 border border-surface-container-highest/40">
            {/* Read Receipts */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-label-md text-sm text-on-surface font-medium">Read Receipts</span>
                <span className="font-body-sm text-xs text-on-surface-variant">Send & receive read status across all rooms</span>
              </div>
              <button
                type="button"
                onClick={() => setReadReceipts(!readReceipts)}
                className={`w-11 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer flex items-center ${
                  readReceipts ? 'bg-tertiary-container justify-end' : 'bg-surface-container-highest justify-start'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-tertiary shadow-sm" />
              </button>
            </div>

            {/* Last Seen & Online */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-label-md text-sm text-on-surface font-medium">Last Seen & Online</span>
                <span className="font-body-sm text-xs text-on-surface-variant">Who can view your real-time presence</span>
              </div>
              <button
                onClick={() => {
                  setLastSeenOption((prev) => (prev === 'My Contacts' ? 'Everyone' : prev === 'Everyone' ? 'Nobody' : 'My Contacts'));
                }}
                className="bg-surface-container-high hover:bg-surface-bright px-3 py-1.5 rounded-lg flex items-center gap-1 font-label-sm text-xs text-primary transition-colors"
              >
                <span>{lastSeenOption}</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>

            {/* Disappearing Timer */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-label-md text-sm text-on-surface font-medium">Default Disappearing Timer</span>
                <span className="font-body-sm text-xs text-on-surface-variant">Auto-purge messages across new chats</span>
              </div>
              <button
                onClick={() => {
                  setDisappearingTimer((prev) => (prev === '24 Hours' ? '7 Days' : prev === '7 Days' ? 'Off' : '24 Hours'));
                }}
                className="bg-surface-container-high hover:bg-surface-bright px-3 py-1.5 rounded-lg flex items-center gap-1 font-label-sm text-xs text-secondary transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">timer</span>
                <span>{disappearingTimer}</span>
              </button>
            </div>

            {/* Identity Key Fingerprint */}
            <div className="bg-surface-container-low rounded-xl p-3.5 flex flex-col gap-1 border border-surface-container-highest/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">key</span>
                  <span className="font-label-md text-xs text-on-surface font-medium">Firebase Auth UID</span>
                </div>
                <span className="text-label-sm text-[10px] text-tertiary flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-xs">verified</span>
                  Verified
                </span>
              </div>
              <span className="font-mono text-[10px] text-on-surface-variant break-all">
                {user?.uid || 'Not signed in'}
              </span>
            </div>
          </div>
        </section>

        {/* Section 3: Sign Out */}
        <section className="bg-surface-container rounded-2xl overflow-hidden shadow-md divide-y divide-surface-container-highest/40 border border-surface-container-highest/40">
          <div
            onClick={logout}
            className="flex items-center px-4 py-3.5 hover:bg-error-container/20 transition cursor-pointer text-error"
          >
            <span className="material-symbols-outlined text-xl mr-3">logout</span>
            <span className="text-sm font-medium">Disconnect Firebase Node (Sign Out)</span>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
