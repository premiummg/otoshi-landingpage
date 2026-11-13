# Judo Otoshi – otoshi.ca

The real site, built on `@premiummg/ui` (published to GitHub Packages) the
same way `pmg-intranet` consumes it: Vite + React 19 + Tailwind v4, with the
package's own `tailwind-preset` and `styles.css` (which also ships the
brand's fonts and `pmg-*` utility classes - nothing about those is
duplicated in this repo).

This started as the design-review mockup at
`timesheet-payroll-system/frontend/src/pages/design/OtoshiProposalPage.tsx`;
that page stays in place as the internal review record (it still carries the
today-vs-proposed audit list), while this project is the real, deployable
site rebuilt on shared components instead of one-off local copies of
`SiteButton`/`Eyebrow`/`Hero`/etc.

## Setup

```bash
npm install   # needs a GitHub Packages token (NPM_TOKEN) that can read @premiummg
npm run dev
```

## Registration, payments and deploying (Vercel)

`/register` posts to `api/register.ts`, a Vercel serverless function (Vercel
auto-detects the `/api` directory - no extra config). Files in `api/` that
start with `_` (`_square.ts`, `_validate.ts`, `_guard.ts`) are shared helpers,
not endpoints.

What one registration does, in order:

1. **Validates** the body (`api/_validate.ts`) - shape, lengths, both waivers.
2. **Guards** against abuse (`api/_guard.ts`), in this order: origin check
   (only stops other websites' browsers - a script can fake it), per-IP rate
   limit, Cloudflare Turnstile captcha, then the per-email rate limit (after
   the captcha, so a stranger can't use up someone else's quota). Limits are
   named constants at the top of `_guard.ts`.
3. **Prices it on the server** from `src/registerData.ts` (the browser never
   chooses a price): 15% sibling discount (the highest-priced kid pays full),
   50% adult discount when a kid is registered, plus the Square fee. The
   monthly total is computed once, in whole cents.
4. **Creates a Square-hosted checkout for a monthly subscription**
   (`api/_square.ts`). Square's subscription price comes from a plan
   *variation*, and every family's total differs, so one variation per
   distinct amount is created inside the shared plan "Otoshi Monthly
   Tuition" the first time that amount is needed (and reused after). The
   family is redirected to Square's page, which collects the card (it never
   touches this site), charges the first month, and bills every month after.
   If Square is not configured, or this step fails, the registration still
   goes through and the club collects payment by hand.
5. **Emails the club** (via Resend) the registration. **This email is sent
   before the family pays**, so it is not proof of payment: the club must
   check the Square Dashboard (Customers -> Subscriptions) for the
   subscription carrying the same reference.

After paying, Square sends the family back to `/register?paid=1`. Anyone can
type that URL, so the page it shows never says a payment happened - only that
Square emails a receipt if it did.

To cancel a family, the club cancels their subscription in Square Dashboard
after the family emails.

### Environment variables

Copy `.env.example` to `.env.local` for local development (gitignored); on
Vercel set the same names under Project -> Settings -> Environment Variables.

| Variable | Needed | What it is |
| --- | --- | --- |
| `RESEND_API_KEY` | yes (prod) | Sends the registration email. Without it a real deployment returns a 500 on purpose, so a lost registration is visible. Locally, no key means the email is just printed to the terminal (dry run). |
| `SQUARE_ENVIRONMENT` | for payments | `sandbox` or `production` (case and spaces ignored). Anything else logs an error and is treated as production. |
| `SQUARE_ACCESS_TOKEN` | for payments | Secret. From the Square Developer Dashboard -> your app -> Credentials (the sandbox or production tab to match). |
| `SQUARE_LOCATION_ID` | for payments | The location (a short code like `LZ3B...`), not the Application ID. |
| `TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | recommended | Cloudflare Turnstile captcha (free). The captcha is on only when BOTH are set. With just one, it is treated as OFF and a loud error is logged (a half-configuration would otherwise lock every family out, or show a widget nobody checks). **Without it, abuse protection is only the in-memory limiter** - set these before launch. |
| `REGISTRATION_TO` | optional | Overrides who receives the registration email (default: the club address in `src/contact.ts`). |
| `SITE_URL` | optional | Pins where Square sends families after paying. Default: `https://otoshi.ca` on production (never read from request headers), and the request host on previews / local dev. |

