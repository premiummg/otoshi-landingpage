import { Card, FieldError } from '@premiummg/ui';
import { useT } from '../../lang';
import { Field } from './Field';
import { ParticipantFields } from './ParticipantFields';
import {
  ADULT_LEVELS, KIDS_LEVELS, MAX_ADULTS, MAX_KIDS, participantDiscount, participantFullPrice, squareFee,
} from '../../registerData';
import { resizeParticipants } from '../../registerTypes';
import type { RegisterFormData } from '../../registerTypes';

export function Step3Registration({ data, setData, kidsErrors, adultsErrors, atLeastOneClassError }: {
  data: RegisterFormData;
  setData: (fn: (d: RegisterFormData) => RegisterFormData) => void;
  kidsErrors: Record<string, string>[];
  adultsErrors: Record<string, string>[];
  atLeastOneClassError?: string;
}) {
  const t = useT();
  const s = t.register.step3;

  function setCount(kind: 'kidsCount' | 'adultsCount', value: number) {
    setData(d => {
      const count = Math.max(0, Math.min(kind === 'kidsCount' ? MAX_KIDS : MAX_ADULTS, value));

      if (kind === 'kidsCount') {
        const prevCount = d.kids.length;
        let kids = resizeParticipants(d.kids, count);
        // Every newly created kid slot defaults its last name to the
        // registering parent's - siblings share a surname far more often
        // than not, so this saves retyping it once per kid. Only touches
        // the slots that just appeared (still blank by construction), never
        // a kid whose name was already typed.
        if (count > prevCount && d.parent.lastName.trim()) {
          kids = kids.map((k, i) => (i >= prevCount ? { ...k, lastName: d.parent.lastName.trim() } : k));
        }
        return { ...d, kidsCount: count, kids };
      }

      let adults = resizeParticipants(d.adults, count);
      // The first adult slot is, in practice, almost always the parent/
      // guardian themselves registering for an adult class too - so its
      // name comes pre-filled from Step 1 instead of asking them to retype
      // it. Only fires the moment that slot is first created (adults was
      // empty), so it never overwrites a name already typed, and never
      // touches a second adult (e.g. a spouse), whose name really is
      // different.
      if (d.adults.length === 0 && count > 0 && (d.parent.firstName.trim() || d.parent.lastName.trim())) {
        adults = [{ ...adults[0], firstName: d.parent.firstName.trim(), lastName: d.parent.lastName.trim() }, ...adults.slice(1)];
      }

      return { ...d, adultsCount: count, adults };
    });
  }

  const fullSubtotal =
    data.kids.reduce((sum, p) => sum + participantFullPrice(p, KIDS_LEVELS), 0) +
    data.adults.reduce((sum, p) => sum + participantFullPrice(p, ADULT_LEVELS), 0);
  const discount =
    data.kids.reduce((sum, p) => sum + participantDiscount(p, KIDS_LEVELS), 0) +
    data.adults.reduce((sum, p) => sum + participantDiscount(p, ADULT_LEVELS), 0);
  const subtotal = fullSubtotal - discount;
  const fee = squareFee(subtotal);
  const total = subtotal + fee;

  return (
    <div className="space-y-5">
      <Card padding className="space-y-5">
        <h2 className="font-heading font-extrabold text-lg text-(--premium-black) dark:text-white">{s.title}</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label={s.kids} htmlFor="kidsCount">
            {/* A bounded 0-5 range has no real use for free typing - a
                <select> also sidesteps the classic controlled
                type="number" bug where a leading "0" never clears (click,
                type "1", the field is left showing "01": the browser
                inserts at the cursor instead of replacing, and a number
                input's own DOM value doesn't always re-sync from React's
                state while still focused). */}
            <select id="kidsCount" className="input-field" value={data.kidsCount}
                    onChange={e => setCount('kidsCount', Number(e.target.value))}>
              {Array.from({ length: MAX_KIDS + 1 }, (_, n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </Field>
          <Field label={s.adults} htmlFor="adultsCount">
            <select id="adultsCount" className="input-field" value={data.adultsCount}
                    onChange={e => setCount('adultsCount', Number(e.target.value))}>
              {Array.from({ length: MAX_ADULTS + 1 }, (_, n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </Field>
        </div>
        {atLeastOneClassError && <div data-invalid="true"><FieldError message={atLeastOneClassError} /></div>}
      </Card>

      {data.kids.map((p, i) => (
        <ParticipantFields
          key={`kid-${i}`}
          index={i}
          label={`${s.participant} - ${s.kidLabel} ${i + 1}`}
          levels={KIDS_LEVELS}
          value={p}
          onChange={next => setData(d => ({ ...d, kids: d.kids.map((k, idx) => idx === i ? next : k) }))}
          errors={kidsErrors[i] ?? {}}
        />
      ))}

      {data.adults.map((p, i) => (
        <ParticipantFields
          key={`adult-${i}`}
          index={data.kids.length + i}
          label={`${s.participant} - ${s.adultLabel} ${i + 1}`}
          levels={ADULT_LEVELS}
          showParentDiscount
          value={p}
          onChange={next => setData(d => ({ ...d, adults: d.adults.map((a, idx) => idx === i ? next : a) }))}
          errors={adultsErrors[i] ?? {}}
        />
      ))}

      <Card padding className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">{s.subtotal}</span>
          <span className="pmg-figure text-(--premium-black) dark:text-white">${fullSubtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">{s.parentDiscountLine}</span>
            <span className="pmg-figure text-emerald-600 dark:text-emerald-400">-${discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">{s.fee}</span>
          <span className="pmg-figure text-(--premium-black) dark:text-white">${fee.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-base font-heading font-bold pt-2 border-t border-gray-100 dark:border-white/10">
          <span className="text-(--premium-black) dark:text-white">{s.total}</span>
          <span className="pmg-figure text-(--premium-black) dark:text-white">${total.toFixed(2)}</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">{s.pricingNote}</p>
      </Card>
    </div>
  );
}
