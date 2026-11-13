// Classes, schedules and prices confirmed directly by Malcolm (club contact)
// by email, replacing the placeholder list that was only inferred from the
// old form's raw page source. Two things he was explicit about:
// - Schedule/price options are scoped to their class, not a shared global
//   list - "We can't have a Ninja doing 12 hours of judo."
// - Adults get 50% off when the household already has a kid registered.
export interface ScheduleOption {
  key: string;
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

// Malcolm's email: "Parents get 50% off when they have a kid registered
// already." Applied to an adult participant's price when the household
// checks the box - see the `parentDiscount` flag on Participant.
export const PARENT_DISCOUNT_RATE = 0.5;

// Shared by the client price summary (Step3Registration) and the email
// (api/register.ts) so the two can't drift out of sync with each other -
// same reasoning as sharing RegisterFormData/Participant itself. A minimal
// structural type instead of importing Participant from registerTypes.ts,
// since this file has no other reason to depend on that one.
interface PricedParticipant {
  classKey: string;
  scheduleKey: string;
  parentDiscount: boolean;
}

export function participantFullPrice(p: PricedParticipant, levels: ClassLevel[]): number {
  return levels.find(l => l.key === p.classKey)?.schedules.find(sc => sc.key === p.scheduleKey)?.price ?? 0;
}

// How much a participant's parent-discount checkbox saves, in dollars - 0
// when it isn't checked (or isn't applicable, as for kids).
export function participantDiscount(p: PricedParticipant, levels: ClassLevel[]): number {
  return p.parentDiscount ? participantFullPrice(p, levels) * (1 - PARENT_DISCOUNT_RATE) : 0;
}

export function participantPrice(p: PricedParticipant, levels: ClassLevel[]): number {
  return participantFullPrice(p, levels) - participantDiscount(p, levels);
}

// Malcolm's email: "15% off for any other sibling in judo (the highest price
// class pays full class. Ex: two kids, one in elite and the other in
// beginner, elite pays in full, beginner has 15% off)." Read literally: in
// any household with several kids, the single highest-priced kid pays full
// and every other kid gets 15% off their own price. A tie for highest means
// the first of them pays full. Does NOT apply to adults (they have the 50%
// parent discount above instead).
export const SIBLING_DISCOUNT_RATE = 0.15;

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
  const fullSubtotal =
    kids.reduce((sum, k) => sum + k.full, 0) +
    data.adults.reduce((sum, p) => sum + participantFullPrice(p, ADULT_LEVELS), 0);
  const siblingDiscount = kids.reduce((sum, k) => sum + k.discount, 0);
  const parentDiscount = data.adults.reduce((sum, p) => sum + participantDiscount(p, ADULT_LEVELS), 0);
  const subtotal = fullSubtotal - siblingDiscount - parentDiscount;
  const fee = squareFee(subtotal);
  return { fullSubtotal, siblingDiscount, parentDiscount, subtotal, fee, total: subtotal + fee };
}

export const MAX_KIDS = 5;
export const MAX_ADULTS = 5;

// Square's own published rate for an online/invoiced transaction in Canada.
// Confirmed by Malcolm's email as the payment processor, not yet confirmed
// with real Square credentials - kept here rather than hardcoded in the form
// so there's one place to update if the club's actual Square plan turns out
// to charge a different rate.
export function squareFee(subtotal: number): number {
  return subtotal * 0.03 + 0.3;
}
