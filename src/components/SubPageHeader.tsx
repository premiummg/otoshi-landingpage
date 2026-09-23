import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { LanguageToggle, DarkModeToggle, type Lang } from '@premiummg/ui';
import { useT } from '../lang';
import { useLocaleHref } from '../lib/useLocaleHref';
import { MEDIA, BAND_PANEL } from '../palette';

// A compact header shared by the site's "task, not a page to browse"
// sub-pages - the registration flow and a program's detail page - not the
// full marketing SiteNav (no link row, no mobile menu): both are single
// tasks to finish (register, or read about one class) rather than
// somewhere that invites wandering off to another section.
export function SubPageHeader({ lang, setLang, isDark, toggleTheme }: {
  lang: Lang; setLang: (l: Lang) => void; isDark: boolean; toggleTheme: () => void;
}) {
  const t = useT();
  const href = useLocaleHref();
  return (
    <nav className={`${BAND_PANEL} border-b border-gray-100 dark:border-white/10`}>
      <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link to={href('/')} className="flex items-center gap-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#14151A] dark:hover:text-white transition">
          <FiArrowLeft size={15} />
          <img src={`${MEDIA}/logo.png`} alt="Judo Otoshi" className="h-8 w-8 object-contain" />
          <span className="hidden sm:inline">{t.register.backToSite}</span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageToggle lang={lang} onChange={setLang} names={{ en: 'English', fr: 'Français' }} />
          <DarkModeToggle isDark={isDark} onToggle={toggleTheme} size={17} />
        </div>
      </div>
    </nav>
  );
}
