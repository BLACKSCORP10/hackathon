'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useAvatarPreview } from '@/context/AvatarPreviewContext';
import { ProfileModal } from '@/components/profile/ProfileModal';

interface TopHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onSearchClick?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  title = 'NexusChat',
  subtitle = 'Chats',
  showBack = false,
  onSearchClick,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { openAvatarPreview } = useAvatarPreview();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const defaultAvatar =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBfpDzwR2xsNv-nsDiy8QJclKg9hzaA5jd1kdt99vR7jPAQs7lZv5vgSDaWYMhGBFv8Ei5ezRYpDb_wAr3lxlYpw8f1qiS29oJ2P6AuVne7dMFwLILfdkLxBonarXmqdT-fgwxrcciUyl8XN29J9Qzkg1NNk2FlFeMbplyopjX2HVtWSHqczvwBI-yU2C6Lqtz9vj-edQeNxEaj3poxvGbhIAuyi2eO9XjNTiCQFGtefBCjPKttKXgFsA';

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

  return (
    <>
      <header className={`fixed top-0 w-full z-40 backdrop-blur-xl border-b pt-safe transition-all shadow-lg ${
        theme === 'dark' ? 'bg-slate-950/85 border-white/10' : 'bg-white/85 border-slate-200'
      }`}>
        <div className="h-16 max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBack ? (
              <button
                onClick={() => router.back()}
                aria-label="Go back"
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors -ml-1 active:scale-95 ${
                  theme === 'dark' ? 'text-slate-300 hover:text-white hover:bg-slate-900' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">arrow_back_ios_new</span>
              </button>
            ) : (
              <Link href="/dashboard" className="flex items-center gap-2 group">
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-cyan-400 shadow-md group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[20px]">hub</span>
                </div>
              </Link>
            )}

            <div className="flex flex-col">
              <span className={`text-sm font-bold leading-none tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {title}
              </span>
              <span className="text-[11px] font-mono text-cyan-400 font-medium leading-none mt-1">
                {subtitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Dark/Light Mode Switcher */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Dark/Light Mode"
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors active:scale-95 ${
                theme === 'dark' ? 'text-slate-400 hover:text-amber-400 hover:bg-slate-900' : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
              }`}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {onSearchClick && (
              <button
                onClick={onSearchClick}
                aria-label="Search"
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors active:scale-95 ${
                  theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">search</span>
              </button>
            )}

            {/* Profile Avatar Click to View DP */}
            <button
              type="button"
              onClick={handleAvatarClick}
              className="relative flex items-center justify-center group focus:outline-none"
              title="View profile picture"
            >
              <img
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/40 group-hover:ring-cyan-400 transition-all shadow-md"
                src={user?.avatarUrl || defaultAvatar}
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950"></span>
            </button>

            {/* More Menu Dropdown */}
            <div className="relative flex items-center" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="More options"
                aria-expanded={menuOpen}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                  menuOpen
                    ? 'text-cyan-400 bg-slate-900'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">more_vert</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-11 z-50 w-56 rounded-2xl bg-slate-900/95 backdrop-blur-2xl p-1.5 shadow-2xl border border-white/10 flex flex-col gap-0.5 animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-slate-200 hover:bg-slate-800 hover:text-cyan-300 transition-colors text-xs font-semibold"
                  >
                    <span className="material-symbols-outlined text-base text-cyan-400">person</span>
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      router.push('/stories');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-slate-200 hover:bg-slate-800 hover:text-cyan-300 transition-colors text-xs font-semibold"
                  >
                    <span className="material-symbols-outlined text-base text-cyan-400">auto_stories</span>
                    <span>24h Moments</span>
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      router.push('/settings');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-slate-200 hover:bg-slate-800 hover:text-cyan-300 transition-colors text-xs font-semibold"
                  >
                    <span className="material-symbols-outlined text-base text-indigo-400">settings</span>
                    <span>Settings & E2EE</span>
                  </button>
                  <div className="h-px bg-white/10 my-1" />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-red-400 hover:bg-red-500/15 transition-colors text-xs font-semibold"
                  >
                    <span className="material-symbols-outlined text-base text-red-400">logout</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Edit Profile Modal */}
      <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
    </>
  );
};
