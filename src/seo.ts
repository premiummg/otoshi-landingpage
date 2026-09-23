import { COPY, EN, type Lang } from './copy';
import { PHONE, EMAIL } from './palette';
import { localePath, PROGRAM_KEYS } from './lib/routes';

// Absolute, and the apex rather than www: every canonical, hreflang,
// og:image and sitemap entry is built from this one constant, and a
// canonical that disagrees with the host a visitor actually landed on is
// how a site ends up competing with itself for its own pages.
export const SITE_URL = 'https://otoshi.ca';

export const SOCIAL = [
  'https://www.facebook.com/profile.php?id=100039844673681',
  'https://www.instagram.com/clubdejudootoshi/',
];

// Postal code is from public directory listings, not the club - the street
// address the club publishes ("1571 Melanson Rd, Dieppe") sits in the
// Greater Lakeburn delivery area, so this is worth one confirmation from
// Malcolm before it is treated as final. Everything else here is the club's
// own published contact information.
const ADDRESS = {
  streetAddress: '1571 Melanson Rd',
  addressLocality: 'Dieppe',
  addressRegion: 'NB',
  postalCode: 'E1H 2B8',
  addressCountry: 'CA',
};

const abs = (path: string) => `${SITE_URL}${path}`;
const e164 = (display: string) => `+1${display.replace(/\D/g, '')}`;

// "5:00 – 6:15 pm" / "10:00 am – 12:00 pm" / "7 h 30" never reach a search
// engine as written - openingHoursSpecification wants 24-hour ISO times. The
// English schedule is the one parsed (its am/pm is unambiguous, and the FR
// copy carries the same times in 24-hour French notation), so the structured
// hours stay derived from `copy.ts` instead of being a second hand-kept list
// that silently drifts when the club changes a class time.
function to24h(raw: string, fallbackMeridiem?: string): string | null {
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (!m) return null;
  const meridiem = (m[3] ?? fallbackMeridiem)?.toLowerCase();
  let hour = Number(m[1]);
  if (meridiem === 'pm' && hour !== 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${m[2]}`;
}

function parseRange(time: string): { opens: string; closes: string } | null {
  const [rawStart, rawEnd] = time.split(/\s*[–-]\s*/);
  if (!rawStart || !rawEnd) return null;
  // A range written "5:00 – 6:15 pm" states its meridiem once, on the end
  // time only, so the start inherits it.
  const trailing = rawEnd.trim().match(/(am|pm)$/i)?.[1];
  const opens = to24h(rawStart, trailing);
  const closes = to24h(rawEnd);
  return opens && closes ? { opens, closes } : null;
}

function openingHours() {
  return EN.schedule.days.flatMap(day => {
    const ranges = day.classes.map(c => parseRange(c.time)).filter(r => r !== null);
    if (ranges.length === 0) return [];
    return [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${day.day}`,
      opens: ranges.reduce((min, r) => (r.opens < min ? r.opens : min), ranges[0].opens),
      closes: ranges.reduce((max, r) => (r.closes > max ? r.closes : max), ranges[0].closes),
    }];
  });
}

// One @id shared by every page's graph, so both language trees and every
// sub-page describe the SAME club to Google rather than looking like a
// handful of unrelated organisations that happen to share an address.
const ORG_ID = `${SITE_URL}/#organization`;

function organization(lang: Lang) {
  return {
    '@type': 'SportsClub',
    '@id': ORG_ID,
    name: 'Club de Judo Otoshi',
    alternateName: 'Judo Otoshi',
    description: COPY[lang].seo.organizationDescription,
    url: abs(localePath(lang, '/')),
    logo: abs('/media/logo.png'),
    image: abs('/media/hero-poster.jpg'),
    telephone: e164(PHONE),
    email: EMAIL,
    foundingDate: '2012',
    sport: 'Judo',
    address: { '@type': 'PostalAddress', ...ADDRESS },
    areaServed: ['Dieppe', 'Moncton', 'Riverview', 'Greater Moncton'],
    knowsLanguage: ['en-CA', 'fr-CA'],
    hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${ADDRESS.streetAddress}, ${ADDRESS.addressLocality}, ${ADDRESS.addressRegion}`,
    )}`,
    openingHoursSpecification: openingHours(),
    sameAs: SOCIAL,
  };
}

export interface PageSeo {
  lang: Lang;
  locale: string;
  title: string;
  description: string;
  canonical: string;
  /** hreflang pairs, including x-default - every page links to its twin. */
  alternates: { hreflang: string; href: string }[];
  ogImage: string;
  jsonLd: unknown[];
}

/** `path` is the language-less route (`/`, `/register`, `/programs/elite`). */
export function seoFor(lang: Lang, path: string): PageSeo {
  const t = COPY[lang];
  const canonical = abs(localePath(lang, path));
  const program = path.startsWith('/programs/')
    ? t.programs.items.find(p => p.key === path.slice('/programs/'.length))
    : undefined;

  let title = t.seo.home.title;
  let description = t.seo.home.description;
  if (path === '/register') {
    title = t.seo.register.title;
    description = t.seo.register.description;
  } else if (program) {
    title = t.seo.program.title.replace('{name}', program.name);
    description = `${program.body} ${t.seo.program.descriptionSuffix}`;
  }

  const breadcrumb = program
    ? [{
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t.nav.home, item: abs(localePath(lang, '/')) },
          { '@type': 'ListItem', position: 2, name: program.name, item: canonical },
        ],
      }]
    : [];

  return {
    lang,
    locale: lang === 'fr' ? 'fr_CA' : 'en_CA',
    title,
    description,
    canonical,
    // x-default points at the English root: it is what a visitor with no
    // matching language preference should get, and it is the URL the old
    // site's strongest indexed pages already pointed at.
    alternates: [
      { hreflang: 'en-CA', href: abs(localePath('en', path)) },
      { hreflang: 'fr-CA', href: abs(localePath('fr', path)) },
      { hreflang: 'x-default', href: abs(localePath('en', path)) },
    ],
    ogImage: program ? abs(`/media/${program.img}`) : abs('/media/hero-poster.jpg'),
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@graph': [
          organization(lang),
          {
            '@type': 'WebSite',
            '@id': `${SITE_URL}/#website`,
            url: abs(localePath(lang, '/')),
            name: 'Judo Otoshi',
            publisher: { '@id': ORG_ID },
            inLanguage: lang === 'fr' ? 'fr-CA' : 'en-CA',
          },
          {
            '@type': 'WebPage',
            '@id': `${canonical}#webpage`,
            url: canonical,
            name: title,
            description,
            isPartOf: { '@id': `${SITE_URL}/#website` },
            about: { '@id': ORG_ID },
            inLanguage: lang === 'fr' ? 'fr-CA' : 'en-CA',
          },
          ...breadcrumb,
        ],
      },
    ],
  };
}

export { PROGRAM_KEYS };
