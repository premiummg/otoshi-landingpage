import { Card, FieldError } from '@premiummg/ui';
import { useT } from '../../lang';
import { MAROON } from '../../palette';

function AgreementRow({ title, body, agreeLabel, checked, onChange }: {
  title: string; body: string[]; agreeLabel: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-white/10 p-4 space-y-3">
      <p className="font-heading font-bold text-sm text-(--premium-black) dark:text-white">{title}</p>

      {/* A scrollable box, not the full text inline in the page's own flow -
          this is real legal text (the club's own previous waiver, verbatim),
          long enough that dumping it straight into the page would bury the
          checkbox several screens down. The standard "agreement text in its
          own scroll area" shape reads as what it is - something to actually
          read - rather than another paragraph of site copy. */}
      <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3 space-y-2.5">
        {body.map((paragraph, i) => (
          <p key={i} className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{paragraph}</p>
        ))}
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="w-4 h-4 shrink-0 rounded border-gray-300 dark:border-white/25"
          style={{ accentColor: MAROON }}
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{agreeLabel}</span>
      </label>
    </div>
  );
}

export function Step4Agreements({ agreedJudoNb, agreedClub, setAgreedJudoNb, setAgreedClub, error }: {
  agreedJudoNb: boolean;
  agreedClub: boolean;
  setAgreedJudoNb: (v: boolean) => void;
  setAgreedClub: (v: boolean) => void;
  error?: string;
}) {
  const t = useT();
  const s = t.register.step4;

  return (
    <Card padding className="space-y-6">
      <h2 className="font-heading font-extrabold text-lg text-(--premium-black) dark:text-white">{s.title}</h2>

      <AgreementRow title={s.judoNbTitle} body={s.judoNbBody} agreeLabel={s.agree} checked={agreedJudoNb} onChange={setAgreedJudoNb} />
      <AgreementRow title={s.clubTitle} body={s.clubBody} agreeLabel={s.agree} checked={agreedClub} onChange={setAgreedClub} />

      <p className="text-xs text-amber-600 dark:text-amber-400 italic">{s.legalEnglishOnlyNote}</p>

      {error && <FieldError message={error} />}
    </Card>
  );
}
