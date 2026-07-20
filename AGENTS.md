# Stillgarden / notiongame agent notes

## Cursor Cloud specific instructions

- Environment config lives in `.cursor/environment.json` (Dockerfile base image + update script).
- On boot, `bash .cursor/scripts/update-deps.sh` runs. It skips `npm ci` when `node_modules` already matches `package-lock.json`.
- After the update script, dependencies are ready — do **not** re-run `npm install` / `npm ci` unless the lockfile changed or `node_modules` is missing.
- Verify with:
  - `npm test`
  - `npm run build`
  - `npm run lint`
- Dev server: `npm run dev -- --host 0.0.0.0`
- Unit tests use Vitest + jsdom; Playwright browsers are not required for `npm test`.
