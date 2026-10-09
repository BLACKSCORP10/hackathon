/**
 * NexusChat International Phone Utilities
 * Handles flexible international phone formatting, country code normalization (+91 India default),
 * and forgiving validation for all countries.
 */

export function formatInternationalPhone(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';

  // If already starts with '+', preserve international format
  if (trimmed.startsWith('+')) {
    return trimmed;
  }

  // Clean pure digits to check for existing country code without '+'
  const cleanDigits = trimmed.replace(/\D/g, '');

  // If user typed 91 followed by a 10-digit number (e.g. 919876543210)
  if (cleanDigits.startsWith('91') && cleanDigits.length === 12) {
    return `+91 ${cleanDigits.slice(2, 7)} ${cleanDigits.slice(7)}`;
  }

  // If user typed a 10-digit Indian number without country code (e.g. 9876543210)
  if (cleanDigits.length === 10) {
    return `+91 ${cleanDigits.slice(0, 5)} ${cleanDigits.slice(5)}`;
  }

  // Otherwise, automatically prefix with +91 (India default)
  return `+91 ${trimmed}`;
}

export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  // Very flexible: allows between 6 and 16 digits (covers all international standards)
  return digits.length >= 6 && digits.length <= 16;
}
