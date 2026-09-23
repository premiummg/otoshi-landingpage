import { Card } from '@premiummg/ui';
import { useT } from '../../lang';
import { Field } from './Field';
import { AddressAutocomplete } from './AddressAutocomplete';
import { EmailAutocomplete } from './EmailAutocomplete';
import { PhoneField } from './PhoneField';
import type { AddressSuggestion } from '../../lib/nominatim';
import type { RegisterFormData } from '../../registerTypes';

export function Step1Parent({ data, setData, errors }: {
  data: RegisterFormData;
  setData: (fn: (d: RegisterFormData) => RegisterFormData) => void;
  errors: Record<string, string>;
}) {
  const t = useT();
  const s = t.register.step1;

  function set<K extends keyof RegisterFormData['parent']>(key: K, value: RegisterFormData['parent'][K]) {
    setData(d => ({ ...d, parent: { ...d.parent, [key]: value } }));
  }

  // City/Province/Postal Code autofill from the picked suggestion - typed
  // over freely afterward like any other field, this only ever fires once
  // per selection.
  function selectAddress(suggestion: AddressSuggestion) {
    setData(d => ({
      ...d,
      parent: {
        ...d.parent,
        address: suggestion.street || suggestion.displayName,
        city: suggestion.city || d.parent.city,
        province: suggestion.province || d.parent.province,
        postalCode: suggestion.postalCode || d.parent.postalCode,
      },
    }));
  }

  return (
    <Card padding className="space-y-5">
      <h2 className="font-heading font-extrabold text-lg text-(--premium-black) dark:text-white">{s.title}</h2>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label={s.firstName} htmlFor="p-firstName" required error={errors.firstName}>
          <input id="p-firstName" data-1p-ignore className="input-field" value={data.parent.firstName}
                 onChange={e => set('firstName', e.target.value)} />
        </Field>
        <Field label={s.lastName} htmlFor="p-lastName" required error={errors.lastName}>
          <input id="p-lastName" data-1p-ignore className="input-field" value={data.parent.lastName}
                 onChange={e => set('lastName', e.target.value)} />
        </Field>
      </div>

      <Field label={s.email} htmlFor="p-email" required error={errors.email}>
        <EmailAutocomplete id="p-email" value={data.parent.email} onChange={v => set('email', v)} />
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{s.emailHint}</p>
      </Field>

      <Field label={s.phone} htmlFor="p-phone" required error={errors.phone}>
        <PhoneField id="p-phone" value={data.parent.phone} onChange={v => set('phone', v)} />
      </Field>

      <Field label={s.address} htmlFor="p-address" required error={errors.address}>
        <AddressAutocomplete
          id="p-address"
          value={data.parent.address}
          onChange={v => set('address', v)}
          onSelect={selectAddress}
        />
      </Field>

      <div className="grid sm:grid-cols-3 gap-5">
        <Field label={s.city} htmlFor="p-city" required error={errors.city}>
          <input id="p-city" data-1p-ignore className="input-field" value={data.parent.city}
                 onChange={e => set('city', e.target.value)} />
        </Field>
        <Field label={s.province} htmlFor="p-province" required error={errors.province}>
          <input id="p-province" data-1p-ignore className="input-field" value={data.parent.province}
                 onChange={e => set('province', e.target.value)} />
        </Field>
        <Field label={s.postalCode} htmlFor="p-postalCode" required error={errors.postalCode}>
          <input id="p-postalCode" data-1p-ignore className="input-field" value={data.parent.postalCode}
                 onChange={e => set('postalCode', e.target.value)} />
        </Field>
      </div>
    </Card>
  );
}
