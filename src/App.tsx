import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
import { useDarkMode } from '@premiummg/ui';
import { COPY, type Lang } from './copy';
import { LangCtx } from './lang';
import { HomePage } from './pages/HomePage';
import { RegisterPage } from './pages/RegisterPage';
import { ProgramDetailPage } from './pages/ProgramDetailPage';

const LANG_KEY = 'otoshi-lang';

// React Router doesn't reset scroll position on navigation the way a real
// page load does - clicking a program card from partway down the home page
// otherwise lands the new page partway down too. Resets to the top only on
// PUSH/REPLACE (a real Link/navigate() to a new path); a POP (the
// browser's own back/forward button) is left alone so the browser's native
// per-history-entry scroll memory still restores where you were.
function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  useEffect(() => {
    if (navigationType !== 'POP') window.scrollTo(0, 0);
  }, [pathname, navigationType]);
  return null;
}

// French by default, not English: the club's own logo already wraps its
// belt knot in the Acadian flag, and Dieppe is an Acadian community first.
// Persisted the same way the theme choice is (via localStorage), once a
// visitor actually picks a language.
function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    return saved === 'en' || saved === 'fr' ? saved : 'fr';
  } catch {
    return 'fr';
  }
}

export default function App() {
  const { isDark, toggle } = useDarkMode();
  const [lang, setLang] = useState<Lang>(initialLang);

  useEffect(() => {
    try { localStorage.setItem(LANG_KEY, lang); } catch { /* private browsing, etc. */ }
  }, [lang]);

  return (
    <LangCtx.Provider value={COPY[lang]}>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage lang={lang} setLang={setLang} isDark={isDark} toggleTheme={toggle} />} />
          <Route path="/register" element={<RegisterPage lang={lang} setLang={setLang} isDark={isDark} toggleTheme={toggle} />} />
          <Route path="/programs/:key" element={<ProgramDetailPage lang={lang} setLang={setLang} isDark={isDark} toggleTheme={toggle} />} />
        </Routes>
      </BrowserRouter>
    </LangCtx.Provider>
  );
}
