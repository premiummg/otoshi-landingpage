import { FiClock, FiMapPin } from 'react-icons/fi';
import { SiteButton, Reveal } from '@premiummg/ui';
import { SectionHead } from './SectionHead';
import { useT } from '../lang';
import { NAVY_ACCENT, BAND_PANEL, CARD_ON_PANEL, H1_INK, BODY_INK } from '../palette';

// Malcolm's fix, three parts at once: the Riverview table is gone (one
// dojo, one timetable), the paragraph that used to sit above the table is
// gone (the table already says what it needs to), and the section is
// reachable from a button both in the nav and right here.
//
// A plain <table>, not @premiummg/ui's `ScrollableTable` - that component's
// scroll-fade/chevron affordances are for a wide or tall DATA table; this is
// 8 short rows that never need to scroll.
export function Schedule({ go }: { go: (id: string) => void }) {
  const t = useT();
  return (
    <section id="schedule" className={BAND_PANEL}>
      <div className="max-w-6xl mx-auto px-6 py-20 md:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
          <SectionHead eyebrow={t.schedule.eyebrow} title={t.schedule.title} color={NAVY_ACCENT} />
          <SiteButton variant="ghost" onClick={() => go('schedule')} className="shrink-0">
            <FiClock size={15} /> {t.schedule.jumpCta}
          </SiteButton>
        </div>

        <Reveal delay={100}>
          <div className={`mt-8 rounded-2xl overflow-hidden ${CARD_ON_PANEL}`}>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
              <FiMapPin size={14} className={BODY_INK} />
              <p className={`text-sm font-heading font-bold ${H1_INK}`}>{t.schedule.address}</p>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {t.schedule.rows.map((r, i) => (
                  <tr key={i} className="border-t border-gray-100 dark:border-white/10 first:border-0">
                    <td className="px-6 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{r.day}</td>
                    <td className="px-6 py-3 pmg-figure text-gray-900 dark:text-gray-100 whitespace-nowrap">{r.time}</td>
                    <td className={`px-6 py-3 font-medium ${H1_INK}`}>{r.level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={`text-xs mt-4 ${BODY_INK}`}>{t.schedule.footnote}</p>
        </Reveal>
      </div>
    </section>
  );
}
