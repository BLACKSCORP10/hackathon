'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useAvatarPreview } from '@/context/AvatarPreviewContext';
import { compressImage } from '@/lib/imageUtils';
import { formatInternationalPhone } from '@/lib/phoneUtils';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}
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
    return data.data.url;
  } else {
    throw new Error("ImgBB upload failed");
  }
};

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfileData } = useAuth();
  const { updateProfile } = useChat();
  const { openAvatarPreview } = useAvatarPreview();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state whenever modal opens or user updates
  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || user.displayName || '');
      setPhone(user.phoneNumber || user.phone || '');
      setBio(user.statusText || user.bio || 'Available · Connected via NexusChat');
      setAvatarUrl(user.avatarUrl || user.photoURL || '');
      setErrorMessage(null);
      setSuccessMsg(false);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSaving(true);
      // Upload image to ImgBB and get short URL
      const uploadedUrl = await uploadToImgBB(file);
      // Set local state to the new short URL
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

    // Flexible international phone formatting (+91 default prefix if no leading '+')
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

      // 1. Save cleanly to Firestore users/${user.uid} and update Firebase Auth profile
      await updateProfileData(profileUpdates);

      // 2. Sync ChatContext local operative state
      await updateProfile(profileUpdates);

      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        onClose();
      }, 750);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setErrorMessage(err?.message || 'Failed to save profile changes. Please try again.');
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

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-500/15 text-rose-300 text-xs flex items-center gap-2 border border-rose-500/30 animate-in fade-in">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

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
                    name: name || user?.name || user?.displayName || 'Operative',
                    avatarUrl:
                      avatarUrl ||
                      user?.avatarUrl ||
                      user?.photoURL ||
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuBfpDzwR2xsNv-nsDiy8QJclKg9hzaA5jd1kdt99vR7jPAQs7lZv5vgSDaWYMhGBFv8Ei5ezRYpDb_wAr3lxlYpw8f1qiS29oJ2P6AuVne7dMFwLILfdkLxBonarXmqdT-fgwxrcciUyl8XN29J9Qzkg1NNk2FlFeMbplyopjX2HVtWSHqczvwBI-yU2C6Lqtz9vj-edQeNxEaj3poxvGbhIAuyi2eO9XjNTiCQFGtefBCjPKttKXgFsA',
                    username: user?.username || 'node',
                    phone: phone || user?.phoneNumber || user?.phone,
                    phoneNumber: phone || user?.phoneNumber || user?.phone,
                    bio: bio || user?.statusText || user?.bio || 'Available · Connected via NexusChat',
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

          {/* Flexible International Phone Field */}
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
                placeholder="+91 98765 43210 (or any international format)"
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <span className="text-[11px] text-slate-500">
              Enter any local or international number. Numbers without a country code will default to +91.
            </span>
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
