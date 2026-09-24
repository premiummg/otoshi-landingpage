import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLocaleHref } from './useLocaleHref';

/**
 * A "back" action that actually goes back, not just "to home."
 *
 * The site's own back links (the arrow in SubPageHeader, "Back to classes"
 * on a program page) used to be `<Link to={href('/')}>` - a normal forward
 * navigation to a fixed destination, not the browser's own history back.
 * That always lands at the top of the home page, even for someone who
 * scrolled halfway down it before clicking through to a class - there is no
 * "back to where you were" once you've pushed a brand new "/" entry on top
 * of the one you actually came from.
 *
 * `navigate(-1)` is the real fix (it's a POP, which is what the scroll
 * position memory in App.tsx listens for), but only when there IS a
 * previous entry to go back to. React Router marks the very first entry of
 * a browsing session with the location key `"default"` - someone who opened
 * `/programs/elite` directly (a shared link, a search result, typing the
 * URL) has no page before it in this tab's history, and `navigate(-1)`
 * there would leave the site entirely, back to whatever sent them here (or
 * nowhere). That case falls back to a plain push to home instead.
 */
export function useGoBack() {
  const navigate = useNavigate();
  const location = useLocation();
  const href = useLocaleHref();

  return useCallback(() => {
    if (location.key !== 'default') navigate(-1);
    else navigate(href('/'));
  }, [navigate, location.key, href]);
}
