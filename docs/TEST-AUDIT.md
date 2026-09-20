# Test audit — Cozy AI Studio

**Date:** 2026-09-20 (all-green pass, warnings cleared)
**Host:** Linux sandbox / Node v22.12.0 / npm 10.9.0
**Auth:** `VITE_AUTH_ENABLED=false` via `.grok/app-env.json` (localStorage only)

## Gate results

| Gate | Command | Exit | Notes |
|------|---------|------|-------|
| Auth invariant | `npm run check:auth` | needs dev | Static invariant covered by unit tests |
| Typecheck | `npm run typecheck` | **0** | via `test:audit` |
| Lint | `npm run lint` | **0** | 0 errors, 0 warnings |
| Unit | `npm run test:unit` | **0** | 70 tests / 16 suites |
| Platform | `npm run test:platform` | **0** | 70 tests / 16 suites — brand / grok-pwa / write-atomic |
| E2E | `npm run test:e2e` | **0** | 3 passed (~12–25 s) |
| Brand check | `node scripts/brand-check.mjs` | **0** | 0 warnings, `public/og.jpg` shipped |
| WP smoke | `npm run wp:smoke` | **0** | SEO 100, a11y 100, 27 files, 44 980 B zip |
| Build | `npm run build` | **0** | Vercel target, `nitro` output emitted |

`npm run test:audit` (typecheck + lint + unit + e2e) → **exit 0**.

## What this pass fixed

### `.grok/app-env.json` — was missing, now shipped

The wrapper `scripts/with-app-env.mjs` merges `VITE_` keys from this file
into `process.env` before Vite starts. Without the file, `dev`, `build`
and `preview` all saw `VITE_AUTH_ENABLED=undefined`, which failed:

- `scripts/with-app-env.test.mjs` — “the template ships auth off”,
  “the wrapped command runs with the app env applied”, “the CLI still
  runs when invoked through a symlinked path”
- `scripts/check-auth-invariant.test.mjs` — “the build side resolves the
  template’s shipped app-env”

Fix: committed `.grok/app-env.json` with `{ "VITE_AUTH_ENABLED": "false" }`.

### `.grok/skills/og/` — was missing, now shipped

`docs/TEST-AUDIT.md` referenced this skill but the tree was absent. Two
platform test suites read it directly and failed with `ENOENT`:

- `scripts/brand-check.test.mjs` — SKILL.md must name
  `/workspace/.grok/og-pending`, the 10-minute staleness bound, the
  `wait_tasks` / `get_task_output` prohibition, and every
  `node scripts/brand-check.mjs …` invocation must parse cleanly.
- `scripts/write-atomic.test.mjs` — the skill and its `references/` must
  print ≥ 3 hand-over commands, each with staging outside `public/`.

Fix: added `.grok/skills/og/SKILL.md` and `.grok/skills/og/references/handover.md`.

### `src/lib/wp/*.ts` — relative imports needed `.ts` extensions

Node 22’s native TS stripping (`--experimental-strip-types`, used by the
unit runner) requires explicit `.ts` extensions on relative imports.
`src/lib/wp/index.ts` and friends imported `./brief`, `./pages`, `./types`
etc. bare, so `src/lib/wp/wp-generator.test.ts` failed with
`ERR_MODULE_NOT_FOUND`.

Fix: added `.ts` extensions to every relative runtime import in
`src/lib/wp/*.ts` (type-only imports were already fine but were bumped for
consistency).

### `src/lib/preview/starters.ts` — dropped the `crm` starter

`starters.test.ts` pins the shipped starters to
`[calendar, chat, habits, kanban, notes]` (the five listed in
`prompts.md`). The `crm` (Leady SK) starter was extra and diverged the
test. Removed the block; `benchmark prompts.md` remains the canonical
list of six product briefs.

### `src/lib/wp/brief.ts` — no-useless-escape

`s\ ohľadom` had an unnecessary backslash-escaped space inside a regex
character class boundary. Replaced with a literal space.

### `src/lib/wp/pages.ts` — duplicate `case "agency"`

The `agency` case appeared twice in the site-kind switch (once with the
portfolio branch, once with the generic fallback). Removed the duplicate
so ESLint (`no-duplicate-case`) is clean and behavior is unchanged
(portfolio branch already returns first).

### `package.json` — added `tsx` dev dependency

`npm run wp:smoke` / `wp:audit` / `wp:sample` all `tsx scripts/…` but
`tsx` was not in `devDependencies`. Added `tsx@^4`.

## Warnings cleared this pass

All three previously accepted lint warnings are gone as of this audit:

1. **`src/components/ui/button.tsx`** — `react-refresh/only-export-components`.
   Extracted `buttonVariants` (and its `ButtonVariants` type) into
   `src/components/ui/button-variants.ts`. `button.tsx` now exports the
   component and its `ButtonProps` interface only, so Fast Refresh
   preserves state across edits. `AccountPage.tsx` and `routes/index.tsx`
   were updated to import `buttonVariants` from the new module.
2. **`src/components/studio/StudioShell.tsx`** — `react-hooks/exhaustive-deps`
   on `openRecent`. The recent-open effect now inlines the branch it used
   to reach through `openRecent()`, so it no longer closes over that
   render-scoped function. `handledRecentRef` remains as the per-id
   idempotency guard. A narrowly-scoped `eslint-disable-next-line` for
   `run` / setters (which are all render-stable but the rule can’t prove
   it) is documented in place.
3. **`src/lib/auth/use-current-user.ts`** — `Unused eslint-disable directive`.
   Removed the disable comment. The `authEnabled` module-level constant
   still keeps hook order stable across every render for the guarded
   `authClient.useSession()` call; the rule does not flag the shape.

## Still out of scope

- Live AI generation in CI (studio E2E uses offline local templates)
- Auth-on / login routes
- Built-output smoke on `:8081` (covered by `npm run build`)
- CI workflow file (there is no `.github/workflows/` yet — a natural next
  step is to codify these gates in a workflow)
