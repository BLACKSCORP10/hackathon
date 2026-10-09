'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';
  const { login, loginWithGoogle, loginWithGithub, loginAnonymously } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email.trim(), password);
      router.push(redirectPath);
    } catch (err: any) {
      console.error('Login error:', err);
      let message = 'Authentication failed. Please check your credentials.';
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
      ) {
        message = 'Invalid email or password. Please try again or create an account.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Access temporarily disabled due to many failed attempts. Try again later or reset password.';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSocialLoading(true);
    try {
      await loginWithGoogle();
      router.push(redirectPath);
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was closed.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized in your Firebase Console.');
      } else {
        setError(err.message || 'Google sign-in failed.');
      }
    } finally {
      setIsSocialLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setError(null);
    setIsSocialLoading(true);
    try {
      await loginWithGithub();
      router.push(redirectPath);
    } catch (err: any) {
      console.error('GitHub Sign-In error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('GitHub sign-in popup was closed.');
      } else {
        setError(err.message || 'GitHub sign-in failed.');
      }
    } finally {
      setIsSocialLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setError(null);
    setIsSocialLoading(true);
    try {
      await loginAnonymously();
      router.push(redirectPath);
    } catch (err: any) {
      console.error('Guest Sign-In error:', err);
      setError(err.message || 'Guest sign-in failed.');
    } finally {
      setIsSocialLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md relative overflow-hidden animate-fade-in">
      {/* Atmosphere Glow */}
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
          Quantum Encrypted Node
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">NexusChat</h1>
        <p className="text-xs text-slate-400 max-w-xs mt-1 font-medium">
          Frictionless direct authentication & real-time Firestore sync
        </p>
      </div>

      {/* Tabbed Segmented Switch */}
      <div className="relative z-10 w-full p-1 bg-slate-900/90 rounded-2xl flex items-center mb-5 shadow-inner border border-white/10">
        <button
          className="flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all duration-200 bg-indigo-600 text-white shadow-md"
          type="button"
        >
          Sign In
        </button>
        <Link
          href="/register"
          className="flex-1 py-2 text-center text-xs font-semibold rounded-xl transition-all duration-200 text-slate-400 hover:text-white"
        >
          Create Account
        </Link>
      </div>

      {/* Main Glassmorphic Card Container */}
      <div className="relative z-10 flex flex-col w-full bg-slate-900/80 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl border border-white/10">
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-500/15 text-red-300 text-xs flex items-start gap-2 border border-red-500/30 animate-in fade-in">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            <span className="leading-snug">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
          {/* Email Input */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">Email Address</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-slate-500 pointer-events-none text-lg">
                mail
              </span>
              <input
                className="w-full bg-slate-950/80 text-white placeholder:text-slate-600 text-sm pl-10 pr-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="name@example.com"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1.5 w-full">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">Password</label>
              <Link href="/register" className="text-xs text-cyan-400 hover:underline">
                Create new?
              </Link>
            </div>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-slate-500 pointer-events-none text-lg">
                lock
              </span>
              <input
                className="w-full bg-slate-950/80 text-white placeholder:text-slate-600 text-sm pl-10 pr-10 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="••••••••••••"
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
          </div>

          {/* Remember Session */}
          <label className="flex items-center gap-2 cursor-pointer select-none mt-0.5 group">
            <div className="relative flex items-center justify-center">
              <input
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="sr-only"
                type="checkbox"
              />
              <div
                className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors ${
                  rememberMe
                    ? 'bg-emerald-500 text-black font-bold'
                    : 'bg-slate-950 border border-white/15'
                }`}
              >
                {rememberMe && <span className="material-symbols-outlined text-[12px]">check</span>}
              </div>
            </div>
            <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">
              Persist encrypted session token
            </span>
          </label>

          {/* Primary Submit Button */}
          <button
            disabled={isLoading || isSocialLoading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all hover:opacity-95 mt-1 disabled:opacity-50"
            type="submit"
          >
            <span>{isLoading ? 'Connecting node...' : 'Direct Sign In'}</span>
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>

          {/* Frictionless Instant Guest Access */}
          <button
            type="button"
            disabled={isLoading || isSocialLoading}
            onClick={handleGuestSignIn}
            className="w-full py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-cyan-300 font-semibold text-xs flex items-center justify-center gap-2 border border-cyan-500/30 active:scale-95 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base text-cyan-400">bolt</span>
            <span>Instant Guest Operative (No Password)</span>
          </button>

          {/* Social Authentication Separator */}
          <div className="flex items-center gap-2 my-1">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
              or continue with
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-2.5 w-full">
            <button
              type="button"
              disabled={isSocialLoading}
              onClick={handleGoogleSignIn}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 text-white transition-all active:scale-95 border border-white/10 disabled:opacity-50"
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
              <span className="text-xs font-semibold">Google</span>
            </button>
            <button
              type="button"
              disabled={isSocialLoading}
              onClick={handleGithubSignIn}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 text-white transition-all active:scale-95 border border-white/10 disabled:opacity-50"
            >
              <svg className="w-4 h-4 fill-current text-white shrink-0" viewBox="0 0 24 24">
                <path
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  fillRule="evenodd"
                />
              </svg>
              <span className="text-xs font-semibold">GitHub</span>
            </button>
          </div>
        </form>
      </div>

      {/* Security Footer */}
      <div className="flex flex-col items-center justify-center mt-5 text-center gap-1 relative z-10">
        <div className="inline-flex items-center gap-1.5 text-slate-400 font-mono text-xs">
          <span className="material-symbols-outlined text-emerald-400 text-sm">lock</span>
          <span>End-to-End Quantum Encryption</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex flex-col relative w-full min-h-screen bg-slate-950 items-center justify-center pt-safe pb-safe px-4 py-8">
      <Suspense fallback={<div className="text-cyan-400 animate-pulse font-mono text-xs">Connecting Node...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
