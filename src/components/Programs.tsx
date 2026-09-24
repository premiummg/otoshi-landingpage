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
              {/* flex! flex-col! items-stretch! justify-start!: MediaCard
                  renders a <button> here (it gets an onClick), and a
                  <button>'s default rendering centers its content block
                  vertically when that content is shorter than the button's
                  own height - confirmed by measuring actual rendered
                  boxes in a real browser: Beginner/Elite's longer body
                  text fills the card almost exactly (1px of slack, split
                  1px above/1px below - invisible), while Intermediate/
                  Adult's shorter body wraps to fewer lines, leaving ~25px
                  of slack that gets split ~12px above/12px below - visible
                  as a gap between the card's rounded top and the photo,
                  and genuinely nothing to do with this card's own reveal
                  animation, an image loading race, or the grid's column
                  widths (all ruled out first). Forcing a real flex column
                  with top-aligned content overrides that default:
                  `!important` because a plain `flex` utility loses to
                  the button's own internal treatment otherwise. */}
              <MediaCard
                imageSrc={webp(p.img)}
                imageAlt={p.name}
                title={p.name}
                eyebrow={p.ages}
                eyebrowColor={NAVY_ACCENT}
                onClick={() => navigate(href(`/programs/${p.key}`))}
                className="flex! flex-col! items-stretch! justify-start!"
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
