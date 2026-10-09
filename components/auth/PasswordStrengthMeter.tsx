'use client';

import React from 'react';

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  let label = 'Entropy: Minimal';
  let badgeClass = 'bg-surface-container-highest text-outline';
  let bar1 = 'bg-surface-container-highest';
  let bar2 = 'bg-surface-container-highest';
  let bar3 = 'bg-surface-container-highest';
  let bar4 = 'bg-surface-container-highest';

  if (password.length > 0) {
    if (score <= 1) {
      label = 'Weak Key';
      badgeClass = 'bg-error-container text-on-error-container';
      bar1 = 'bg-error';
    } else if (score === 2) {
      label = 'Fair Entropy';
      badgeClass = 'bg-secondary-container text-on-secondary-container';
      bar1 = 'bg-secondary';
      bar2 = 'bg-secondary';
    } else if (score === 3) {
      label = 'High Security';
      badgeClass = 'bg-primary-container text-on-primary-container';
      bar1 = 'bg-primary';
      bar2 = 'bg-primary';
      bar3 = 'bg-primary';
    } else {
      label = 'Quantum Secure';
      badgeClass = 'bg-tertiary-container text-on-tertiary-container';
      bar1 = 'bg-tertiary';
      bar2 = 'bg-tertiary';
      bar3 = 'bg-tertiary';
      bar4 = 'bg-tertiary';
    }
  }

  return (
    <div className="flex flex-col gap-1 mt-1">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 w-1/2">
          <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${bar1}`} />
          <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${bar2}`} />
          <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${bar3}`} />
          <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${bar4}`} />
        </div>
        <span className={`px-space-xs py-0.5 rounded text-label-sm font-label-sm transition-colors ${badgeClass}`}>
          {label}
        </span>
      </div>
    </div>
  );
};
