import { EN, type Lang } from '../copy';

// The site is served as two parallel URL trees, one per language, rather
// than one tree whose language lives in localStorage. A URL is the only
// thing a search engine can index, link to, or pair with an hreflang
// annotation, so a language that exists only as client state is a language
// Google cannot rank - and the club's previous WordPress site DID have
// separate `/` and `/fr/` trees, both of which are still indexed today.
//
// English stays at the root and French is namespaced under `/fr`, matching
// that old structure exactly, so every indexed old URL maps 1:1 onto a new
// one of the same language (see vercel.json).
export const FR_PREFIX = '/fr';

// Derived from the copy rather than hand-listed: the prerender script and
// the sitemap both walk this, so a program added to `copy.ts` gets its own
// static HTML page and sitemap entry without a second list to remember.
export const PROGRAM_KEYS = EN.programs.items.map(p => p.key);

/** App-relative path (`/register`) to a real URL path for that language. */
export function localePath(lang: Lang, path: string): string {
  // The home page is the empty remainder, so French home is `/fr` (not
  // `/fr/`) and English home falls back to a bare `/`.
  const clean = path === '/' ? '' : path;
  return lang === 'fr' ? `${FR_PREFIX}${clean}` : clean || '/';
}

/** Real URL path back to its language and the language-less remainder. */
export function splitLocalePath(pathname: string): { lang: Lang; path: string } {
  if (pathname === FR_PREFIX || pathname.startsWith(`${FR_PREFIX}/`)) {
    return { lang: 'fr', path: pathname.slice(FR_PREFIX.length) || '/' };
  }
  return { lang: 'en', path: pathname || '/' };
}

/** Every real URL the site serves, in both languages - the prerender list. */
export function allRoutes(): { lang: Lang; path: string; url: string }[] {
  const paths = ['/', '/register', ...PROGRAM_KEYS.map(k => `/programs/${k}`)];
  return (['en', 'fr'] as const).flatMap(lang =>
    paths.map(path => ({ lang, path, url: localePath(lang, path) })),
  );
}
