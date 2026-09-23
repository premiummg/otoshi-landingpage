import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import type { RegisterFormData, Participant } from '../src/registerTypes';
import {
  ADULT_LEVELS, KIDS_LEVELS, participantDiscount, participantFullPrice, participantPrice, squareFee,
} from '../src/registerData';
import type { ClassLevel } from '../src/registerData';

const TO = 'judo.otoshi.dieppe@gmail.com';

function levelName(classKey: string, levels: ClassLevel[]) {
  return levels.find(l => l.key === classKey)?.name ?? classKey;
}

function scheduleInfo(p: Participant, levels: ClassLevel[]) {
  return levels.find(l => l.key === p.classKey)?.schedules.find(sc => sc.key === p.scheduleKey);
}

function participantRow(p: Participant, levels: ClassLevel[]): string {
  const sched = scheduleInfo(p, levels);
  const price = participantPrice(p, levels);
  return `
    <tr>
      <td style="padding:4px 8px;border:1px solid #ddd;">${p.firstName} ${p.lastName}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;">${levelName(p.classKey, levels)}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;">${sched?.schedule ?? p.scheduleKey}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;">${p.dob}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;">${p.gender}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;">${p.notes || '-'}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;">$${price.toFixed(2)}${p.parentDiscount ? ' (50% parent discount)' : ''}</td>
    </tr>`;
}

function buildEmailHtml(data: RegisterFormData): string {
  const fullSubtotal =
    data.kids.reduce((sum, p) => sum + participantFullPrice(p, KIDS_LEVELS), 0) +
    data.adults.reduce((sum, p) => sum + participantFullPrice(p, ADULT_LEVELS), 0);
  const discount =
    data.kids.reduce((sum, p) => sum + participantDiscount(p, KIDS_LEVELS), 0) +
    data.adults.reduce((sum, p) => sum + participantDiscount(p, ADULT_LEVELS), 0);
  const subtotal = fullSubtotal - discount;
  const fee = squareFee(subtotal);
  const total = subtotal + fee;

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
        ${data.kids.map(p => participantRow(p, KIDS_LEVELS)).join('')}
        ${data.adults.map(p => participantRow(p, ADULT_LEVELS)).join('')}
      </tbody>
    </table>
    <p>
      Subtotal: $${fullSubtotal.toFixed(2)}<br>
      ${discount > 0 ? `Parent discount (50%): -$${discount.toFixed(2)}<br>` : ''}
      Square fee (est.): $${fee.toFixed(2)}<br>
      <strong>Total: $${total.toFixed(2)}</strong><br>
    </p>
    <p><strong>Payment not collected yet</strong> - Square isn't wired into the site until the club's
      credentials are set up. Follow up with the family directly about payment.</p>
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

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      // Resend's own sandbox sender - works with no domain setup. Swap for
      // a verified otoshi.ca address once the site's real domain is
      // connected to Resend (see README).
      from: 'Otoshi Registrations <onboarding@resend.dev>',
      to: TO,
      replyTo: data.parent.email,
      subject: `New registration - ${data.parent.firstName} ${data.parent.lastName}`,
      html: buildEmailHtml(data),
    });
    if (error) throw error;
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Failed to send registration email:', err);
    res.status(502).json({ error: 'Failed to send registration email.' });
  }
}
