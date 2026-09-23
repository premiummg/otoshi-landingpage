// Page-owned copy of @premiummg/ui's own SectionHead layout - that shared
// component's eyebrow is hardcoded to Premium red with no color/className/
// style passthrough to reach it, so a sister brand's own accent (Otoshi's
// maroon) can't be applied to it from the outside at all. Rather than touch
// the shared package, this replicates the same markup locally, fully owned
// by this page, with a `color` prop on the one piece that needs it.
export function SectionHead({ eyebrow, title, sub, color, center = false }: {
  eyebrow: string; title: string; sub?: string; color?: string; center?: boolean;
}) {
  return (
    <div className={`max-w-3xl ${center ? 'mx-auto text-center' : ''}`}>
      <p className="pmg-eyebrow" style={color ? { color } : undefined}>{eyebrow}</p>
      <h2 className="font-heading font-black text-3xl md:text-4xl leading-[1.1] mt-3 text-(--premium-black) dark:text-white">
        {title}
      </h2>
      {sub && <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-400">{sub}</p>}
    </div>
  );
}
