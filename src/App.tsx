import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useDarkMode } from '@premiummg/ui';
import { COPY, type Lang } from './copy';
import { LangCtx } from './lang';
import { HomePage } from './pages/HomePage';
import { RegisterPage } from './pages/RegisterPage';

const LANG_KEY = 'otoshi-lang';

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
        <Routes>
          <Route path="/" element={<HomePage lang={lang} setLang={setLang} isDark={isDark} toggleTheme={toggle} />} />
          <Route path="/register" element={<RegisterPage lang={lang} setLang={setLang} isDark={isDark} toggleTheme={toggle} />} />
        </Routes>
      </BrowserRouter>
    </LangCtx.Provider>
  );
}
