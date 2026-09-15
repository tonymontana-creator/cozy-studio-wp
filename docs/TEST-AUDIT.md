# Test audit — Cozy AI Studio

**Date:** 2026-09-05 (PWA/brand re-audit)  
**Host:** Windows 10 / Node v24.19.0 / npm 12.0.2  
**Auth:** `VITE_AUTH_ENABLED=false` (localStorage only)

## Gate results (post PWA/brand fix)

| Gate | Command | Exit | Notes |
|------|---------|------|-------|
| Auth invariant | `npm run check:auth` | **0** | Integrity PASS — sign-in off (dev = build) |
| Platform | `npm run test:platform` | **0** | 195 pass / 2 skip (+ 60 src); brand / grok-pwa / write-atomic |
| Typecheck | `npm run typecheck` | **0** | via `test:audit` |
| Lint | `npm run lint` | **0** | 3 warnings (non-blocking) |
| Unit | `npm run test:unit` / `npm test` | **0** | core + platform (`.grok/skills/og` present) |
| E2E | `npm run test:e2e` | **0** | 3 passed (~28s) |
| Smoke | `npm run test:smoke` | **0** | desktop + mobile; **no BRAND NOTE/WARNING** |

`npm run test:audit` = typecheck + lint + unit + e2e → **exit 0**.

## What this re-audit fixed

### PWA unit isolation
- [`scripts/grok-pwa-plugin.test.mjs`](../scripts/grok-pwa-plugin.test.mjs) — `emptyWorkspace()` + `bareCtx()` so injectors never load baked `src/lib/og/site.json` from the repo cwd

### OG skill stubs (platform doc pins)
- [`.grok/skills/og/SKILL.md`](../.grok/skills/og/SKILL.md) — `/workspace/.grok/og-pending`, 10 minutes, Brand-asset pass wait prohibition, `brand-check` CLI
- [`.grok/skills/og/references/handover.md`](../.grok/skills/og/references/handover.md) — ≥3 accepted `write-atomic` hand-overs

### Brand assets
- `public/og.jpg` present (~111 KB JPEG)
- [`src/lib/og/site.json`](../src/lib/og/site.json) — `"card": "custom"`, `"image": "/og.jpg"` (no `x:game`)

### Smoke workspace root
- [`scripts/browser-smoke.mjs`](../scripts/browser-smoke.mjs) — `computeBrandWarnings({ workspaceRoot })` uses repo root (not hardcoded `/workspace`) so Windows hosts see `public/og.jpg`

## Known warnings (out of scope)

1. `StudioShell.tsx` — `react-hooks/exhaustive-deps` (`openRecent`)
2. `button.tsx` — `react-refresh/only-export-components`
3. `use-current-user.ts` — unused eslint-disable

## Still out of scope

- Live AI generation in CI (studio E2E uses offline local templates)
- Auth-on / login routes
- Built-output smoke on `:8081`
- Commit/push (on request only)
