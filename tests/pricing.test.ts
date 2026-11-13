import { describe, expect, it } from 'vitest';
import {
  adultPrices, kidPrices, registrationTotals, squareFee,
} from '../src/registerData';

const kid = (classKey: string, scheduleKey: string) => ({ classKey, scheduleKey });
const ninja = kid('ninja', 'ninja-1'); // $50
const beginner = kid('beginner', 'beginner-1'); // $80
const elite = kid('elite', 'elite-1'); // $195
const adult = kid('adult', 'adult-1'); // $90

describe('sibling discount (15%, highest-priced kid pays full)', () => {
  it('charges a single kid in full', () => {
    expect(kidPrices([beginner]).map(k => k.price)).toEqual([80]);
  });

  it("Malcolm's example: elite pays full, beginner gets 15% off", () => {
    expect(kidPrices([beginner, elite]).map(k => k.price)).toEqual([68, 195]);
    expect(kidPrices([elite, beginner]).map(k => k.price)).toEqual([195, 68]);
  });

  it('gives every kid except the single highest-priced one the discount', () => {
    expect(kidPrices([ninja, elite, beginner]).map(k => k.price)).toEqual([42.5, 195, 68]);
  });

  it('on a tie, the first of the tied kids pays full', () => {
    expect(kidPrices([beginner, beginner]).map(k => k.price)).toEqual([80, 68]);
  });

  it('handles no kids and unknown classes without throwing', () => {
    expect(kidPrices([])).toEqual([]);
    expect(kidPrices([kid('nope', 'nope')]).map(k => k.full)).toEqual([0]);
  });
});

describe('adult discount (50% when at least one kid is registered)', () => {
  it('applies only with a kid in the same registration', () => {
    expect(adultPrices([adult], true).map(a => a.price)).toEqual([45]);
    expect(adultPrices([adult], false).map(a => a.price)).toEqual([90]);
  });

  it('applies to every adult', () => {
    expect(adultPrices([adult, adult], true).map(a => a.price)).toEqual([45, 45]);
  });
});

describe('registrationTotals', () => {
  it('combines both discounts and adds the Square fee once', () => {
    // 195 + 68 (80 less 15%) + 45 (90 less 50%) = 308, fee 3% + $0.30 = 9.54
    const t = registrationTotals({ kids: [beginner, elite], adults: [adult] });
    expect(t.fullSubtotal).toBe(365);
    expect(t.siblingDiscount).toBe(12);
    expect(t.parentDiscount).toBe(45);
    expect(t.subtotal).toBe(308);
    expect(t.fee).toBe(9.54);
    expect(t.total).toBe(317.54);
    expect(t.totalCents).toBe(31754);
  });

  it('a lone Ninja is $50 plus fee', () => {
    const t = registrationTotals({ kids: [ninja], adults: [] });
    expect(t.total).toBe(51.8);
    expect(t.totalCents).toBe(5180);
  });

  it('the cents charged always equal the total shown', () => {
    for (const kids of [[], [ninja], [beginner, elite], [ninja, ninja, ninja, elite, beginner]]) {
      for (const adults of [[], [adult], [adult, adult]]) {
        const t = registrationTotals({ kids, adults });
        expect(t.totalCents).toBe(Math.round(t.total * 100));
        expect(Number.isInteger(t.totalCents)).toBe(true);
      }
    }
  });
});

describe('squareFee rounding', () => {
  it('rounds half-cent ties up, not down to float noise', () => {
    // 136.50 * 3% = 4.095 exactly -> 4.10 (+ $0.30), not 4.09
    expect(squareFee(136.5)).toBe(4.4);
  });

  it('is 3% + 30 cents on whole dollars', () => {
    expect(squareFee(100)).toBe(3.3);
    expect(squareFee(0)).toBe(0.3);
  });
});