Square payments need both `SQUARE_ACCESS_TOKEN` and `SQUARE_LOCATION_ID`; with
either missing the site behaves as email-only.

**Square sandbox caveat:** Square's sandbox hosted checkout page is only a
preview - it does not take cards - so a real payment, the first charge and
the monthly renewals can only be confirmed in production. Suggested first
test there: register a Ninja with your own card, check the Dashboard, then
cancel the subscription and refund.

Also set a **rate-limit rule in the Vercel dashboard** (Firewall) for
`/api/register`: the in-memory limiter in `_guard.ts` only sees requests that
land on the same warm function instance. Use **sandbox** Square credentials
for the Preview environment: preview deployments skip the origin check.

**Known limit:** every distinct monthly total gets its own plan variation in
Square (created on first use). The number of distinct totals is bounded by the
class/schedule combinations but can reach the thousands; Square's per-plan
variation limit has not been confirmed. The rate limits and the captcha are
what keep anyone from forcing them all to be created.

**Security headers** are set in `vercel.json`. The Content-Security-Policy is
**report-only** for now: open the site and the register page with the browser
console open, check for "Content-Security-Policy-Report-Only" violations (the
Turnstile widget, Square's redirect and the fonts are the likely ones), then
rename the header to `Content-Security-Policy` to enforce it. The CSP lists a
SHA-256 hash of the small inline theme script in `index.html`: if that script
changes, the hash must be recomputed.

`otoshi.ca` is verified with Resend and emails send from
`no-reply@otoshi.ca` (no real mailbox needs to exist behind that address -
a "from" address is outbound-only).

### Local development and tests

```bash
npm run dev        # site + the /api functions (a small Vite middleware runs api/*.ts)
npm test           # pricing, validation and endpoint tests (Vitest)
npm run typecheck
```

Tests never read `.env.local`, so they can't reach a real Square account.

## Structure

- `src/copy.ts` - EN/FR content. `FR` is typed against the same `Copy` shape
  as `EN`, so a missing French string is a compile error, not a silent
  fallback to English at runtime.
- `src/components/` - page sections. Most are thin wrappers around
  `@premiummg/ui` components (`Hero`, `FeatureCard`, `MediaCard`, `StatBlock`,
  `PortraitFigure`, `SiteFooter`, `SiteButton`, `Eyebrow`/`SectionHead`,
  `LanguageToggle`, `DarkModeToggle`). `SiteNav`, `Schedule` and `BackToTop`
  stay page-local - a marketing nav's own link row, a short static schedule
  table, and a scroll-sentinel back-to-top control are this site's own
  content/composition, not reusable design-system atoms.
- `src/components/register/`, `src/pages/RegisterPage.tsx`,
  `src/registerData.ts`, `src/registerTypes.ts` - the `/register` flow: a
  4-step form (parent/guardian, emergency contact, participants + live price
  total, waiver agreements) whose payload shape is shared with
  `api/register.ts` via `registerTypes.ts`, so the two can't silently drift.
- `api/` - serverless functions: `register.ts` (the flow above),
  `site-config.ts` (what the browser may know: Square on/off, the public Turnstile key) and the `_`-prefixed helpers.
  `tsconfig.api.json` only includes a few `src/` files (`registerTypes`,
  `registerData`, `contact`); a new `src/` import from `api/` needs adding
  there.
- `tests/` - Vitest tests. Kept outside `api/` on purpose: anything in `api/`
  would be deployed as an endpoint.
- `public/media/` - the club's own real photos/video/logo, re-hosted at
  served size. No CMS, no analytics.
