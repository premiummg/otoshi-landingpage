import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import type { RegisterRequest, Participant } from '../src/registerTypes.js';
import {
  ADULT_LEVELS, KIDS_LEVELS, PARENT_PERCENT, SIBLING_PERCENT, adultPrices, kidPrices, registrationTotals,
} from '../src/registerData.js';
import type { ClassLevel } from '../src/registerData.js';
import { CLUB_EMAIL, CLUB_SITE_URL } from '../src/contact.js';
import { createSubscriptionCheckout, describeError, squareConfig } from './_square.js';
import type { SubscriptionCheckout } from './_square.js';
import { esc, parseRegisterRequest } from './_validate.js';
import { EMAIL_LIMIT, IP_LIMIT, clientIp, originAllowed, verifyTurnstile, withinRateLimit } from './_guard.js';

// Where registrations are emailed. REGISTRATION_TO lets a staging deployment
// point somewhere else without a code change.
const TO = process.env.REGISTRATION_TO || CLUB_EMAIL;

function levelName(classKey: string, levels: ClassLevel[]) {
  return levels.find(l => l.key === classKey)?.name ?? classKey;
}

function scheduleInfo(p: Participant, levels: ClassLevel[]) {
  return levels.find(l => l.key === p.classKey)?.schedules.find(sc => sc.key === p.scheduleKey);
}

// A registration is only chargeable if every participant maps to a real
// class + schedule: prices are always recomputed here from registerData.ts,
// never trusted from the browser, so a tampered request can't pick its own
// price. An unknown key prices as $0, which is exactly what this rejects.
function hasValidPrices(data: RegisterRequest): boolean {
  if (data.kids.length + data.adults.length === 0) return false;
  return kidPrices(data.kids).every(k => k.full > 0) && adultPrices(data.adults, data.kids.length > 0).every(a => a.full > 0);
}

// Where Square sends the family after the hosted checkout. SITE_URL pins it;
// on production it is otherwise the fixed public address, never read from
// request headers. Only previews and local development derive it from the
// request (and only from a plausible hostname).
function siteOrigin(req: VercelRequest): string {
  if (process.env.SITE_URL) {
    try {
      return new URL(process.env.SITE_URL).origin;
    } catch {
      console.error('SITE_URL is not a valid URL - ignoring it.');
    }
  }
  if (process.env.VERCEL_ENV === 'production') return CLUB_SITE_URL;
  const host = req.headers['x-forwarded-host'] ?? req.headers.host;
  const hostName = Array.isArray(host) ? host[0] : host;
  if (!hostName || !/^[a-z0-9.-]+(:\d+)?$/i.test(hostName)) return CLUB_SITE_URL;
  return `${hostName.startsWith('localhost') ? 'http' : 'https'}://${hostName}`;
}

// "Ana+x@gmail.com" and "ana@gmail.com" are the same mailbox: key the limiter
// on the normalised form so a +tag can't be used to dodge it.
const limiterEmail = (email: string) => email.toLowerCase().replace(/\+[^@]*@/, '@');

function participantRow(p: Participant, levels: ClassLevel[], price: number, note: string): string {
  const sched = scheduleInfo(p, levels);
  const cell = 'padding:4px 8px;border:1px solid #ddd;';
  return `
    <tr>
      <td style="${cell}">${esc(p.firstName)} ${esc(p.lastName)}</td>
      <td style="${cell}">${esc(levelName(p.classKey, levels))}</td>
      <td style="${cell}">${esc(sched?.schedule ?? p.scheduleKey)}</td>
      <td style="${cell}">${esc(p.dob)}</td>
      <td style="${cell}">${esc(p.gender)}</td>
      <td style="${cell}">${esc(p.notes || '-')}</td>
      <td style="${cell}">$${price.toFixed(2)}${note}</td>
    </tr>`;
}

