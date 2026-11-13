import { randomUUID } from 'node:crypto';

// Files starting with "_" inside /api are NOT turned into endpoints by Vercel,
// so this is a plain helper module shared by the real endpoints.
//
// How payment works: the family is sent to a Square-hosted checkout page that
// sells a MONTHLY SUBSCRIPTION at their exact total. Square collects the card
// there (it never touches this site), charges the first month, and bills every
// month after. Square decides the price from a subscription-plan *variation*,
// and every family has a different total, so one variation is created per
// distinct monthly amount inside a single shared plan, on first use.

const PLAN_NAME = 'Otoshi Monthly Tuition';

export interface SquareConfig {
  token: string;
  locationId: string;
  environment: 'sandbox' | 'production';
  base: string;
  // Aborts every request of one checkout attempt together, so a hung Square
  // call falls into the email-only path instead of exhausting the function.
  signal?: AbortSignal;
}

// Null when Square isn't set up (a secret is missing). The registration then
// degrades to email-only and the club collects payment by hand.
export function squareConfig(): SquareConfig | null {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!token || !locationId) return null;
  // Tolerate "Sandbox" / trailing spaces: anything that isn't clearly sandbox
  // would otherwise silently use the production host with a sandbox token.
  const raw = (process.env.SQUARE_ENVIRONMENT ?? '').trim().toLowerCase();
  if (raw && raw !== 'sandbox' && raw !== 'production') {
    console.error(`SQUARE_ENVIRONMENT="${raw}" is not "sandbox" or "production" - using production.`);
  }
  const environment = raw === 'sandbox' ? 'sandbox' : 'production';
  return {
    token, locationId, environment,
    base: environment === 'sandbox' ? 'https://connect.squareupsandbox.com' : 'https://connect.squareup.com',
  };
}

interface SquareApiError { category?: string; code?: string; detail?: string; field?: string }

export class SquareError extends Error {
  constructor(public status: number, public errors: SquareApiError[], public path = '') {
    // Codes, the name of the offending field and the endpoint. Never `detail`:
    // Square's detail strings can echo what we sent (an email address), and
    // error messages end up in Vercel's logs.
    // Square often puts the useful part ("redirect_url must ...") only in
    // `detail`, so it is logged with anything email-shaped blanked out.
    const detail = (e: SquareApiError) => (e.detail ? ` "${e.detail.replace(/\S+@\S+/g, '[email]').slice(0, 200)}"` : '');
    super((errors.map(e => `${e.code}${e.field ? ` field=${e.field}` : ''}${detail(e)}`).filter(Boolean).join(', ') || `Square request failed (${status})`)
      + (path ? ` @ ${path.split('?')[0]}` : ''));
  }
}

// What is safe to log about a failure: status and codes, never the payload.
export function describeError(err: unknown): string {
  if (err instanceof SquareError) return `SquareError ${err.status} [${err.message}]`;
  return err instanceof Error ? err.name : 'unknown error';
}

async function squareFetch<T>(cfg: SquareConfig, method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${cfg.base}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      'Square-Version': '2025-10-16',
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: cfg.signal,
  });
  const json = (await res.json()) as T & { errors?: SquareApiError[] };
  if (!res.ok) throw new SquareError(res.status, json.errors ?? [], path);
  return json;
}

interface CatalogVariation {
  id: string;
  is_deleted?: boolean;
  subscription_plan_variation_data?: {
    phases?: { cadence?: string; pricing?: { price_money?: { amount?: number } } }[];
  };
}
interface CatalogPlan {
  id: string;
  is_deleted?: boolean;
  subscription_plan_data?: {
    name?: string;
    subscription_plan_variations?: CatalogVariation[];
  };
}

function variationBody(cents: number) {
  return {
    name: `Monthly $${(cents / 100).toFixed(2)}`,
    phases: [{
      cadence: 'MONTHLY',
      ordinal: 0,
      pricing: { type: 'STATIC', price_money: { amount: cents, currency: 'CAD' } },
    }],
  };
}

