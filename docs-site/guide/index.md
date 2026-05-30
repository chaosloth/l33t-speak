# Quick Start

## Start Dictating

1. Open a file or click into a terminal in VS Code
2. Press **`Cmd+Shift+D`** (macOS) or **`Ctrl+Shift+D`** (Windows)
3. Speak — you'll see partial text in the status bar
4. Press the same key combo again to stop — text is inserted at your cursor

That's it. Your words appear wherever your cursor was when you started recording.

## Keybindings

| Key | Action |
|-----|--------|
| `Cmd+Shift+D` / `Ctrl+Shift+D` | Toggle dictation on/off |
| `Cmd+Shift+Space` / `Ctrl+Shift+Space` | Stop dictation |
| `Escape` | **Cancel** dictation (discards text) |

## Status Bar

The status bar (bottom right) shows:

- **Idle:** `🎤 Default` — microphone name, click to change
- **Recording:** `🎤 Recording...` with red background, shows partial text as you speak
- **Processing:** Cycling rainbow colors with a spinner — gateway is enhancing your text (see [Gateway Setup](/guide/gateway))
- **Mode Selector:** Shows current mode (Auto/Markdown/Code/Terminal/Commit/Magic) — click to cycle (see [Processing Modes](/guide/modes))
- **Error:** `⚠️ Mic Error` — check permissions

## Audio Feedback

You'll hear short tones:

- **Start:** a light "tink" when recording begins
- **Stop:** a "pop" when recording ends and text is inserted
- **Cancel:** a low "basso" when you press ESC to discard

## Next Steps

- [Configure settings](/guide/configuration) — language, engine, insert mode
- [AI Gateway](/guide/gateway) — enhance dictation with language models
- [Processing Modes](/guide/modes) — choose how your text is formatted
- [Use with terminals](/guide/terminal) — dictate into Claude Code
- [Select a microphone](/guide/microphone) — choose your input device
