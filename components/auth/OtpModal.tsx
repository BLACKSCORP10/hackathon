'use client';

import React, { useState, useRef } from 'react';

interface OtpModalProps {
  isOpen: boolean;
  phone: string;
  onClose: () => void;
  onVerify: () => void;
}

export const OtpModal: React.FC<OtpModalProps> = ({
  isOpen,
  phone,
  onClose,
  onVerify,
}) => {
  const [digits, setDigits] = useState(['8', '4', '2', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;

    const newDigits = [...digits];
    newDigits[index] = val.slice(-1);
    setDigits(newDigits);

    // Auto-advance
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-surface-container rounded-2xl border border-surface-container-highest p-6 shadow-2xl flex flex-col gap-4 text-center animate-in zoom-in-95">
        <button
          className="absolute top-4 right-4 text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container-high transition-colors"
          onClick={onClose}
          type="button"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        <div className="w-12 h-12 mx-auto rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary-fixed shadow-sm">
          <span className="material-symbols-outlined text-2xl">sms</span>
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-title-md font-semibold text-on-surface">Verify Phone Number</h3>
          <p className="text-body-sm text-on-surface-variant">
            Enter the 6-digit verification code sent via SMS to{' '}
            <span className="font-mono text-primary-fixed font-medium">{phone || '+1 (555) 942-8820'}</span>
          </p>
        </div>

        <div className="flex justify-center gap-2 my-2">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={el => { inputRefs.current[idx] = el; }}
              className="w-10 h-12 text-center text-lg font-mono font-bold bg-surface-container-low text-on-surface rounded-lg border border-surface-container-highest focus:border-primary-fixed focus:bg-surface-container-highest focus:outline-none focus:ring-1 focus:ring-primary-fixed transition-all"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleDigitChange(idx, e.target.value)}
              onKeyDown={e => handleKeyDown(idx, e)}
              placeholder="·"
              type="text"
            />
          ))}
        </div>

        <div className="flex items-center justify-between text-body-sm px-1">
          <span className="text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">schedule</span>
            0:45
          </span>
          <button
            className="text-primary-fixed hover:underline font-label-md transition-colors"
            type="button"
            onClick={() => setDigits(['', '', '', '', '', ''])}
          >
            Resend SMS
          </button>
        </div>

        <button
          className="w-full py-2.5 rounded-lg bg-primary-container text-on-primary-container font-label-md font-semibold hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg"
          onClick={onVerify}
          type="button"
        >
          <span className="material-symbols-outlined text-sm">check_circle</span>
          Verify & Complete Registration
        </button>

        <button
          className="text-label-sm text-outline hover:text-on-surface transition-colors"
          onClick={onClose}
          type="button"
        >
          Edit phone number
        </button>
      </div>
    </div>
  );
};
