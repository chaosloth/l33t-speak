# L33t Speak - Voice to Text for VS Code

A VS Code extension that provides voice-to-text dictation using OS-native speech recognition. Speak into your microphone and have your words inserted at your cursor — in the editor or the terminal.

Built for developers who want hands-free text input while coding, writing commit messages, or interacting with CLI tools like Claude Code.

## Features

- **Voice dictation** — press a hotkey to start/stop recording, text appears where your cursor is
- **Works in editors and terminals** — dictation targets whichever panel is focused when you start
- **Claude Code integration** — speak commands directly into a Claude Code terminal session
- **Microphone selection** — pick your input device from the status bar
- **Audio feedback** — short tones on start, stop, and cancel so you know the state
- **Cancel with ESC** — discard what you said without inserting anything

## Keybindings

| Key | Action |
|-----|--------|
| `Cmd+Shift+D` (macOS) / `Ctrl+Shift+D` | Toggle dictation on/off |
| `Cmd+Shift+Space` / `Ctrl+Shift+Space` | Start/stop dictation (alternative) |
| `Escape` | Cancel dictation (discards buffered text) |

## How It Works

The extension uses **macOS native speech recognition** (SFSpeechRecognizer) on Mac and **System.Speech** on Windows. A hidden WebView fallback using the Web Speech API is available when native engines aren't present.

On macOS, a compiled Swift helper binary handles the actual speech recognition and communicates with the extension via JSON over stdin/stdout. This means:

- No API keys required
- No internet required (on macOS)
- Low latency, high accuracy via Apple's on-device models

## Requirements

- **macOS 10.15+** or **Windows 10/11**
- Microphone access must be granted to VS Code in System Settings > Privacy & Security
- Speech Recognition access must be granted (macOS will prompt on first use)

## Extension Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `l33t-speak.preferredEngine` | `auto` | Engine to use: `auto`, `macos`, `windows`, or `webview` |
| `l33t-speak.microphone` | `null` | Device ID of preferred microphone |
| `l33t-speak.language` | `en-US` | BCP-47 language code for recognition |
| `l33t-speak.insertMode` | `final` | Insert on final result only, or stream interim results |

## Development

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Build the macOS Swift helper
./helpers/macos/build.sh

# Run tests (requires Node 20)
npm test

# Launch in VS Code
# Press F5 to open an Extension Development Host
```

## Architecture

```
Extension Host (TypeScript)
    ├── extension.ts        ← commands, wiring
    ├── recognizer.ts       ← engine selection, lifecycle
    ├── engines/
    │   ├── macos.ts        ← spawns Swift helper
    │   ├── windows.ts      ← spawns PowerShell helper
    │   └── webview.ts      ← Web Speech API fallback
    ├── statusBar.ts        ← UI state
    ├── insertion.ts        ← routes text to editor/terminal
    └── tones.ts            ← audio feedback

Native Helpers (communicate via JSON lines over stdin/stdout)
    ├── bin/darwin/dictation-helper    ← compiled Swift binary
    └── bin/win32/dictation-helper.ps1 ← PowerShell script
```

## Known Limitations

- Linux is not supported (no native speech engine; WebView fallback requires internet)
- Push-to-talk is implemented as press-to-start/press-to-stop (VS Code doesn't support keyup events)
- The WebView fallback requires an internet connection (Chrome's speech recognition uses Google servers)
- First use on macOS requires granting both Microphone and Speech Recognition permissions to VS Code
