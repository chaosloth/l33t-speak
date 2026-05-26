# Task 9: Extension Entry Point & Commands

**Files:**
- Create: `src/extension.ts`

---

- [ ] **Step 1: Create `src/extension.ts`**

```typescript
import * as vscode from "vscode";
import { RecognizerManager } from "./recognizer";
import { StatusBarManager } from "./statusBar";
import { MacOSEngine } from "./engines/macos";
import { WindowsEngine } from "./engines/windows";
import { WebViewEngine } from "./engines/webview";
import { insertTextAtCursor } from "./insertion";
import { RecognitionEngine } from "./types";

let recognizer: RecognizerManager;
let statusBar: StatusBarManager;
let isRecordingContext: boolean = false;

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration("l33t-speak");
  const preferredEngine = config.get<string>("preferredEngine", "auto");

  const engines: RecognitionEngine[] = buildEngineList(
    context.extensionPath,
    context.extensionUri,
    preferredEngine
  );

  try {
    recognizer = new RecognizerManager(engines);
  } catch (e: any) {
    vscode.window.showErrorMessage(
      `L33t Speak: ${e.message}. Voice-to-text is unavailable.`
    );
    return;
  }

  statusBar = new StatusBarManager();

  const recordingContext = "l33t-speak.isRecording";
  vscode.commands.executeCommand("setContext", recordingContext, false);

  recognizer.onStateChange = (state) => {
    statusBar.setState(state);
    const recording = state === "recording";
    vscode.commands.executeCommand("setContext", recordingContext, recording);
    isRecordingContext = recording;
  };

  recognizer.onResult = (result) => {
    if (result.type === "final") {
      insertTextAtCursor(result.text);
      statusBar.setState("recording");
    } else {
      statusBar.setPartialText(result.text);
    }
  };

  recognizer.onError = (error) => {
    vscode.window.showErrorMessage(`L33t Speak: ${error}`);
    statusBar.setState("error");
  };

  const toggleCmd = vscode.commands.registerCommand(
    "l33t-speak.toggleDictation",
    () => {
      const config = vscode.workspace.getConfiguration("l33t-speak");
      const deviceId = config.get<string | null>("microphone", null);
      const lang = config.get<string>("language", "en-US");
      recognizer.toggle(deviceId, lang);
    }
  );

  const startCmd = vscode.commands.registerCommand(
    "l33t-speak.startDictation",
    () => {
      const config = vscode.workspace.getConfiguration("l33t-speak");
      const deviceId = config.get<string | null>("microphone", null);
      const lang = config.get<string>("language", "en-US");
      recognizer.start(deviceId, lang);
    }
  );

  const stopCmd = vscode.commands.registerCommand(
    "l33t-speak.stopDictation",
    () => {
      recognizer.stop();
    }
  );

  const selectMicCmd = vscode.commands.registerCommand(
    "l33t-speak.selectMicrophone",
    async () => {
      try {
        const devices = await recognizer.listDevices();
        const items = devices.map((d) => ({
          label: d.name,
          description: d.id,
        }));

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: "Select a microphone",
        });

        if (selected) {
          const config = vscode.workspace.getConfiguration("l33t-speak");
          await config.update(
            "microphone",
            selected.description,
            vscode.ConfigurationTarget.Global
          );
          statusBar.setMicName(selected.label);
        }
      } catch (e: any) {
        vscode.window.showErrorMessage(
          `L33t Speak: Failed to list microphones: ${e.message}`
        );
      }
    }
  );

  context.subscriptions.push(toggleCmd, startCmd, stopCmd, selectMicCmd);
  context.subscriptions.push(statusBar);
  context.subscriptions.push({ dispose: () => recognizer.dispose() });
}

function buildEngineList(
  extensionPath: string,
  extensionUri: vscode.Uri,
  preferred: string
): RecognitionEngine[] {
  const macos = new MacOSEngine(extensionPath);
  const windows = new WindowsEngine(extensionPath);
  const webview = new WebViewEngine(extensionUri);

  if (preferred === "macos") return [macos, webview];
  if (preferred === "windows") return [windows, webview];
  if (preferred === "webview") return [webview];

  // "auto" — platform-native first, webview fallback
  if (process.platform === "darwin") return [macos, webview];
  if (process.platform === "win32") return [windows, webview];
  return [webview];
}

export function deactivate() {
  recognizer?.dispose();
  statusBar?.dispose();
}
```

- [ ] **Step 2: Verify build succeeds**

Run: `npm run build`
Expected: Build complete, `dist/extension.js` created

- [ ] **Step 3: Commit**

```bash
git add src/extension.ts
git commit -m "feat: add extension entry point with commands and wiring"
```
