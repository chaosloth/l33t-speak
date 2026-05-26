# Task 12: WebView HTML (standalone file)

**Files:**
- Create: `media/webview/index.html`

Note: The WebView engine (Task 8) inlines the HTML in the TypeScript source for simplicity. This standalone file exists as a development/debugging reference that can be opened in a browser to verify the Web Speech API logic independently.

---

- [ ] **Step 1: Create `media/webview/index.html`**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>L33t Speak - Dictation (Debug)</title>
  <style>
    body { font-family: system-ui; padding: 20px; background: #1e1e1e; color: #ccc; }
    #status { font-size: 1.2em; margin: 10px 0; }
    #output { white-space: pre-wrap; border: 1px solid #444; padding: 10px; min-height: 100px; }
    .recording { color: #f44; }
    .idle { color: #4f4; }
  </style>
</head>
<body>
  <h3>Dictation Debug Panel</h3>
  <div id="status" class="idle">Idle</div>
  <div id="output"></div>
  <script>
    const vscode = (typeof acquireVsCodeApi !== 'undefined') ? acquireVsCodeApi() : null;
    const statusEl = document.getElementById('status');
    const outputEl = document.getElementById('output');

    let recognition = null;

    function log(msg) {
      outputEl.textContent += msg + '\n';
    }

    function sendMessage(msg) {
      if (vscode) {
        vscode.postMessage(msg);
      } else {
        log('[OUT] ' + JSON.stringify(msg));
      }
    }

    function createRecognition(lang) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        sendMessage({ type: 'error', message: 'Web Speech API not available' });
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
            sendMessage({ type: 'final', text: result[0].transcript });
            log('[FINAL] ' + result[0].transcript);
          } else {
            sendMessage({ type: 'partial', text: result[0].transcript });
          }
        }
      };

      r.onerror = (event) => {
        sendMessage({ type: 'error', message: event.error });
        log('[ERROR] ' + event.error);
        statusEl.textContent = 'Error: ' + event.error;
        statusEl.className = 'idle';
      };

      r.onend = () => {
        statusEl.textContent = 'Idle';
        statusEl.className = 'idle';
      };

      return r;
    }

    function handleCommand(msg) {
      switch (msg.cmd) {
        case 'start':
          if (recognition) recognition.stop();
          recognition = createRecognition(msg.lang);
          if (recognition) {
            recognition.start();
            statusEl.textContent = 'Recording...';
            statusEl.className = 'recording';
            log('[START] lang=' + (msg.lang || 'en-US'));
          }
          break;
        case 'stop':
          if (recognition) {
            recognition.stop();
            recognition = null;
            log('[STOP]');
          }
          statusEl.textContent = 'Idle';
          statusEl.className = 'idle';
          break;
        case 'listDevices':
          if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            navigator.mediaDevices.enumerateDevices().then(devices => {
              const mics = devices
                .filter(d => d.kind === 'audioinput')
                .map(d => ({ id: d.deviceId, name: d.label || 'Microphone ' + d.deviceId.slice(0, 4) }));
              sendMessage({ type: 'devices', list: mics });
              log('[DEVICES] ' + JSON.stringify(mics));
            });
          } else {
            sendMessage({ type: 'devices', list: [] });
          }
          break;
      }
    }

    // Listen for messages from VS Code extension host
    window.addEventListener('message', (event) => {
      handleCommand(event.data);
    });

    // For standalone debugging: auto-start on click
    document.body.addEventListener('click', () => {
      if (!recognition) {
        handleCommand({ cmd: 'start', lang: 'en-US' });
      } else {
        handleCommand({ cmd: 'stop' });
      }
    });
  </script>
</body>
</html>
```

- [ ] **Step 2: Verify by opening in browser**

Open `media/webview/index.html` in Chrome. Click the page body. Verify:
- Status changes to "Recording..."
- Speaking into mic produces `[FINAL]` lines in the output area
- Click again stops recognition

- [ ] **Step 3: Commit**

```bash
git add media/webview/index.html
git commit -m "feat: add WebView HTML for speech recognition fallback"
```
