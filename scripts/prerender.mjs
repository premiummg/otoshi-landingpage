import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Turns the built SPA into one real HTML file per route.
//
// Why at all: the client-rendered build ships `<div id="root"></div>` and
// nothing else. Google can run the JS and eventually see the page, but it
// does so on a second pass, and Bing, the social scrapers and the AI
// crawlers largely do not. The club is replacing a WordPress site whose
// every page WAS server-rendered HTML, so shipping an empty shell would be a
// straight downgrade in what a crawler can read.
//
// Why a script instead of a framework: every route's content is static copy
// out of `copy.ts` with no data fetching, so there is nothing to await and
// nothing to serialise - `renderToString` over the app's own route table is
// the whole job.

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const dist = join(root, 'dist');
const ssrDist = join(root, '.prerender');

// Some `@premiummg/ui` components (PremiumLogo among them) read
// `document.documentElement.classList` inside a `useState` initializer to
// pick a light or dark variant. That runs during render, so rendering them
// under Node throws before any of this site's own code gets a say, and the
// package is shared - patching it for one consumer's build is not an option.
//
// This answers that one question and nothing else. `contains` reporting
// false means those components render their light variant here, which is
// correct: the only place the site uses one (the footer logo) pins
// `mode="dark"` explicitly, so its markup does not depend on the answer, and
// the browser re-reads the real class on hydration anyway. Anything reaching
// for a DOM API beyond this will throw loudly rather than silently render
// something wrong.
globalThis.document ??= {
  documentElement: {
    lang: 'en',
    classList: { contains: () => false, add() {}, remove() {}, toggle: () => false },
  },
};

const { renderRoute, allRoutes } = await import(
  pathToFileURL(join(ssrDist, 'entry-prerender.js')).href
);

const template = readFileSync(join(dist, 'index.html'), 'utf8');

// A direct hit on /register or /programs/:key (a search result, a shared
// link - not a click from within the already-loaded app) still only gets
// the main bundle's own <script> tag; the page's OWN chunk (see App.tsx's
// `lazy()` split) is only discovered once that main bundle runs, decides
// which route matched, and issues the dynamic import - one avoidable extra
// round trip on the very pages the split was supposed to make cheaper to
// visit directly. A `modulepreload` hint added to that page's own
// prerendered HTML lets the browser start fetching the chunk immediately,
// in parallel with the main bundle, instead of after it.
//
// The manifest (vite.config.ts's `build.manifest: true`) is what makes this
// possible without hardcoding a filename: Vite content-hashes every chunk,
// so `RegisterPage-<hash>.js` is a different string on every build.
const manifest = JSON.parse(readFileSync(join(dist, '.vite/manifest.json'), 'utf8'));

function chunkFilesFor(srcKey, seen = new Set()) {
  if (seen.has(srcKey)) return [];
  seen.add(srcKey);
  const entry = manifest[srcKey];
  if (!entry) return [];
  const nested = (entry.imports ?? []).filter(k => k !== 'index.html').flatMap(k => chunkFilesFor(k, seen));
  return [entry.file, ...nested];
}

function preloadLinksFor(path) {
  const srcKey = path === '/register' ? 'src/pages/RegisterPage.tsx'
    : path.startsWith('/programs/') ? 'src/pages/ProgramDetailPage.tsx'
    : null;
  if (!srcKey) return '';
  return chunkFilesFor(srcKey).map(f => `<link rel="modulepreload" href="/${f}">`).join('\n');
}

const SEO_BLOCK = /<!--seo-start-->[\s\S]*?<!--seo-end-->/;
const APP_SLOT = '<!--app-html-->';
const HTML_TAG = '<html lang="en">';

// Checked up front rather than per route: a `String.replace` whose pattern is
// absent is a silent no-op, so without this a template change would ship 12
// pages with no title and an empty body, on a green build.
for (const [what, present] of [
  ['<!--seo-start--> ... <!--seo-end--> block', SEO_BLOCK.test(template)],
  [APP_SLOT + ' slot', template.includes(APP_SLOT)],
  [HTML_TAG + ' tag', template.includes(HTML_TAG)],
]) {
  if (!present) throw new Error(`index.html is missing its ${what}.`);
}

const routes = allRoutes();
const written = [];

for (const { url, path } of routes) {
  const { html, head, lang } = await renderRoute(url);

  // entry-prerender.tsx's lazy-page workaround is a fixed number of event
  // loop turns, not a wait for an actual completion signal - if a future
  // dependency bump makes that page's own chunk graph slower to resolve
  // than today's margin covers, `renderToString` doesn't throw, it just
  // emits this same recovery marker again for a still-suspended boundary.
  // Failing the build on it is what turns "a future silent regression"
  // into "this build fails right here, on this route."
  if (html.includes('Switched to client rendering')) {
    throw new Error(`${url} prerendered as an empty Suspense fallback, not real content - see entry-prerender.tsx's drainMicrotasks.`);
  }

  const preloads = preloadLinksFor(path);

  // Function replacers, not plain strings: `String.replace` treats `$&`,
  // "$'" and `$$` inside a replacement STRING as substitution directives, so
  // a dollar sign anywhere in the rendered markup (a price on a class page,
  // say) would splice parts of the template into the output. A function
  // replacement is inserted literally.
  const page = template
    .replace(HTML_TAG, () => `<html lang="${lang}">`)
    .replace(SEO_BLOCK, () => (preloads ? `${head}\n${preloads}` : head))
    .replace(APP_SLOT, () => html);

  // `/` becomes dist/index.html, `/fr/register` becomes
  // dist/fr/register/index.html - directory-style so a static host serves it
  // at the clean URL with no rewrite rule in the way.
  const outFile = url === '/' ? join(dist, 'index.html') : join(dist, url, 'index.html');
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, page);
  written.push(url);
}

// Generated here rather than kept in public/ so it can never list a route
// that no longer exists, or miss one that was just added to copy.ts.
const SITE_URL = 'https://otoshi.ca';
const today = new Date().toISOString().slice(0, 10);
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...routes.map(({ url, path }) => {
    // Each entry declares both language versions of the same page, which is
    // how Google is meant to discover an hreflang pair from a sitemap.
    const alt = ['en', 'fr'].map(l => {
      const href = l === 'fr' ? `${SITE_URL}/fr${path === '/' ? '' : path}` : `${SITE_URL}${path}`;
      return `    <xhtml:link rel="alternate" hreflang="${l}-CA" href="${href}"/>`;
    });
    return [
      '  <url>',
      `    <loc>${SITE_URL}${url}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      ...alt,
      `    <priority>${path === '/' ? '1.0' : '0.8'}</priority>`,
      '  </url>',
    ].join('\n');
  }),
  '</urlset>',
].join('\n');

writeFileSync(join(dist, 'sitemap.xml'), sitemap);

rmSync(ssrDist, { recursive: true, force: true });
// Build metadata (the chunk map this script just read), not something the
// site itself serves - same reasoning as removing .prerender above.
rmSync(join(dist, '.vite'), { recursive: true, force: true });

console.log(`prerendered ${written.length} routes:\n  ${written.join('\n  ')}`);
console.log('wrote dist/sitemap.xml');
