import { FiHeart, FiShield, FiUsers } from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { FeatureCard, Reveal } from '@premiummg/ui';
import { useT } from '../lang';
import { BAND_PANEL } from '../palette';

const ICONS: IconType[] = [FiHeart, FiShield, FiUsers];

// FeatureCard's own `align="center"` is exactly this layout - the doc
// comment on that prop names this section by name. The one thing it
// deliberately leaves out is the colored hover-fill icon chip below: that's
// a single-brand treatment layered on top via `className="group"` (so the
// chip's own `group-hover:` can target FeatureCard's root) rather than a
// feature of the shared component itself.
export function Community() {
  const t = useT();
  return (
    <section className={BAND_PANEL}>
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-5">
          {t.community.items.map((c, i) => {
            const Icon = ICONS[i];
            return (
              <Reveal key={c.title} delay={i * 80}>
                <FeatureCard
                  align="center"
                  title={c.title}
                  className="group transition-shadow duration-200 hover:shadow-md dark:hover:shadow-black/30"
                  icon={
                    // dark:group-hover: written out explicitly, not left to
                    // fall back on the plain group-hover: rule - Tailwind
                    // emits dark: after group-hover: in this build, so a
                    // bare dark:bg-.../40 resting rule quietly outranks
                    // group-hover:bg-... the instant both conditions are
                    // true, and the hover fill never shows in dark mode.
                    <div className="w-11 h-11 rounded-lg grid place-items-center bg-[#1A2C6E]/10 dark:bg-[#1A2C6E]/40 transition-colors duration-200 group-hover:bg-[#1A2C6E] dark:group-hover:bg-[#1A2C6E]">
                      <Icon size={20} className="text-[#1A2C6E] dark:text-[#9FB2EE] transition-colors duration-200 group-hover:text-white dark:group-hover:text-white" />
                    </div>
                  }
                >
                  {c.body}
                </FeatureCard>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
