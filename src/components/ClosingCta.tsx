import { useNavigate } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import { Eyebrow, SiteButton, Reveal } from '@premiummg/ui';
import { useT } from '../lang';
import { useLocaleHref } from '../lib/useLocaleHref';
import { NAVY_DARK, PHONE } from '../palette';

export function ClosingCta() {
  const t = useT();
  const navigate = useNavigate();
  const href = useLocaleHref();
  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: NAVY_DARK }}>
      <div className="absolute inset-0 pmg-bars pointer-events-none" />
      <div className="relative max-w-6xl mx-auto px-6 py-20 text-center">
        <Reveal>
          <Eyebrow tone="white" text={t.cta.eyebrow} />
          <h2 className="font-heading font-black text-3xl md:text-4xl text-white leading-[1.1] mt-3 max-w-2xl mx-auto">
            {t.cta.title}
          </h2>
          <p className="text-white/75 mt-4 max-w-xl mx-auto">{t.cta.sub}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-9">
            <SiteButton variant="onDark" onClick={() => navigate(href('/register'))}>
              {t.cta.button} <FiArrowRight size={16} />
            </SiteButton>
            <p className="text-sm text-white/70">
              {t.cta.or}{' '}
              <a href={`tel:${PHONE.replace(/[^\d+]/g, '')}`} className="font-heading font-bold text-white hover:underline">
                {PHONE}
              </a>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
