import { PortraitFigure, Reveal } from '@premiummg/ui';
import { SectionHead } from './SectionHead';
import { useT } from '../lang';
import { NAVY, NAVY_ACCENT, webp, BAND_GROUND, H1_INK, BODY_INK } from '../palette';

// Malcolm's fix: the live paragraph used to close on a stale "two locations"
// claim. The etymology stays - genuinely good, distinctive copy - but it now
// closes on the club's own numbers instead, a claim years don't undo.
export function Who() {
  const t = useT();
  return (
    <section id="who" className={BAND_GROUND}>
      <div className="max-w-6xl mx-auto px-6 py-20 md:py-24 grid lg:grid-cols-2 gap-14 items-center">
        <Reveal>
          <SectionHead eyebrow={t.who.eyebrow} title={t.who.title} color={NAVY_ACCENT} />
          <p className={`text-base leading-relaxed mt-6 ${BODY_INK}`}>{t.who.body}</p>
          <p className={`text-base leading-relaxed mt-4 ${BODY_INK}`}>{t.who.body2}</p>

          <div className="flex gap-12 mt-10">
            <div>
              <p className={`pmg-figure text-5xl leading-none ${H1_INK}`}>{t.who.figure}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-35">{t.who.figureLabel}</p>
            </div>
            <div className="pl-12 border-l border-gray-200 dark:border-white/15">
              <p className={`pmg-figure text-5xl leading-none ${H1_INK}`}>{t.who.figure2}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-35">{t.who.figureLabel2}</p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <PortraitFigure
            imageSrc={webp('hero-tall.jpg')}
            name="Judo Otoshi"
            role="Dieppe, NB"
            color={NAVY}
          />
        </Reveal>
      </div>
    </section>
  );
}
