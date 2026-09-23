import { FiAward } from 'react-icons/fi';
import { Reveal } from '@premiummg/ui';
import { SectionHead } from './SectionHead';
import { useT } from '../lang';
import { NAVY_ACCENT, GOLD, BAND_GROUND, CARD_ON_GROUND, H1_INK } from '../palette';

// Real content from the live homepage, kept as-is: the newcomer program and
// its five benefits are genuinely good, on-brand copy nothing here changes.
export function JudoForAll() {
  const t = useT();
  return (
    <section className={BAND_GROUND}>
      <div className="max-w-6xl mx-auto px-6 py-20 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
        <Reveal>
          <SectionHead eyebrow={t.judoForAll.eyebrow} title={t.judoForAll.title} sub={t.judoForAll.body} color={NAVY_ACCENT} />
        </Reveal>
        <Reveal delay={100}>
          <ul className="grid sm:grid-cols-2 gap-3">
            {t.judoForAll.benefits.map(b => (
              <li key={b} className={`flex items-start gap-2.5 rounded-xl p-4 ${CARD_ON_GROUND}`}>
                <FiAward size={16} className="mt-0.5 shrink-0" style={{ color: GOLD }} />
                <span className={`text-sm leading-snug ${H1_INK}`}>{b}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
