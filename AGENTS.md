# AGENTS.md

This file provides guidance to AI coding agents working in this repository.

## Commands

```bash
# Node 20 required — system default is v14
export PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$PATH"

npm run build        # esbuild bundle src/extension.ts -> dist/extension.js (CJS, Node 18)
npm run watch        # esbuild --watch
npm test             # vitest run
npm run lint         # type check only (tsc --noEmit) — no ESLint or style linting

# Single test file
npx vitest run src/test/recognizer.test.ts

# Swift helper (macOS only)
./helpers/macos/build.sh   # compiles -> bin/darwin/dictation-helper (committed binary)
```

## Build

- esbuild bundles a single entrypoint (`src/extension.ts`) to CJS targeting Node 18, output to `dist/extension.js`
- `vscode` module is externalized — never bundled, imported at runtime by the extension host
- `tsconfig.json` **excludes** `src/test/**/*` from type checking, but vitest still runs those files

## Testing

- Uses vitest with `vi.mock("vscode", ..., { virtual: true })` — the vscode mock is created inline in test files, not in `__mocks__/`
- No CI runs tests or lint. The only CI workflow deploys VitePress docs to GitHub Pages on push to `main`

## Architecture

### Engine selection

`RecognizerManager` selects the **first available** engine from the list — the rest are fallbacks. Engine order depends on `l33t-speak.preferredEngine` config:

| Config       | Order                        |
| ------------ | ---------------------------- |
| `auto`       | native → webview (by platform) |
| `macos`      | macos → webview              |
| `windows`    | windows → webview            |
| `webview`    | webview only                 |

### Engine communication protocol

Native engines spawn a subprocess and communicate via **JSON lines over stdin/stdout**. The webview engine uses `postMessage`. Protocol message types are in `src/types.ts`:

- **Inbound** (helper → extension): `{ type: "partial" | "final" | "error" | "devices", ... }`
- **Outbound** (extension → helper): `{ cmd: "start" | "stop" | "listDevices", deviceId?, lang? }`

### Key files

- `src/extension.ts` — activation, command registration, wiring
- `src/recognizer.ts` — engine selection, start/stop/toggle lifecycle
- `src/engines/macos.ts` — spawns `bin/darwin/dictation-helper` (committed Swift binary)
- `src/engines/windows.ts` — spawns `bin/win32/dictation-helper.ps1` (committed PowerShell)
- `src/engines/webview.ts` — hidden WebView panel, always-available fallback
- `src/insertion.ts` — routes recognized text to editor or terminal
- `src/statusBar.ts` — recording state and mic name display
- `src/tones.ts` — start/stop/cancel audio feedback

### Insertion

Text is inserted at all active selections in the editor. For terminals, `terminal.sendText(text, false)` is used (no trailing newline). The target is locked in when recording starts (editor vs terminal), not re-evaluated on insertion.

### Debugging

Press F5 to launch the Extension Development Host. The `.vscode/launch.json` has a `preLaunchTask` that runs the default npm build task first.
