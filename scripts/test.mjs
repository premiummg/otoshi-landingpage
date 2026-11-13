// Runs Vitest with the Windows drive letter upper-cased.
//
// A shell opened as "c:\..." (lowercase drive, which is what VS Code's
// terminal gives you) makes Vitest end up loaded under two spellings of the
// same path, and every suite then dies with "Cannot read properties of
// undefined (reading 'config')" before a single test runs. Starting it from
// "C:\..." avoids that. On macOS/Linux this is a plain pass-through.
import { spawnSync } from 'node:child_process';

const root = process.cwd().replace(/^[a-z]:/, drive => drive.toUpperCase());
const result = spawnSync(
  process.execPath,
  [`${root}/node_modules/vitest/vitest.mjs`, 'run', ...process.argv.slice(2)],
  { cwd: root, stdio: 'inherit' },
);
process.exit(result.status ?? 1);
