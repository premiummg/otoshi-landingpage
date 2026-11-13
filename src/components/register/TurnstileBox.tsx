import { useEffect, useImperativeHandle, useRef } from 'react';
import type { Ref } from 'react';

// Cloudflare Turnstile: an (almost always invisible) human check. The widget
// hands back a one-time token that the server verifies with Cloudflare before
// it touches Square or sends any email. Only rendered when the server says
// a site key is configured.
export interface TurnstileHandle {
  getToken(): string | undefined;
  // A token is single-use, so a failed submit needs a fresh one.
  reset(): void;
}

interface TurnstileApi {
  render(el: HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}
declare global {
  interface Window { turnstile?: TurnstileApi }
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptPromise: Promise<void> | undefined;
function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  scriptPromise ??= new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = SCRIPT_URL;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => { scriptPromise = undefined; reject(new Error('Turnstile failed to load')); };
    document.head.appendChild(el);
  });
  return scriptPromise;
}

// Starts the script download early (e.g. when the form mounts or the user
// reaches the step), so the widget is ready by the time it is rendered.
export function preloadTurnstile(): void {
  loadScript().catch(() => {});
}

export function TurnstileBox({ siteKey, lang, ref }: { siteKey: string; lang: 'en' | 'fr'; ref: Ref<TurnstileHandle> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const token = useRef<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !window.turnstile || !containerRef.current) return;
        widgetId.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          language: lang,
          callback: (t: string) => { token.current = t; },
          'expired-callback': () => { token.current = undefined; },
          'error-callback': () => { token.current = undefined; },
        });
      })
      .catch(err => console.error('Turnstile unavailable:', err));
    return () => {
      cancelled = true;
      token.current = undefined;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = undefined;
    };
  }, [siteKey, lang]);

  useImperativeHandle(ref, () => ({
    getToken: () => token.current,
    reset() {
      token.current = undefined;
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    },
  }), []);

  return <div ref={containerRef} className="flex justify-center min-h-[65px]" />;
}
