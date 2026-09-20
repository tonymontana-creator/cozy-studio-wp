# og hand-overs

Every asset is produced under `/workspace/.grok/…`, then moved onto the
deployed path with `scripts/write-atomic.mjs`. `write-atomic` refuses
staging inside `public/` on purpose: `vite build` ships that directory
verbatim, and a half-written temp there would ship too.

## 1. Share card — `public/og.jpg`

Render the 1200×630 card into the staging directory, then hand over:

```
node scripts/write-atomic.mjs /workspace/.grok/og-pending/og.jpg /workspace/public/og.jpg
```

## 2. X feed banner — `public/x-banner.jpg`

Same story, 1500×500 for the X 50:11 game-card unfurl:

```
node scripts/write-atomic.mjs /workspace/.grok/og-pending/x-banner.jpg /workspace/public/x-banner.jpg
```

## 3. Site manifest — `src/lib/og/site.json`

Flip `"card": "custom"` and point `"image"` at `/og.jpg`. For games, also
set `"type": "x:game"` so the platform injector emits `og:type` for the X
game-card unfurl. Stage the JSON alongside the images and hand over:

```
node scripts/write-atomic.mjs /workspace/.grok/og-pending/site.json /workspace/src/lib/og/site.json
```

## Notes

- Touch `/workspace/.grok/og-pending` after each of the three hand-overs so
  the parent's 10-minute freshness window keeps sliding.
- The final self-check is `node scripts/brand-check.mjs` from the SKILL —
  the strict form, with no `--placeholder-ok`, because a pass that ends
  with a placeholder is a failed pass.
