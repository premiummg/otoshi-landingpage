import { lazy, Suspense, useCallback, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { COPY, type Lang } from './copy';
import { LangCtx } from './lang';
import { useDarkMode } from './lib/useDarkMode';
import { localePath, splitLocalePath, FR_PREFIX } from './lib/routes';
import { Seo } from './components/Seo';
import { HomePage } from './pages/HomePage';

// Lazy, unlike HomePage: a visitor who only ever reads the home page (most
// of them) was downloading the entire registration flow with it - four form
// steps, address/email autocomplete, and react-phone-number-input, which
// alone carries a full metadata table for every country's phone format.
// None of that is needed to paint the page they actually asked for.
//
// This DOES need care in the prerender build (scripts/prerender.mjs warms
// both chunks before rendering any route, and again per-route since Vite's
// SSR build gives each entry its own module registry) - `renderToString`
// does not wait out a lazy import, so an un-warmed chunk would silently
// prerender as this Suspense fallback instead of the real page.
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ProgramDetailPage = lazy(() => import('./pages/ProgramDetailPage').then(m => ({ default: m.ProgramDetailPage })));

// Where each history entry's scroll position was last seen, keyed by React
// Router's own per-entry `location.key`. Module scope, not state - it needs
// to survive the home page unmounting entirely while a sub-page is open, and
// nothing here needs a re-render when it changes.
//
// This is what actually answers "go back to where I was": the browser's own
// scroll restoration is disabled below (it was firing, if at all, before the
// page had finished laying out, since a client-side route swap has no
// navigation event for it to time itself against - so it never reliably put
// the reader back where they'd been, which is the bug this file now works
// around instead of relying on).
const scrollPositions = new Map<string, number>();

// React Router doesn't reset scroll position on navigation the way a real
// page load does - clicking a program card from partway down the home page
// otherwise lands the new page partway down too. Resets to the top on
// PUSH/REPLACE (a real Link/navigate() to a new path); a POP (the browser's
// back/forward buttons, or this app's own "back" links - see useGoBack)
// restores whatever position was last recorded for the entry being
// returned to, or the top if none was ever recorded (a direct hit on that
// URL, nothing to return to).
//
// It watches the language-LESS path, not the raw pathname, because switching
// language is now a navigation too (`/` to `/fr`). That is a different URL
// but the same page, and a reader two thirds of the way down the schedule
// who clicks FR should stay on the schedule, not get thrown back to the hero.
function ScrollManager() {
  const { pathname, key } = useLocation();
  const navigationType = useNavigationType();
  const { path } = splitLocalePath(pathname);
  const lastPath = useRef(path);

  useEffect(() => {
    const original = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = original;
    };
  }, []);

  useEffect(() => {
    const onScroll = () => scrollPositions.set(key, window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [key]);

  useEffect(() => {
    const changedPage = lastPath.current !== path;
    lastPath.current = path;
    if (!changedPage) return;
    if (navigationType === 'POP') window.scrollTo(0, scrollPositions.get(key) ?? 0);
    else window.scrollTo(0, 0);
  }, [path, key, navigationType]);

  return null;
}

// Language is read from the URL, not from state or localStorage. Each
// language is its own indexable URL tree (English at the root, French under
// /fr - see lib/routes.ts), which is what lets the two versions be crawled,
// linked and paired with hreflang separately. It also means switching
// language is a navigation, so the choice survives a reload, a shared link
// and a back button for free.
function AppRoutes() {
  const { isDark, toggle } = useDarkMode();
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, path } = splitLocalePath(location.pathname);

  // Swaps the language segment while staying on the same page. The hash is
  // carried over so the URL stays shareable and honest, not to drive the
  // scroll - a pushState never scrolls to a hash, and ScrollToTop above
  // deliberately leaves the reader's position alone on a language switch.
  const setLang = useCallback(
    (next: Lang) => navigate(`${localePath(next, path)}${location.hash}`),
    [navigate, path, location.hash],
  );

  const pageProps = { lang, setLang, isDark, toggleTheme: toggle };

  return (
    <LangCtx.Provider value={COPY[lang]}>
      <Seo lang={lang} path={path} />
      <ScrollManager />
      {/* No fallback UI (`null`): every route that can suspend here is also
          prerendered, so a real client navigation only ever suspends for the
          time it takes to fetch an already-cached-by-the-preceding-page-load
          chunk - normally under a frame. A skeleton would flash on for that
          one frame and read as a bug, not a loading state. */}
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<HomePage {...pageProps} />} />
          <Route path="/register" element={<RegisterPage {...pageProps} />} />
          <Route path="/programs/:key" element={<ProgramDetailPage {...pageProps} />} />
          <Route path={FR_PREFIX} element={<HomePage {...pageProps} />} />
          <Route path={`${FR_PREFIX}/register`} element={<RegisterPage {...pageProps} />} />
          <Route path={`${FR_PREFIX}/programs/:key`} element={<ProgramDetailPage {...pageProps} />} />
        </Routes>
      </Suspense>
    </LangCtx.Provider>
  );
}

// Exported without a router of its own so the prerender can mount the same
// tree under a StaticRouter (see entry-prerender.tsx) instead of a second,
// subtly different copy of the route table.
export { AppRoutes };

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
