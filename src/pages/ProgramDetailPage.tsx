import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiClock } from 'react-icons/fi';
import { SiteButton, Reveal } from '@premiummg/ui';
import { useT, LangCtx } from '../lang';
import { useLocaleHref } from '../lib/useLocaleHref';
import { COPY } from '../copy';
import type { PageProps } from './HomePage';
import { SubPageHeader } from '../components/SubPageHeader';
import { BAND_GROUND, CARD_ON_GROUND, H1_INK, BODY_INK, NAVY, MEDIA } from '../palette';

// Malcolm asked whether clicking a class on the main page opens a more
// elaborate explanation "like our old website" - it didn't, so this is that
// page. The old site is now a private WordPress.com install with nothing
// public left to pull the original copy from (confirmed - even the bare
// domain redirects to a "this site is private" placeholder), so the longer
// descriptions here are new copy, not a recovered original - worth a pass
// from Malcolm before it's final, same as everything else content-related.
export function ProgramDetailPage(props: PageProps) {
  return (
    <LangCtx.Provider value={COPY[props.lang]}>
      <ProgramDetail {...props} />
    </LangCtx.Provider>
  );
}

function ProgramDetail({ lang, setLang, isDark, toggleTheme }: PageProps) {
  const t = useT();
  const navigate = useNavigate();
  const href = useLocaleHref();
  const { key } = useParams<{ key: string }>();
  const program = t.programs.items.find(p => p.key === key);
  const d = t.programs.detail;

  if (!program) {
    return (
      <div className={`min-h-screen ${BAND_GROUND}`}>
        <SubPageHeader lang={lang} setLang={setLang} isDark={isDark} toggleTheme={toggleTheme} />
        <div className="max-w-lg mx-auto px-6 py-24 text-center">
          <h1 className="font-heading font-black text-2xl text-(--premium-black) dark:text-white">{d.notFoundTitle}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">{d.notFoundBody}</p>
          <Link to={href('/')} className="inline-flex items-center gap-2 mt-8 text-sm font-medium hover:underline" style={{ color: NAVY }}>
            <FiArrowLeft size={15} /> {d.backToPrograms}
          </Link>
        </div>
      </div>
    );
  }

  // Cross-referenced from `schedule.days` by class name, rather than a
  // second hand-maintained copy of the schedule - a day appears here only
  // if one of its classes' names is in this program's own `classNames`.
  const meetings = t.schedule.days.flatMap(day =>
    day.classes.filter(c => program.classNames.includes(c.name)).map(c => ({ day: day.day, ...c })),
  );

  return (
    <div className={`min-h-screen ${BAND_GROUND}`}>
      <SubPageHeader lang={lang} setLang={setLang} isDark={isDark} toggleTheme={toggleTheme} />

      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to={href('/')} className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-(--premium-black) dark:hover:text-white transition">
          <FiArrowLeft size={15} /> {d.backToPrograms}
        </Link>

        <Reveal>
          <div className="mt-6 rounded-2xl overflow-hidden aspect-[16/9]">
            <img src={`${MEDIA}/${program.img}`} alt={program.name} className="w-full h-full object-cover" />
          </div>

          <p className="pmg-eyebrow mt-6" style={{ color: NAVY }}>{program.ages}</p>
          <h1 className="font-heading font-black text-3xl md:text-4xl leading-[1.1] mt-2 text-(--premium-black) dark:text-white">
            {program.name}
          </h1>

          <div className="mt-6 space-y-4">
            {program.long.map((paragraph, i) => (
              <p key={i} className={`text-base leading-relaxed ${BODY_INK}`}>{paragraph}</p>
            ))}
          </div>

          {meetings.length > 0 && (
            <div className={`mt-8 rounded-2xl p-6 ${CARD_ON_GROUND}`}>
              <p className={`flex items-center gap-2 pmg-eyebrow ${H1_INK}`}><FiClock size={13} /> {d.whenItMeets}</p>
              <ul className="mt-4 space-y-2">
                {meetings.map((m, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-4 text-sm">
                    <span className={`font-medium ${H1_INK}`}>{m.day}</span>
                    <span className="pmg-figure text-gray-600 dark:text-gray-400 text-right">{m.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <SiteButton onClick={() => navigate(href('/register'))} style={{ backgroundColor: NAVY }} className="mt-8">
            {d.cta}
          </SiteButton>
        </Reveal>
      </div>
    </div>
  );
}
