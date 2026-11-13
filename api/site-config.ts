import type { VercelRequest, VercelResponse } from '@vercel/node';
import { squareConfig } from './_square.js';
import { turnstileActive } from './_guard.js';

// What the browser needs to know about this deployment: whether Square
// payments are switched on (so it can describe the payment step) and the
// public Turnstile *site* key if the captcha is configured. No secret is
// ever returned. Served at runtime so switching sandbox/production is an
// env-var change rather than a rebuild. Cached for one minute only: a longer
// (or stale-while-revalidate) cache would keep telling browsers the old
// captcha state after a deploy, and a stale key locks families out.
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'public, s-maxage=60');
  res.status(200).json({
    squareEnabled: squareConfig() !== null,
    // Only when the secret is set too: see turnstileActive().
    turnstileSiteKey: turnstileActive() ? process.env.TURNSTILE_SITE_KEY : undefined,
  });
}
