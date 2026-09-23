import { useCallback, useEffect, useState } from 'react';

const THEME_KEY = 'theme';

/**
 * A local stand-in for `@premiummg/ui`'s `useDarkMode`, used only because the
 * package's version reads `document.documentElement` inside its `useState`
 * initializer. That runs during render, which is fine in a browser and fatal
 * in the build-time prerender, where there is no `document` at all.
 *
 * The difference is only in WHEN the theme is read, not in what it does:
 *
 * - The boot script in `index.html` still owns the first paint, applying
 *   `.dark` before React loads so there is no flash of the wrong theme.
 * - State starts `false` on the server AND on the first client render, so
 *   hydration matches, then an effect adopts whatever the boot script
 *   actually applied.
 * - The class and `localStorage` are written only from `toggle`, a real user
 *   action, never from an effect - an effect firing on mount would race the
 *   boot script and strip `.dark` back off before the state caught up.
 */
export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      try {
        localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
      } catch {
        /* private browsing, blocked storage - the class still applies */
      }
      return next;
    });
  }, []);

  return { isDark, toggle };
}
