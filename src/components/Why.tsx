import { StatBlock, Reveal } from '@premiummg/ui';
import { SectionHead } from './SectionHead';
import { useT } from '../lang';
import { NAVY_ACCENT, BAND_GROUND, BODY_INK } from '../palette';

// The three numbers and the footnote are verbatim from the live homepage -
// real IJF figures, not placeholder stats.
export function Why() {
  const t = useT();
  return (
    <section className={BAND_GROUND}>
      <div className="max-w-6xl mx-auto px-6 py-20 md:py-24">
        <Reveal><SectionHead eyebrow={t.why.eyebrow} title={t.why.title} center /></Reveal>
        <div className="grid sm:grid-cols-3 gap-5 mt-12 max-w-2xl mx-auto">
          {t.why.stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 90}>
              <StatBlock value={s.value} label={s.label} color={NAVY_ACCENT} />
            </Reveal>
          ))}
        </div>
        <p className={`text-xs text-center mt-6 ${BODY_INK}`}>{t.why.footnote}</p>
      </div>
    </section>
  );
}
