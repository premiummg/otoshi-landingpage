import { isValidPhoneNumber } from 'react-phone-number-input';
import { EMAIL_PATTERN } from '../formLimits';

// Same pattern the server enforces (src/formLimits.ts), so the form can't
// accept an address the server will then reject.
const EMAIL_RE = EMAIL_PATTERN;

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
