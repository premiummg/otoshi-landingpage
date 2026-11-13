// Classes, schedules and prices confirmed directly by Malcolm (club contact)
// by email, replacing the placeholder list that was only inferred from the
// old form's raw page source. Two things he was explicit about:
// - Schedule/price options are scoped to their class, not a shared global
//   list - "We can't have a Ninja doing 12 hours of judo."
// - Adults get 50% off when the household already has a kid registered.
export interface ScheduleOption {
  key: string;
  // English only, and it is what the FR form and the club email show too.
  // The timetable in copy.ts restates the same days/times: keep the two in
  // sync by hand when a class changes.
  schedule: string;
  price: number;
}

export interface ClassLevel {
  key: string;
  name: string;
  schedules: ScheduleOption[];
}

export const KIDS_LEVELS: ClassLevel[] = [
  {
    key: 'ninja',
    name: 'Ninja',
    schedules: [
      { key: 'ninja-1', schedule: '1 class/week, 45 min (Saturday)', price: 50 },
    ],
  },
  {
    key: 'beginner',
    name: 'Beginner',
    schedules: [
      { key: 'beginner-1', schedule: '2 classes/week, 1 hour each (Tuesday & Thursday)', price: 80 },
    ],
  },
  {
    key: 'intermediate',
    name: 'Intermediate',
    schedules: [
      { key: 'intermediate-1', schedule: '2 classes/week, 1h15 each (Monday & Friday)', price: 90 },
      { key: 'intermediate-2', schedule: '3 classes/week, 1h15 each (Monday, Wednesday & Friday)', price: 115 },
      { key: 'intermediate-3', schedule: '3 classes/week (Monday, Wednesday & Friday) + 1 conditioning class', price: 150 },
    ],
  },
  {
    key: 'elite',
    name: 'Elite',
    schedules: [
      { key: 'elite-1', schedule: '4 classes/week (Tuesday, Thursday, Friday & Saturday)', price: 195 },
      { key: 'elite-2', schedule: '4 classes/week + 1 conditioning class', price: 210 },
      { key: 'elite-3', schedule: '4 classes/week + 2 conditioning classes', price: 230 },
    ],
  },
];

export const ADULT_LEVELS: ClassLevel[] = [
  {
    key: 'adult',
    name: 'Adult',
    schedules: [
      { key: 'adult-1', schedule: '2 classes/week, 1h30 each (Monday & Wednesday)', price: 90 },
    ],
  },
];

// Malcolm's email: "50% off the adult class if they have a kid in any other
// class." Applied automatically to every adult's price whenever the same
// registration includes at least one kid (see `adultPrices`).
const PARENT_DISCOUNT_RATE = 0.5;

// Shared by the client price summary (Step3Registration) and the email
// (api/register.ts) so the two can't drift out of sync with each other -
// same reasoning as sharing RegisterFormData/Participant itself. A minimal
// structural type instead of importing Participant from registerTypes.ts,
// since this file has no other reason to depend on that one.
interface PricedParticipant {
  classKey: string;
  scheduleKey: string;
}

function participantFullPrice(p: PricedParticipant, levels: ClassLevel[]): number {
  return levels.find(l => l.key === p.classKey)?.schedules.find(sc => sc.key === p.scheduleKey)?.price ?? 0;
}

// Malcolm's email: "15% off for any other sibling in judo (the highest price
// class pays full class. Ex: two kids, one in elite and the other in
// beginner, elite pays in full, beginner has 15% off)." Read literally: in
// any household with several kids, the single highest-priced kid pays full
// and every other kid gets 15% off their own price. A tie for highest means
// the first of them pays full. Does NOT apply to adults (they have the 50%
// parent discount above instead).
const SIBLING_DISCOUNT_RATE = 0.15;

export interface PricedKid {
  full: number;
  discount: number;
  price: number;
}

export function kidPrices(kids: PricedParticipant[]): PricedKid[] {
  const fulls = kids.map(k => participantFullPrice(k, KIDS_LEVELS));
  const top = fulls.indexOf(Math.max(...fulls));
  return fulls.map((full, i) => {
    const discount = i === top ? 0 : full * SIBLING_DISCOUNT_RATE;
    return { full, discount, price: full - discount };
  });
}

// One source of truth for the whole price summary, used by the client form,
// the registration email and the Square checkout, so the three can't drift.
export function registrationTotals(data: { kids: PricedParticipant[]; adults: PricedParticipant[] }) {
  const kids = kidPrices(data.kids);
  const adults = adultPrices(data.adults, data.kids.length > 0);
  const fullSubtotal =
    kids.reduce((sum, k) => sum + k.full, 0) +
    adults.reduce((sum, a) => sum + a.full, 0);
  const siblingDiscount = kids.reduce((sum, k) => sum + k.discount, 0);
  const parentDiscount = adults.reduce((sum, a) => sum + a.discount, 0);
  const subtotalCents = Math.round((fullSubtotal - siblingDiscount - parentDiscount) * 100);
  const feeCents = Math.round(squareFee(subtotalCents / 100) * 100);
  // Everything shown (summary, email) and everything charged derives from
  // these same two integers, so they can never differ by a cent.
  const totalCents = subtotalCents + feeCents;
  return {
    fullSubtotal, siblingDiscount, parentDiscount,
    subtotal: subtotalCents / 100,
    fee: feeCents / 100,
    total: totalCents / 100,
    totalCents,
  };
}

export interface PricedAdult {
  full: number;
  discount: number;
  price: number;
}

export function adultPrices(adults: PricedParticipant[], hasKids: boolean): PricedAdult[] {
  return adults.map(p => {
    const full = participantFullPrice(p, ADULT_LEVELS);
    const discount = hasKids ? full * PARENT_DISCOUNT_RATE : 0;
    return { full, discount, price: full - discount };
  });
}

export const MAX_KIDS = 5;
export const MAX_ADULTS = 5;

// Square's published rate for an online card transaction in Canada: 3% plus
// 30 cents. Kept here, not hardcoded in the form, so there is one place to
// update if the club's actual Square plan charges something different.
const SQUARE_RATE_PERCENT = 3;
const SQUARE_FIXED_CENTS = 30;

// Whole-cent arithmetic on purpose: `subtotal * 0.03` in floating point can
// land a hair under a half-cent tie (13650 * 0.03 = 409.49999999999994), which
// would round the wrong way. Multiplying integers first keeps the tie exact.
export function squareFee(subtotal: number): number {
  const subtotalCents = Math.round(subtotal * 100);
  return (Math.round((subtotalCents * SQUARE_RATE_PERCENT) / 100) + SQUARE_FIXED_CENTS) / 100;
}

// Percent for display ("15", "50"), straight from the real discount rates so
// the copy can't disagree with the maths.
export const SIBLING_PERCENT = Math.round(SIBLING_DISCOUNT_RATE * 100);
export const PARENT_PERCENT = Math.round(PARENT_DISCOUNT_RATE * 100);
