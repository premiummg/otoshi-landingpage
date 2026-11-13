import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { esc, parseRegisterRequest } from '../api/_validate';
import { isSquareUrl } from '../api/_square';

// Resend is replaced for every test: nothing here can send a real email.
const send = vi.hoisted(() => vi.fn());
vi.mock('resend', () => ({
  Resend: class {
    emails = { send };
  },
}));

type Json = Record<string, unknown>;

// A request the real form would send.
function validBody(overrides: Json = {}): Json {
  return {
    parent: {
      firstName: 'Ana', lastName: 'Roy', email: 'ana@example.com', phone: '+15065550100',
      address: '1 Main St', city: 'Dieppe', province: 'NB', postalCode: 'E1A 1A1',
    },
    emergency: { name: 'Luc Roy', relationship: 'Father', phone: '+15065550101' },
    kids: [{ classKey: 'beginner', scheduleKey: 'beginner-1', firstName: 'Max', lastName: 'Roy', dob: '2015-03-02', gender: 'male', notes: '' }],
    adults: [],
    agreedJudoNb: true,
    agreedClub: true,
    submissionId: '3f2b9c1e-8a44-4c58-9d0e-1b7a6c5d4e3f',
    ...overrides,
  };
}
const kid = () => (validBody().kids as Json[])[0];
const parent = (over: Json = {}) => ({ ...(validBody().parent as Json), ...over });

function fakeRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    status(code: number) { res.statusCode = code; return res; },
    json(b: unknown) { res.body = b; return res; },
    setHeader(k: string, v: string) { res.headers[k] = v; return res; },
  };
  return res;
}

// A fresh copy of the handler (and of every module-level cache/limiter it
// holds) per call, so no test can depend on another one having run first.
async function freshHandler() {
  vi.resetModules();
  return (await import('../api/register')).default;
}

async function call(method: string, body: unknown, headers: Record<string, string> = {}) {
  const handler = await freshHandler();
  return callWith(handler, method, body, headers);
}
async function callWith(handler: Awaited<ReturnType<typeof freshHandler>>, method: string, body: unknown, headers: Record<string, string> = {}) {
  const res = fakeRes();
  await handler({ method, body, headers, socket: {} } as never, res as never);
  return res;
}

const ENV_KEYS = [
  'RESEND_API_KEY', 'VERCEL', 'VERCEL_ENV', 'SITE_URL', 'REGISTRATION_TO',
  'SQUARE_ACCESS_TOKEN', 'SQUARE_LOCATION_ID', 'SQUARE_ENVIRONMENT',
  'TURNSTILE_SECRET_KEY', 'TURNSTILE_SITE_KEY',
];
const saved = { ...process.env };

beforeEach(() => {
  for (const k of ENV_KEYS) delete process.env[k];
  send.mockReset();
  send.mockResolvedValue({ error: null });
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  process.env = { ...saved };
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ───────────────────────── input validation ─────────────────────────

describe('parseRegisterRequest', () => {
  it('accepts a normal registration and keeps only known fields', () => {
    const r = parseRegisterRequest({ ...validBody(), evil: '<script>', parent: parent({ extra: 1 }) });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).not.toHaveProperty('evil');
      expect(r.data.parent).not.toHaveProperty('extra');
      expect(r.data.kidsCount).toBe(1);
    }
  });

  it.each([
    ['not an object', 'hello'],
    ['kids is not an array', validBody({ kids: 'x' })],
    ['too many kids', validBody({ kids: Array(6).fill(kid()) })],
    ['no participants', validBody({ kids: [], adults: [] })],
    ['bad email', validBody({ parent: parent({ email: 'nope' }) })],
    ['email with a comma (header injection shape)', validBody({ parent: parent({ email: 'a@b.co,evil@x.co' }) })],
    ['email with angle brackets', validBody({ parent: parent({ email: '<a@b.co>' }) })],
    ['missing waiver', validBody({ agreedClub: false })],
    ['bad gender', validBody({ kids: [{ ...kid(), gender: 'x' }] })],
    ['notes too long', validBody({ kids: [{ ...kid(), notes: 'a'.repeat(1001) }] })],
    ['name too long', validBody({ parent: parent({ firstName: 'a'.repeat(81) }) })],
    ['no submission id', validBody({ submissionId: 'abc' })],
    ['impossible date', validBody({ kids: [{ ...kid(), dob: '2015-99-99' }] })],
    ['Feb 30th', validBody({ kids: [{ ...kid(), dob: '2015-02-30' }] })],
    ['future date', validBody({ kids: [{ ...kid(), dob: '2999-01-01' }] })],
    ['before 1900', validBody({ kids: [{ ...kid(), dob: '1850-01-01' }] })],
  ])('rejects %s', (_label, body) => {
    expect(parseRegisterRequest(body).ok).toBe(false);
  });

  it('accepts a leap day and a normal adult birth date', () => {
    expect(parseRegisterRequest(validBody({ kids: [{ ...kid(), dob: '2016-02-29' }] })).ok).toBe(true);
    expect(parseRegisterRequest(validBody({ kids: [{ ...kid(), dob: '1985-07-14' }] })).ok).toBe(true);
  });

  it('treats absent kids/adults as empty rather than crashing', () => {
    const { kids: _kids, ...rest } = validBody({ adults: [{ ...kid(), classKey: 'adult', scheduleKey: 'adult-1' }] });
    void _kids;
    expect(parseRegisterRequest(rest).ok).toBe(true);
  });
});

