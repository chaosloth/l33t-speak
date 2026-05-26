# Task 8: WebView Fallback Engine

**Files:**
- Create: `src/engines/webview.ts`

---

- [ ] **Step 1: Create `src/engines/webview.ts`**

```typescript
import * as vscode from "vscode";
import { RecognitionEngine, AudioDevice, RecognitionResult } from "../types";

export class WebViewEngine implements RecognitionEngine {
  readonly name = "webview";
  private panel: vscode.WebviewPanel | null = null;
  private extensionUri: vscode.Uri;
  private deviceResolve: ((devices: AudioDevice[]) => void) | null = null;

  onResult: ((result: RecognitionResult) => void) | null = null;
  onError: ((error: string) => void) | null = null;

  constructor(extensionUri: vscode.Uri) {
    this.extensionUri = extensionUri;
  }

  get isAvailable(): boolean {
    return true;
  }

  private ensurePanel(): vscode.WebviewPanel {
    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel(
        "l33tSpeakDictation",
        "Dictation",
        { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
        {
          enableScripts: true,
          localResourceRoots: [
            vscode.Uri.joinPath(this.extensionUri, "media", "webview"),
          ],
        }
      );

      const htmlPath = vscode.Uri.joinPath(
        this.extensionUri,
        "media",
        "webview",
        "index.html"
      );

      this.panel.webview.html = this.getWebviewContent(this.panel.webview);

      this.panel.webview.onDidReceiveMessage((msg) => {
        switch (msg.type) {
          case "partial":
          case "final":
            this.onResult?.(msg as RecognitionResult);
            break;
          case "error":
            this.onError?.(msg.message);
            break;
          case "devices":
            this.deviceResolve?.(msg.list);
            this.deviceResolve = null;
            break;
        }
      });

      this.panel.onDidDispose(() => {
        this.panel = null;
      });

      // Hide the panel — we don't want it visible
      // VS Code doesn't support truly hidden webviews, so we minimize impact
    }
    return this.panel;
  }

  async start(deviceId: string | null, lang: string): Promise<void> {
    const panel = this.ensurePanel();
    panel.webview.postMessage({ cmd: "start", deviceId, lang });
  }

  async stop(): Promise<void> {
    if (this.panel) {
      this.panel.webview.postMessage({ cmd: "stop" });
    }
  }

  async listDevices(): Promise<AudioDevice[]> {
    return new Promise((resolve, reject) => {
      const panel = this.ensurePanel();
      this.deviceResolve = resolve;
      panel.webview.postMessage({ cmd: "listDevices" });
      setTimeout(() => {
        this.deviceResolve = null;
        reject(new Error("Timeout listing devices"));
      }, 5000);
    });
  }

  private getWebviewContent(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
<script>
  const vscode = acquireVsCodeApi();

  let recognition = null;

  function createRecognition(lang) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      vscode.postMessage({ type: 'error', message: 'Web Speech API not available' });
      return null;
    }
    const r = new SpeechRecognition();
    r.continuous = true;
    r.interimResults = true;
    r.lang = lang || 'en-US';

    r.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          vscode.postMessage({ type: 'final', text: result[0].transcript });
        } else {
          vscode.postMessage({ type: 'partial', text: result[0].transcript });
        }
      }
    };

    r.onerror = (event) => {
      vscode.postMessage({ type: 'error', message: event.error });
    };

    return r;
  }

  window.addEventListener('message', (event) => {
    const msg = event.data;
    switch (msg.cmd) {
      case 'start':
        if (recognition) recognition.stop();
        recognition = createRecognition(msg.lang);
        if (recognition) recognition.start();
        break;
      case 'stop':
        if (recognition) { recognition.stop(); recognition = null; }
        break;
      case 'listDevices':
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          navigator.mediaDevices.enumerateDevices().then(devices => {
            const mics = devices
              .filter(d => d.kind === 'audioinput')
              .map(d => ({ id: d.deviceId, name: d.label || 'Microphone ' + d.deviceId.slice(0, 4) }));
            vscode.postMessage({ type: 'devices', list: mics });
          });
        } else {
          vscode.postMessage({ type: 'devices', list: [] });
        }
        break;
    }
  });
</script>
</body>
</html>`;
  }

  dispose(): void {
    this.panel?.dispose();
    this.panel = null;
  }
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/engines/webview.ts
git commit -m "feat: add WebView fallback engine using Web Speech API"
```
