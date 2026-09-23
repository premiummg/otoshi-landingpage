import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { localePath, splitLocalePath } from './routes';

/**
 * Turns an app-relative path into one in the language the visitor is already
 * reading: `href('/register')` is `/register` in English and `/fr/register`
 * in French.
 *
 * Every in-app link goes through this. A hardcoded `/register` would quietly
 * drop a French visitor back into English mid-flow, and because language
 * lives in the URL now, that is a real navigation, not just a label change.
 */
export function useLocaleHref() {
  const { pathname } = useLocation();
  const { lang } = splitLocalePath(pathname);
  return useCallback((path: string) => localePath(lang, path), [lang]);
}