describe('esc', () => {
  it('neutralises HTML so names cannot become links', () => {
    expect(esc('<a href="x">&\'')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
  });
});

describe('isSquareUrl', () => {
  it.each([
    ['https://square.link/u/abc', true],
    ['https://sandbox.square.link/u/abc', true],
    ['https://checkout.square.site/pay/abc', false], // .site is not a trusted host here
    ['https://connect.squareup.com/x', true],
    ['https://connect.squareupsandbox.com/x', true],
    ['http://square.link/u/abc', false],
    ['https://evilsquare.link/u/abc', false],
    ['https://square.link.evil.com/u', false],
    ['javascript:alert(1)', false],
    ['not a url', false],
  ])('%s -> %s', (url, expected) => {
    expect(isSquareUrl(url)).toBe(expected);
  });
});

// ───────────────────────── endpoint, no Square ─────────────────────────

describe('POST /api/register (no Square, no Resend: local dry run)', () => {
  it('405 for anything but POST', async () => {
    expect((await call('GET', undefined)).statusCode).toBe(405);
  });

  it('400 for a missing or malformed body, never a crash', async () => {
    expect((await call('POST', undefined)).statusCode).toBe(400);
    expect((await call('POST', { parent: { email: 'a@b.co' } })).statusCode).toBe(400);
    expect((await call('POST', validBody({ kids: 'x' }))).statusCode).toBe(400);
  });

  it('400 for a class or schedule that does not exist (price would be $0)', async () => {
    const res = await call('POST', validBody({ kids: [{ ...kid(), scheduleKey: 'made-up' }] }));
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'invalid_participants' });
  });

  it('200 for a valid registration, with no payment link', async () => {
    const res = await call('POST', validBody());
    expect(res.statusCode).toBe(200);
    expect(res.body).toStrictEqual({ ok: true, paymentUrl: undefined });
    expect(send).not.toHaveBeenCalled(); // dry run: nothing emailed
  });

  it('fails loudly on a real deployment without the Resend key', async () => {
    process.env.VERCEL = '1';
    expect((await call('POST', validBody())).statusCode).toBe(500);
  });
});

// ───────────────────────── email ─────────────────────────

describe('the club email', () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = 're_test';
  });

  it('is sent once with the expected envelope', async () => {
    const res = await call('POST', validBody());
    expect(res.statusCode).toBe(200);
    expect(send).toHaveBeenCalledTimes(1);
    const mail = send.mock.calls[0][0];
    expect(mail.to).toBe('judo.otoshi.dieppe@gmail.com');
    expect(mail.replyTo).toBe('ana@example.com');
    expect(mail.from).toContain('no-reply@otoshi.ca');
    expect(mail.subject).toBe('New registration - Ana Roy');
    expect(mail.html).toContain('Monthly total: $82.70');
  });

  it('REGISTRATION_TO redirects it', async () => {
    process.env.REGISTRATION_TO = 'staging@example.com';
    await call('POST', validBody());
    expect(send.mock.calls[0][0].to).toBe('staging@example.com');
  });

  it('shows user-typed HTML as text, never as live markup', async () => {
    await call('POST', validBody({
      parent: parent({ firstName: '<img src=x onerror=alert(1)>', address: '<a href="https://evil.example">pay here</a>' }),
      kids: [{ ...kid(), notes: '<script>steal()</script>' }],
    }));
    const html: string = send.mock.calls[0][0].html;
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<a href="https://evil.example"');
    expect(html).not.toContain('<script>steal');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&lt;script&gt;steal()&lt;/script&gt;');
  });

  it('answers 502 when Resend fails and nothing was charged', async () => {
    send.mockResolvedValue({ error: { message: 'boom' } });
    const res = await call('POST', validBody());
    expect(res.statusCode).toBe(502);
    expect(res.body).toEqual({ error: 'email_failed' });
  });
});

