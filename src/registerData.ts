// Pulled from the old (now offline) WordPress registration form's raw page
// source, since the site itself was moved to a private Free plan and its
// plugins disabled - not confirmed by the club. Malcolm's own email and the
// context handed off alongside it both flag this the same way: the
// class-to-price MAPPING was inferred from the old form's field order, and
// the BILLING PERIOD (monthly? per session?) was never stated at all.
// Nothing here should be treated as final until the club confirms it - the
// registration form itself shows this same caveat next to the price
// summary, not just in this comment.
export const PRICING_IS_PROVISIONAL = true;

export interface ClassLevel {
  key: string;
  name: string;
}

export interface ScheduleOption {
  key: string;
  schedule: string;
  price: number;
}

// Level (age group) and schedule/price are kept as two independent lists,
// not paired 1:1, on purpose: the old form's raw source showed Riverview
// offering more than one weekly frequency for the same level (Regular
// Intermediates, Competitive Intermediates each had two), and it's not
// confirmed yet whether Dieppe genuinely only ever had exactly one
// frequency per level or whether the old form just happened to show them in
// a 1:1-looking order. Every schedule stays selectable regardless of which
// level is picked until the club confirms which pairings are real -
// pending, same as the prices themselves.
export const KIDS_LEVELS: ClassLevel[] = [
  { key: 'ninjas', name: 'Ninjas (4-6 years old)' },
  { key: 'beginners', name: 'Beginners (approx. 6-10)' },
  { key: 'regular-intermediates', name: 'Regular Intermediates (approx. 10-14)' },
  { key: 'competitive-intermediates', name: 'Competitive Intermediates (approx. 10-14)' },
  { key: 'intermediates-elites', name: 'Intermediates/Elites (approx. 10-14)' },
  { key: 'teens', name: 'Teens (approx. 14+)' },
  { key: 'elites', name: 'Elites' },
  { key: 'elites-1-conditioning', name: 'Elites + 1 conditioning' },
  { key: 'elites-2-conditioning', name: 'Elites + 2 conditioning' },
];

export const KIDS_SCHEDULES: ScheduleOption[] = [
  { key: 'k1', schedule: '1 class/week (Sat)', price: 50 },
  { key: 'k2', schedule: '2 classes/week (Tue/Thu)', price: 80 },
  { key: 'k3', schedule: '2 classes/week (Mon/Fri)', price: 90 },
  { key: 'k4', schedule: '3 classes/week (Mon/Wed/Fri)', price: 115 },
  { key: 'k5', schedule: '3 classes/week (Mon/Wed/Fri) + conditioning', price: 150 },
  { key: 'k6', schedule: '2 classes/week (Mon/Wed)', price: 90 },
  { key: 'k7', schedule: '4 classes/week (Tue/Thu/Fri/Sat)', price: 195 },
  { key: 'k8', schedule: '4 classes/week (Tue/Thu/Fri/Sat) + conditioning', price: 210 },
  { key: 'k9', schedule: '4 classes/week (Tue/Thu/Fri/Sat) + conditioning', price: 230 },
];

export const ADULT_LEVELS: ClassLevel[] = [
  { key: 'adults', name: 'Adults' },
];

export const ADULT_SCHEDULES: ScheduleOption[] = [
  { key: 'a1', schedule: '2 classes/week (Mon/Wed)', price: 90 },
];

export const MAX_KIDS = 5;
export const MAX_ADULTS = 5;

// Square's own published rate for an online/invoiced transaction in Canada.
// Confirmed by Malcolm's email as the payment processor, not yet confirmed
// with real Square credentials, same "pending" status as everything else in
// this file - kept here rather than hardcoded in the form so there's one
// place to update if the club's actual Square plan turns out to charge a
// different rate.
export function squareFee(subtotal: number): number {
  return subtotal * 0.03 + 0.3;
}
