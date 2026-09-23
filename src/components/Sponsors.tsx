import { useT } from '../lang';
import { webp, BAND_PANEL } from '../palette';

// width/height are the real pixel dimensions of the WebP files, present
// only so the browser can reserve the right box before the image arrives.
// CSS (`h-9 w-auto`) still decides the drawn size; without them these two
// logos land late and shove the whole section, which is measured as layout
// shift.
const SPONSORS = [
  { file: 'sponsor-lumar.png', name: 'Lumar Electric', width: 400, height: 146 },
  { file: 'sponsor-max.jpg', name: 'Max Health', width: 400, height: 203 },
];

export function Sponsors() {
  const t = useT();
  return (
    <div className={`${BAND_PANEL} border-t border-b border-gray-100 dark:border-white/10`}>
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* dark:text-white, not the muted dark:text-gray-500 this started
            as - this section's own bg (BAND_PANEL) goes to a near-black
            #1B1B22 in dark mode, where that gray read as barely legible.
            Kept a readable gray in light mode instead of plain white there
            too, since white-on-white (this band is bg-white in light mode)
            would just disappear. */}
        <p className="pmg-eyebrow text-gray-400 dark:text-white text-center mb-6">{t.sponsors.label}</p>
        <div className="flex flex-wrap items-center justify-center gap-10">
          {SPONSORS.map(s => (
            <img key={s.file} src={webp(s.file)} alt={s.name} loading="lazy" width={s.width} height={s.height}
                 className="h-9 w-auto object-contain hover:opacity-70 hover:grayscale transition" />
          ))}
        </div>
      </div>
    </div>
  );
}