// ───────────────────────── abuse guards ─────────────────────────

describe('abuse guards (on a real deployment)', () => {
  beforeEach(() => {
    process.env.VERCEL = '1';
    process.env.RESEND_API_KEY = 're_test';
  });
  const fromIp = (ip: string, extra: Record<string, string> = {}) => ({ 'x-vercel-forwarded-for': ip, ...extra });

  describe('origin check (production only)', () => {
    beforeEach(() => { process.env.VERCEL_ENV = 'production'; });

    it('rejects a POST with no Origin', async () => {
      const res = await call('POST', validBody(), fromIp('1.1.1.1', { host: 'otoshi.ca' }));
      expect(res.statusCode).toBe(403);
      expect(res.body).toEqual({ error: 'forbidden' });
    });
    it('rejects another site', async () => {
      const res = await call('POST', validBody(), fromIp('1.1.1.1', { host: 'otoshi.ca', origin: 'https://evil.example' }));
      expect(res.statusCode).toBe(403);
    });
    it('accepts the site itself, with or without www', async () => {
      expect((await call('POST', validBody(), fromIp('1.1.1.1', { host: 'otoshi.ca', origin: 'https://otoshi.ca' }))).statusCode).toBe(200);
      expect((await call('POST', validBody(), fromIp('1.1.1.2', { host: 'otoshi.ca', origin: 'https://www.otoshi.ca' }))).statusCode).toBe(200);
    });
    it('is not enforced on previews', async () => {
      process.env.VERCEL_ENV = 'preview';
      expect((await call('POST', validBody(), fromIp('1.1.1.1'))).statusCode).toBe(200);
    });
  });

  describe('rate limits', () => {
    it('blocks the 9th request from one IP in 10 minutes', async () => {
      const handler = await freshHandler();
      for (let i = 0; i < 8; i++) {
        const r = await callWith(handler, 'POST', validBody({ parent: parent({ email: `p${i}@example.com` }) }), fromIp('9.9.9.9'));
        expect(r.statusCode).toBe(200);
      }
      const blocked = await callWith(handler, 'POST', validBody({ parent: parent({ email: 'p9@example.com' }) }), fromIp('9.9.9.9'));
      expect(blocked.statusCode).toBe(429);
      expect(blocked.body).toEqual({ error: 'too_many_requests' });
      // another IP is unaffected
      expect((await callWith(handler, 'POST', validBody({ parent: parent({ email: 'p9@example.com' }) }), fromIp('8.8.8.8'))).statusCode).toBe(200);
    });

    it('blocks the 4th request for one mailbox, even with +tags and other IPs', async () => {
      const handler = await freshHandler();
      const emails = ['ana@example.com', 'Ana+one@example.com', 'ana+two@example.com'];
      for (const [i, email] of emails.entries()) {
        expect((await callWith(handler, 'POST', validBody({ parent: parent({ email }) }), fromIp(`2.2.2.${i}`))).statusCode).toBe(200);
      }
      const blocked = await callWith(handler, 'POST', validBody({ parent: parent({ email: 'ana+three@example.com' }) }), fromIp('2.2.2.99'));
      expect(blocked.statusCode).toBe(429);
    });
  });

  describe('Turnstile captcha', () => {
    function turnstile(result: 'ok' | 'fail' | 'throw') {
      const fetchMock = vi.fn(async () => {
        if (result === 'throw') throw new Error('network down');
        return { ok: true, status: 200, json: async () => ({ success: result === 'ok' }) };
      });
      vi.stubGlobal('fetch', fetchMock);
      return fetchMock;
    }
    beforeEach(() => {
      process.env.TURNSTILE_SECRET_KEY = 'secret';
      process.env.TURNSTILE_SITE_KEY = 'site';
    });

    it('refuses a request with no token', async () => {
      turnstile('ok');
      const res = await call('POST', validBody(), fromIp('3.3.3.3'));
      expect(res.statusCode).toBe(403);
      expect(res.body).toEqual({ error: 'captcha_failed' });
    });
    it('accepts a token Cloudflare approves, and sends its secret + the IP', async () => {
      const fetchMock = turnstile('ok');
      const res = await call('POST', validBody({ turnstileToken: 'good' }), fromIp('3.3.3.3'));
      expect(res.statusCode).toBe(200);
      const [url, init] = fetchMock.mock.calls[0] as unknown as [string, { body: URLSearchParams }];
      expect(url).toContain('challenges.cloudflare.com');
      expect(init.body.get('secret')).toBe('secret');
      expect(init.body.get('response')).toBe('good');
      expect(init.body.get('remoteip')).toBe('3.3.3.3');
    });
    it('refuses a token Cloudflare rejects', async () => {
      turnstile('fail');
      expect((await call('POST', validBody({ turnstileToken: 'bad' }), fromIp('3.3.3.3'))).statusCode).toBe(403);
    });
    it('fails closed when Cloudflare cannot be reached', async () => {
      turnstile('throw');
      expect((await call('POST', validBody({ turnstileToken: 'x' }), fromIp('3.3.3.3'))).statusCode).toBe(403);
    });
    it('a stranger typing a victim\'s email cannot burn the victim\'s quota', async () => {
      const handler = await freshHandler();
      turnstile('fail');
      for (let i = 0; i < 5; i++) {
        const r = await callWith(handler, 'POST', validBody(), fromIp(`4.4.4.${i}`));
        expect(r.statusCode).toBe(403); // blocked by the captcha, not counted against the email
      }
      turnstile('ok');
      const real = await callWith(handler, 'POST', validBody({ turnstileToken: 'good' }), fromIp('5.5.5.5'));
      expect(real.statusCode).toBe(200);
    });
    it('is OFF (not a lockout) when only one of the two keys is set', async () => {
      delete process.env.TURNSTILE_SITE_KEY;
      const res = await call('POST', validBody(), fromIp('6.6.6.6'));
      expect(res.statusCode).toBe(200);
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('half-configured'));
    });
  });
});

