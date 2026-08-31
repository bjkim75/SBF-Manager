// Feature: horizontal-tab-navigation
// Module-resolution hooks that map the "@/..." path alias (tsconfig paths) to the
// project root so tests can import app/tabnav TypeScript modules under
// `node --test --experimental-strip-types`. Registered via tests/alias-register.mjs.
// Dedicated to the tabnav property tests; touches no shared test/impl file.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const projectRoot = new URL('../', import.meta.url);
const CANDIDATE_EXTS = ['.ts', '.tsx', '.mts', '.js', '.mjs'];

function withResolvedExtension(url) {
  const path = fileURLToPath(url);
  if (existsSync(path)) return url; // already a real file (has extension)
  for (const ext of CANDIDATE_EXTS) {
    if (existsSync(path + ext)) return new URL(url.href + ext);
  }
  return url;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const mapped = withResolvedExtension(new URL(specifier.slice(2), projectRoot));
    return nextResolve(mapped.href, context);
  }
  return nextResolve(specifier, context);
}