// Every user-supplied value below goes through esc(): this email is read in
// the club's mail client, where a name like `<a href=...>` would otherwise
// become a live link inside a message the club trusts.
function buildEmailHtml(
  data: RegisterRequest, reference: string, squareOn: boolean, checkout: SubscriptionCheckout | null,
): string {
  const { fullSubtotal, siblingDiscount, parentDiscount, fee, total } = registrationTotals(data);
  const kids = kidPrices(data.kids);
  const adults = adultPrices(data.adults, data.kids.length > 0);
  const { parent, emergency } = data;

  const payment = checkout
    ? `<p><strong>Awaiting payment on Square.</strong> The family was sent to Square's checkout for a monthly subscription of
       $${total.toFixed(2)}. Reference <code>${esc(reference)}</code> (Square order <code>${esc(checkout.orderId)}</code>).
       This email goes out BEFORE they pay, so a registration here is not proof of payment: check that a subscription
       for this family appears in the Square Dashboard (Customers &rarr; Subscriptions) and that the first payment went
       through. To cancel, cancel that subscription once the family emails.</p>`
    : squareOn
      ? `<p><strong>Payment not collected</strong> - Square's checkout could not be created for this registration
         (reference <code>${esc(reference)}</code>; see the function logs). Follow up with the family directly about payment.</p>`
      : `<p><strong>Payment not collected</strong> - Square isn't set up on the site yet
         (reference <code>${esc(reference)}</code>). Follow up with the family directly about payment.</p>`;

  return `
    <h2>New Otoshi registration</h2>
    <h3>Parent / Guardian</h3>
    <p>
      ${esc(parent.firstName)} ${esc(parent.lastName)}<br>
      ${esc(parent.email)} · ${esc(parent.phone)}<br>
      ${esc(parent.address)}, ${esc(parent.city)}, ${esc(parent.province)} ${esc(parent.postalCode)}
    </p>
    <h3>Emergency Contact</h3>
    <p>${esc(emergency.name)} (${esc(emergency.relationship)}) · ${esc(emergency.phone)}</p>
    <h3>Participants</h3>
    <table style="border-collapse:collapse;font-family:sans-serif;font-size:13px;">
      <thead>
        <tr>
          <th style="padding:4px 8px;border:1px solid #ddd;text-align:left;">Name</th>
          <th style="padding:4px 8px;border:1px solid #ddd;text-align:left;">Class</th>
          <th style="padding:4px 8px;border:1px solid #ddd;text-align:left;">Schedule</th>
          <th style="padding:4px 8px;border:1px solid #ddd;text-align:left;">DOB</th>
          <th style="padding:4px 8px;border:1px solid #ddd;text-align:left;">Gender</th>
          <th style="padding:4px 8px;border:1px solid #ddd;text-align:left;">Notes</th>
          <th style="padding:4px 8px;border:1px solid #ddd;text-align:left;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${data.kids.map((p, i) => participantRow(p, KIDS_LEVELS, kids[i].price, kids[i].discount > 0 ? ` (${SIBLING_PERCENT}% sibling discount)` : '')).join('')}
        ${data.adults.map((p, i) => participantRow(p, ADULT_LEVELS, adults[i].price, adults[i].discount > 0 ? ` (${PARENT_PERCENT}% parent discount)` : '')).join('')}
      </tbody>
    </table>
    <p>
      Subtotal: $${fullSubtotal.toFixed(2)}<br>
      ${siblingDiscount > 0 ? `Sibling discount (${SIBLING_PERCENT}%): -$${siblingDiscount.toFixed(2)}<br>` : ''}
      ${parentDiscount > 0 ? `Parent discount (${PARENT_PERCENT}%): -$${parentDiscount.toFixed(2)}<br>` : ''}
      Square fee (est.): $${fee.toFixed(2)}<br>
      <strong>Monthly total: $${total.toFixed(2)}</strong><br>
    </p>
    ${payment}
    <h3>Agreements</h3>
    <p>Judo NB waiver: ${data.agreedJudoNb ? 'Agreed' : 'NOT agreed'}<br>
       Club Otoshi waiver: ${data.agreedClub ? 'Agreed' : 'NOT agreed'}</p>
  `;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  // Local-only escape hatch: Vercel always sets VERCEL, so on a real
  // deployment a missing key still fails loudly below. On a dev machine
  // without a Resend key the email is printed to the terminal instead, so
  // the rest of the flow (Square) can be tested without mailing the club.
  const localDryRun = !apiKey && !process.env.VERCEL;
  if (!apiKey && !localDryRun) {
    // Fail loudly, not silently: a registration that LOOKS submitted but
    // never reached the club is worse than a visible error, since nobody
    // would think to check for it.
    console.error('RESEND_API_KEY is not set - cannot send registration emails.');
    res.status(500).json({ error: 'Email service is not configured yet (RESEND_API_KEY missing).' });
    return;
  }

  // 1. Shape first: nothing below may run on an unvalidated body.
  const parsed = parseRegisterRequest(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const data = parsed.data;
  if (!hasValidPrices(data)) {
    res.status(400).json({ error: 'invalid_participants' });
    return;
  }

  // 2. Abuse guards, before any Square call or email.
  const ip = clientIp(req);
  if (!originAllowed(req)) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  // IP first (counts every request, so bots that never pass the captcha are
  // throttled), then the captcha, and only THEN the per-email limit - so a
  // stranger typing someone else's address can't burn that person's quota.
  if (!withinRateLimit(`ip:${ip}`, IP_LIMIT)) {
    res.status(429).json({ error: 'too_many_requests' });
    return;
  }
  if (!(await verifyTurnstile(data.turnstileToken, ip))) {
    res.status(403).json({ error: 'captcha_failed' });
    return;
  }
  if (!withinRateLimit(`email:${limiterEmail(data.parent.email)}`, EMAIL_LIMIT)) {
    res.status(429).json({ error: 'too_many_requests' });
    return;
  }

  // The submission id doubles as the human-readable reference in the email.
  const reference = data.submissionId.slice(0, 8).toUpperCase();
  const square = squareConfig();
  let checkout: SubscriptionCheckout | null = null;

  if (square) {
    try {
      checkout = await createSubscriptionCheckout(square, {
        monthlyCents: registrationTotals(data).totalCents,
        reference,
        email: data.parent.email,
        redirectUrl: `${siteOrigin(req)}${data.lang === 'fr' ? '/fr' : ''}/register?paid=1`,
      });
    } catch (err) {
      // Not fatal: the registration must still reach the club. The email
      // says payment was not collected and the family sees the "club will
      // follow up" message instead of being sent to a payment page.
      console.error(`Square checkout failed (ref ${reference}): ${describeError(err)}`);
    }
  }

  const html = buildEmailHtml(data, reference, !!square, checkout);

  if (localDryRun) {
    console.log(`[dry run] RESEND_API_KEY not set - registration email NOT sent. Square checkout: ${checkout?.url ?? 'none'}`);
    res.status(200).json({ ok: true, paymentUrl: checkout?.url });
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      // otoshi.ca is verified with Resend, so this can send from the real
      // domain instead of Resend's onboarding@resend.dev sandbox sender -
      // lets it reach any recipient. No actual mailbox needs to exist for
      // this address - a "from" address is outbound-only, like any no-reply@.
      from: 'Otoshi Registrations <no-reply@otoshi.ca>',
      to: TO,
      replyTo: data.parent.email,
      // Names are length-capped and validated, but strip line breaks anyway:
      // a header value must never be able to carry one.
      subject: `New registration - ${data.parent.firstName} ${data.parent.lastName}`.replace(/[\r\n]+/g, ' '),
      html,
    });
    if (error) throw error;
    res.status(200).json({ ok: true, paymentUrl: checkout?.url });
  } catch (err) {
    // Nothing has been charged at this point (the family hasn't reached the
    // payment page), so failing loudly and letting them retry is safe.
    console.error(`Failed to send registration email (ref ${reference}): ${describeError(err)}`);
    res.status(502).json({ error: 'email_failed' });
  }
}
