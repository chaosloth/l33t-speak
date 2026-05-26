# Task 13: End-to-End Manual Testing

**Files:**
- Modify: `package.json` (add launch config reference)
- Create: `.vscode/launch.json`

---

- [ ] **Step 1: Create `.vscode/launch.json`**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": ["--extensionDevelopmentPath=${workspaceFolder}"],
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "preLaunchTask": "${defaultBuildTask}"
    }
  ]
}
```

- [ ] **Step 2: Create `.vscode/tasks.json`**

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Build",
      "type": "npm",
      "script": "build",
      "isBackground": false,
      "group": { "kind": "build", "isDefault": true }
    }
  ]
}
```

- [ ] **Step 3: Build the extension**

Run: `npm run build`
Expected: `dist/extension.js` created without errors

- [ ] **Step 4: Launch extension in debug mode**

In VS Code, press F5 (uses the launch config above). A new Extension Development Host window opens.

- [ ] **Step 5: Test toggle dictation**

In the Extension Development Host:
1. Open a text file
2. Press `Cmd+Shift+D` (macOS) or `Ctrl+Shift+D` (Windows)
3. Verify: status bar shows "Recording..." with red background
4. Speak a phrase
5. Verify: text is inserted at cursor after speaking
6. Press `Cmd+Shift+D` again
7. Verify: status bar returns to idle state showing mic name

- [ ] **Step 6: Test push-to-talk**

1. Open a text file, place cursor
2. Press `Cmd+Shift+Space` — verify recording starts
3. Press `Cmd+Shift+Space` again — verify recording stops and text is inserted

- [ ] **Step 7: Test microphone selection**

1. Click the mic status bar item
2. Verify: quick-pick list appears with available microphones
3. Select a different microphone
4. Verify: status bar updates with new mic name
5. Verify: next dictation uses the selected microphone

- [ ] **Step 8: Test fallback behavior**

1. Set `l33t-speak.preferredEngine` to `"webview"` in settings
2. Trigger dictation
3. Verify: WebView panel appears, recognition works via Web Speech API
4. Verify: notification indicates WebView is being used (if triggered by fallback)

- [ ] **Step 9: Test error handling**

1. Deny microphone permission (if prompted)
2. Verify: error notification appears with guidance
3. Verify: status bar shows error state

- [ ] **Step 10: Commit launch configs**

```bash
git add .vscode/launch.json .vscode/tasks.json
git commit -m "chore: add VS Code launch config for extension debugging"
```
