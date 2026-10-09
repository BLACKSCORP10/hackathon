'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme, CHAT_BG_PRESETS } from '@/context/ThemeContext';
import { useAvatarPreview } from '@/context/AvatarPreviewContext';
import { TopHeader } from '@/components/navigation/TopHeader';
import { BottomNav } from '@/components/navigation/BottomNav';
import { ProfileModal } from '@/components/profile/ProfileModal';
import { compressImage } from '@/lib/imageUtils';

export default function SettingsPage() {
  const { user, logout, updateProfileData } = useAuth();
  const {
    theme,
    toggleTheme,
    setTheme,
    chatBackground,
    customChatImage,
    setChatBackground,
    setCustomChatImage,
    resetChatBackground,
    getChatBackgroundStyle,
  } = useTheme();
  const { openAvatarPreview } = useAvatarPreview();

  const [aiAssistantEnabled, setAiAssistantEnabled] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [lastSeenOption, setLastSeenOption] = useState('My Contacts');
  const [disappearingTimer, setDisappearingTimer] = useState('24 Hours');
  const [customStatus, setCustomStatus] = useState(user?.statusText || '🚀 Available on NexusChat');
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const bgFileInputRef = useRef<HTMLInputElement | null>(null);

  const defaultAvatar =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBfpDzwR2xsNv-nsDiy8QJclKg9hzaA5jd1kdt99vR7jPAQs7lZv5vgSDaWYMhGBFv8Ei5ezRYpDb_wAr3lxlYpw8f1qiS29oJ2P6AuVne7dMFwLILfdkLxBonarXmqdT-fgwxrcciUyl8XN29J9Qzkg1NNk2FlFeMbplyopjX2HVtWSHqczvwBI-yU2C6Lqtz9vj-edQeNxEaj3poxvGbhIAuyi2eO9XjNTiCQFGtefBCjPKttKXgFsA';

  const handleSaveStatus = async () => {
    setIsEditingStatus(false);
    if (user?.uid) {
      await updateProfileData({ statusText: customStatus });
    }
  };

  const handleAvatarClick = () => {
    openAvatarPreview({
      name: user?.name || 'Nexus Operative',
      avatarUrl: user?.avatarUrl || defaultAvatar,
      username: user?.username || user?.email?.split('@')[0] || 'node',
      bio: user?.statusText || user?.bio || 'Available · Connected via NexusChat',
      statusText: 'Online · Verified Firebase Node',
      isOnline: true,
    });
  };

  const handleCustomImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const comp = await compressImage(file, 800, 0.6);
      setCustomChatImage(comp.dataUrl);
      setChatBackground('custom');
    } catch (err) {
      console.warn('Custom wallpaper compression fallback:', err);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCustomChatImage(reader.result);
          setChatBackground('custom');
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <TopHeader title="NexusChat" subtitle="Settings & Customization" showBack />

      <main className="flex-1 flex flex-col pt-16 pb-28 max-w-2xl mx-auto w-full px-4 py-4 gap-6">
        {/* Header Profile Card */}
        <section className={`rounded-3xl p-5 shadow-xl flex flex-col gap-4 relative overflow-hidden border backdrop-blur-xl transition-all ${
          theme === 'dark' ? 'bg-slate-900/60 border-white/10' : 'bg-white/80 border-slate-200'
        }`}>
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {/* Profile Avatar Click to open DP modal */}
              <div
                className="relative shrink-0 cursor-pointer group"
                onClick={handleAvatarClick}
                title="Tap to view high-resolution profile picture"
              >
                <div className="w-16 h-16 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-lg group-hover:scale-105 transition-transform">
                  <img
                    className="w-full h-full rounded-full object-cover bg-slate-800"
                    src={user?.avatarUrl || defaultAvatar}
                    alt={user?.name || 'User Profile'}
                  />
                </div>
                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-400 ring-2 ring-slate-950 shadow-sm" />
                <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-white text-lg">visibility</span>
                </div>
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-base font-bold truncate ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                    {user?.name || 'Nexus Operative'}
                  </span>
                  <span
                    className="material-symbols-outlined text-indigo-400 text-[18px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                </div>
                <span className="text-xs text-indigo-400 font-mono">
                  @{user?.username || user?.email?.split('@')[0] || 'node'}
                </span>
                <span className="text-xs text-slate-400 truncate mt-0.5">
                  {user?.email || 'Authenticated Firebase Node'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setProfileModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              <span>Edit</span>
            </button>
          </div>

          {/* Live Custom Status Badge */}
          <div className={`rounded-2xl p-3 flex items-center justify-between gap-3 border ${
            theme === 'dark' ? 'bg-slate-950/60 border-white/10' : 'bg-slate-100 border-slate-200'
          }`}>
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
                <span className={`text-xs truncate ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  {user?.statusText || customStatus}
                </span>
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

        {/* Section 1: Appearance & Theme Mode Toggle (Requirement 2) */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-400 text-[20px]">
                {theme === 'dark' ? 'dark_mode' : 'light_mode'}
              </span>
              <h2 className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                Theme & Appearance
              </h2>
            </div>
            <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </span>
          </div>

          <div className={`rounded-3xl p-5 shadow-xl flex flex-col gap-4 border backdrop-blur-xl ${
            theme === 'dark' ? 'bg-slate-900/60 border-white/10' : 'bg-white/80 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                  Display Theme Mode
                </span>
                <span className="text-xs text-slate-400">
                  {theme === 'dark' ? 'Cyber stealth dark glass interface' : 'Clean daytime high-contrast light interface'}
                </span>
              </div>

              {/* Theme Toggle Button */}
              <div className="flex items-center p-1 rounded-2xl bg-slate-950/40 border border-white/10">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    theme === 'dark'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">dark_mode</span>
                  <span>Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    theme === 'light'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">light_mode</span>
                  <span>Light</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Chat Background & Wallpaper Customization (Requirement 3) */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-400 text-[20px]">
                wallpaper
              </span>
              <h2 className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                Chat Background Customization
              </h2>
            </div>
            {chatBackground !== 'default' && (
              <button
                type="button"
                onClick={resetChatBackground}
                className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 font-mono"
              >
                <span className="material-symbols-outlined text-xs">restart_alt</span>
                Reset Default
              </button>
            )}
          </div>

          <div className={`rounded-3xl p-5 shadow-xl flex flex-col gap-5 border backdrop-blur-xl ${
            theme === 'dark' ? 'bg-slate-900/60 border-white/10' : 'bg-white/80 border-slate-200'
          }`}>
            <div>
              <span className={`text-xs font-mono uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Preset Solid & Gradient Themes
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Select an aesthetic theme to apply to all direct & group chat containers:
              </p>
            </div>

            {/* Grid of Preset Wallpaper Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CHAT_BG_PRESETS.map((preset) => {
                const isSelected = chatBackground === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setChatBackground(preset.id)}
                    className={`relative rounded-2xl p-3 h-24 flex flex-col justify-end text-left border overflow-hidden transition-all duration-200 group active:scale-95 shadow-md ${
                      isSelected
                        ? 'ring-2 ring-indigo-500 border-indigo-400 shadow-indigo-500/20'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                    style={{ background: preset.preview }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-md">
                        <span className="material-symbols-outlined text-xs font-bold">check</span>
                      </div>
                    )}

                    <div className="relative z-10">
                      <span className="text-xs font-bold text-white block">{preset.name}</span>
                      <span className="text-[10px] text-slate-300 truncate block font-mono">{preset.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Image Upload Section */}
            <div className={`rounded-2xl p-4 border flex flex-col gap-3 ${
              theme === 'dark' ? 'bg-slate-950/60 border-white/10' : 'bg-slate-100 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-400 text-lg">add_photo_alternate</span>
                  <span className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                    Upload Custom Chat Wallpaper
                  </span>
                </div>
                {chatBackground === 'custom' && (
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                    Custom Active
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400">
                Choose any high-resolution photo from your device to set as your personal chat background.
              </p>

              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={bgFileInputRef}
                  onChange={handleCustomImageUpload}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => bgFileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm">upload</span>
                  <span>Choose Image File</span>
                </button>

                {customChatImage && (
                  <button
                    type="button"
                    onClick={() => setCustomChatImage(null)}
                    className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    <span>Remove</span>
                  </button>
                )}
              </div>

              {/* Uploaded Thumbnail Preview */}
              {customChatImage && (
                <div className="relative rounded-2xl overflow-hidden h-32 border border-white/20 shadow-xl mt-1">
                  <img
                    src={customChatImage}
                    alt="Custom Chat Wallpaper"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                    <span className="text-xs font-semibold text-white px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20">
                      Active Custom Wallpaper
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Live Chat Simulation Mini-Preview */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Live Chat Wallpaper Simulation
              </span>
              <div
                className="rounded-2xl p-4 border border-white/10 shadow-inner flex flex-col gap-2.5 overflow-hidden transition-all duration-300"
                style={getChatBackgroundStyle()}
              >
                <div className="self-start max-w-[80%] p-2.5 rounded-2xl rounded-tl-sm bg-slate-900/80 backdrop-blur-md text-slate-200 text-xs border border-white/10 shadow-sm">
                  Hey! How does the new chat theme look?
                </div>
                <div className="self-end max-w-[80%] p-2.5 rounded-2xl rounded-tr-sm bg-indigo-600 text-white text-xs shadow-md">
                  Looks gorgeous! Glassmorphic gradients & custom wallpaper active. ✨
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Nexus AI Copilot Settings */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-400 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
              <h2 className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                Gemini AI Settings
              </h2>
            </div>
            <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
              Active Engine
            </span>
          </div>

          <div className={`rounded-3xl p-5 shadow-xl flex flex-col gap-4 border backdrop-blur-xl ${
            theme === 'dark' ? 'bg-slate-900/60 border-white/10' : 'bg-white/80 border-slate-200'
          }`}>
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
            <div className={`rounded-2xl p-3.5 flex flex-col gap-2 border ${
              theme === 'dark' ? 'bg-slate-950/60 border-white/5' : 'bg-slate-100 border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-[18px]">summarize</span>
                <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                  Summarize Unread Messages
                </span>
              </div>
              <p className="text-xs text-slate-400">Live synthetic brief across active Firestore channels:</p>
              <div className={`rounded-xl p-2.5 flex flex-col gap-1.5 font-mono text-[11px] border ${
                theme === 'dark' ? 'bg-slate-900/80 text-slate-300 border-white/5' : 'bg-white text-slate-700 border-slate-200'
              }`}>
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

        {/* Section 4: Privacy & Encryption Controls */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <span className="material-symbols-outlined text-emerald-400 text-[20px]">security</span>
            <h2 className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
              Privacy & Encryption
            </h2>
          </div>

          <div className={`rounded-3xl p-5 shadow-xl flex flex-col gap-4 border backdrop-blur-xl ${
            theme === 'dark' ? 'bg-slate-900/60 border-white/10' : 'bg-white/80 border-slate-200'
          }`}>
            {/* Read Receipts */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                  Read Receipts
                </span>
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
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                  Last Seen & Online
                </span>
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
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                  Default Disappearing Timer
                </span>
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
          </div>
        </section>

        {/* Section 5: Sign Out */}
        <section className={`rounded-3xl overflow-hidden shadow-xl border backdrop-blur-xl ${
          theme === 'dark' ? 'bg-slate-900/60 border-white/10' : 'bg-white/80 border-slate-200'
        }`}>
          <div
            onClick={logout}
            className="flex items-center px-5 py-4 hover:bg-rose-500/10 transition cursor-pointer text-rose-400"
          >
            <span className="material-symbols-outlined text-xl mr-3">logout</span>
            <span className="text-sm font-semibold">Disconnect Firebase Node (Sign Out)</span>
          </div>
        </section>
      </main>

      {/* Edit Profile Modal */}
      <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />

      <BottomNav />
    </div>
  );
}

