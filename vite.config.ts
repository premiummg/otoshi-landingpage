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
  build: {
    outDir: 'dist',
  },
});
