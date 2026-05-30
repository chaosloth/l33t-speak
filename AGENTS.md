# AGENTS.md

## Current Scope

- This repo is currently a single-package VS Code extension. The broader l33t-speak gateway/monorepo plan is not implemented here yet; do not assume `apps/`, `packages/`, or server code exists in this repository.
- This package still uses npm (`package-lock.json`) rather than a pnpm workspace. Keep using the verified local npm scripts here until the extension is migrated deliberately.
- Use Node 20. The repo docs assume `export PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$PATH"` because older system Node versions are too old for the toolchain.

## Commands

```bash
npm install
npm run build
npm run watch
npm test
npx vitest run src/test/recognizer.test.ts
npm run lint
npm run docs:build
./helpers/macos/build.sh
```

- `npm run build` bundles `src/extension.ts` to `dist/extension.js` with esbuild as CJS targeting Node 18; `vscode` stays external.
- `npm run lint` is only `tsc --noEmit`. There is no ESLint, Prettier, or Biome config.
- `./helpers/macos/build.sh` rebuilds and ad-hoc signs `bin/darwin/dictation-helper`; that binary is expected in-repo.

## Testing And CI

- `tsconfig.json` excludes `src/test/**/*`, so `npm run lint` does not type-check tests. Run Vitest for any test change.
- Tests use inline `vi.mock("vscode", ..., { virtual: true })` in each test file, not a shared `__mocks__/` setup.
- `.github/workflows/docs.yml` is the only GitHub Actions workflow. It runs `npm install && npm run docs:build` on `main`; there is no CI coverage for extension build, typecheck, or tests.

## Architecture

- `src/extension.ts` is the real entrypoint: command registration, engine list construction, status bar wiring, insertion, and audio feedback all start there.
- `src/recognizer.ts` selects the first engine whose `isAvailable` is `true` and keeps it for the session. "Fallback" only means the initial engine ordering.
- `src/engines/macos.ts` and `src/engines/windows.ts` treat platform match as availability. If a native helper is missing or broken, the manager still selects it and will not fall back to `webview` automatically.
- Native engines use JSON lines over stdin/stdout. Outbound commands are `start`, `stop`, and `listDevices`; inbound messages are `partial`, `final`, `error`, and `devices`.
- `src/engines/webview.ts` is the always-available fallback and embeds the Web Speech API client inline in the panel HTML.
- `src/insertion.ts` inserts into every active editor selection or calls `terminal.sendText(text, false)` with no trailing newline. The insert target is chosen when recording starts, not when text is finally inserted.
- On stop, `src/extension.ts` waits 500 ms for a final recognition event; if none arrives, it inserts the last partial transcript. Preserve that behaviour when changing stop/cancel logic.

## Gotchas

- `l33t-speak.insertMode` is contributed in `package.json` and documented, but current runtime code never reads it. Do not assume streaming insertion is implemented.
- `activationEvents` is intentionally empty; command contributions activate the extension on VS Code `^1.74.0`.
- F5 launches the Extension Development Host, and `.vscode/launch.json` runs the default npm `build` task first.
