import pmgPreset from '@premiummg/ui/tailwind-preset';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [pmgPreset],
  darkMode: 'class',
  // @premiummg/ui's own components build their className strings at runtime
  // inside the package's COMPILED dist bundle, not inside anything under
  // ./src - without scanning that bundle too, Tailwind's JIT never sees
  // those exact class-name tokens and silently drops them (the same gap
  // pmg-intranet's own tailwind.config.js documents and works around).
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@premiummg/ui/dist/**/*.{js,cjs}',
  ],
};
