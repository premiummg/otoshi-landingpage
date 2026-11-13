import { MAX_ADULTS, MAX_KIDS } from '../src/registerData.js';
import { EMAIL_PATTERN, LIMITS } from '../src/formLimits.js';
import type { Participant, RegisterRequest } from '../src/registerTypes.js';

// `req.body` is attacker-controlled JSON, so nothing is trusted until it has
// been rebuilt here field by field. The result contains ONLY known fields
// (trimmed, length-capped), so junk in the request never reaches Square, the
// email or the price maths.

export type ParseResult = { ok: true; data: RegisterRequest } | { ok: false; error: string };

const EMAIL_RE = EMAIL_PATTERN;
// Loose on purpose (the form stores E.164 like "+15065551234", but a human
// might paste "(506) 555-1234"): digits and common separators only.
const PHONE_RE = /^\+?[0-9 ()\-.]{7,30}$/;
const DOB_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

// A trimmed string within [min, max] characters, else null.
function text(v: unknown, max: number, min = 1): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length >= min && t.length <= max ? t : null;
}

// "2015-99-99" matches the yyyy-MM-dd shape but is not a date, and a birth
// date can't be in the future or before 1900.
function isRealPastDate(value: string): boolean {
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const real = date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  return real && y >= 1900 && date.getTime() <= Date.now();
}

function participant(v: unknown): Participant | null {
  if (!isObject(v)) return null;
  const classKey = text(v.classKey, 40);
  const scheduleKey = text(v.scheduleKey, 60);
  const firstName = text(v.firstName, LIMITS.name);
  const lastName = text(v.lastName, LIMITS.name);
  const dob = text(v.dob, 10, 10);
  const notes = v.notes === undefined || v.notes === '' ? '' : text(v.notes, LIMITS.notes);
  if (!classKey || !scheduleKey || !firstName || !lastName || !dob || !DOB_RE.test(dob) || !isRealPastDate(dob) || notes === null) return null;
  if (v.gender !== 'male' && v.gender !== 'female') return null;
  return { classKey, scheduleKey, firstName, lastName, dob, gender: v.gender, notes };
}

function list(v: unknown, max: number): Participant[] | null {
  if (!Array.isArray(v) || v.length > max) return null;
  const out: Participant[] = [];
  for (const item of v) {
    const p = participant(item);
    if (!p) return null;
    out.push(p);
  }
  return out;
}

export function parseRegisterRequest(body: unknown): ParseResult {
  const bad = (field: string): ParseResult => ({ ok: false, error: `invalid_${field}` });
  if (!isObject(body)) return bad('body');

  const p = body.parent;
  const e = body.emergency;
  if (!isObject(p)) return bad('parent');
  if (!isObject(e)) return bad('emergency');

  const email = text(p.email, LIMITS.email);
  const phone = text(p.phone, LIMITS.phone);
  const ePhone = text(e.phone, LIMITS.phone);
  const parent = {
    firstName: text(p.firstName, LIMITS.name),
    lastName: text(p.lastName, LIMITS.name),
    email,
    phone,
    address: text(p.address, LIMITS.address),
    city: text(p.city, LIMITS.city),
    province: text(p.province, LIMITS.province),
    postalCode: text(p.postalCode, LIMITS.postalCode),
  };
  if (Object.values(parent).some(v => v === null)) return bad('parent');
  if (!EMAIL_RE.test(email!) || !PHONE_RE.test(phone!)) return bad('parent');

  const emergency = { name: text(e.name, LIMITS.emergencyName), relationship: text(e.relationship, LIMITS.relationship), phone: ePhone };
  if (Object.values(emergency).some(v => v === null) || !PHONE_RE.test(ePhone!)) return bad('emergency');

  // Absent arrays mean "none"; present-but-malformed ones are rejected.
  const kids = list(body.kids ?? [], MAX_KIDS);
  const adults = list(body.adults ?? [], MAX_ADULTS);
  if (!kids) return bad('kids');
  if (!adults) return bad('adults');
  if (kids.length + adults.length === 0) return bad('participants');

  // Both waivers are mandatory. The form enforces it, so this only stops a
  // hand-built request from skipping them.
  if (body.agreedJudoNb !== true || body.agreedClub !== true) return bad('agreements');

  const submissionId = typeof body.submissionId === 'string' && UUID_RE.test(body.submissionId) ? body.submissionId : null;
  if (!submissionId) return bad('submission');

  const turnstileToken = body.turnstileToken === undefined ? undefined : text(body.turnstileToken, 4096);
  if (turnstileToken === null) return bad('captcha');

  return {
    ok: true,
    data: {
      parent: parent as RegisterRequest['parent'],
      emergency: emergency as RegisterRequest['emergency'],
      kidsCount: kids.length,
      adultsCount: adults.length,
      kids,
      adults,
      agreedJudoNb: true,
      agreedClub: true,
      submissionId,
      turnstileToken,
      lang: body.lang === 'fr' ? 'fr' : 'en',
    },
  };
}

// Everything user-typed that lands in the club's HTML email goes through
// this, so a name like `<a href=evil>` shows as text instead of a live link.
export function esc(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
