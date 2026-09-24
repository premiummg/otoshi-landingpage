import { DatePicker, Card } from '@premiummg/ui';
import { useT } from '../../lang';
import { Field } from './Field';
import { NAVY } from '../../palette';
import type { ClassLevel } from '../../registerData';
import type { Participant } from '../../registerTypes';

// One participant's fields (kid or adult) - the level list is the only
// thing that differs between the two, so this renders both from one place
// rather than two near-identical copies.
export function ParticipantFields({ index, label, levels, showParentDiscount, value, onChange, errors }: {
  index: number;
  label: string;
  levels: ClassLevel[];
  showParentDiscount?: boolean;
  value: Participant;
  onChange: (next: Participant) => void;
  errors: Record<string, string>;
}) {
  const t = useT();
  const s = t.register.step3;
  const selectedLevel = levels.find(l => l.key === value.classKey);

  function set<K extends keyof Participant>(key: K, v: Participant[K]) {
    onChange({ ...value, [key]: v });
  }

  function setClass(classKey: string) {
    // Schedule keys aren't shared across classes (Malcolm: a Ninja can't
    // pick an Elite's 4x/week option), so switching class clears whatever
    // schedule was chosen for the old one instead of leaving a stale,
    // now-invisible selection behind. When the new class only has one
    // schedule/price option (e.g. Adult), there's nothing to actually
    // choose, so pick it automatically instead of making the user open a
    // dropdown just to click its only entry.
    const newLevel = levels.find(l => l.key === classKey);
    const schedules = newLevel?.schedules ?? [];
    onChange({ ...value, classKey, scheduleKey: schedules.length === 1 ? schedules[0].key : '' });
  }

  const prefix = `participant-${index}`;

  return (
    <Card padding className="space-y-4">
      <h3 className="font-heading font-bold text-sm text-(--premium-black) dark:text-white">{label}</h3>

      {/* Schedule/price options are scoped to the selected class, confirmed
          by Malcolm. See registerData.ts. */}
      <Field label={s.class} htmlFor={`${prefix}-class`} required error={errors.classKey}>
        <select id={`${prefix}-class`} className="input-field" value={value.classKey}
                onChange={e => setClass(e.target.value)}>
          <option value="">{s.chooseClass}</option>
          {levels.map(l => (
            <option key={l.key} value={l.key}>{l.name}</option>
          ))}
        </select>
      </Field>

      <Field label={s.schedulePrice} htmlFor={`${prefix}-schedule`} required error={errors.scheduleKey}>
        <select id={`${prefix}-schedule`} className="input-field" value={value.scheduleKey} disabled={!selectedLevel}
                onChange={e => set('scheduleKey', e.target.value)}>
          <option value="">{selectedLevel ? s.chooseClass : s.chooseClassFirst}</option>
          {(selectedLevel?.schedules ?? []).map(sc => (
            <option key={sc.key} value={sc.key}>{sc.schedule} - ${sc.price}</option>
          ))}
        </select>
      </Field>

      {showParentDiscount && (
        <label className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300">
          <input type="checkbox" className="mt-0.5" checked={value.parentDiscount}
                 onChange={e => set('parentDiscount', e.target.checked)} />
          <span>{s.parentDiscount}</span>
        </label>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={s.firstName} htmlFor={`${prefix}-first`} required error={errors.firstName}>
          <input id={`${prefix}-first`} data-1p-ignore className="input-field" value={value.firstName}
                 onChange={e => set('firstName', e.target.value)} />
        </Field>
        <Field label={s.lastName} htmlFor={`${prefix}-last`} required error={errors.lastName}>
          <input id={`${prefix}-last`} data-1p-ignore className="input-field" value={value.lastName}
                 onChange={e => set('lastName', e.target.value)} />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={s.dob} htmlFor={`${prefix}-dob`} required error={errors.dob}>
          <DatePicker id={`${prefix}-dob`} value={value.dob} onChange={v => set('dob', v)} maxDate={new Date()} />
        </Field>

        <Field label={s.gender} htmlFor={`${prefix}-gender`} required error={errors.gender}>
          <div className="flex gap-2">
            {(['male', 'female'] as const).map(g => (
              <button
                key={g}
                type="button"
                onClick={() => set('gender', g)}
                className={`flex-1 px-3 py-2.5 rounded-lg border text-sm font-medium transition ${
                  value.gender === g
                    ? 'text-white border-transparent'
                    : 'border-gray-300 dark:border-white/20 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-white/40'
                }`}
                style={value.gender === g ? { backgroundColor: NAVY } : undefined}
              >
                {g === 'male' ? s.male : s.female}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <Field label={s.notes} htmlFor={`${prefix}-notes`} optional>
        <textarea id={`${prefix}-notes`} className="input-field" rows={2} value={value.notes}
                  onChange={e => set('notes', e.target.value)} />
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{s.notesHint}</p>
      </Field>
    </Card>
  );
}
