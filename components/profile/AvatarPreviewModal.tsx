'use client';

import React, { useState } from 'react';
import { useAvatarPreview } from '@/context/AvatarPreviewContext';

export const AvatarPreviewModal: React.FC = () => {
  const { previewData, isOpen, closeAvatarPreview } = useAvatarPreview();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !previewData) return null;

  const handleCopyHandle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewData.username) {
      navigator.clipboard.writeText(`@${previewData.username}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const bioText = previewData.statusText || previewData.bio || 'Encrypted operative node · Standby for transmissions';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-fade-in"
      onClick={closeAvatarPreview}
      role="dialog"
      aria-modal="true"
    >
      {/* Modal Content Card */}
      <div
        className="relative w-full max-w-sm bg-slate-900/90 dark:bg-slate-900/90 rounded-3xl p-6 shadow-2xl border border-white/10 dark:border-white/10 flex flex-col items-center gap-5 text-slate-100 backdrop-blur-2xl transform transition-all duration-300 scale-100 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400 text-xl">account_circle</span>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Profile Information</span>
          </div>
          <button
            type="button"
            onClick={closeAvatarPreview}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors active:scale-95"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* High-Resolution Picture View */}
        <div className="relative group w-52 h-52 sm:w-60 sm:h-60 rounded-3xl overflow-hidden p-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-2xl shadow-indigo-500/20">
          <div className="w-full h-full rounded-[22px] overflow-hidden bg-slate-950 ring-2 ring-slate-950 flex items-center justify-center">
            <img
              alt={previewData.name}
              src={
                previewData.avatarUrl ||
                'https://lh3.googleusercontent.com/aida-public/AB6AXuBfpDzwR2xsNv-nsDiy8QJclKg9hzaA5jd1kdt99vR7jPAQs7lZv5vgSDaWYMhGBFv8Ei5ezRYpDb_wAr3lxlYpw8f1qiS29oJ2P6AuVne7dMFwLILfdkLxBonarXmqdT-fgwxrcciUyl8XN29J9Qzkg1NNk2FlFeMbplyopjX2HVtWSHqczvwBI-yU2C6Lqtz9vj-edQeNxEaj3poxvGbhIAuyi2eO9XjNTiCQFGtefBCjPKttKXgFsA'
              }
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          {previewData.isOnline && (
            <span className="absolute bottom-3 right-3 w-4 h-4 rounded-full bg-emerald-400 ring-4 ring-slate-950 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
          )}
        </div>

        {/* User Info Details */}
        <div className="w-full flex flex-col items-center text-center gap-2">
          <div className="flex items-center gap-1.5 justify-center">
            <h3 className="text-lg font-bold text-white tracking-tight">{previewData.name}</h3>
            <span
              className="material-symbols-outlined text-indigo-400 text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
          </div>

          {/* Registered Phone Number Pill (Prominent Display) */}
          {(previewData.phoneNumber || previewData.phone) ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-cyan-300 font-mono text-xs shadow-sm">
              <span className="material-symbols-outlined text-[14px] text-cyan-400">call</span>
              <span className="font-semibold">{previewData.phoneNumber || previewData.phone}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-white/5 text-slate-400 font-mono text-[11px]">
              <span className="material-symbols-outlined text-[13px] text-slate-500">lock</span>
              <span>Encrypted Node</span>
            </div>
          )}

          {previewData.username && (
            <button
              type="button"
              onClick={handleCopyHandle}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800/80 hover:bg-slate-800 text-indigo-300 font-mono text-xs border border-white/5 transition-colors group"
              title="Click to copy handle"
            >
              <span>@{previewData.username}</span>
              <span className="material-symbols-outlined text-[13px] text-slate-400 group-hover:text-white">
                {copied ? 'check' : 'content_copy'}
              </span>
            </button>
          )}

          {/* Bio / Status Quote Box */}
          <div className="w-full mt-1 bg-slate-950/60 rounded-2xl p-3.5 border border-white/10 text-left flex flex-col gap-1 shadow-inner">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-indigo-400">format_quote</span>
              Bio & Operative Status
            </span>
            <p className="text-xs text-slate-200 leading-relaxed font-sans italic">
              &quot;{bioText}&quot;
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="w-full flex items-center gap-2">
          <button
            type="button"
            onClick={closeAvatarPreview}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:opacity-90 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/30 active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span>Dismiss</span>
          </button>
        </div>
      </div>
    </div>
  );
};
