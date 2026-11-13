import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';


// Dev-only stand-in for Vercel's /api runtime: `npm run dev` is plain Vite,
// which doesn't serve the api/ folder, so without this a local /register
// submit 404s. Runs the real api/register.ts handler (loaded through Vite so
// the TypeScript just works) behind a minimal req/res shim, with the secrets
// from .env.local (gitignored). Registered with `apply: 'serve'`, so it
// never exists in a production build.
function localApi(mode: string): Plugin {
  return {
    name: 'local-api',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(mode, process.cwd(), '');
      for (const [k, v] of Object.entries(env)) if (process.env[k] === undefined) process.env[k] = v;

      server.middlewares.use('/api', async (req, res, next) => {
        // req.url is relative to the mount point: "/register", "/site-config".
        const name = (req.url ?? '').split('?')[0].replace(/^\//, '');
        if (!/^[a-z-]+$/.test(name)) { next(); return; }
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        const raw = Buffer.concat(chunks).toString('utf8');
        let parsedBody: unknown;
        try {
          parsedBody = raw ? JSON.parse(raw) : undefined;
        } catch {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'invalid_body' }));
          return;
        }
        const vReq = Object.assign(req, { body: parsedBody });
        const vRes = Object.assign(res, {
          status(code: number) { res.statusCode = code; return vRes; },
          json(body: unknown) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); },
        });
        try {
          const mod = await server.ssrLoadModule(`/api/${name}.ts`);
          await mod.default(vReq, vRes);
        } catch (err) {
          console.error('[local-api]', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Local API crashed - see the dev server log.' }));
        }
      });
    },
  };
}
// @premiummg/ui's styles.css declares Montserrat/Poppins as .ttf (~2.2 MB), but
// src/index.css re-declares every one of those family/weight pairs with the
// WOFF2 files in public/fonts, and the later declaration wins, so the browser
// never requests the TTFs. Vite still emits them into dist/assets; drop them
// so they are not deployed. If a weight is ever added to the package but not
// to src/index.css, it would 404 - add its WOFF2 there instead.
function dropUnusedTtf(): Plugin {
  return {
    name: 'drop-unused-ttf',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const name of Object.keys(bundle)) {
        if (bundle[name].type === 'asset' && name.endsWith('.ttf')) delete bundle[name];
      }
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), localApi(mode), dropUnusedTtf()],
  // Forces a single copy of React. @premiummg/ui is now installed from the
  // registry (no symlink), so this is just a safety net: if it is ever
  // `npm link`ed / `file:`-linked again for local work, its own nested React
  // would otherwise load alongside this project's and break every hook
  // ("Cannot read properties of null (reading 'useState')").
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  // The prerender build (see scripts/prerender.mjs) runs this same tree under
  // Node. Vite leaves node_modules imports external in an SSR build by
  // default, which breaks two of them here:
  //
  // - `@premiummg/ui` was added here back when it was a `file:` symlink, so
  //   Node would not resolve it (and its own React copy) outside Vite. It now
  //   comes from the registry; it is kept bundled as the known-good setting
  //   and has not been re-tested as external.
  // - `react-phone-number-input` imports a stylesheet, and Node cannot
  //   `import` a .css file at all.
  //
  // Bundling both puts them back under Vite's resolution, where the CSS is
  // handled at build time and React stays a single instance.
  ssr: {
    noExternal: ['@premiummg/ui', 'react-phone-number-input'],
  },
  build: {
    outDir: 'dist',
    // Read by scripts/prerender.mjs to find each lazy page's own built
    // filename (it has a content hash Vite only decides at this build), so
    // a direct hit on /register or /programs/:key can get a modulepreload
    // hint for its own chunk instead of discovering it only after the main
    // bundle has already loaded and started executing.
    manifest: true,
    rolldownOptions: {
      treeshake: {
        // @premiummg/ui ships one flat dist/index.js that calls
        // `createDOMPurify()` at module level; bundlers cannot prove that
        // call side-effect-free, so DOMPurify (~21 kB raw) lands in the main
        // chunk even though no page here sanitizes HTML. Declaring these
        // calls pure lets it be dropped. Long-term fix: mark the call
        // `/*#__PURE__*/` in the UI package itself. If src/ ever starts using
        // a UI component that sanitizes HTML, remove this option.
        manualPureFunctions: ['createDOMPurify', 'DOMPurify'],
      },
    },
  },
}));
