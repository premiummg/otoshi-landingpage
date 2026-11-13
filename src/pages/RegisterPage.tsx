import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { Card, SiteButton } from '@premiummg/ui';
import { useT, LangCtx } from '../lang';
import { COPY } from '../copy';
import type { PageProps } from './HomePage';
import { SubPageHeader } from '../components/SubPageHeader';
import { StepIndicator } from '../components/register/StepIndicator';
import { Step1Parent } from '../components/register/Step1Parent';
import { Step2Emergency } from '../components/register/Step2Emergency';
import { Step3Registration } from '../components/register/Step3Registration';
import { Step4Agreements } from '../components/register/Step4Agreements';
import { TurnstileBox, preloadTurnstile } from '../components/register/TurnstileBox';
import type { TurnstileHandle } from '../components/register/TurnstileBox';
import { emptyRegisterForm, type Participant, type RegisterFormData, type RegisterRequest } from '../registerTypes';
import { registrationTotals } from '../registerData';
import { LIMITS } from '../formLimits';
import { isValidEmail, isValidPhone } from '../lib/validators';
import { useLocaleHref } from '../lib/useLocaleHref';
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
  const href = useLocaleHref();
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
  // True when the family came back from Square's checkout. The URL flag can
  // be typed by anyone, so the message it unlocks never claims a payment
  // happened - only that Square will send a receipt if it did.
  const [paid, setPaid] = useState(false);
  const [paymentError, setPaymentError] = useState<string>();
  // What the server says is switched on (Square payments, the captcha).
  // Asked at runtime so one build works in sandbox and production, and falls
  // back to the email-only flow when Square isn't configured.
  const [site, setSite] = useState<{ squareEnabled?: boolean; turnstileSiteKey?: string } | null>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);
  // One id per page load; the server shows it as the registration's reference.
  const [submissionId] = useState(() => crypto.randomUUID());
  // The site config failed to load even after a retry. Without it the form
  // can't know whether the captcha is required, so it asks for a refresh
  // instead of submitting into a guaranteed rejection.
  const [siteFailed, setSiteFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    async function load(attempt: number) {
      try {
        const res = await fetch('/api/site-config');
        if (!res.ok) throw new Error('site-config failed');
        const cfg = (await res.json()) as { squareEnabled?: boolean; turnstileSiteKey?: string };
        if (cancelled) return;
        setSite(cfg);
        // Start the captcha script now so the widget is ready on the last step.
        if (cfg.turnstileSiteKey) preloadTurnstile();
      } catch {
        if (cancelled) return;
        if (attempt === 0) setTimeout(() => void load(1), 1500);
        else setSiteFailed(true);
      }
    }
    void load(0);
    // Square sends the family back to /register?paid=1 after checkout. Read in
    // an effect, not during render, so the prerendered HTML matches the first
    // client render (the query string only exists in the browser).
    if (new URLSearchParams(window.location.search).get('paid') === '1') {
      setPaid(true);
      setStatus('success');
    }
    return () => { cancelled = true; };
  }, []);

  // Pressing Back from Square's page can restore this page from the browser's
  // back-forward cache exactly as it was left: stuck on "Sending..." with a
  // disabled button. Put it back into a usable state (and get a fresh captcha
  // token, since the old one was spent).
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      setStatus(s => (s === 'submitting' ? 'idle' : s));
      turnstileRef.current?.reset();
    };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

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
    else if (data.parent.address.length > LIMITS.address) e.address = t.register.tooLong;
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

  // Jump to the earliest step that has something wrong. Needed because the
  // step indicator lets the family go back and edit, then straight to the last
  // step, without passing through `next()`'s validation again.
  function firstInvalidStep(): number {
    if (!validateStep1()) return 0;
    if (!validateStep2()) return 1;
    if (!validateStep3()) return 2;
    return -1;
  }

  async function submit() {
    const bad = firstInvalidStep();
    if (bad !== -1) {
      setStep(bad);
      scrollToFirstError();
      return;
    }
    if (!validateStep4()) {
      scrollToFirstError();
      return;
    }
    const pay = t.register.payment;
    const turnstileToken = turnstileRef.current?.getToken();
    if (site?.turnstileSiteKey && !turnstileToken) {
      setPaymentError(pay.captcha);
      return;
    }
    setPaymentError(undefined);
    setStatus('submitting');
    try {
      const body: RegisterRequest = { ...data, submissionId, turnstileToken, lang: lang === 'fr' ? 'fr' : 'en' };
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const { error } = (await res.json().catch(() => ({}))) as { error?: string };
        // A captcha token is single-use, so the next attempt needs a new one.
        turnstileRef.current?.reset();
        const known: Record<string, string> = { captcha_failed: pay.captcha, too_many_requests: pay.tooMany };
        if (error && known[error]) {
          setPaymentError(known[error]);
          setStatus('idle');
          return;
        }
        throw new Error('Request failed');
      }
      const { paymentUrl } = (await res.json()) as { paymentUrl?: string };
      if (paymentUrl) {
        // Hand off to Square's hosted checkout. Stay in 'submitting' so the
        // button can't be pressed twice while the browser navigates away.
        window.location.assign(paymentUrl);
        return;
      }
      setStatus('success');
    } catch {
      turnstileRef.current?.reset();
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className={`min-h-screen ${BAND_GROUND}`} style={NAVY_BUTTON_OVERRIDE}>
        <SubPageHeader lang={lang} setLang={setLang} isDark={isDark} toggleTheme={toggleTheme} />
        <div className="max-w-lg mx-auto px-6 py-24 text-center">
          <h1 className="font-heading font-black text-2xl text-(--premium-black) dark:text-white">{t.register.success.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">{t.register.success.body}</p>
          <p className={`text-sm mt-4 leading-relaxed ${paid ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>{paid ? t.register.success.paidNote : t.register.success.paymentNote}</p>
          <Link to={href('/')} className="inline-block mt-8">
            <SiteButton>{t.register.success.backHome}</SiteButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${BAND_GROUND}`} style={NAVY_BUTTON_OVERRIDE}>
      <SubPageHeader lang={lang} setLang={setLang} isDark={isDark} toggleTheme={toggleTheme} />

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
            squareEnabled={site?.squareEnabled}
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

        {step === 3 && site?.squareEnabled && (
          <Card padding className="mt-5 space-y-2">
            <h2 className="font-heading font-extrabold text-lg text-(--premium-black) dark:text-white">{t.register.payment.title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {t.register.payment.note.replace('{amount}', `$${registrationTotals(data).total.toFixed(2)}`)}
            </p>
          </Card>
        )}

        {step === 3 && site?.turnstileSiteKey && (
          <div className="mt-5">
            <TurnstileBox ref={turnstileRef} siteKey={site.turnstileSiteKey} lang={lang === 'fr' ? 'fr' : 'en'} />
          </div>
        )}

        {siteFailed && (
          <p className="text-sm text-red-500 text-center mt-4">{t.register.payment.reload}</p>
        )}

        {paymentError && (
          <p className="text-sm text-red-500 text-center mt-4" data-invalid="true">{paymentError}</p>
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
            <SiteButton onClick={submit} disabled={status === 'submitting' || site === null}>
              {status === 'submitting' ? t.register.stepNav.submitting : t.register.stepNav.submit}
            </SiteButton>
          )}
        </div>
      </div>
    </div>
  );
}
