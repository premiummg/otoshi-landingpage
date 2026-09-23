import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiMenu } from 'react-icons/fi';
import { SiteButton, LanguageToggle, DarkModeToggle, type Lang } from '@premiummg/ui';
import { useT } from '../lang';
import { useLocaleHref } from '../lib/useLocaleHref';
import { GOLD, NAVY, webp, BAND_PANEL } from '../palette';

// A real marketing nav (logo, link row, mobile menu) - not @premiummg/ui's
// `Navbar`, which hardcodes `PremiumLogo` and is scoped to a slim app-chrome
// bar, not a full public-site nav with its own link row and mobile menu. The
// language toggle, dark-mode toggle and CTA button underneath it ARE shared
// components; only the shell composing them is page-local, same reasoning
// `Navbar` itself already documents for why it doesn't own real nav items.
export function SiteNav({ lang, setLang, go, isDark, toggleTheme }: {
  lang: Lang; setLang: (l: Lang) => void;
  go: (id: string) => void; isDark: boolean; toggleTheme: () => void;
}) {
  const t = useT();
  const navigate = useNavigate();
  const href = useLocaleHref();
  const [openMenu, setOpenMenu] = useState(false);

  const linkCls = 'relative py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-[#14151A] dark:hover:text-white transition-colors after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-0 after:bg-[#FFA810] after:transition-all after:duration-200 hover:after:w-full';

  return (
    <div className="sticky top-0 z-20">
      <nav className={`${BAND_PANEL} border-b border-gray-100 dark:border-white/10`}>
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between gap-6">
          <button onClick={() => go('top')} className="shrink-0 flex items-center gap-2.5">
            <img src={webp('logo.png')} alt="Judo Otoshi" width={44} height={44} className="h-11 w-11 object-contain" />
            <span className="font-heading font-black text-lg leading-none text-[#14151A] dark:text-white hidden sm:block">
              Judo Otoshi
            </span>
          </button>

          <div className="hidden lg:flex items-center gap-7">
            <button onClick={() => go('top')} className={linkCls}>{t.nav.home}</button>
            <button onClick={() => go('who')} className={linkCls}>{t.nav.about}</button>
            <button onClick={() => go('schedule')} className={linkCls}>{t.nav.schedule}</button>
            <button onClick={() => go('contact')} className={linkCls}>{t.nav.contact}</button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <LanguageToggle
              lang={lang}
              onChange={setLang}
              names={{ en: 'English', fr: 'Français' }}
            />
            <DarkModeToggle isDark={isDark} onToggle={toggleTheme} size={17} />
            {/* Hidden until `lg` (matching the full nav-link row above), not
                `sm` - LanguageToggle always renders both flags+labels with
                no compact mode, and the French CTA text ("Joindre le Club
                Otoshi") is long enough that showing this alongside the
                toggle, dark-mode button, and hamburger overflowed the row
                horizontally on narrower screens. The hamburger's own open
                menu already has a full-width CTA, so nothing is lost below
                `lg`.
                `hidden!`, not plain `hidden` - SiteButton's own base class
                list already includes an unconditional `inline-flex`, which
                the compiled stylesheet happens to declare AFTER `.hidden`;
                equal specificity plus later source order meant that base
                `inline-flex` was silently winning the cascade at every
                width, so `hidden` never actually did anything. `!important`
                forces it through regardless of generated rule order. */}
            <SiteButton onClick={() => navigate(href('/register'))} style={{ backgroundColor: NAVY }} className="px-4! py-2.5! hidden! lg:inline-flex">
              {t.nav.cta}
            </SiteButton>
            <button onClick={() => setOpenMenu(o => !o)} aria-label="Menu"
                    className="lg:hidden w-9 h-9 rounded-lg grid place-items-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition">
              {openMenu ? <FiX size={19} /> : <FiMenu size={19} />}
            </button>
          </div>
        </div>

        {openMenu && (
          <div className="lg:hidden border-t border-gray-100 dark:border-white/10 px-6 py-4 space-y-1">
            {[{ label: t.nav.home, id: 'top' }, { label: t.nav.about, id: 'who' }, { label: t.nav.schedule, id: 'schedule' }, { label: t.nav.contact, id: 'contact' }].map(l => (
              <button key={l.id} onClick={() => { setOpenMenu(false); go(l.id); }}
                      className="block w-full text-left py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-[#14151A] dark:hover:text-white transition">
                {l.label}
              </button>
            ))}
            <div className="pt-3">
              <SiteButton onClick={() => { setOpenMenu(false); navigate(href('/register')); }} style={{ backgroundColor: NAVY }} className="w-full">
                {t.nav.cta}
              </SiteButton>
            </div>
          </div>
        )}
      </nav>
      <div className="h-0.75" style={{ backgroundColor: GOLD }} />
    </div>
  );
}
