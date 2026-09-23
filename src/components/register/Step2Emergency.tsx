import { Card } from '@premiummg/ui';
import { useT } from '../../lang';
import { Field } from './Field';
import { PhoneField } from './PhoneField';
import type { RegisterFormData } from '../../registerTypes';

export function Step2Emergency({ data, setData, errors }: {
  data: RegisterFormData;
  setData: (fn: (d: RegisterFormData) => RegisterFormData) => void;
  errors: Record<string, string>;
}) {
  const t = useT();
  const s = t.register.step2;

  function set<K extends keyof RegisterFormData['emergency']>(key: K, value: RegisterFormData['emergency'][K]) {
    setData(d => ({ ...d, emergency: { ...d.emergency, [key]: value } }));
  }

  return (
    <Card padding className="space-y-5">
      <h2 className="font-heading font-extrabold text-lg text-(--premium-black) dark:text-white">{s.title}</h2>

      <Field label={s.name} htmlFor="e-name" required error={errors.name}>
        <input id="e-name" data-1p-ignore className="input-field" value={data.emergency.name}
               onChange={e => set('name', e.target.value)} />
      </Field>

      <Field label={s.relationship} htmlFor="e-relationship" required error={errors.relationship}>
        <input id="e-relationship" data-1p-ignore className="input-field" value={data.emergency.relationship}
               onChange={e => set('relationship', e.target.value)} />
      </Field>

      <Field label={s.phone} htmlFor="e-phone" required error={errors.phone}>
        <PhoneField id="e-phone" value={data.emergency.phone} onChange={v => set('phone', v)} />
      </Field>
    </Card>
  );
}