async function findPlan(cfg: SquareConfig): Promise<CatalogPlan | undefined> {
  let cursor: string | undefined;
  for (let page = 0; page < 5; page++) {
    const query = `types=SUBSCRIPTION_PLAN${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
    const listed = await squareFetch<{ objects?: CatalogPlan[]; cursor?: string }>(cfg, 'GET', `/v2/catalog/list?${query}`);
    const plan = listed.objects?.find(o => !o.is_deleted && o.subscription_plan_data?.name === PLAN_NAME);
    if (plan) return plan;
    cursor = listed.cursor;
    if (!cursor) return undefined;
  }
  return undefined;
}

// Variation ids already resolved on this warm instance, by monthly cents.
const variationByCents = new Map<number, string>();

// The id of the monthly variation priced at exactly `cents`: reused if one
// exists, otherwise created (and the shared plan too, the very first time).
async function variationForAmount(cfg: SquareConfig, cents: number): Promise<string> {
  const cached = variationByCents.get(cents);
  if (cached) return cached;

  const plan = await findPlan(cfg);
  const existing = plan?.subscription_plan_data?.subscription_plan_variations?.find(v =>
    !v.is_deleted
    && v.subscription_plan_variation_data?.phases?.length === 1
    && v.subscription_plan_variation_data.phases[0].cadence === 'MONTHLY'
    && v.subscription_plan_variation_data.phases[0].pricing?.price_money?.amount === cents);
  if (existing) {
    variationByCents.set(cents, existing.id);
    return existing.id;
  }

  let id: string | undefined;
  if (plan) {
    const created = await squareFetch<{ catalog_object: { id: string } }>(cfg, 'POST', '/v2/catalog/object', {
      idempotency_key: randomUUID(),
      object: {
        type: 'SUBSCRIPTION_PLAN_VARIATION',
        id: '#variation',
        subscription_plan_variation_data: { ...variationBody(cents), subscription_plan_id: plan.id },
      },
    });
    id = created.catalog_object.id;
  } else {
    const created = await squareFetch<{ catalog_object: CatalogPlan }>(cfg, 'POST', '/v2/catalog/object', {
      idempotency_key: randomUUID(),
      object: {
        type: 'SUBSCRIPTION_PLAN',
        id: '#plan',
        subscription_plan_data: {
          name: PLAN_NAME,
          subscription_plan_variations: [{
            type: 'SUBSCRIPTION_PLAN_VARIATION',
            id: '#variation',
            subscription_plan_variation_data: variationBody(cents),
          }],
        },
      },
    });
    id = created.catalog_object.subscription_plan_data?.subscription_plan_variations?.[0]?.id;
  }
  if (!id) throw new Error('Square returned no subscription plan variation id.');
  variationByCents.set(cents, id);
  return id;
}

export interface SubscriptionCheckout {
  url: string;
  orderId: string;
}

// The only places a Square checkout can legitimately live. Checked before the
// URL is handed to the browser, which will navigate straight to it.
const SQUARE_HOSTS = ['square.link', 'squareup.com', 'squareupsandbox.com'];

export function isSquareUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' && SQUARE_HOSTS.some(h => u.hostname === h || u.hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

// A Square-hosted checkout for a monthly subscription at `monthlyCents`.
// Creating it charges nothing: the family only pays if they complete the
// page. Square then saves the card, starts the subscription (first month
// charged at once) and bills monthly on the same day.
export async function createSubscriptionCheckout(
  baseCfg: SquareConfig,
  args: { monthlyCents: number; reference: string; email: string; redirectUrl: string },
): Promise<SubscriptionCheckout> {
  const cfg = { ...baseCfg, signal: AbortSignal.timeout(6000) };

  for (let attempt = 0; ; attempt++) {
    const variationId = await variationForAmount(cfg, args.monthlyCents);
    try {
      const { payment_link: link } = await squareFetch<{ payment_link: { url: string; order_id: string } }>(
        cfg, 'POST', '/v2/online-checkout/payment-links',
        {
          idempotency_key: randomUUID(),
          quick_pay: {
            name: 'Judo Otoshi - monthly tuition',
            price_money: { amount: args.monthlyCents, currency: 'CAD' },
            location_id: cfg.locationId,
          },
          checkout_options: {
            subscription_plan_id: variationId,
            redirect_url: args.redirectUrl,
            ask_for_shipping_address: false,
          },
          pre_populated_data: { buyer_email: args.email },
          payment_note: `Otoshi registration ${args.reference}`,
        },
      );
      if (!isSquareUrl(link.url)) throw new Error('Square returned an unexpected checkout URL.');
      return { url: link.url, orderId: link.order_id };
    } catch (err) {
      // A variation deleted in the Square dashboard would otherwise be served
      // from this instance's cache until it recycles. Forget it and retry once.
      if (attempt === 0 && err instanceof SquareError && err.status >= 400 && err.status < 500) {
        variationByCents.delete(args.monthlyCents);
        continue;
      }
      throw err;
    }
  }
}
