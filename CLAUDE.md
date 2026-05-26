# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

l33t-speak — a VS Code extension providing voice-to-text dictation using OS-native speech recognition (macOS/Windows) with a WebView fallback.

## Commands

```bash
# Use Node 20 (default system node is v14, too old)
export PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$PATH"

npm run build        # Bundle extension with esbuild -> dist/extension.js
npm run watch        # Watch mode for development
npm test             # Run all tests (vitest)
npm run test:watch   # Watch mode tests
npm run lint         # Type check (tsc --noEmit)

# Run a single test file
npx vitest run src/test/recognizer.test.ts

# Build macOS Swift helper
./helpers/macos/build.sh  # Outputs bin/darwin/dictation-helper
```

## Architecture

The extension has a layered architecture:

1. **Extension entry** (`src/extension.ts`) — activates on command, wires components, registers VS Code commands
2. **RecognizerManager** (`src/recognizer.ts`) — selects the first available engine, manages start/stop lifecycle, forwards events
3. **Platform engines** (`src/engines/`) — each implements `RecognitionEngine` interface from `src/types.ts`:
   - `macos.ts` — spawns `bin/darwin/dictation-helper` (Swift binary using SFSpeechRecognizer)
   - `windows.ts` — spawns `bin/win32/dictation-helper.ps1` (PowerShell using System.Speech)
   - `webview.ts` — hidden VS Code WebView panel using Web Speech API (always-available fallback)
4. **StatusBar** (`src/statusBar.ts`) — displays recording state and mic name, triggers mic picker
5. **Insertion** (`src/insertion.ts`) — inserts recognized text at all active cursor positions

Engines communicate with the extension via JSON lines over stdin/stdout (native) or postMessage (webview). Protocol types are in `src/types.ts`.

## Testing

Tests use vitest with a virtual mock for the `vscode` module. Test files live alongside source in `src/test/`. The `vitest.config.ts` handles the vscode mock resolution.

## Debugging

Press F5 in VS Code to launch the Extension Development Host (`.vscode/launch.json` configured).
