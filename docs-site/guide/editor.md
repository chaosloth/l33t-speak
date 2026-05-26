# Editor Dictation

Dictate directly into any open editor — source files, markdown, commit messages, or any text input.

## How It Works

1. Place your cursor where you want text to appear
2. Press `Cmd+Shift+D` (macOS) or `Ctrl+Shift+D` (Windows)
3. Speak — a light "tink" tone confirms recording started
4. Press the same key combo to stop — text is inserted at all active cursors

## Multi-Cursor Support

If you have multiple cursors active (e.g., `Cmd+D` to select multiple occurrences), dictated text is inserted at **every** cursor position simultaneously.

## Insert Mode

By default (`final`), text is inserted only after you stop recording. Change to `streaming` to see text appear as you speak:

```json
{
  "l33t-speak.insertMode": "streaming"
}
```

| Mode | Behavior |
|------|----------|
| `final` | Inserts all recognized text when you stop recording |
| `streaming` | Inserts interim results in real-time as you speak |

## Cancel

Press `Escape` to cancel recording — nothing is inserted and the audio buffer is discarded. You'll hear a low "basso" tone confirming the cancel.
