import { useCallback, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { COPY, type Lang } from './copy';
import { LangCtx } from './lang';
import { useDarkMode } from './lib/useDarkMode';
import { localePath, splitLocalePath, FR_PREFIX } from './lib/routes';
import { Seo } from './components/Seo';
import { HomePage } from './pages/HomePage';
import { RegisterPage } from './pages/RegisterPage';
import { ProgramDetailPage } from './pages/ProgramDetailPage';

// React Router doesn't reset scroll position on navigation the way a real
// page load does - clicking a program card from partway down the home page
// otherwise lands the new page partway down too. Resets to the top only on
// PUSH/REPLACE (a real Link/navigate() to a new path); a POP (the
// browser's own back/forward button) is left alone so the browser's native
// per-history-entry scroll memory still restores where you were.
//
// It watches the language-LESS path, not the raw pathname, because switching
// language is now a navigation too (`/` to `/fr`). That is a different URL
// but the same page, and a reader two thirds of the way down the schedule
// who clicks FR should stay on the schedule, not get thrown back to the hero.
function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const { path } = splitLocalePath(pathname);
  const lastPath = useRef(path);

  useEffect(() => {
    const changedPage = lastPath.current !== path;
    lastPath.current = path;
    if (navigationType !== 'POP' && changedPage) window.scrollTo(0, 0);
  }, [path, navigationType]);
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
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage {...pageProps} />} />
        <Route path="/register" element={<RegisterPage {...pageProps} />} />
        <Route path="/programs/:key" element={<ProgramDetailPage {...pageProps} />} />
        <Route path={FR_PREFIX} element={<HomePage {...pageProps} />} />
        <Route path={`${FR_PREFIX}/register`} element={<RegisterPage {...pageProps} />} />
        <Route path={`${FR_PREFIX}/programs/:key`} element={<ProgramDetailPage {...pageProps} />} />
      </Routes>
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
