import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
// react-router v7 consolidated its packages: StaticRouter now lives in
// `react-router` itself, not the `react-router-dom/server` entry point that
// v6 used.
import { StaticRouter } from 'react-router';
import { AppRoutes } from './App';
import { seoFor } from './seo';
import { headTags } from './lib/head';
import { splitLocalePath, allRoutes } from './lib/routes';

export { allRoutes };

// App.tsx lazy-loads RegisterPage and ProgramDetailPage (see its own
// comment for why), and `renderToString` does not wait out a suspended
// import - it doesn't throw for it either, it writes a "switched to client
// rendering" recovery comment in place of that boundary's content, which is
// exactly the empty shell prerendering exists to avoid (this specific
// fallback-with-marker behavior isn't new to React 19; it's just how
// `renderToString` has always handled Suspense it can't wait out).
//
// `React.lazy`'s promise is created fresh, INSIDE React, the first time a
// render pass actually reaches that lazy component - not when this module
// happens to import the same path itself. Pre-importing the underlying
// module (which was tried here first) only warms Node's own module cache;
// it does nothing for the separate promise React's own `lazy()` wrapper
// creates from its ctor, and that promise cannot be observed from outside
// React to know when it settles.
//
// So the only working handle on it is a render pass: the first render
// reaches the lazy component, which starts that internal promise, and
// (since resolving it still means Node's ESM loader reading and linking
// that page's own chunk file - and whatever IT imports - from disk) lets it
// settle within a few ticks of the event loop. Draining those ticks - not a
// fixed delay, just enough turns for that real but fast file I/O to finish -
// is what the second, real render then finds already resolved.
//
// This margin is a guess, not a guarantee, which is why
// scripts/prerender.mjs fails the build outright if a route's rendered
// HTML ever contains that recovery comment, rather than silently shipping
// it.
async function drainMicrotasks() {
  for (let i = 0; i < 6; i++) await new Promise(resolve => setImmediate(resolve));
}

/**
 * Renders one route to static HTML at build time.
 *
 * Same component tree the browser mounts, just under a StaticRouter instead
 * of a BrowserRouter, so there is no second copy of the route table that can
 * drift from the real one.
 */
export async function renderRoute(url: string): Promise<{ html: string; head: string; lang: string }> {
  const { lang, path } = splitLocalePath(url);
  const render = () =>
    renderToString(
      <StrictMode>
        <StaticRouter location={url}>
          <AppRoutes />
        </StaticRouter>
      </StrictMode>,
    );

  render();
  await drainMicrotasks();
  const html = render();

  return { html, head: headTags(seoFor(lang, path)), lang };
}
