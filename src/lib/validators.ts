import { isValidPhoneNumber } from 'react-phone-number-input';

// Deliberately simple (not the full RFC 5322 grammar) - good enough to catch
// a typo like a missing "@" or domain without rejecting real addresses.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

// `PhoneField` stores its value as the E.164 string react-phone-number-input
// itself produces (e.g. "+15065551234"), so `isValidPhoneNumber` can check it
// straight, no country argument needed.
export function isValidPhone(value: string): boolean {
  if (!value.trim()) return false;
  try {
    return isValidPhoneNumber(value);
  } catch {
    return false;
  }
}
