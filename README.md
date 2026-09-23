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

## Deploying (Vercel) and the registration form's email

`/register` posts to `api/register.ts`, a Vercel serverless function (Vercel
auto-detects the `/api` directory - no extra config). It sends the
submission to `judo.otoshi.dieppe@gmail.com` via **Resend**, and needs one
env var set in the Vercel project: `RESEND_API_KEY` (free tier, resend.com -
sign up, create a key, add it under the project's Settings → Environment
Variables). Without it the function returns a `500` with a clear
"RESEND_API_KEY missing" message rather than silently pretending the email
sent - if a registration ever appears to succeed but never reaches the
club's inbox, check that first.

Emails currently send from Resend's own sandbox address
(`onboarding@resend.dev`), which works with no setup. Once otoshi.ca's real
DNS is pointed at this deployment, verify that domain with Resend too and
switch the `from` address in `api/register.ts` to something at otoshi.ca -
sandbox sending is fine for now but isn't meant to be permanent.

Two things the registration form itself flags as **pending, not finished**
(see `src/registerData.ts` and Malcolm's own email): the class-to-price
mapping and billing period are inferred from the old (now offline) form, not
confirmed by the club; and Square isn't wired in at all yet (no credentials) -
the form collects and emails the registration, then tells the family payment
will be arranged separately.

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
- `public/media/` - the club's own real photos/video/logo, re-hosted at
  served size. No CMS, no analytics.
