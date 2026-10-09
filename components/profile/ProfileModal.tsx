'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useAvatarPreview } from '@/context/AvatarPreviewContext';
import { compressImage } from '@/lib/imageUtils';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { updateProfile } = useChat();
  const { openAvatarPreview } = useAvatarPreview();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.statusText || user?.bio || 'Available · Connected via NexusChat');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 800, 0.6);
      setAvatarUrl(compressed.dataUrl);
    } catch (err) {
      console.warn('Avatar compression fallback:', err);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        statusText: bio.trim(),
        avatarUrl,
      });
      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        onClose();
      }, 900);
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Failed to save profile changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900/90 rounded-3xl p-6 shadow-2xl border border-white/10 flex flex-col gap-5 text-slate-100 backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-400 text-2xl">account_circle</span>
            <h3 className="text-lg font-bold text-white tracking-tight">Edit Operative Profile</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {/* Avatar Preview & Upload */}
          <div className="flex flex-col items-center gap-2.5">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <img
                alt="Profile Preview"
                src={
                  avatarUrl ||
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuBfpDzwR2xsNv-nsDiy8QJclKg9hzaA5jd1kdt99vR7jPAQs7lZv5vgSDaWYMhGBFv8Ei5ezRYpDb_wAr3lxlYpw8f1qiS29oJ2P6AuVne7dMFwLILfdkLxBonarXmqdT-fgwxrcciUyl8XN29J9Qzkg1NNk2FlFeMbplyopjX2HVtWSHqczvwBI-yU2C6Lqtz9vj-edQeNxEaj3poxvGbhIAuyi2eO9XjNTiCQFGtefBCjPKttKXgFsA'
                }
                className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-500/40 shadow-xl group-hover:brightness-75 transition-all"
              />
              <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white">
                <span className="material-symbols-outlined text-2xl">photo_camera</span>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarFile}
              accept="image/*"
              className="hidden"
            />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-cyan-400 font-semibold hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">photo_camera</span>
                <span>Change Photo</span>
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() =>
                  openAvatarPreview({
                    name: name || user?.name || 'Operative',
                    avatarUrl:
                      avatarUrl ||
                      user?.avatarUrl ||
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuBfpDzwR2xsNv-nsDiy8QJclKg9hzaA5jd1kdt99vR7jPAQs7lZv5vgSDaWYMhGBFv8Ei5ezRYpDb_wAr3lxlYpw8f1qiS29oJ2P6AuVne7dMFwLILfdkLxBonarXmqdT-fgwxrcciUyl8XN29J9Qzkg1NNk2FlFeMbplyopjX2HVtWSHqczvwBI-yU2C6Lqtz9vj-edQeNxEaj3poxvGbhIAuyi2eO9XjNTiCQFGtefBCjPKttKXgFsA',
                    username: user?.username || 'node',
                    bio: bio || user?.statusText || 'Available · Connected via NexusChat',
                    statusText: 'Online · Verified Firebase Node',
                    isOnline: true,
                  })
                }
                className="text-xs text-indigo-300 font-semibold hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">fullscreen</span>
                <span>Preview DP</span>
              </button>
            </div>
          </div>

          {/* Display Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">Display Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Operative Name"
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Bio / Status Text */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">Bio & Signal Status</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="E.g. Quantum cryptographer · Standby for signals"
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:opacity-90 text-white font-semibold text-xs transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                  <span>Saving...</span>
                </>
              ) : successMsg ? (
                <>
                  <span className="material-symbols-outlined text-sm text-emerald-300">check_circle</span>
                  <span>Updated!</span>
                </>
              ) : (
                <span>Save Profile</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
