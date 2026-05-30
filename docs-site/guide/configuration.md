# Configuration

Open VS Code settings (`Cmd+,`) and search for "l33t-speak".

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `l33t-speak.preferredEngine` | `auto` | Speech engine: `auto`, `macos`, `windows`, or `webview` |
| `l33t-speak.microphone` | `null` | Device ID of preferred microphone |
| `l33t-speak.language` | `en-US` | BCP-47 language code (e.g., `en-GB`, `fr-FR`, `de-DE`) |
| `l33t-speak.insertMode` | `final` | `final` inserts after you stop; `streaming` inserts as you speak |
| `l33t-speak.enableGateway` | `false` | Send dictation to the l33t gateway for AI processing |
| `l33t-speak.gatewayUrl` | `https://gateway.l33tspeak.dev` | Base URL of the gateway API |
| `l33t-speak.gatewayApiKey` | `""` | Placeholder — use `Cmd+Shift+P` → "Set Gateway API Key" to store in OS keychain |

## Gateway Settings

When the gateway is configured (see [Gateway Setup](/guide/gateway)), three additional settings control how dictation is processed:

### `l33t-speak.enableGateway`

Toggles gateway AI processing on/off. **This is auto-enabled when you set an API key** — no manual toggle needed. Turn it off to disable gateway processing without clearing your key.

### `l33t-speak.gatewayUrl`

The URL of your gateway API. Default is `https://gateway.l33tspeak.dev` for the hosted gateway. Use `http://localhost:3000` for local Docker development.

### `l33t-speak.gatewayApiKey`

Placeholder text only. The actual API key is stored securely in your operating system's keychain via VS Code's [SecretStorage API](https://code.visualstudio.com/api/references/vscode-api#SecretStorage). Use the command **"L33t Speak: Set Gateway API Key"** to enter your key — it will never appear in your settings file.

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
