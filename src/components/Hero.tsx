import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiPhone } from 'react-icons/fi';
import { Hero as UiHero } from '@premiummg/ui';
import { useT } from '../lang';
import { useLocaleHref } from '../lib/useLocaleHref';
import { NAVY, NAVY_DARK, MEDIA, webp, PHONE } from '../palette';

// Hero owns its primary CTA's <button> internally - no style/className
// passthrough reaches it, so there's no prop from this page that can recolor
// it directly. What DOES reach it: the plain CSS custom-property cascade.
// The button's own class resolves color via `var(--premium-red)`, and CSS
// variables resolve to the nearest ancestor that defines them - so
// redefining those two variables on a wrapper scoped to just this Hero
// recolors its button without touching the package at all. Nothing else
// inside Hero (in this exact configuration - eyebrowTone="amber", wedge
// off) reads either variable, so the override is safely scoped.
const HERO_ACCENT_OVERRIDE = {
  '--premium-red': NAVY,
  '--premium-red-dark': NAVY_DARK,
} as CSSProperties;

// hero.mp4 is a 10-second, muted, silent-loop trim of real judo footage -
// not shot at the Dieppe dojo, so it's a placeholder for the club's own
// footage rather than a claim about what it shows, swapped for real club
// video before this goes live. hero-poster.jpg is its first frame, so the
// hero paints before the clip loads.
//
// Deliberately NOT the wedge (`wedge` stays false, @premiummg/ui's default):
// that 45deg device is Premium's own signature, and a sister brand wearing
// another company's signature is exactly what makes an independent club
// look like a reskinned Premium page instead of its own identity. `overlay`
// stays at its own default (`"scrim"`, the plain black gradient) rather
// than `"acadian"` - just this page's own choice, not a package change.
export function Hero({ go }: { go: (id: string) => void }) {
  const t = useT();
  const navigate = useNavigate();
  const href = useLocaleHref();

  return (
    <div style={HERO_ACCENT_OVERRIDE}>
      <UiHero
        eyebrow={t.hero.eyebrow}
        eyebrowTone="amber"
        title={t.hero.title}
        sub={t.hero.sub}
        imageSrc={webp('hero-poster.jpg')}
        videoSrc={`${MEDIA}/hero.mp4`}
        primaryAction={{ label: t.hero.cta, onClick: () => navigate(href('/register')) }}
        secondaryAction={{ label: t.hero.alt, onClick: () => go('programs') }}
        caption={
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div>
              <p className="pmg-eyebrow text-white/50">{t.hero.locationLabel}</p>
              <p className="inline-flex items-center gap-1.5 text-sm text-white/90 mt-1.5">
                <FiMapPin size={13} /> {t.hero.location}
              </p>
            </div>
            <div>
              <p className="pmg-eyebrow text-white/50">{t.hero.phoneLabel}</p>
              <a href={`tel:${PHONE.replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-1.5 text-sm text-white/90 mt-1.5 hover:text-white transition">
                <FiPhone size={13} /> {PHONE}
              </a>
            </div>
          </div>
        }
      />
    </div>
  );
}