// ───────────────────────── Square-hosted checkout ─────────────────────────

describe('POST /api/register with Square configured', () => {
  beforeEach(() => {
    process.env.SQUARE_ACCESS_TOKEN = 'test-token';
    process.env.SQUARE_LOCATION_ID = 'LTEST';
    process.env.SQUARE_ENVIRONMENT = 'sandbox';
  });

  const variation = (id: string, cents: number, extra: Json = {}) => ({
    id,
    ...extra,
    subscription_plan_variation_data: { phases: [{ cadence: 'MONTHLY', pricing: { price_money: { amount: cents } } }] },
  });

  // Plays Square. `plans` is what /catalog/list returns; `linkFailures` makes
  // the first N payment-link calls fail with a 400.
  function fakeSquare(opts: { plans?: Json[]; linkFailures?: number; linkUrl?: string; linkStatus?: number } = {}) {
    const calls: { url: string; body: any }[] = [];
    let linkAttempts = 0;
    const plans = opts.plans ?? [{ id: 'PLAN1', subscription_plan_data: { name: 'Otoshi Monthly Tuition', subscription_plan_variations: [] } }];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { body?: string }) => {
      const body = init?.body ? JSON.parse(init.body) : undefined;
      calls.push({ url, body });
      const ok = (json: unknown) => ({ ok: true, status: 200, json: async () => json });
      if (url.includes('/v2/catalog/list')) return ok({ objects: plans });
      if (url.includes('/v2/catalog/object')) {
        return ok({
          catalog_object: body.object.type === 'SUBSCRIPTION_PLAN'
            ? { id: 'NEWPLAN', subscription_plan_data: { subscription_plan_variations: [{ id: 'NEWVAR' }] } }
            : { id: 'VAR1' },
        });
      }
      if (url.includes('/v2/online-checkout/payment-links')) {
        linkAttempts++;
        if (linkAttempts <= (opts.linkFailures ?? 0) || opts.linkStatus) {
          return { ok: false, status: opts.linkStatus ?? 400, json: async () => ({ errors: [{ code: 'INVALID_VALUE', detail: 'a@b.co is bad' }] }) };
        }
        return ok({ payment_link: { url: opts.linkUrl ?? 'https://sandbox.square.link/u/ABC', order_id: 'ORDER1' } });
      }
      throw new Error(`unexpected call ${url}`);
    }));
    return calls;
  }
  const catalogWrites = (calls: { url: string; body: any }[]) => calls.filter(c => c.url.includes('/v2/catalog/object'));
  const linkCall = (calls: { url: string; body: any }[]) => calls.find(c => c.url.includes('payment-links'))!.body;

  it('adds a variation at the exact monthly total and returns the Square link', async () => {
    const calls = fakeSquare();
    const res = await call('POST', validBody());
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, paymentUrl: 'https://sandbox.square.link/u/ABC' });

    // Beginner $80 + 3% + $0.30 = $82.70
    const written = catalogWrites(calls)[0].body.object;
    expect(written.type).toBe('SUBSCRIPTION_PLAN_VARIATION');
    expect(written.subscription_plan_variation_data.subscription_plan_id).toBe('PLAN1');
    expect(written.subscription_plan_variation_data.phases[0].pricing.price_money.amount).toBe(8270);
    expect(linkCall(calls).quick_pay.price_money.amount).toBe(8270);
    expect(linkCall(calls).checkout_options.subscription_plan_id).toBe('VAR1');
  });

  it('reuses a variation that already has this price (no catalog write)', async () => {
    const calls = fakeSquare({ plans: [{ id: 'PLAN1', subscription_plan_data: { name: 'Otoshi Monthly Tuition', subscription_plan_variations: [variation('EXISTING', 8270)] } }] });
    await call('POST', validBody());
    expect(catalogWrites(calls)).toHaveLength(0);
    expect(linkCall(calls).checkout_options.subscription_plan_id).toBe('EXISTING');
  });

  it('ignores a deleted variation and variations at other prices', async () => {
    const calls = fakeSquare({ plans: [{ id: 'PLAN1', subscription_plan_data: { name: 'Otoshi Monthly Tuition', subscription_plan_variations: [variation('DEAD', 8270, { is_deleted: true }), variation('OTHER', 5180)] } }] });
    await call('POST', validBody());
    expect(catalogWrites(calls)).toHaveLength(1);
    expect(linkCall(calls).checkout_options.subscription_plan_id).toBe('VAR1');
  });

  it('creates the plan itself the very first time', async () => {
    const calls = fakeSquare({ plans: [] });
    await call('POST', validBody());
    const written = catalogWrites(calls)[0].body.object;
    expect(written.type).toBe('SUBSCRIPTION_PLAN');
    expect(written.subscription_plan_data.name).toBe('Otoshi Monthly Tuition');
    expect(linkCall(calls).checkout_options.subscription_plan_id).toBe('NEWVAR');
  });

  it('does not trust a plan with a different name', async () => {
    const calls = fakeSquare({ plans: [{ id: 'OTHER', subscription_plan_data: { name: 'Someone else', subscription_plan_variations: [variation('X', 8270)] } }] });
    await call('POST', validBody());
    expect(catalogWrites(calls)[0].body.object.type).toBe('SUBSCRIPTION_PLAN');
  });

  it('never trusts a price from the browser', async () => {
    const calls = fakeSquare();
    await call('POST', validBody({ total: 1, monthlyCents: 100, price: 1 }));
    expect(linkCall(calls).quick_pay.price_money.amount).toBe(8270);
  });

  it('retries once with a fresh lookup when the first link attempt is rejected', async () => {
    const calls = fakeSquare({ linkFailures: 1 });
    const res = await call('POST', validBody());
    expect(res.body).toEqual({ ok: true, paymentUrl: 'https://sandbox.square.link/u/ABC' });
    expect(calls.filter(c => c.url.includes('payment-links'))).toHaveLength(2);
    expect(calls.filter(c => c.url.includes('/v2/catalog/list'))).toHaveLength(2); // looked the variation up again
  });

  it('still accepts the registration when Square keeps failing (no lost registration)', async () => {
    fakeSquare({ linkStatus: 400 });
    const res = await call('POST', validBody());
    expect(res.statusCode).toBe(200);
    expect(res.body).toStrictEqual({ ok: true, paymentUrl: undefined });
  });

  it('never hands the browser a URL that is not Square\'s', async () => {
    fakeSquare({ linkUrl: 'https://evil.example/pay' });
    const res = await call('POST', validBody());
    expect(res.statusCode).toBe(200);
    expect(res.body).toStrictEqual({ ok: true, paymentUrl: undefined });
  });

  it('tolerates "Sandbox " with odd case and spaces (stays off the production host)', async () => {
    process.env.SQUARE_ENVIRONMENT = ' Sandbox ';
    const calls = fakeSquare();
    await call('POST', validBody());
    expect(calls[0].url).toContain('connect.squareupsandbox.com');
  });

  it('is email-only when only one Square secret is set', async () => {
    delete process.env.SQUARE_LOCATION_ID;
    const calls = fakeSquare();
    const res = await call('POST', validBody());
    expect(calls).toHaveLength(0);
    expect(res.body).toStrictEqual({ ok: true, paymentUrl: undefined });
  });

  describe('where Square sends the family back to', () => {
    it('SITE_URL wins, with the language prefix', async () => {
      process.env.SITE_URL = 'https://otoshi.test/some/path';
      const calls = fakeSquare();
      await call('POST', validBody({ lang: 'fr' }));
      expect(linkCall(calls).checkout_options.redirect_url).toBe('https://otoshi.test/fr/register?paid=1');
    });
    it('on production it is the fixed site address, never the request headers', async () => {
      process.env.VERCEL_ENV = 'production';
      const calls = fakeSquare();
      await call('POST', validBody(), { host: 'evil.test', origin: 'https://evil.test' });
      expect(linkCall(calls).checkout_options.redirect_url).toBe('https://otoshi.ca/register?paid=1');
    });
    it('on a local dev server it follows localhost over http', async () => {
      const calls = fakeSquare();
      await call('POST', validBody(), { host: 'localhost:5173' });
      expect(linkCall(calls).checkout_options.redirect_url).toBe('http://localhost:5173/register?paid=1');
    });
    it('a junk Host header falls back to the fixed address', async () => {
      const calls = fakeSquare();
      await call('POST', validBody(), { host: 'evil.test/path?x=1' });
      expect(linkCall(calls).checkout_options.redirect_url).toBe('https://otoshi.ca/register?paid=1');
    });
  });

  it('the email says payment is awaited, with the Square order id', async () => {
    process.env.RESEND_API_KEY = 're_test';
    process.env.VERCEL = '1';
    fakeSquare();
    await call('POST', validBody(), { 'x-vercel-forwarded-for': '7.7.7.7' });
    expect(send.mock.calls[0][0].html).toContain('Awaiting payment on Square');
    expect(send.mock.calls[0][0].html).toContain('ORDER1');
  });
});

