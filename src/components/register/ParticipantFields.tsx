import { DatePicker, Card } from '@premiummg/ui';
import { useT } from '../../lang';
import { Field } from './Field';
import { MAROON } from '../../palette';
import type { ClassLevel, ScheduleOption } from '../../registerData';
import type { Participant } from '../../registerTypes';

// One participant's fields (kid or adult) - the level/schedule lists are the
// only thing that differs between the two, so this renders both from one
// place rather than two near-identical copies.
export function ParticipantFields({ index, label, levels, schedules, value, onChange, errors }: {
  index: number;
  label: string;
  levels: ClassLevel[];
  schedules: ScheduleOption[];
  value: Participant;
  onChange: (next: Participant) => void;
  errors: Record<string, string>;
}) {
  const t = useT();
  const s = t.register.step3;

  function set<K extends keyof Participant>(key: K, v: Participant[K]) {
    onChange({ ...value, [key]: v });
  }

  const prefix = `participant-${index}`;

  return (
    <Card padding className="space-y-4">
      <h3 className="font-heading font-bold text-sm text-(--premium-black) dark:text-white">{label}</h3>

      {/* Level and schedule/price are two fully independent fields, not one
          deriving the other - not yet confirmed whether Dieppe pairs each
          level to exactly one schedule (the old form's own Riverview
          section offered more than one for some levels), so every schedule
          stays pickable regardless of which level was chosen. See
          registerData.ts. */}
      <Field label={s.class} htmlFor={`${prefix}-class`} required error={errors.classKey}>
        <select id={`${prefix}-class`} className="input-field" value={value.classKey}
                onChange={e => set('classKey', e.target.value)}>
          <option value="">{s.chooseClass}</option>
          {levels.map(l => (
            <option key={l.key} value={l.key}>{l.name}</option>
          ))}
        </select>
      </Field>

      <Field label={s.schedulePrice} htmlFor={`${prefix}-schedule`} required error={errors.scheduleKey}>
        <select id={`${prefix}-schedule`} className="input-field" value={value.scheduleKey}
                onChange={e => set('scheduleKey', e.target.value)}>
          <option value="">{s.chooseClass}</option>
          {schedules.map(sc => (
            <option key={sc.key} value={sc.key}>{sc.schedule} - ${sc.price}</option>
          ))}
        </select>
      </Field>

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
                style={value.gender === g ? { backgroundColor: MAROON } : undefined}
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
