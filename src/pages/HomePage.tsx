import { useCallback, useRef } from 'react';
import type { Lang } from '../copy';
import { SiteNav } from '../components/SiteNav';
import { Hero } from '../components/Hero';
import { Community } from '../components/Community';
import { Why } from '../components/Why';
import { Programs } from '../components/Programs';
import { Who } from '../components/Who';
import { Schedule } from '../components/Schedule';
import { JudoForAll } from '../components/JudoForAll';
import { Sponsors } from '../components/Sponsors';
import { ClosingCta } from '../components/ClosingCta';
import { Footer } from '../components/Footer';
import { BackToTop } from '../components/BackToTop';

export interface PageProps {
  lang: Lang;
  setLang: (l: Lang) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

// The whole marketing site, moved here unchanged from what used to be
// App.tsx's own body - App now only owns the router and the state (lang/
// theme) both this page and RegisterPage share.
export function HomePage({ lang, setLang, isDark, toggleTheme }: PageProps) {
  const topRef = useRef<HTMLDivElement>(null);

  const go = useCallback((id: string) => {
    const root = topRef.current;
    if (!root) return;
    const el = id === 'top' ? root : root.querySelector(`#${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div ref={topRef} className="relative font-sans min-h-screen">
      <SiteNav lang={lang} setLang={setLang} go={go} isDark={isDark} toggleTheme={toggleTheme} />
      <BackToTop go={go} />
      <Hero go={go} />
      <Community />
      <Why />
      <Programs go={go} />
      <Who />
      <Schedule go={go} />
      <JudoForAll />
      <Sponsors />
      <ClosingCta />
      <Footer />
    </div>
  );
}
