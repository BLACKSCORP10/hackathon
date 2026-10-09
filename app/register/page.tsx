'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';

export default function RegisterPage() {
  const router = useRouter();
  const { register, loginWithGoogle, loginWithGithub } = useAuth();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBfpDzwR2xsNv-nsDiy8QJclKg9hzaA5jd1kdt99vR7jPAQs7lZv5vgSDaWYMhGBFv8Ei5ezRYpDb_wAr3lxlYpw8f1qiS29oJ2P6AuVne7dMFwLILfdkLxBonarXmqdT-fgwxrcciUyl8XN29J9Qzkg1NNk2FlFeMbplyopjX2HVtWSHqczvwBI-yU2C6Lqtz9vj-edQeNxEaj3poxvGbhIAuyi2eO9XjNTiCQFGtefBCjPKttKXgFsA'
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setAvatarPreview(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !name.trim()) {
      setError('Please fill in your name, email, and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await register({
        name: name.trim(),
        username: username.trim() || email.split('@')[0],
        email: email.trim(),
        password,
        avatarUrl: avatarPreview,
      });
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      let message = 'Registration failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'An account already exists with this email. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setIsSocialLoading(true);
    try {
      await loginWithGoogle();
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Google Sign-Up error:', err);
      setError(err.message || 'Google sign-up failed.');
    } finally {
      setIsSocialLoading(false);
    }
  };

  return (
    <main className="flex flex-col relative w-full min-h-screen bg-slate-950 items-center justify-center pt-safe pb-safe px-4 py-8">
      <div className="flex flex-col w-full max-w-md relative overflow-hidden animate-fade-in">
        {/* Glow Atmosphere */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-64 h-64 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

        {/* Brand Hero */}
        <div className="flex flex-col items-center text-center mt-2 mb-6 relative z-10">
          <div className="relative flex items-center justify-center mb-3">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 blur-lg opacity-60 animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center shadow-xl border border-white/10">
              <span className="material-symbols-outlined text-cyan-400 text-3xl">hub</span>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-indigo-500/30 text-indigo-300 text-xs font-mono uppercase tracking-wider mb-2 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Direct Account Provisioning
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Create Node Account</h1>
          <p className="text-xs text-slate-400 max-w-xs mt-1 font-medium">
            Register your encrypted communication node on Firestore
          </p>
        </div>

        {/* Tabbed Segmented Switch */}
        <div className="relative z-10 w-full p-1 bg-slate-900/90 rounded-2xl flex items-center mb-5 shadow-inner border border-white/10">
          <Link
            href="/login"
            className="flex-1 py-2 text-center text-xs font-semibold rounded-xl transition-all duration-200 text-slate-400 hover:text-white"
          >
            Sign In
          </Link>
          <button
            className="flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all duration-200 bg-indigo-600 text-white shadow-md"
            type="button"
          >
            Create Account
          </button>
        </div>

        {/* Main Glassmorphic Card Container */}
        <div className="relative z-10 flex flex-col w-full bg-slate-900/80 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl border border-white/10">
          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-red-500/15 text-red-300 text-xs flex items-start gap-2 border border-red-500/30 animate-in fade-in">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Profile Avatar Picker */}
          <div className="flex flex-col items-center justify-center mb-5">
            <label className="relative group cursor-pointer">
              <div className="w-20 h-20 rounded-full bg-slate-950 overflow-hidden flex items-center justify-center shadow-lg border-2 border-indigo-500/40 group-hover:border-indigo-400 transition-colors">
                <img
                  className="w-full h-full object-cover"
                  src={avatarPreview}
                  alt="Profile Avatar Preview"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95">
                <span className="material-symbols-outlined text-sm">add_a_photo</span>
              </div>
              <input
                accept="image/*"
                className="hidden"
                type="file"
                onChange={handleAvatarChange}
              />
            </label>
            <span className="text-[11px] text-slate-400 font-mono mt-2">
              Tap photo to customize avatar
            </span>
          </div>

          <form onSubmit={handleFormSubmit} className="flex flex-col gap-3.5 w-full">
            {/* Full Name Input */}
            <div className="flex flex-col gap-1 w-full">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">Full Name</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-slate-500 pointer-events-none text-lg">
                  badge
                </span>
                <input
                  className="w-full bg-slate-950/80 text-white placeholder:text-slate-600 text-sm pl-10 pr-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Your Name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            {/* Handle / Alias Input */}
            <div className="flex flex-col gap-1 w-full">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">Handle / Alias</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-slate-500 pointer-events-none text-lg">
                  alternate_email
                </span>
                <input
                  className="w-full bg-slate-950/80 text-white placeholder:text-slate-600 text-sm pl-10 pr-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="unique_handle"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="flex flex-col gap-1 w-full">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-slate-500 pointer-events-none text-lg">
                  mail
                </span>
                <input
                  className="w-full bg-slate-950/80 text-white placeholder:text-slate-600 text-sm pl-10 pr-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="user@example.com"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1 w-full">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-slate-500 pointer-events-none text-lg">
                  lock
                </span>
                <input
                  className="w-full bg-slate-950/80 text-white placeholder:text-slate-600 text-sm pl-10 pr-10 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="At least 6 characters"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-500 hover:text-white transition-colors flex items-center"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <PasswordStrengthMeter password={password} />
            </div>

            {/* Submit Action CTA */}
            <button
              disabled={isLoading || isSocialLoading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all hover:opacity-95 mt-2 disabled:opacity-50"
              type="submit"
            >
              <span>{isLoading ? 'Creating account...' : 'Complete Registration'}</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>

            {/* Social Registration */}
            <div className="flex items-center gap-2 my-1">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                or sign up with
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <button
              type="button"
              disabled={isSocialLoading}
              onClick={handleGoogleSignUp}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 text-white transition-all active:scale-95 border border-white/10 disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  d="M12 5c1.56 0 2.97.56 4.07 1.48l3.05-3.05C17.26 1.7 14.81 1 12 1 7.46 1 3.56 3.6 1.63 7.37l3.65 2.83C6.18 7.44 8.84 5 12 5z"
                  fill="#EA4335"
                />
                <path
                  d="M23.5 12.28c0-.82-.07-1.6-.2-2.28H12v4.51h6.47c-.28 1.46-1.12 2.7-2.38 3.54l3.67 2.85c2.14-1.98 3.74-4.89 3.74-8.62z"
                  fill="#4285F4"
                />
                <path
                  d="M5.28 14.8c-.24-.7-.38-1.46-.38-2.25s.14-1.55.38-2.25L1.63 7.47C.59 9.55 0 11.96 0 12.75s.59 3.2 1.63 5.28l3.65-2.83z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 23.5c3.24 0 5.96-1.07 7.95-2.91l-3.67-2.85c-1.08.72-2.46 1.16-4.28 1.16-3.16 0-5.82-2.44-6.72-5.2L1.63 16.53C3.56 20.3 7.46 23.5 12 23.5z"
                  fill="#34A853"
                />
              </svg>
              <span className="text-xs font-semibold">Continue with Google</span>
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
