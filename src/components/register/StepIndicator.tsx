import { MAROON } from '../../palette';

// A plain numbered row, not @premiummg/ui's SegmentedControl - that's a
// mutually-exclusive CHOICE control with no ordering of its own; this one
// keeps the sequential "step N of M" reading (later steps stay visually
// muted) while still letting a visited step be clicked to jump back and
// edit it - a future, not-yet-reached step stays a plain unclickable dot,
// since its own data depends on steps before it that haven't been filled in
// yet.
export function StepIndicator({ steps, current, maxReached, onStepClick }: {
  steps: string[];
  current: number;
  maxReached: number;
  onStepClick: (i: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-10">
      {steps.map((label, i) => {
        const reached = i <= maxReached;
        return (
          <div key={label} className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => reached && onStepClick(i)}
              disabled={!reached}
              aria-current={i === current ? 'step' : undefined}
              className={`flex flex-col items-center gap-1.5 ${reached ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div
                className={`w-8 h-8 rounded-full grid place-items-center text-xs font-heading font-bold transition-colors ${
                  i <= current ? 'text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500'
                } ${reached && i !== current ? 'hover:opacity-80' : ''}`}
                style={i <= current ? { backgroundColor: MAROON } : undefined}
              >
                {i + 1}
              </div>
              <span className={`hidden sm:block text-[11px] font-medium text-center max-w-24 ${
                i <= current ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'
              }`}>
                {label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <div className={`w-6 sm:w-12 h-0.5 rounded-full ${i < current ? '' : 'bg-gray-200 dark:bg-white/10'}`}
                   style={i < current ? { backgroundColor: MAROON } : undefined} />
            )}
          </div>
        );
      })}
    </div>
  );
}
