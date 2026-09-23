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

/**
 * Renders one route to static HTML at build time.
 *
 * Same component tree the browser mounts, just under a StaticRouter instead
 * of a BrowserRouter, so there is no second copy of the route table that can
 * drift from the real one.
 */
export function renderRoute(url: string): { html: string; head: string; lang: string } {
  const { lang, path } = splitLocalePath(url);
  const html = renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <AppRoutes />
      </StaticRouter>
    </StrictMode>,
  );
  return { html, head: headTags(seoFor(lang, path)), lang };
}
