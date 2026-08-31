// Feature: horizontal-tab-navigation
// Registers the "@/..." alias resolution hook (tests/alias-hook.mjs) so that
// importing app/tabnav TypeScript modules resolves the tsconfig path alias.
// Used via `node --import ./tests/alias-register.mjs`. Dedicated to tabnav tests.
import { register } from 'node:module';

register('./alias-hook.mjs', import.meta.url);
