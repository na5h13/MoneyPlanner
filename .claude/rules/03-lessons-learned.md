# Lessons Learned — Quick Gotcha Reference

These are verified failures from the first build. Read before implementing.

| Gotcha | Rule |
|--------|------|
| Plaid SDK ESM bare imports | Postinstall `scripts/fix-plaid-esm.js` patches them |
| Plaid SDK has no Expo plugin | Don't add to app.json plugins — autolinking only |
| Expo prebuild generates signingConfigs | Patch INSIDE existing block, don't add new block |
| google-services.json in CI | Use `printenv`, never `echo '...'`. Must include `configuration_version: "1"` |
| .env heredoc in YAML | Use individual `echo` lines, not heredoc (whitespace leaks) |
| Placeholder PNGs must be valid | ImageMagick: `convert -size 1024x1024 xc:'#f5f2ee' assets/icon.png` |
| Express v5 params | `req.params.id` is `string \| string[]` — cast with `as string` |
| tsconfig picks up worktrees | Add worktree dirs to `exclude` |
| Firestore `.set()` with dot-notation | Creates FLAT keys. Use `.update()` for nested paths |
| Firestore composite index | Multi-field where+orderBy fails without index. Wrap in try/catch |
| Categories must be seeded before use | Budget + sync must call `ensureCategories()` — not just GET /categories |
| ensureCategories only seeds | Must ALSO migrate existing docs missing new fields |
| Firebase JS init at module load | Blank screen crash. Use lazy `getFirebaseAuth()` pattern |
| Firebase web vs Android API key | Different per platform. Web from Console, not google-services.json |
| Web layout mobile-first | BAD. Desktop sidebar 220px + mobile bottom nav at <768px |
| Silent API errors | Surface ALL with ErrorBanner + retry. Differentiate empty/loading/error |
| Vite env vars | Need `VITE_` prefix. Expo needs `EXPO_PUBLIC_` prefix |
| Web app deployment | Express serves `web/dist/`. railway.json builds both. No separate hosting |
| Piecewise data model changes | Grep codebase, update ALL: types, routes, services, store, UI, migration |
| Unregistered Plaid redirect_uri | Kills ALL banks. Only send OAuth params via env vars when registered |
| Duplicate .env keys | Last value wins. Deduplicate before debugging API issues |
| aarch64 cannot build APKs | GitHub Actions CI only. Never local Gradle on ARM |
| Spread operator duplicates | Check spread contents before adding explicit overrides |
