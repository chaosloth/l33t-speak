# Voice-to-Text VS Code Extension — Design Spec

## Summary

A VS Code extension ("l33t-speak") that captures speech via OS-native dictation (macOS/Windows) and inserts recognized text at the cursor position. Falls back to a hidden WebView using the Web Speech API when native engines are unavailable.

## Goals

- Provide low-friction voice-to-text input inside VS Code
- Support both toggle (tap start/stop) and push-to-talk (hold to record) activation modes
- Allow microphone selection via a status bar quick-pick
- Work on macOS and Windows natively; fall back to WebView on unsupported platforms or on failure

## Architecture

```
┌─────────────────────────────────────────────┐
│  VS Code Extension (TypeScript)             │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Commands │  │ Status   │  │ Settings │  │
│  │ & Keys   │  │ Bar      │  │          │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       └──────────┬───┘             │        │
│            ┌─────▼─────┐           │        │
│            │ Recognizer │◄──────────┘        │
│            │ Manager    │                    │
│            └─────┬──────┘                    │
│         ┌────────┼────────┐                  │
│    ┌────▼───┐ ┌──▼───┐ ┌──▼──────┐          │
│    │ macOS  │ │ Win  │ │ WebView │          │
│    │ Helper │ │Helper│ │Fallback │          │
│    └────────┘ └──────┘ └─────────┘          │
└─────────────────────────────────────────────┘
```

**Recognizer Manager** detects the platform, selects the appropriate engine, manages start/stop lifecycle, and emits recognized text to the extension host.

## Commands & Keybindings

| Command ID | Behavior | Default Keybinding |
|---|---|---|
| `l33t-speak.toggleDictation` | Start/stop recording (toggle) | `Ctrl+Shift+D` |
| `l33t-speak.pushToTalk` | Record while held, stop on release | `Ctrl+Shift+Space` |

- A microphone icon button is also added to the editor title bar for mouse activation.
- Push-to-talk is implemented as two keybindings on the same key combo: one triggers `l33t-speak.startDictation` (keydown), the other triggers `l33t-speak.stopDictation` with a `when` clause of `l33t-speak.isRecording` (second press or release). Since VS Code doesn't support native keyup events, push-to-talk behaves as "press to start, press again to stop" — functionally identical to toggle but with a separate keybinding for user ergonomics.

## Status Bar

- Displays current state: idle (mic icon), recording (red highlight + "Recording..."), or error
- Shows the name of the currently selected microphone
- Clicking opens a quick-pick list of available input devices (enumerated from the active engine)

## Platform Engines

### macOS — Swift Helper Binary

- Pre-compiled Swift CLI binary bundled at `bin/darwin/dictation-helper`
- Uses `SFSpeechRecognizer` + `AVAudioEngine` (requires macOS 10.15+)
- Microphone enumeration via AVAudioSession input ports
- Accepts device ID and language as CLI arguments
- Communicates via JSON lines over stdin/stdout

### Windows — PowerShell Script

- PowerShell script at `bin/win32/dictation-helper.ps1`
- Uses .NET `System.Speech.Recognition.SpeechRecognitionEngine` (available on Windows 10/11)
- Microphone enumeration via `System.Speech` audio input APIs
- Accepts device index and language as parameters
- Communicates via JSON lines over stdin/stdout

### WebView Fallback

- Hidden VS Code WebView panel with HTML/JS using `webkitSpeechRecognition`
- Communicates via VS Code webview messaging API (`postMessage` / `onDidReceiveMessage`)
- Microphone selection via `navigator.mediaDevices.enumerateDevices()` (limited compared to native)
- Requires internet (Chrome's speech recognition uses Google servers)

## Communication Protocol

Extension → Helper (stdin):
```json
{"cmd": "start", "deviceId": "...", "lang": "en-US"}
{"cmd": "stop"}
{"cmd": "listDevices"}
```

Helper → Extension (stdout):
```json
{"type": "partial", "text": "hello"}
{"type": "final", "text": "hello world"}
{"type": "devices", "list": [{"id": "...", "name": "MacBook Pro Microphone"}]}
{"type": "error", "message": "..."}
```

## Text Insertion

- On `final` result: insert text at all active cursor positions in the active editor
- On `partial` result: display in the status bar as a live preview (not inserted into the document)
- If no active text editor is open, show a warning notification

## Settings

| Setting | Type | Default | Description |
|---|---|---|---|
| `l33t-speak.preferredEngine` | `"auto" \| "macos" \| "windows" \| "webview"` | `"auto"` | Override engine selection |
| `l33t-speak.microphone` | `string \| null` | `null` | Device ID of preferred microphone |
| `l33t-speak.language` | `string` | `"en-US"` | BCP-47 language code for recognition |
| `l33t-speak.insertMode` | `"final" \| "streaming"` | `"final"` | Insert on final result only, or stream interim text |

## Error Handling & Fallback Chain

1. Detect platform → select native engine
2. Attempt to spawn native helper
3. If spawn fails (binary missing, permission denied, unexpected exit) → fall back to WebView engine
4. Show notification: "Native dictation unavailable, using WebView fallback"
5. If WebView also fails → show error with troubleshooting guidance

**macOS permissions:** First launch triggers OS permission prompts for Microphone and Speech Recognition. Permission denial is detected via helper exit code; extension surfaces a notification linking to System Preferences.

## Technology

- **Language:** TypeScript (extension), Swift (macOS helper), PowerShell (Windows helper)
- **Bundler:** esbuild
- **Activation:** `onCommand` (lazy — no cost until first use)
- **VS Code API version:** 1.74+ (for WebView and status bar APIs)

## Project Structure

```
l33t-speak/
├── src/
│   ├── extension.ts          # activation, command registration
│   ├── recognizer.ts         # RecognizerManager - engine selection & lifecycle
│   ├── engines/
│   │   ├── macos.ts          # spawn & communicate with Swift helper
│   │   ├── windows.ts        # spawn & communicate with PowerShell helper
│   │   └── webview.ts        # WebView panel management & messaging
│   ├── statusBar.ts          # status bar UI
│   └── insertion.ts          # text insertion at cursor
├── bin/
│   ├── darwin/
│   │   └── dictation-helper  # compiled Swift binary
│   └── win32/
│       └── dictation-helper.ps1
├── media/
│   └── webview/
│       └── index.html        # Web Speech API fallback
├── helpers/
│   └── macos/
│       └── main.swift        # Swift source for the macOS helper
├── package.json              # extension manifest, commands, keybindings, settings
├── tsconfig.json
└── esbuild.config.mjs
```

## Out of Scope (for PoC)

- Linux native support
- Custom wake words
- Punctuation commands ("period", "new line" interpreted as formatting)
- Speech-to-code intelligence (e.g., converting "function foo" to actual code constructs)
- Extension marketplace publishing
