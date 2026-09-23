import { useEffect, useRef, useState } from 'react';
import { FiArrowUp } from 'react-icons/fi';
import { NAVY } from '../palette';

// The one navigation affordance a long marketing page needs: once you've
// scrolled far enough that the nav is out of reach, a corner button gets
// you back to it in one motion.
//
// `position: sticky` was the first attempt, scoped to a containing ref -
// but that ref's own `overflow-hidden` (needed for its rounded corners)
// makes it the element's sticky SCROLL CONTAINER by spec, so it never
// scrolls internally and sticky has nothing to stick against. The next
// attempt kept `fixed` and switched visibility with two IntersectionObservers
// on 1px sentinels - measured as broken too, under direct inspection: a
// fresh observer attached after the scroll had already happened still
// hadn't fired a single callback two seconds later. This reverts to the
// plainest mechanism: a scroll listener reading getBoundingClientRect on two
// sentinels directly, on every scroll event - less elegant, but what
// actually measured as working.
export function BackToTop({ go }: { go: (id: string) => void }) {
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const top = topSentinelRef.current?.getBoundingClientRect();
      const bottom = bottomSentinelRef.current?.getBoundingClientRect();
      const pastTop = !!top && top.top < 0;
      const beforeBottom = !!bottom && bottom.top > window.innerHeight * 0.5;
      setShow(pastTop && beforeBottom);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <>
      <div ref={topSentinelRef} className="absolute top-20 h-px w-px" aria-hidden="true" />
      <div ref={bottomSentinelRef} className="absolute bottom-0 h-px w-px" aria-hidden="true" />
      <button
        onClick={() => go('top')}
        aria-label="Back to top"
        tabIndex={show ? 0 : -1}
        className={`fixed bottom-6 right-6 z-30 w-11 h-11 rounded-full grid place-items-center text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 ${
          show ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
        style={{ backgroundColor: NAVY }}
      >
        <FiArrowUp size={18} />
      </button>
    </>
  );
}
