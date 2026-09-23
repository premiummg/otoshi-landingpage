import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { SiteButton } from '@premiummg/ui';
import { useT, LangCtx } from '../lang';
import { COPY } from '../copy';
import type { PageProps } from './HomePage';
import { RegisterHeader } from '../components/register/RegisterHeader';
import { StepIndicator } from '../components/register/StepIndicator';
import { Step1Parent } from '../components/register/Step1Parent';
import { Step2Emergency } from '../components/register/Step2Emergency';
import { Step3Registration } from '../components/register/Step3Registration';
import { Step4Agreements } from '../components/register/Step4Agreements';
import { emptyRegisterForm, type Participant, type RegisterFormData } from '../registerTypes';
import { isValidEmail, isValidPhone } from '../lib/validators';
import { BAND_GROUND, NAVY, NAVY_DARK } from '../palette';

// Same CSS-custom-property override the Hero uses on the main page: SiteButton
// resolves its fill from `var(--premium-red)`, so redefining it on a wrapper
// swaps every default-variant button here to Otoshi's navy without touching
// the shared package.
const NAVY_BUTTON_OVERRIDE = { '--premium-red': NAVY, '--premium-red-dark': NAVY_DARK } as CSSProperties;

// Fields render their own error via a local `Field` wrapper that marks
// itself `data-invalid="true"` (see components/register/Field.tsx) - a
// validation failure often lands below the fold (a step with several
// fields, or a participant card deep in Step 3), so without this the user
// would see nothing happen and not know why Next/Submit didn't move on.
// Runs after the render that adds the attribute, not synchronously in the
// same tick as the setState calls that produce it.
function scrollToFirstError() {
  setTimeout(() => {
    document.querySelector('[data-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 0);
}

function validateParticipant(p: Participant, required: string): Record<string, string> {
  const e: Record<string, string> = {};
  if (!p.classKey) e.classKey = required;
  if (!p.scheduleKey) e.scheduleKey = required;
  if (!p.firstName.trim()) e.firstName = required;
  if (!p.lastName.trim()) e.lastName = required;
  if (!p.dob) e.dob = required;
  if (!p.gender) e.gender = required;
  return e;
}

// This page renders inside its OWN LangCtx.Provider (App.tsx's provider
// already wraps it too, but that's fine - a nested provider with the same
// value is a no-op) so it can be developed/tested standalone; kept simple
// by just reading the already-provided context like every other page piece.
export function RegisterPage({ lang, setLang, isDark, toggleTheme }: PageProps) {
  return (
    <LangCtx.Provider value={COPY[lang]}>
      <RegisterForm lang={lang} setLang={setLang} isDark={isDark} toggleTheme={toggleTheme} />
    </LangCtx.Provider>
  );
}

function RegisterForm({ lang, setLang, isDark, toggleTheme }: PageProps) {
  const t = useT();
  const [step, setStep] = useState(0);
  // The furthest step reached so far - StepIndicator only lets a click jump
  // to a step at or before this one, so re-visiting step 1 to fix a typo
  // doesn't silently unlock steps 3-4 whose own data was never validated.
  const [maxStepReached, setMaxStepReached] = useState(0);
  const [data, setData] = useState<RegisterFormData>(emptyRegisterForm);
  const [parentErrors, setParentErrors] = useState<Record<string, string>>({});
  const [emergencyErrors, setEmergencyErrors] = useState<Record<string, string>>({});
  const [kidsErrors, setKidsErrors] = useState<Record<string, string>[]>([]);
  const [adultsErrors, setAdultsErrors] = useState<Record<string, string>[]>([]);
  const [atLeastOneClassError, setAtLeastOneClassError] = useState<string>();
  const [agreementError, setAgreementError] = useState<string>();
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const required = t.register.required;

  function validateStep1() {
    const e: Record<string, string> = {};
    if (!data.parent.firstName.trim()) e.firstName = required;
    if (!data.parent.lastName.trim()) e.lastName = required;
    if (!data.parent.email.trim()) e.email = required;
    else if (!isValidEmail(data.parent.email)) e.email = t.register.invalidEmail;
    if (!data.parent.phone.trim()) e.phone = required;
    else if (!isValidPhone(data.parent.phone)) e.phone = t.register.invalidPhone;
    if (!data.parent.address.trim()) e.address = required;
    if (!data.parent.city.trim()) e.city = required;
    if (!data.parent.province.trim()) e.province = required;
    if (!data.parent.postalCode.trim()) e.postalCode = required;
    setParentErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e: Record<string, string> = {};
    if (!data.emergency.name.trim()) e.name = required;
    if (!data.emergency.relationship.trim()) e.relationship = required;
    if (!data.emergency.phone.trim()) e.phone = required;
    else if (!isValidPhone(data.emergency.phone)) e.phone = t.register.invalidPhone;
    setEmergencyErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep3() {
    const kErrors = data.kids.map(p => validateParticipant(p, required));
    const aErrors = data.adults.map(p => validateParticipant(p, required));
    setKidsErrors(kErrors);
    setAdultsErrors(aErrors);
    const totalParticipants = data.kids.length + data.adults.length;
    const noneSelected = totalParticipants === 0;
    setAtLeastOneClassError(noneSelected ? t.register.step3.atLeastOneClass : undefined);
    const hasFieldErrors = [...kErrors, ...aErrors].some(e => Object.keys(e).length > 0);
    return !noneSelected && !hasFieldErrors;
  }

  function validateStep4() {
    const ok = data.agreedJudoNb && data.agreedClub;
    setAgreementError(ok ? undefined : t.register.step4.mustAgree);
    return ok;
  }

  function next() {
    const valid = step === 0 ? validateStep1() : step === 1 ? validateStep2() : step === 2 ? validateStep3() : true;
    if (valid) {
      const nextStep = Math.min(3, step + 1);
      setStep(nextStep);
      setMaxStepReached(m => Math.max(m, nextStep));
    } else {
      scrollToFirstError();
    }
  }

  function back() {
    setStep(s => Math.max(0, s - 1));
  }

  // Jumping to an already-reached step to fix something - no validation
  // gate here (unlike `next`), since the whole point is to go back and
  // change a value that's already there, not to re-clear it.
  function goToStep(i: number) {
    if (i <= maxStepReached) setStep(i);
  }

  async function submit() {
    if (!validateStep4()) {
      scrollToFirstError();
      return;
    }
    setStatus('submitting');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Request failed');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className={`min-h-screen ${BAND_GROUND}`} style={NAVY_BUTTON_OVERRIDE}>
        <RegisterHeader lang={lang} setLang={setLang} isDark={isDark} toggleTheme={toggleTheme} />
        <div className="max-w-lg mx-auto px-6 py-24 text-center">
          <h1 className="font-heading font-black text-2xl text-(--premium-black) dark:text-white">{t.register.success.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">{t.register.success.body}</p>
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-4 leading-relaxed">{t.register.success.paymentNote}</p>
          <Link to="/" className="inline-block mt-8">
            <SiteButton>{t.register.success.backHome}</SiteButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${BAND_GROUND}`} style={NAVY_BUTTON_OVERRIDE}>
      <RegisterHeader lang={lang} setLang={setLang} isDark={isDark} toggleTheme={toggleTheme} />

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-heading font-black text-2xl text-(--premium-black) dark:text-white text-center mb-8">
          {t.register.pageTitle}
        </h1>

        <StepIndicator steps={t.register.steps} current={step} maxReached={maxStepReached} onStepClick={goToStep} />

        {step === 0 && <Step1Parent data={data} setData={setData} errors={parentErrors} />}
        {step === 1 && <Step2Emergency data={data} setData={setData} errors={emergencyErrors} />}
        {step === 2 && (
          <Step3Registration
            data={data}
            setData={setData}
            kidsErrors={kidsErrors}
            adultsErrors={adultsErrors}
            atLeastOneClassError={atLeastOneClassError}
          />
        )}
        {step === 3 && (
          <Step4Agreements
            agreedJudoNb={data.agreedJudoNb}
            agreedClub={data.agreedClub}
            setAgreedJudoNb={v => setData(d => ({ ...d, agreedJudoNb: v }))}
            setAgreedClub={v => setData(d => ({ ...d, agreedClub: v }))}
            error={agreementError}
          />
        )}

        {status === 'error' && (
          <p className="text-sm text-red-500 text-center mt-4">{t.register.error.body}</p>
        )}

        <div className="flex items-center justify-between mt-8">
          <SiteButton variant="ghost" onClick={back} disabled={step === 0} className={step === 0 ? 'opacity-0 pointer-events-none' : ''}>
            {t.register.stepNav.back}
          </SiteButton>
          {step < 3 ? (
            <SiteButton onClick={next}>{t.register.stepNav.next}</SiteButton>
          ) : (
            <SiteButton onClick={submit} disabled={status === 'submitting'}>
              {status === 'submitting' ? t.register.stepNav.submitting : t.register.stepNav.submit}
            </SiteButton>
          )}
        </div>
      </div>
    </div>
  );
}
