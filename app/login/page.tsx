'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';
  const { login, loginWithGoogle, loginWithGithub } = useAuth();

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
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
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
        setError('This domain is not authorized in your Firebase Console (Authentication -> Settings -> Authorized domains).');
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

  return (
    <div className="flex flex-col w-full max-w-md relative overflow-hidden">
      {/* Glowing Background Mesh Atmosphere */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-64 h-64 rounded-full bg-primary-container/15 blur-3xl pointer-events-none" />
      <div className="absolute top-2/3 -left-20 w-64 h-64 rounded-full bg-tertiary-container/15 blur-3xl pointer-events-none" />

      {/* Brand Hero */}
      <div className="flex flex-col items-center text-center mt-2 mb-6 relative z-10">
        <div className="relative flex items-center justify-center mb-3">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-secondary-container to-primary-container blur-md opacity-70 animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center shadow-xl border border-surface-container-highest/60">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              hub
            </span>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-highest text-primary-fixed-dim text-label-sm font-label-sm uppercase tracking-wider mb-2 shadow-sm border border-surface-bright/50">
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping" />
          Firebase Cloud Connected
        </div>
        <h1 className="text-headline-xl-mobile font-bold text-on-surface tracking-tight">NexusChat</h1>
        <p className="text-body-sm text-on-surface-variant max-w-xs mt-1">
          Real-time multi-device quantum messaging powered by Firebase Authentication & Firestore
        </p>
      </div>

      {/* Tabbed Segmented Switch */}
      <div className="relative z-10 w-full p-1 bg-surface-container-lowest rounded-xl flex items-center mb-6 shadow-inner border border-surface-container-highest/40">
        <button
          className="flex-1 py-2 text-center font-label-md text-label-md rounded-lg transition-all duration-200 bg-primary-container text-on-primary-container shadow-md"
          type="button"
        >
          Sign In
        </button>
        <Link
          href="/register"
          className="flex-1 py-2 text-center font-label-md text-label-md rounded-lg transition-all duration-200 text-on-surface-variant hover:text-on-surface"
        >
          Create Account
        </Link>
      </div>

      {/* Main Card Container */}
      <div className="relative z-10 flex flex-col w-full bg-surface-container/90 rounded-2xl p-6 shadow-2xl backdrop-blur-md border border-surface-container-highest/50">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-error-container/80 text-on-error-container text-body-sm flex items-start gap-2 border border-error/30 animate-in fade-in">
            <span className="material-symbols-outlined text-sm mt-0.5 shrink-0">error</span>
            <span className="leading-snug">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
          {/* Work Email Input */}
          <div className="flex flex-col gap-1 w-full">
            <label className="text-label-sm font-label-sm text-on-surface-variant">Email Address</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-outline pointer-events-none text-lg">
                mail
              </span>
              <input
                className="w-full bg-surface-container-low text-on-surface placeholder:text-outline text-body-md pl-10 pr-4 py-2.5 rounded-lg border border-surface-container-highest focus:outline-none focus:bg-surface-container-highest focus:border-primary transition-all"
                placeholder="name@example.com"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center justify-between">
              <label className="text-label-sm font-label-sm text-on-surface-variant">Password</label>
              <Link
                href="/register"
                className="text-label-sm font-label-sm text-primary hover:underline"
              >
                Need account?
              </Link>
            </div>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-outline pointer-events-none text-lg">
                lock
              </span>
              <input
                className="w-full bg-surface-container-low text-on-surface placeholder:text-outline text-body-md pl-10 pr-10 py-2.5 rounded-lg border border-surface-container-highest focus:outline-none focus:bg-surface-container-highest focus:border-primary transition-all"
                placeholder="••••••••••••"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-outline hover:text-on-surface transition-colors flex items-center"
              >
                <span className="material-symbols-outlined text-lg">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Keep Logged In */}
          <label className="flex items-center gap-2 cursor-pointer select-none mt-1 group">
            <div className="relative flex items-center justify-center">
              <input
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="sr-only"
                type="checkbox"
              />
              <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors shadow-sm ${
                rememberMe ? 'bg-tertiary-container text-tertiary-fixed' : 'bg-surface-container-low border border-surface-container-highest'
              }`}>
                {rememberMe && (
                  <span className="material-symbols-outlined text-sm font-bold">check</span>
                )}
              </div>
            </div>
            <span className="text-body-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
              Keep me securely logged in (Firebase Session)
            </span>
          </label>

          {/* Primary Action CTA */}
          <button
            disabled={isLoading || isSocialLoading}
            className="relative group overflow-hidden w-full py-3 rounded-xl bg-gradient-to-r from-secondary-container via-primary-container to-secondary-container bg-[length:200%_auto] text-on-primary font-headline-md text-headline-md flex items-center justify-center gap-2 shadow-xl active:scale-[0.99] transition-all hover:bg-right mt-2 disabled:opacity-50"
            type="submit"
          >
            <span className="relative z-10 flex items-center gap-2 text-on-primary font-semibold">
              <span>{isLoading ? 'Connecting to Firebase...' : 'Sign In & Decrypt'}</span>
              <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">
                arrow_forward
              </span>
            </span>
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-on-primary/20 to-transparent" />
          </button>

          {/* Social Authentication Separator */}
          <div className="flex items-center gap-2 my-2">
            <div className="flex-1 h-px bg-surface-container-highest" />
            <span className="text-label-sm font-label-sm uppercase tracking-wider text-outline text-[11px]">
              or connect via provider
            </span>
            <div className="flex-1 h-px bg-surface-container-highest" />
          </div>

          {/* Social Buttons with Genuine Firebase signInWithPopup */}
          <div className="grid grid-cols-2 gap-2.5 w-full">
            <button
              type="button"
              disabled={isSocialLoading}
              onClick={handleGoogleSignIn}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container-highest text-on-surface transition-all active:scale-95 shadow-sm border border-surface-container-highest/40 disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path d="M12 5c1.56 0 2.97.56 4.07 1.48l3.05-3.05C17.26 1.7 14.81 1 12 1 7.46 1 3.56 3.6 1.63 7.37l3.65 2.83C6.18 7.44 8.84 5 12 5z" fill="#EA4335" />
                <path d="M23.5 12.28c0-.82-.07-1.6-.2-2.28H12v4.51h6.47c-.28 1.46-1.12 2.7-2.38 3.54l3.67 2.85c2.14-1.98 3.74-4.89 3.74-8.62z" fill="#4285F4" />
                <path d="M5.28 14.8c-.24-.7-.38-1.46-.38-2.25s.14-1.55.38-2.25L1.63 7.47C.59 9.55 0 11.96 0 12.75s.59 3.2 1.63 5.28l3.65-2.83z" fill="#FBBC05" />
                <path d="M12 23.5c3.24 0 5.96-1.07 7.95-2.91l-3.67-2.85c-1.08.72-2.46 1.16-4.28 1.16-3.16 0-5.82-2.44-6.72-5.2L1.63 16.53C3.56 20.3 7.46 23.5 12 23.5z" fill="#34A853" />
              </svg>
              <span className="text-label-md font-label-md text-xs">Google</span>
            </button>
            <button
              type="button"
              disabled={isSocialLoading}
              onClick={handleGithubSignIn}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container-highest text-on-surface transition-all active:scale-95 shadow-sm border border-surface-container-highest/40 disabled:opacity-50"
            >
              <svg className="w-4 h-4 fill-current text-on-surface shrink-0" viewBox="0 0 24 24">
                <path clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fillRule="evenodd" />
              </svg>
              <span className="text-label-md font-label-md text-xs">GitHub</span>
            </button>
          </div>
        </form>
      </div>

      {/* Security Badge */}
      <div className="flex flex-col items-center justify-center mt-6 text-center gap-1 relative z-10">
        <div className="inline-flex items-center gap-1.5 text-on-surface-variant font-mono text-xs">
          <span className="material-symbols-outlined text-tertiary text-sm">enhanced_encryption</span>
          <span>Protected by Firebase Auth & AES-256 Protocol</span>
        </div>
        <span className="text-label-sm font-label-sm text-outline text-[11px]">
          Live Cloud Firestore Real-Time Synced
        </span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex flex-col relative w-full min-h-screen bg-surface items-center justify-center pt-safe pb-safe px-4 py-8">
      <Suspense fallback={<div className="text-primary animate-pulse font-mono text-xs">Connecting Node...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
