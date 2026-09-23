import { useNavigate } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import { MediaCard, SiteButton, Reveal } from '@premiummg/ui';
import { SectionHead } from './SectionHead';
import { useT } from '../lang';
import { useLocaleHref } from '../lib/useLocaleHref';
import { NAVY, NAVY_ACCENT, webp, BAND_PANEL } from '../palette';

// Malcolm's fix, and the one item with the most day-to-day confusion behind
// it: the live site runs six overlapping age tiers. Four tiers here, each
// named for who it is rather than what it costs to overlap-check against
// the others.
export function Programs({ go }: { go: (id: string) => void }) {
  const t = useT();
  const navigate = useNavigate();
  const href = useLocaleHref();
  return (
    <section id="programs" className={BAND_PANEL}>
      <div className="max-w-6xl mx-auto px-6 py-20 md:py-24">
        <Reveal><SectionHead eyebrow={t.programs.eyebrow} title={t.programs.title} color={NAVY_ACCENT} /></Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
          {t.programs.items.map((p, i) => (
            <Reveal key={p.key} delay={i * 80}>
              <MediaCard
                imageSrc={webp(p.img)}
                imageAlt={p.name}
                title={p.name}
                eyebrow={p.ages}
                eyebrowColor={NAVY_ACCENT}
                onClick={() => navigate(href(`/programs/${p.key}`))}
              >
                {p.body}
              </MediaCard>
            </Reveal>
          ))}
        </div>

        <Reveal delay={340}>
          <div className="mt-8 rounded-2xl p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
               style={{ backgroundColor: NAVY }}>
            <div>
              <h3 className="font-heading font-extrabold text-lg text-white">{t.programs.trial.title}</h3>
              <p className="text-sm text-white/75 mt-1.5 max-w-md">{t.programs.trial.body}</p>
            </div>
            <SiteButton variant="onDark" onClick={() => go('contact')} className="shrink-0">
              {t.programs.trial.cta} <FiArrowRight size={15} />
            </SiteButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
