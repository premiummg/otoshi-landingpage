import { FiClock, FiMapPin } from 'react-icons/fi';
import { SiteButton, Reveal } from '@premiummg/ui';
import { SectionHead } from './SectionHead';
import { useT } from '../lang';
import { NAVY_ACCENT, BAND_PANEL, CARD_ON_PANEL, H1_INK, BODY_INK } from '../palette';

// Malcolm's fixes, two rounds now: the Riverview table went first (one
// dojo, one timetable), and this round replaces the "Mon-Fri" summary rows
// with a real day-by-day breakdown - from the club's own 2026-2027
// activities calendar he sent as reference, since he flagged the old
// grouped-by-range format as hard to follow.
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
            <div className="divide-y divide-gray-100 dark:divide-white/10">
              {t.schedule.days.map(d => (
                <div key={d.day} className="px-6 py-4 flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-6">
                  <p className={`text-sm font-heading font-bold shrink-0 sm:w-28 ${H1_INK}`}>{d.day}</p>
                  {d.classes.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic">{t.schedule.closedLabel}</p>
                  ) : (
                    <ul className="space-y-1.5 flex-1">
                      {d.classes.map((c, i) => (
                        <li key={i} className="flex flex-wrap items-baseline gap-x-3 text-sm">
                          <span className="pmg-figure text-gray-900 dark:text-gray-100 whitespace-nowrap">{c.time}</span>
                          <span className={`font-medium ${H1_INK}`}>{c.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
          {t.schedule.notes.map((note, i) => (
            <p key={i} className={`text-xs mt-2 first:mt-4 ${BODY_INK}`}>{note}</p>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
