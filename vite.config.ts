import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // @premiummg/ui is a `file:` link during local dev (see package.json) -
  // through that symlink, its own `react`/`react-dom` (a separate copy in
  // ITS node_modules, not this project's) resolves ahead of this project's,
  // giving two React instances and "Cannot read properties of null (reading
  // 'useState')" on every component that uses a hook. `dedupe` forces both
  // to resolve to this project's single copy. A real registry install of
  // the package (no symlink) wouldn't hit this - it only shows up with a
  // local `file:` dependency.
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  // The prerender build (see scripts/prerender.mjs) runs this same tree under
  // Node. Vite leaves node_modules imports external in an SSR build by
  // default, which breaks two of them here:
  //
  // - `@premiummg/ui` resolves through the same `file:` symlink described
  //   above, so an external import would be resolved by Node rather than by
  //   the `dedupe` below, reaching for the package's own React copy again.
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
  },
});
