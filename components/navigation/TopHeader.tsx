'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

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
  const [menuOpen, setMenuOpen] = useState(false);
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

  const defaultAvatar = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtBpKB_hileIlifX6sIEN1CejCdWChfud93K51ft6qbVAZGnNhgqOzEmRgRNKiXYmea02Rm_mfRlL4AHI_ItdqoN6YZVbkjMGEFJn9rFTi8f2qZhei2yeMgZeHtgQV5yXQF7YUXf2O0NJKF6vcI9YUi-j1j92Vl1KXD3HYPvXIr69s-RcPPJwDTsL8y-iPl1Q0X1ZzKzt1-ZLCey8Dhh2LghufDcKrM1SDMHbrLm8ClBwd0My832aNZQ';

  return (
    <header className="fixed top-0 w-full z-40 bg-surface/85 backdrop-blur-xl border-b border-surface-container-highest/40 pt-safe transition-all">
      <div className="h-16 max-w-4xl mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack ? (
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors -ml-1 active:scale-95"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back_ios_new</span>
            </button>
          ) : (
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-primary-container/20 border border-primary/30 flex items-center justify-center text-primary shadow-sm group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  hub
                </span>
              </div>
            </Link>
          )}

          <div className="flex flex-col">
            <span className="font-label-md text-label-md text-on-surface font-semibold leading-none tracking-tight">
              {title}
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium leading-none mt-1">
              {subtitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSearchClick}
            aria-label="Search"
            className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>

          <Link href="/settings" className="relative flex items-center justify-center group">
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover ring-1 ring-surface-container-highest group-hover:ring-primary transition-all"
              src={user?.avatarUrl || defaultAvatar}
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-tertiary ring-2 ring-surface"></span>
          </Link>

          <div className="relative flex items-center" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="More options"
              aria-expanded={menuOpen}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                menuOpen ? 'text-primary bg-surface-container' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">more_vert</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-12 z-50 w-56 rounded-xl bg-surface-container-high/95 backdrop-blur-xl p-1.5 shadow-2xl ring-1 ring-surface-bright flex flex-col gap-0.5 animate-in fade-in zoom-in-95">
                <button
                  onClick={() => { setMenuOpen(false); router.push('/dashboard?action=new-group'); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-on-surface hover:bg-surface-container hover:text-primary transition-colors text-body-sm font-label-md"
                >
                  <span className="material-symbols-outlined text-[18px] text-outline">group_add</span>
                  <span>New group</span>
                </button>
                <button
                  onClick={() => { setMenuOpen(false); router.push('/dashboard?action=create-room'); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-on-surface hover:bg-surface-container hover:text-primary transition-colors text-body-sm font-label-md"
                >
                  <span className="material-symbols-outlined text-[18px] text-outline">meeting_room</span>
                  <span>Create room</span>
                </button>
                <button
                  onClick={() => { setMenuOpen(false); router.push('/settings'); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-on-surface hover:bg-surface-container hover:text-primary transition-colors text-body-sm font-label-md"
                >
                  <span className="material-symbols-outlined text-[18px] text-outline">devices</span>
                  <span>Linked devices</span>
                </button>
                <button
                  onClick={() => { setMenuOpen(false); router.push('/settings'); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-on-surface hover:bg-surface-container hover:text-primary transition-colors text-body-sm font-label-md"
                >
                  <span className="material-symbols-outlined text-[18px] text-outline">star</span>
                  <span>Starred messages</span>
                </button>
                <div className="h-[1px] bg-surface-variant my-1"></div>
                <button
                  onClick={() => { setMenuOpen(false); router.push('/settings'); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-on-surface hover:bg-surface-container hover:text-primary transition-colors text-body-sm font-label-md"
                >
                  <span className="material-symbols-outlined text-[18px] text-outline">settings</span>
                  <span>Settings</span>
                </button>
                <button
                  onClick={() => { setMenuOpen(false); logout(); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-error hover:bg-error-container/20 transition-colors text-body-sm font-label-md"
                >
                  <span className="material-symbols-outlined text-[18px] text-error">logout</span>
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
