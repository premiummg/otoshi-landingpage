import { useEffect } from 'react';
import type { Lang } from '../copy';
import { seoFor } from '../seo';

// Each helper updates the tag already in the document when there is one and
// only creates it otherwise. That matters because the prerendered HTML ships
// a full head of its own: a blind append would leave the landing page's
// title and description sitting alongside the new page's.
function setMeta(kind: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${kind}="${CSS.escape(key)}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(kind, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

function setAlternates(alternates: { hreflang: string; href: string }[]) {
  // Cleared and rewritten as a set rather than updated in place: the count
  // is fixed but the hrefs all change together, and leaving a stale one
  // behind would have the page advertise a translation of whichever page the
  // visitor first landed on. Nothing else here uses rel="alternate".
  document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());
  for (const a of alternates) {
    const el = document.createElement('link');
    el.rel = 'alternate';
    el.hreflang = a.hreflang;
    el.href = a.href;
    document.head.appendChild(el);
  }
}

/**
 * Keeps the document head matching the current route.
 *
 * On a first load the head is already correct - the build prerenders it into
 * each route's own HTML file (see `scripts/prerender.mjs`), which is what a
 * crawler reads. This only matters for client-side navigation afterwards,
 * where React Router swaps the view without the browser ever fetching a new
 * document, leaving the previous page's title and description in place.
 *
 * JSON-LD is deliberately left alone: it ships in the prerendered HTML, and
 * Google reads structured data from the rendered document, so rewriting it
 * on every in-app navigation buys nothing.
 */
export function Seo({ lang, path }: { lang: Lang; path: string }) {
  useEffect(() => {
    const seo = seoFor(lang, path);
    document.title = seo.title;
    document.documentElement.lang = seo.lang;
    setMeta('name', 'description', seo.description);
    setCanonical(seo.canonical);
    setAlternates(seo.alternates);
    setMeta('property', 'og:title', seo.title);
    setMeta('property', 'og:description', seo.description);
    setMeta('property', 'og:url', seo.canonical);
    setMeta('property', 'og:image', seo.ogImage);
    setMeta('property', 'og:locale', seo.locale);
    setMeta('name', 'twitter:title', seo.title);
    setMeta('name', 'twitter:description', seo.description);
    setMeta('name', 'twitter:image', seo.ogImage);
  }, [lang, path]);

  return null;
}
