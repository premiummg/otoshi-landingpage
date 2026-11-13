// Maximum lengths for the registration form's free-text fields. ONE list,
// used by the inputs (`maxLength`, so the browser stops typing) and by the
// server's validation (api/_validate.ts, which rejects anything longer), so
// the two can't disagree and a family never meets a mysterious server error
// for text the form happily accepted.
export const LIMITS = {
  name: 80,
  email: 254,
  phone: 30,
  address: 200,
  city: 100,
  province: 60,
  postalCode: 12,
  emergencyName: 120,
  relationship: 60,
  notes: 1000,
} as const;

// Deliberately simple (not the full RFC 5322 grammar): catches a missing "@"
// or domain without rejecting real addresses, and - unlike a permissive
// pattern - never lets through commas, angle brackets or quotes, which would
// make a malformed Reply-To header. Shared by the form and the server so a
// form that looks valid is never rejected afterwards.
export const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