// ───────────────────────── site-config ─────────────────────────

describe('GET /api/site-config', () => {
  async function config() {
    vi.resetModules();
    const handler = (await import('../api/site-config')).default;
    const res = fakeRes();
    handler({} as never, res as never);
    return res;
  }

  it('reports Square off and no captcha by default', async () => {
    const res = await config();
    expect(res.body).toEqual({ squareEnabled: false });
  });
  it('reports Square on only when both Square secrets exist', async () => {
    process.env.SQUARE_ACCESS_TOKEN = 't';
    expect(((await config()).body as Json).squareEnabled).toBe(false);
    process.env.SQUARE_LOCATION_ID = 'L';
    expect(((await config()).body as Json).squareEnabled).toBe(true);
  });
  it('exposes the public site key only when the secret is set too, never the secret', async () => {
    process.env.TURNSTILE_SITE_KEY = 'pub';
    expect(((await config()).body as Json).turnstileSiteKey).toBeUndefined();
    process.env.TURNSTILE_SECRET_KEY = 'sekret';
    const res = await config();
    expect((res.body as Json).turnstileSiteKey).toBe('pub');
    expect(JSON.stringify(res.body)).not.toContain('sekret');
  });
  it('is cached for a minute, with no stale-while-revalidate', async () => {
    const res = await config();
    expect(res.headers['Cache-Control']).toBe('public, s-maxage=60');
  });
});
