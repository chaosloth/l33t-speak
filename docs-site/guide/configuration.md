# Configuration

Open VS Code settings (`Cmd+,`) and search for "l33t-speak".

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `l33t-speak.preferredEngine` | `auto` | Speech engine: `auto`, `macos`, `windows`, or `webview` |
| `l33t-speak.microphone` | `null` | Device ID of preferred microphone |
| `l33t-speak.language` | `en-US` | BCP-47 language code (e.g., `en-GB`, `fr-FR`, `de-DE`) |
| `l33t-speak.insertMode` | `final` | `final` inserts after you stop; `streaming` inserts as you speak |

## Engine Selection

By default (`auto`), the extension picks the best available engine:

- **macOS** → native SFSpeechRecognizer (offline, fast)
- **Windows** → native System.Speech (offline)
- **Other** → WebView with Web Speech API (requires internet)

Override with `l33t-speak.preferredEngine` if you want to force a specific engine.

## Language

Set `l33t-speak.language` to any BCP-47 locale supported by your platform's speech recognizer. Common values:

- `en-US` — English (US)
- `en-GB` — English (UK)
- `fr-FR` — French
- `de-DE` — German
- `es-ES` — Spanish
- `ja-JP` — Japanese
