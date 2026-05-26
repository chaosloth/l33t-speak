# Terminal & Claude Code

L33t Speak detects when your terminal panel is focused and routes dictated text directly into the active terminal.

## How It Works

1. Click into a terminal in VS Code (the cursor should be blinking in the terminal)
2. Press `Cmd+Shift+D` to start dictation
3. Speak your command or message
4. Press `Cmd+Shift+D` to stop — text appears in the terminal input

The text is typed into the terminal **without pressing Enter**, so you can review it before submitting.

## Claude Code Integration

This works naturally with Claude Code running in a VS Code terminal:

1. Start Claude Code in a terminal (`claude`)
2. Click into that terminal
3. Press `Cmd+Shift+D` and speak your prompt
4. Stop recording — your spoken words appear in Claude Code's input
5. Press Enter to submit (or edit first)

## Tips

- Text is inserted without a trailing newline — you control when to submit
- If you have multiple terminals open, text goes to the **active** (focused) terminal
- Use ESC to cancel if you misspoke — nothing will be sent to the terminal
