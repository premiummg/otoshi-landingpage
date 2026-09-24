import { useT } from '../lang';
import { webp, BAND_PANEL } from '../palette';

// width/height are the real pixel dimensions of the WebP files, present
// only so the browser can reserve the right box before the image arrives.
// CSS (`h-9 w-auto`) still decides the drawn size; without them these two
// logos land late and shove the whole section, which is measured as layout
// shift.
// Exported so Footer's own "Proudly supported by" column can reuse the
// same file/url data for its smaller sponsor tiles, instead of a second
// hand-maintained copy of these two sponsors.
export const SPONSORS = [
  { file: 'sponsor-lumar.png', name: 'Lumar Electric', width: 400, height: 146, url: 'https://lumarelectric.ca/' },
  { file: 'sponsor-max.jpg', name: 'Max Health', width: 400, height: 203, url: 'https://www.maxhealthnb.ca/' },
];

export function Sponsors() {
  const t = useT();
  return (
    <div className={`${BAND_PANEL} border-t border-b border-gray-100 dark:border-white/10`}>
      <div className="max-w-6xl mx-auto px-6 py-14">
        {/* dark:text-white, not the muted dark:text-gray-500 this started
            as - this section's own bg (BAND_PANEL) goes to a near-black
            #1B1B22 in dark mode, where that gray read as barely legible.
            Kept a readable gray in light mode instead of plain white there
            too, since white-on-white (this band is bg-white in light mode)
            would just disappear. */}
        <p className="pmg-eyebrow text-gray-400 dark:text-white text-center mb-8">{t.sponsors.label}</p>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {SPONSORS.map(s => (
            // Both logo files are flattened onto a plain white background
            // (sponsor-max.jpg has no alpha at all, and sponsor-lumar.png's
            // transparency still needs a light surface behind it to read),
            // so a plain img sitting on this section's own background used
            // to show as a bare, differently-sized wordmark floating in a
            // row - fine in light mode, a stray white rectangle in dark
            // mode. Giving each one its own fixed-size white card fixes
            // both: consistent size regardless of the source logo's own
            // aspect ratio, and a surface that always matches the logo's
            // own background instead of whatever mode the site is in.
            <a
              key={s.file}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-28 w-56 items-center justify-center rounded-2xl bg-white border border-gray-200 dark:border-white/10 shadow-sm px-8 py-5 transition hover:shadow-lg hover:-translate-y-0.5"
            >
              <img src={webp(s.file)} alt={s.name} loading="lazy" width={s.width} height={s.height}
                   className="h-full w-full object-contain transition group-hover:scale-105" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
