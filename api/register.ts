import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import { Resend } from 'resend';
import type { RegisterFormData, Participant } from '../src/registerTypes.js';
import {
  ADULT_LEVELS, KIDS_LEVELS, kidPrices, participantPrice, registrationTotals,
} from '../src/registerData.js';
import type { ClassLevel } from '../src/registerData.js';

const TO = 'judo.otoshi.dieppe@gmail.com';

function levelName(classKey: string, levels: ClassLevel[]) {
  return levels.find(l => l.key === classKey)?.name ?? classKey;
}

function scheduleInfo(p: Participant, levels: ClassLevel[]) {
  return levels.find(l => l.key === p.classKey)?.schedules.find(sc => sc.key === p.scheduleKey);
}

interface PaymentLink {
  url: string;
  orderId: string;
}

// Prices are recomputed here from registerData.ts, never taken from the
// browser: the client only tells us WHICH class/schedule each person picked,
// so a tampered request can't change what Square charges.
function buildLineItems(data: RegisterFormData) {
  const items: { name: string; cents: number }[] = [];
  const add = (p: Participant, levels: ClassLevel[], price: number, note: string) => {
    const sched = scheduleInfo(p, levels);
    items.push({
      name: `${p.firstName} ${p.lastName} - ${levelName(p.classKey, levels)}${sched ? ` (${sched.schedule})` : ''}${note}`.slice(0, 512),
      cents: Math.round(price * 100),
    });
  };
  const kids = kidPrices(data.kids);
  data.kids.forEach((p, i) => add(p, KIDS_LEVELS, kids[i].price, kids[i].discount > 0 ? ' - 15% sibling discount' : ''));
  data.adults.forEach(p => add(p, ADULT_LEVELS, participantPrice(p, ADULT_LEVELS), p.parentDiscount ? ' - 50% parent discount' : ''));
  return items;
}

// Returns null (and logs) when Square isn't configured or the call fails -
// the registration email still goes out either way, so a payment problem
// never loses a registration; the club just follows up by hand like before.
async function createSquarePaymentLink(
  data: RegisterFormData, reference: string, origin: string,
): Promise<PaymentLink | null> {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!token || !locationId) return null;

  const items = buildLineItems(data);
  if (items.length === 0 || items.some(i => i.cents <= 0)) {
    console.error('Registration has an unknown class/schedule - skipping Square checkout.');
    return null;
  }
  const subtotalCents = items.reduce((sum, i) => sum + i.cents, 0);
  const feeCents = Math.round(registrationTotals(data).fee * 100);

  const base = process.env.SQUARE_ENVIRONMENT === 'sandbox'
    ? 'https://connect.squareupsandbox.com'
    : 'https://connect.squareup.com';
  const localePrefix = data.lang === 'fr' ? '/fr' : '';

  try {
    const res = await fetch(`${base}/v2/online-checkout/payment-links`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Square-Version': '2025-10-16',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idempotency_key: randomUUID(),
        order: {
          location_id: locationId,
          reference_id: reference,
          line_items: [
            ...items.map(i => ({
              name: i.name,
              quantity: '1',
              base_price_money: { amount: i.cents, currency: 'CAD' },
            })),
            {
              name: 'Square processing fee',
              quantity: '1',
              base_price_money: { amount: feeCents, currency: 'CAD' },
            },
          ],
        },
        checkout_options: {
          redirect_url: `${origin}${localePrefix}/register?paid=1`,
          ask_for_shipping_address: false,
        },
        pre_populated_data: { buyer_email: data.parent.email },
      }),
    });
    const body = (await res.json()) as {
      payment_link?: { url: string; order_id: string };
      errors?: unknown;
    };
    if (!res.ok || !body.payment_link) {
      console.error('Square payment link failed:', res.status, JSON.stringify(body.errors));
      return null;
    }
    return { url: body.payment_link.url, orderId: body.payment_link.order_id };
  } catch (err) {
    console.error('Square payment link request threw:', err);
    return null;
  }
}

