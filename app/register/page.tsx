'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { OtpModal } from '@/components/auth/OtpModal';

export default function RegisterPage() {
  const router = useRouter();
  const { register, loginWithGoogle, loginWithGithub } = useAuth();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('https://lh3.googleusercontent.com/aida-public/AB6AXuBfpDzwR2xsNv-nsDiy8QJclKg9hzaA5jd1kdt99vR7jPAQs7lZv5vgSDaWYMhGBFv8Ei5ezRYpDb_wAr3lxlYpw8f1qiS29oJ2P6AuVne7dMFwLILfdkLxBonarXmqdT-fgwxrcciUyl8XN29J9Qzkg1NNk2FlFeMbplyopjX2HVtWSHqczvwBI-yU2C6Lqtz9vj-edQeNxEaj3poxvGbhIAuyi2eO9XjNTiCQFGtefBCjPKttKXgFsA');
  const [biometrics, setBiometrics] = useState(true);

  const [otpOpen, setOtpOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = evt => {
        if (evt.target?.result) {
          setAvatarPreview(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !name.trim()) {
      setError('Please fill in your name, email, and password.');
      return;
    }
    setError(null);
    setOtpOpen(true);
  };

  const executeRegistration = async () => {
    setOtpOpen(false);
    setIsLoading(true);
    setError(null);

    try {
      await register({
        name: name.trim(),
        username: username.trim() || email.split('@')[0],
        email: email.trim(),
        password,
        phone: phone.trim() ? `${countryCode} ${phone.trim()}` : undefined,
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
    <main className="flex flex-col relative w-full min-h-screen bg-surface items-center justify-center pt-safe pb-safe px-4 py-8">
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
            Live Cloud Auth
          </div>
          <h1 className="text-headline-xl-mobile font-bold text-on-surface tracking-tight">Create Node Account</h1>
          <p className="text-body-sm text-on-surface-variant max-w-xs mt-1">
            Register your encrypted communication node on the global Firebase Firestore cluster
          </p>
        </div>

        {/* Tabbed Segmented Switch */}
        <div className="relative z-10 w-full p-1 bg-surface-container-lowest rounded-xl flex items-center mb-6 shadow-inner border border-surface-container-highest/40">
          <Link
            href="/login"
            className="flex-1 py-2 text-center font-label-md text-label-md rounded-lg transition-all duration-200 text-on-surface-variant hover:text-on-surface"
          >
            Sign In
          </Link>
          <button
            className="flex-1 py-2 text-center font-label-md text-label-md rounded-lg transition-all duration-200 bg-primary-container text-on-primary-container shadow-md"
            type="button"
          >
            Create Account
          </button>
        </div>

        {/* Main Card Container */}
        <div className="relative z-10 flex flex-col w-full bg-surface-container/90 rounded-2xl p-6 shadow-2xl backdrop-blur-md border border-surface-container-highest/50">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-error-container/80 text-on-error-container text-body-sm flex items-start gap-2 border border-error/30 animate-in fade-in">
              <span className="material-symbols-outlined text-sm mt-0.5 shrink-0">error</span>
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Profile Avatar Picker */}
          <div className="flex flex-col items-center justify-center mb-6">
            <label className="relative group cursor-pointer">
              <div className="w-20 h-20 rounded-full bg-surface-container-high overflow-hidden flex items-center justify-center shadow-md border-2 border-primary/30 group-hover:border-primary transition-colors">
                <img
                  className="w-full h-full object-cover"
                  src={avatarPreview}
                  alt="Profile Avatar Preview"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-lg transition-transform active:scale-95">
                <span className="material-symbols-outlined text-sm">add_a_photo</span>
              </div>
              <input
                accept="image/*"
                className="hidden"
                type="file"
                onChange={handleAvatarChange}
              />
            </label>
            <span className="text-label-sm font-label-sm text-on-surface-variant mt-2">
              Personalize your node avatar
            </span>
          </div>

          <form onSubmit={handleFormSubmit} className="flex flex-col gap-3.5 w-full">
            {/* Full Name Input */}
            <div className="flex flex-col gap-1 w-full">
              <label className="text-label-sm font-label-sm text-on-surface-variant">Full Name</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-outline pointer-events-none text-lg">
                  badge
                </span>
                <input
                  className="w-full bg-surface-container-low text-on-surface placeholder:text-outline text-body-md pl-10 pr-4 py-2.5 rounded-lg border border-surface-container-highest focus:outline-none focus:bg-surface-container-highest focus:border-primary transition-all"
                  placeholder="Your Name"
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            </div>

            {/* Handle / Alias Input */}
            <div className="flex flex-col gap-1 w-full">
              <label className="text-label-sm font-label-sm text-on-surface-variant">Handle / Alias</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-outline pointer-events-none text-lg">
                  alternate_email
                </span>
                <input
                  className="w-full bg-surface-container-low text-on-surface placeholder:text-outline text-body-md pl-10 pr-4 py-2.5 rounded-lg border border-surface-container-highest focus:outline-none focus:bg-surface-container-highest focus:border-primary transition-all"
                  placeholder="unique_handle"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Work Email Input */}
            <div className="flex flex-col gap-1 w-full">
              <label className="text-label-sm font-label-sm text-on-surface-variant">Email Address</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-outline pointer-events-none text-lg">
                  mail
                </span>
                <input
                  className="w-full bg-surface-container-low text-on-surface placeholder:text-outline text-body-md pl-10 pr-4 py-2.5 rounded-lg border border-surface-container-highest focus:outline-none focus:bg-surface-container-highest focus:border-primary transition-all"
                  placeholder="user@example.com"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Phone Number Input */}
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center justify-between">
                <label className="text-label-sm font-label-sm text-on-surface-variant">Mobile Phone Number (Optional)</label>
                <span className="text-label-sm font-label-sm text-tertiary flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  SMS Guard
                </span>
              </div>
              <div className="relative flex items-center gap-2">
                <div className="relative flex items-center bg-surface-container-low rounded-lg px-2 py-2.5 border border-surface-container-highest shrink-0">
                  <span className="text-base mr-1 select-none">🇺🇸</span>
                  <span className="text-body-sm font-mono text-on-surface select-none">{countryCode}</span>
                  <span className="material-symbols-outlined text-outline text-sm ml-0.5 pointer-events-none">expand_more</span>
                  <select
                    aria-label="Country prefix"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    value={countryCode}
                    onChange={e => setCountryCode(e.target.value)}
                  >
                    <option value="+1">+1 (US)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+49">+49 (DE)</option>
                    <option value="+33">+33 (FR)</option>
                    <option value="+81">+81 (JP)</option>
                    <option value="+61">+61 (AU)</option>
                  </select>
                </div>
                <div className="relative flex-1 flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline pointer-events-none text-lg">
                    smartphone
                  </span>
                  <input
                    className="w-full bg-surface-container-low text-on-surface placeholder:text-outline text-body-md pl-10 pr-4 py-2.5 rounded-lg border border-surface-container-highest focus:outline-none focus:bg-surface-container-highest focus:border-primary font-mono transition-all"
                    placeholder="(555) 000-0000"
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Passphrase Input & Strength Meter */}
            <div className="flex flex-col gap-1 w-full">
              <label className="text-label-sm font-label-sm text-on-surface-variant">Create Password</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-outline pointer-events-none text-lg">
                  lock
                </span>
                <input
                  className="w-full bg-surface-container-low text-on-surface placeholder:text-outline text-body-md pl-10 pr-10 py-2.5 rounded-lg border border-surface-container-highest focus:outline-none focus:bg-surface-container-highest focus:border-primary transition-all"
                  placeholder="At least 6 characters"
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
              <PasswordStrengthMeter password={password} />
            </div>

            {/* Biometrics Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer select-none mt-1 group">
              <div className="relative flex items-center justify-center">
                <input
                  checked={biometrics}
                  onChange={e => setBiometrics(e.target.checked)}
                  className="sr-only"
                  type="checkbox"
                />
                <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors shadow-sm ${
                  biometrics ? 'bg-tertiary-container text-tertiary-fixed' : 'bg-surface-container-low border border-surface-container-highest'
                }`}>
                  {biometrics && (
                    <span className="material-symbols-outlined text-sm font-bold">check</span>
                  )}
                </div>
              </div>
              <span className="text-body-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                Keep me securely logged in (biometrics enabled)
              </span>
            </label>

            {/* Primary Action CTA */}
            <button
              disabled={isLoading || isSocialLoading}
              className="relative group overflow-hidden w-full py-3 rounded-xl bg-gradient-to-r from-secondary-container via-primary-container to-secondary-container bg-[length:200%_auto] text-on-primary font-headline-md text-headline-md flex items-center justify-center gap-2 shadow-xl active:scale-[0.99] transition-all hover:bg-right mt-2 disabled:opacity-50"
              type="submit"
            >
              <span className="relative z-10 flex items-center gap-2 text-on-primary font-semibold">
                <span>{isLoading ? 'Registering with Firebase...' : 'Create Firebase Account'}</span>
                <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </span>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-on-primary/20 to-transparent" />
            </button>

            {/* Social Registration */}
            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 h-px bg-surface-container-highest" />
              <span className="text-label-sm font-label-sm uppercase tracking-wider text-outline text-[11px]">
                or sign up with
              </span>
              <div className="flex-1 h-px bg-surface-container-highest" />
            </div>

            <button
              type="button"
              disabled={isSocialLoading}
              onClick={handleGoogleSignUp}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container-highest text-on-surface transition-all active:scale-95 shadow-sm border border-surface-container-highest/40 disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path d="M12 5c1.56 0 2.97.56 4.07 1.48l3.05-3.05C17.26 1.7 14.81 1 12 1 7.46 1 3.56 3.6 1.63 7.37l3.65 2.83C6.18 7.44 8.84 5 12 5z" fill="#EA4335" />
                <path d="M23.5 12.28c0-.82-.07-1.6-.2-2.28H12v4.51h6.47c-.28 1.46-1.12 2.7-2.38 3.54l3.67 2.85c2.14-1.98 3.74-4.89 3.74-8.62z" fill="#4285F4" />
                <path d="M5.28 14.8c-.24-.7-.38-1.46-.38-2.25s.14-1.55.38-2.25L1.63 7.47C.59 9.55 0 11.96 0 12.75s.59 3.2 1.63 5.28l3.65-2.83z" fill="#FBBC05" />
                <path d="M12 23.5c3.24 0 5.96-1.07 7.95-2.91l-3.67-2.85c-1.08.72-2.46 1.16-4.28 1.16-3.16 0-5.82-2.44-6.72-5.2L1.63 16.53C3.56 20.3 7.46 23.5 12 23.5z" fill="#34A853" />
              </svg>
              <span className="text-label-md font-label-md text-xs">Continue with Google</span>
            </button>
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

      {/* OTP SMS Verification Modal */}
      <OtpModal
        isOpen={otpOpen}
        phone={phone ? `${countryCode} ${phone}` : 'SMS Guard'}
        onClose={() => setOtpOpen(false)}
        onVerify={executeRegistration}
      />
    </main>
  );
}
