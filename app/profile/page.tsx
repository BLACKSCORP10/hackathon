'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useTheme } from '@/context/ThemeContext';
import { useAvatarPreview } from '@/context/AvatarPreviewContext';
import { TopHeader } from '@/components/navigation/TopHeader';
import { BottomNav } from '@/components/navigation/BottomNav';
import { compressImage } from '@/lib/imageUtils';
import { formatInternationalPhone } from '@/lib/phoneUtils';

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateProfileData } = useAuth();
  const { updateProfile } = useChat();
  const { theme } = useTheme();
  const { openAvatarPreview } = useAvatarPreview();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || user.displayName || '');
      setPhone(user.phoneNumber || user.phone || '');
      setBio(user.statusText || user.bio || 'Available · Connected via NexusChat');
      setAvatarUrl(user.avatarUrl || user.photoURL || '');
    }
  }, [user]);

  const uploadToImgBB = async (file: File): Promise<string> => {
    const apiKey = "02fc16975b08dd5c3162cbf9c94ce1e5";
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.success) {
      return data.data.url; // Returns direct short HTTPS link
    } else {
      throw new Error("ImgBB upload failed");
    }
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSaving(true); // Optional: show loading state

      // Upload directly to ImgBB to get a short URL
      const uploadedUrl = await uploadToImgBB(file);

      // Set local preview state to the new short URL
      setAvatarUrl(uploadedUrl);
    } catch (err) {
      console.error("Error uploading image:", err);
      setErrorMessage("Failed to upload profile picture.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Display Name is required.');
      return;
    }

    let formattedPhone = phone.trim();
    if (formattedPhone) {
      formattedPhone = formatInternationalPhone(formattedPhone);
    }

    setIsSaving(true);
    try {
      const profileUpdates = {
        name: trimmedName,
        displayName: trimmedName,
        phone: formattedPhone,
        phoneNumber: formattedPhone,
        bio: bio.trim() || 'Available · Connected via NexusChat',
        statusText: bio.trim() || 'Available · Connected via NexusChat',
        avatarUrl: avatarUrl ? avatarUrl.trim() : '',
        photoURL: avatarUrl ? avatarUrl.trim() : '',
      };

      await updateProfileData(profileUpdates);
      await updateProfile(profileUpdates);

      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
      }, 2500);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setErrorMessage(err?.message || 'Failed to save profile changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}>
      <TopHeader title="NexusChat" subtitle="Operative Profile" showBack />

      <main className="flex-1 flex flex-col pt-16 pb-24 max-w-xl mx-auto w-full px-4 py-6 gap-6">
        <div className={`rounded-3xl p-6 shadow-2xl border backdrop-blur-2xl flex flex-col gap-6 ${theme === 'dark' ? 'bg-slate-900/80 border-white/10' : 'bg-white/90 border-slate-200'
          }`}>
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 text-rose-300 text-xs flex items-center gap-2 border border-rose-500/30">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 text-emerald-300 text-xs flex items-center gap-2 border border-emerald-500/30">
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>Profile changes saved and synchronized across sessions!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="flex flex-col gap-5">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <img
                  alt="Profile Avatar"
                  src={
                    avatarUrl ||
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuBfpDzwR2xsNv-nsDiy8QJclKg9hzaA5jd1kdt99vR7jPAQs7lZv5vgSDaWYMhGBFv8Ei5ezRYpDb_wAr3lxlYpw8f1qiS29oJ2P6AuVne7dMFwLILfdkLxBonarXmqdT-fgwxrcciUyl8XN29J9Qzkg1NNk2FlFeMbplyopjX2HVtWSHqczvwBI-yU2C6Lqtz9vj-edQeNxEaj3poxvGbhIAuyi2eO9XjNTiCQFGtefBCjPKttKXgFsA'
                  }
                  className="w-28 h-28 rounded-full object-cover ring-4 ring-indigo-500/50 shadow-2xl group-hover:brightness-75 transition-all"
                />
                <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white">
                  <span className="material-symbols-outlined text-3xl">photo_camera</span>
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
                      name: name || 'Operative',
                      avatarUrl: avatarUrl || user?.avatarUrl || '',
                      username: user?.username || 'node',
                      phone: phone || user?.phoneNumber || user?.phone,
                      phoneNumber: phone || user?.phoneNumber || user?.phone,
                      bio: bio || 'Available · Connected via NexusChat',
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
                placeholder="Operative Name"
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Flexible International Phone Input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Phone Number
                </label>
                <span className="text-[10px] font-mono text-cyan-400">
                  Default prefix: +91 (India)
                </span>
              </div>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-slate-500 pointer-events-none text-base">
                  call
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => {
                    if (phone.trim()) {
                      setPhone(formatInternationalPhone(phone));
                    }
                  }}
                  placeholder="+91 98765 43210 (or any country code)"
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <span className="text-[11px] text-slate-500">
                Supports all international formats. Numbers entered without country codes are automatically prefixed with +91.
              </span>
            </div>

            {/* Bio */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">Status & Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Your node description or status"
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white font-bold text-xs shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 transition-all mt-2"
            >
              {isSaving ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                  <span>Synchronizing Node...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">save</span>
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