function participantRow(p: Participant, levels: ClassLevel[], price: number, note: string): string {
  const sched = scheduleInfo(p, levels);
  return `
    <tr>
      <td style="padding:4px 8px;border:1px solid #ddd;">${p.firstName} ${p.lastName}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;">${levelName(p.classKey, levels)}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;">${sched?.schedule ?? p.scheduleKey}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;">${p.dob}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;">${p.gender}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;">${p.notes || '-'}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;">$${price.toFixed(2)}${note}</td>
    </tr>`;
}

function buildEmailHtml(data: RegisterFormData, reference: string, payment: PaymentLink | null): string {
  const { fullSubtotal, siblingDiscount, parentDiscount, fee, total } = registrationTotals(data);
  const kids = kidPrices(data.kids);

  return `
    <h2>New Otoshi registration</h2>
    <h3>Parent / Guardian</h3>
    <p>
      ${data.parent.firstName} ${data.parent.lastName}<br>
      ${data.parent.email} · ${data.parent.phone}<br>
      ${data.parent.address}, ${data.parent.city}, ${data.parent.province} ${data.parent.postalCode}
    </p>
    <h3>Emergency Contact</h3>
    <p>${data.emergency.name} (${data.emergency.relationship}) · ${data.emergency.phone}</p>
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
        ${data.kids.map((p, i) => participantRow(p, KIDS_LEVELS, kids[i].price, kids[i].discount > 0 ? ' (15% sibling discount)' : '')).join('')}
        ${data.adults.map(p => participantRow(p, ADULT_LEVELS, participantPrice(p, ADULT_LEVELS), p.parentDiscount ? ' (50% parent discount)' : '')).join('')}
      </tbody>
    </table>
    <p>
      Subtotal: $${fullSubtotal.toFixed(2)}<br>
      ${siblingDiscount > 0 ? `Sibling discount (15%): -$${siblingDiscount.toFixed(2)}<br>` : ''}
      ${parentDiscount > 0 ? `Parent discount (50%): -$${parentDiscount.toFixed(2)}<br>` : ''}
      Square fee (est.): $${fee.toFixed(2)}<br>
      <strong>Total: $${total.toFixed(2)}</strong><br>
    </p>
    ${payment
      ? `<p><strong>Sent to Square checkout.</strong> Reference <code>${reference}</code> - confirm the payment
         landed in the Square dashboard (order ${payment.orderId}) before treating this family as paid.</p>`
      : `<p><strong>Payment not collected</strong> - Square checkout wasn't available for this registration
         (reference <code>${reference}</code>). Follow up with the family directly about payment.</p>`}
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
  if (!apiKey) {
    // Fail loudly, not silently: a registration that LOOKS submitted but
    // never reached the club is worse than a visible error, since nobody
    // would think to check for it.
    console.error('RESEND_API_KEY is not set - cannot send registration emails.');
    res.status(500).json({ error: 'Email service is not configured yet (RESEND_API_KEY missing).' });
    return;
  }

  const data = req.body as RegisterFormData;
  if (!data?.parent?.email) {
    res.status(400).json({ error: 'Malformed registration payload.' });
    return;
  }

  const reference = randomUUID().slice(0, 8).toUpperCase();
  const host = req.headers['x-forwarded-host'] ?? req.headers.host;
  const origin = `https://${Array.isArray(host) ? host[0] : host}`;
  const payment = await createSquarePaymentLink(data, reference, origin);

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      // otoshi.ca is now verified with Resend, so this can send from the
      // real domain instead of Resend's onboarding@resend.dev sandbox
      // sender - lets it reach any recipient, not just the Resend
      // account's own address. No actual mailbox needs to exist for this
      // address - a "from" address is outbound-only, the same as any
      // no-reply@ sender.
      from: 'Otoshi Registrations <no-reply@otoshi.ca>',
      to: TO,
      replyTo: data.parent.email,
      subject: `New registration - ${data.parent.firstName} ${data.parent.lastName}`,
      html: buildEmailHtml(data, reference, payment),
    });
    if (error) throw error;
    res.status(200).json({ ok: true, paymentUrl: payment?.url });
  } catch (err) {
    console.error('Failed to send registration email:', err);
    res.status(502).json({ error: 'Failed to send registration email.' });
  }
}
