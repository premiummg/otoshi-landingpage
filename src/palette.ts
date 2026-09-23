// Otoshi's own colours, sampled from the club's own logo - not Premium's.
// See each component for how they're used; kept here once so every section
// references the same values rather than re-typing hex literals.
//
//   #1A2C6E  Otoshi Navy    the flag ground behind the belt knot, and the
//                           colour every one of the club's own program badges
//                           already uses.
//   #9C1519  Otoshi Maroon  the crossed belt itself - this club's one accent
//                           colour (CTAs, links, the one full-bleed field).
//   #FFA810  Otoshi Gold    the five-pointed star on the flag and the ring
//                           text ("JUDO OTOSHI"). Attention channel, not CTA.

export const NAVY = '#1A2C6E';
export const NAVY_DARK = '#12204F';
// NAVY itself is too dark to read as small TEXT sitting directly on a card/
// page background (a stat number, an eyebrow line) - it works fine as a
// solid FILL with white text on top (a button, a band, PortraitFigure's
// tag) because that's a self-contained high-contrast unit regardless of
// theme, but the same hex as foreground text on a dark card was nearly
// invisible. This is the same hue, several steps brighter, for exactly
// that "color on a background" case - use NAVY for fills, this for text/
// number accents.
export const NAVY_ACCENT = '#4C6EF5';
export const MAROON = '#9C1519';
export const MAROON_DARK = '#750F13';
export const GOLD = '#FFA810';

export const BAND_PANEL = 'bg-white dark:bg-[#1B1B22]';
export const BAND_GROUND = 'bg-[#F1F2F6] dark:bg-[#101014]';
export const CARD_ON_GROUND = 'bg-white dark:bg-[#1B1B22] border border-gray-200 dark:border-white/10';
export const CARD_ON_PANEL = 'bg-white dark:bg-[#26262F] border border-gray-200 dark:border-white/10';

export const H1_INK = 'text-[#14151A] dark:text-white';
export const BODY_INK = 'text-gray-600 dark:text-gray-400';

export const PHONE = '(438) 881-7766';
export const EMAIL = 'judo.otoshi.dieppe@gmail.com';
export const MEDIA = '/media';
