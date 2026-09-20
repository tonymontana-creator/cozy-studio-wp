# og — brand-asset pass

> Custom social card + brand assets for the deployed app. Runs as a
> `task` subagent launched during scaffolding, never on the critical path.
> The parent answers without you; ship, then publish again when you wake.

## Trigger words

`og`, `og:image`, `og image`, `share card`, `open graph`, `x-banner`,
`x banner`, `twitter card`, `brand card`, `social preview`, `favicon`,
`pwa icon`, `apple touch icon`.

## Marker file

While the pass is running you keep `/workspace/.grok/og-pending` fresh
(touch it every step). The parent's brand gate reads that marker and
silences its warning while the mtime is younger than **10 minutes**.
Anything staler than 10 minutes is treated as no pass in flight.

Concretely: `touch /workspace/.grok/og-pending` on entry, and again after
every hand-over below. Never write your final asset into `/workspace/public/`
directly — stage under `/workspace/.grok/` first and hand over atomically.

## Brand-asset pass: never waited for

The **parent must never `wait_tasks` or `get_task_output`** on this pass
— consuming a task's output suppresses its completion notification, so the
result would reach nobody. The parent should not `wait_tasks` and it must
never `get_task_output` on this task; the parent answers without you and
re-publishes when you wake it up.

If the parent's own prompt says it *is* the pass, it runs the recipes in
`references/` inline instead of spawning this subagent.

## Self-check before hand-over

Before you touch `og-pending` for the last time, self-check the assets on
disk. The parent's gate has its own tolerances (placeholder allowed for
plain utilities); a pass exists **to produce a real card**, so the CLI is
strict by default and only `--placeholder-ok` excuses no card at all:

```
node scripts/brand-check.mjs
node scripts/brand-check.mjs --game
node scripts/brand-check.mjs --placeholder-ok
node scripts/brand-check.mjs --root /workspace
```

Every invocation above is accepted by `parseBrandCheckArgs` in
`scripts/brand-check.mjs`; do not invent flags.

## Hand-overs

The concrete recipes live in `references/handover.md`. Every hand-over is
an atomic move from `/workspace/.grok/…` to `/workspace/public/…` (or to
`src/lib/og/site.json`) via the atomic writer at
`scripts/write-atomic.mjs`, which refuses staging inside `public/` because
`vite build` ships that directory verbatim.

Read `references/handover.md` before writing any asset. The three
commands the recipes end in are:

```
node scripts/write-atomic.mjs /workspace/.grok/og-pending/og.jpg /workspace/public/og.jpg
node scripts/write-atomic.mjs /workspace/.grok/og-pending/x-banner.jpg /workspace/public/x-banner.jpg
node scripts/write-atomic.mjs /workspace/.grok/og-pending/site.json /workspace/src/lib/og/site.json
```
