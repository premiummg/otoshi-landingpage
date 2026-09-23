import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const container = document.getElementById('root')!;
const tree = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Every real route ships as prerendered HTML (see scripts/prerender.mjs), so
// the normal path is hydration: adopt the markup that is already on screen
// instead of throwing it away and painting the page a second time. The
// createRoot branch is the fallback for a document that arrived empty, which
// is what `vite dev` serves - dev never runs the prerender step.
if (container.firstElementChild) {
  hydrateRoot(container, tree);
} else {
  createRoot(container).render(tree);
}
