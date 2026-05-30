"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode5 = __toESM(require("vscode"));

// src/recognizer.ts
var RecognizerManager = class {
  constructor(engines) {
    this._isRecording = false;
    this.onResult = null;
    this.onError = null;
    this.onStateChange = null;
    const available = engines.find((e) => e.isAvailable);
    if (!available) {
      throw new Error("No speech recognition engine available");
    }
    this.engine = available;
    this.engine.onResult = (result) => this.onResult?.(result);
    this.engine.onError = (error) => {
      this._isRecording = false;
      this.onStateChange?.("error");
      this.onError?.(error);
    };
  }
  get activeEngineName() {
    return this.engine.name;
  }
  get isRecording() {
    return this._isRecording;
  }
  async start(deviceId, lang) {
    if (this._isRecording)
      return;
    await this.engine.start(deviceId, lang);
    this._isRecording = true;
    this.onStateChange?.("recording");
  }
  async stop() {
    if (!this._isRecording)
      return;
    await this.engine.stop();
    this._isRecording = false;
    this.onStateChange?.("idle");
  }
  async toggle(deviceId, lang) {
    if (this._isRecording) {
      await this.stop();
    } else {
      await this.start(deviceId, lang);
    }
  }
  async listDevices() {
    return this.engine.listDevices();
  }
  dispose() {
    this.engine.dispose();
  }
};

// src/statusBar.ts
var vscode = __toESM(require("vscode"));
var MODE_LABELS = {
  "auto": "$(symbol-color) Auto",
  "markdown": "$(markdown) Markdown",
  "code-comment": "$(code) Code",
  "terminal": "$(terminal) Terminal",
  "commit-message": "$(git-commit) Commit",
  "prompt-magic": "$(wand) Magic"
};
var MODE_ORDER = [
  "auto",
  "markdown",
  "code-comment",
  "terminal",
  "commit-message",
  "prompt-magic"
];
var RAINBOW_COLORS = [
  "statusBarItem.errorBackground",
  "statusBarItem.warningBackground",
  "statusBarItem.prominentBackground",
  "statusBarItem.errorBackground",
  "statusBarItem.warningBackground",
  "statusBarItem.prominentBackground"
];
var RAINBOW_EMOJI = ["\u{1F7E5}", "\u{1F7E7}", "\u{1F7E8}", "\u{1F7E9}", "\u{1F7E6}", "\u{1F7EA}"];
var StatusBarManager = class {
  constructor() {
    this.state = "idle";
    this.micName = "Default";
    this.currentMode = "auto";
    this.onModeChange = null;
    this.rainbowInterval = null;
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.item.command = "l33t-speak.selectMicrophone";
    this.update();
    this.item.show();
    this.modeItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      99
    );
    this.modeItem.command = "l33t-speak.selectMode";
    this.updateMode();
    this.modeItem.show();
  }
  setOnModeChange(cb) {
    this.onModeChange = cb;
  }
  setMode(mode) {
    this.currentMode = mode;
    this.updateMode();
  }
  getMode() {
    return this.currentMode;
  }
  cycleMode() {
    const idx = MODE_ORDER.indexOf(this.currentMode);
    const next = MODE_ORDER[(idx + 1) % MODE_ORDER.length];
    this.currentMode = next;
    this.updateMode();
    this.onModeChange?.(next);
  }
  setTooltipForMode(mode) {
    switch (mode) {
      case "auto":
        return "Auto-detect from file type";
      case "markdown":
        return "Format as markdown (# headers, lists, bullets)";
      case "code-comment":
        return "Format as code comment (punctuation substitution)";
      case "terminal":
        return "Format as terminal command (flags, no period)";
      case "commit-message":
        return "Format as git commit message (72 char cap)";
      case "prompt-magic":
        return "Enhance: clean wording, infer structure, verbose output";
    }
  }
  updateMode() {
    this.modeItem.text = MODE_LABELS[this.currentMode];
    this.modeItem.tooltip = `${this.setTooltipForMode(this.currentMode)}
Click to cycle mode`;
  }
  setState(state) {
    this.state = state;
    this.update();
  }
  setMicName(name) {
    this.micName = name;
    this.update();
  }
  setPartialText(text) {
    if (this.state === "recording" && text) {
      const maxLen = 30;
      const display = text.length > maxLen ? "\u2026" + text.slice(-maxLen) : text;
      this.item.text = `$(mic-filled) ${display}`;
      this.item.tooltip = text;
    }
  }
  setProcessingState(route) {
    this.state = "processing";
    const label = route === "rules-engine" ? "Formatting..." : "Enhancing...";
    this.item.tooltip = `Gateway processing via ${route}...`;
    this.clearRainbow();
    let idx = 0;
    this.rainbowInterval = setInterval(() => {
      const emoji = RAINBOW_EMOJI[idx % RAINBOW_EMOJI.length];
      const color = RAINBOW_COLORS[idx % RAINBOW_COLORS.length];
      this.item.text = `$(sync~spin) ${emoji} ${label}`;
      this.item.backgroundColor = new vscode.ThemeColor(color);
      idx++;
    }, 300);
  }
  clearProcessing() {
    this.clearRainbow();
    if (this.state === "processing") {
      this.state = "idle";
      this.update();
    }
  }
  clearRainbow() {
    if (this.rainbowInterval) {
      clearInterval(this.rainbowInterval);
      this.rainbowInterval = null;
    }
  }
  update() {
    switch (this.state) {
      case "idle":
        this.item.text = `$(mic) ${this.micName}`;
        this.item.backgroundColor = void 0;
        this.item.tooltip = "Click to select microphone";
        break;
      case "recording":
        this.item.text = `$(mic-filled) Recording...`;
        this.item.backgroundColor = new vscode.ThemeColor(
          "statusBarItem.errorBackground"
        );
        this.item.tooltip = "Dictation active \u2014 click to select microphone";
        break;
      case "processing":
        this.item.text = `$(sync~spin) \u{1F7E5} Enhancing...`;
        this.item.tooltip = "Gateway is enhancing your text...";
        break;
      case "error":
        this.item.text = `$(error) Mic Error`;
        this.item.backgroundColor = new vscode.ThemeColor(
          "statusBarItem.warningBackground"
        );
        this.item.tooltip = "Speech recognition error";
        break;
    }
  }
  dispose() {
    this.clearRainbow();
    this.item.dispose();
    this.modeItem.dispose();
  }
};

// src/engines/macos.ts
var import_child_process = require("child_process");
var path = __toESM(require("path"));
var MacOSEngine = class {
  constructor(extensionPath) {
    this.name = "macos";
    this.process = null;
    this.buffer = "";
    this.onResult = null;
    this.onError = null;
    this.helperPath = path.join(extensionPath, "bin", "darwin", "dictation-helper");
  }
  get isAvailable() {
    return process.platform === "darwin";
  }
  ensureProcess() {
    if (this.process)
      return;
    this.process = (0, import_child_process.spawn)(this.helperPath, [], { stdio: ["pipe", "pipe", "pipe"] });
    this.process.stdout.on("data", (data) => {
      this.buffer += data.toString();
      const lines = this.buffer.split("\n");
      this.buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim())
          continue;
        try {
          const msg = JSON.parse(line);
          if (msg.type === "partial" || msg.type === "final") {
            this.onResult?.(msg);
          } else if (msg.type === "error") {
            this.onError?.(msg.message);
          }
        } catch {
          this.onError?.(`Failed to parse helper output: ${line}`);
        }
      }
    });
    this.process.stderr.on("data", (data) => {
      this.onError?.(data.toString().trim());
    });
    this.process.on("exit", (code) => {
      this.process = null;
      if (code !== 0 && code !== null) {
        this.onError?.(`Helper exited with code ${code}`);
      }
    });
  }
  async start(deviceId, lang) {
    this.ensureProcess();
    this.sendCommand({ cmd: "start", deviceId: deviceId || void 0, lang });
  }
  async stop() {
    if (!this.process)
      return;
    this.sendCommand({ cmd: "stop" });
  }
  async listDevices() {
    return new Promise((resolve, reject) => {
      this.ensureProcess();
      let buffer = "";
      const handler = (data) => {
        buffer += data.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim())
            continue;
          try {
            const msg = JSON.parse(line);
            if (msg.type === "devices") {
              this.process.stdout.off("data", handler);
              resolve(msg.list);
            }
          } catch {
            reject(new Error(`Failed to parse: ${line}`));
          }
        }
      };
      this.process.stdout.on("data", handler);
      this.sendCommand({ cmd: "listDevices" });
      setTimeout(() => {
        this.process.stdout.off("data", handler);
        reject(new Error("Timeout listing devices"));
      }, 5e3);
    });
  }
  sendCommand(cmd) {
    if (this.process?.stdin?.writable) {
      this.process.stdin.write(JSON.stringify(cmd) + "\n");
    }
  }
  dispose() {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
};

// src/engines/windows.ts
var import_child_process2 = require("child_process");
var path2 = __toESM(require("path"));
var WindowsEngine = class {
  constructor(extensionPath) {
    this.name = "windows";
    this.process = null;
    this.buffer = "";
    this.onResult = null;
    this.onError = null;
    this.helperPath = path2.join(
      extensionPath,
      "bin",
      "win32",
      "dictation-helper.ps1"
    );
  }
  get isAvailable() {
    return process.platform === "win32";
  }
  async start(deviceId, lang) {
    if (this.process)
      return;
    this.process = (0, import_child_process2.spawn)(
      "powershell",
      ["-ExecutionPolicy", "Bypass", "-File", this.helperPath],
      { stdio: ["pipe", "pipe", "pipe"] }
    );
    this.process.stdout.on("data", (data) => {
      this.buffer += data.toString();
      const lines = this.buffer.split("\n");
      this.buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim())
          continue;
        try {
          const msg = JSON.parse(line);
          if (msg.type === "partial" || msg.type === "final") {
            this.onResult?.(msg);
          } else if (msg.type === "error") {
            this.onError?.(msg.message);
          }
        } catch {
          this.onError?.(`Failed to parse helper output: ${line}`);
        }
      }
    });
    this.process.stderr.on("data", (data) => {
      this.onError?.(data.toString().trim());
    });
    this.process.on("exit", (code) => {
      this.process = null;
      if (code !== 0 && code !== null) {
        this.onError?.(`Helper exited with code ${code}`);
      }
    });
    this.sendCommand({ cmd: "start", deviceId: deviceId || void 0, lang });
  }
  async stop() {
    if (!this.process)
      return;
    this.sendCommand({ cmd: "stop" });
  }
  async listDevices() {
    return new Promise((resolve, reject) => {
      if (!this.process) {
        this.process = (0, import_child_process2.spawn)(
          "powershell",
          ["-ExecutionPolicy", "Bypass", "-File", this.helperPath],
          { stdio: ["pipe", "pipe", "pipe"] }
        );
      }
      let buffer = "";
      const handler = (data) => {
        buffer += data.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim())
            continue;
          try {
            const msg = JSON.parse(line);
            if (msg.type === "devices") {
              this.process.stdout.off("data", handler);
              resolve(msg.list);
            }
          } catch {
            reject(new Error(`Failed to parse: ${line}`));
          }
        }
      };
      this.process.stdout.on("data", handler);
      this.sendCommand({ cmd: "listDevices" });
      setTimeout(() => {
        this.process.stdout.off("data", handler);
        reject(new Error("Timeout listing devices"));
      }, 5e3);
    });
  }
  sendCommand(cmd) {
    if (this.process?.stdin?.writable) {
      this.process.stdin.write(JSON.stringify(cmd) + "\n");
    }
  }
  dispose() {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
};

// src/engines/webview.ts
var vscode2 = __toESM(require("vscode"));
var WebViewEngine = class {
  constructor(extensionUri) {
    this.name = "webview";
    this.panel = null;
    this.deviceResolve = null;
    this.onResult = null;
    this.onError = null;
    this.extensionUri = extensionUri;
  }
  get isAvailable() {
    return true;
  }
  ensurePanel() {
    if (!this.panel) {
      this.panel = vscode2.window.createWebviewPanel(
        "l33tSpeakDictation",
        "Dictation",
        { viewColumn: vscode2.ViewColumn.Beside, preserveFocus: true },
        {
          enableScripts: true,
          localResourceRoots: [
            vscode2.Uri.joinPath(this.extensionUri, "media", "webview")
          ]
        }
      );
      this.panel.webview.html = this.getWebviewContent();
      this.panel.webview.onDidReceiveMessage((msg) => {
        switch (msg.type) {
          case "partial":
          case "final":
            this.onResult?.(msg);
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
    }
    return this.panel;
  }
  async start(deviceId, lang) {
    const panel = this.ensurePanel();
    panel.webview.postMessage({ cmd: "start", deviceId, lang });
  }
  async stop() {
    if (this.panel) {
      this.panel.webview.postMessage({ cmd: "stop" });
    }
  }
  async listDevices() {
    return new Promise((resolve, reject) => {
      const panel = this.ensurePanel();
      this.deviceResolve = resolve;
      panel.webview.postMessage({ cmd: "listDevices" });
      setTimeout(() => {
        this.deviceResolve = null;
        reject(new Error("Timeout listing devices"));
      }, 5e3);
    });
  }
  getWebviewContent() {
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
  dispose() {
    this.panel?.dispose();
    this.panel = null;
  }
};

// src/insertion.ts
var vscode3 = __toESM(require("vscode"));
function getEditorTarget() {
  const editor = vscode3.window.activeTextEditor;
  if (editor) {
    return { type: "editor", editor };
  }
  return { type: "none" };
}
function getTerminalTarget() {
  const terminal = vscode3.window.activeTerminal;
  if (terminal) {
    return { type: "terminal", terminal };
  }
  return { type: "none" };
}
async function insertText(text, target) {
  switch (target.type) {
    case "terminal":
      target.terminal.sendText(text, false);
      return true;
    case "editor":
      return target.editor.edit((editBuilder) => {
        for (const selection of target.editor.selections) {
          editBuilder.insert(selection.active, text);
        }
      });
    case "none":
      vscode3.window.showWarningMessage(
        "No active editor or terminal to insert dictation"
      );
      return false;
  }
}

// src/tones.ts
var import_child_process3 = require("child_process");
function playStartTone() {
  if (process.platform === "darwin") {
    (0, import_child_process3.exec)("afplay /System/Library/Sounds/Tink.aiff -v 0.5");
  } else if (process.platform === "win32") {
    (0, import_child_process3.exec)('powershell -c "[System.Media.SystemSounds]::Beep.Play()"');
  }
}
function playStopTone() {
  if (process.platform === "darwin") {
    (0, import_child_process3.exec)("afplay /System/Library/Sounds/Pop.aiff -v 0.5");
  } else if (process.platform === "win32") {
    (0, import_child_process3.exec)('powershell -c "[System.Media.SystemSounds]::Hand.Play()"');
  }
}
function playCancelTone() {
  if (process.platform === "darwin") {
    (0, import_child_process3.exec)("afplay /System/Library/Sounds/Basso.aiff -v 0.3");
  } else if (process.platform === "win32") {
    (0, import_child_process3.exec)('powershell -c "[System.Media.SystemSounds]::Exclamation.Play()"');
  }
}

// src/gateway-client.ts
async function sendToGateway(text, apiKey, gatewayUrl2, context, language, mode = "auto") {
  const url = `${gatewayUrl2.replace(/\/$/, "")}/api/v1/process`;
  const payload = {
    input: {
      text,
      source: "speech",
      language
    },
    context: {
      app: context.app,
      surface: context.surface,
      fileType: context.fileType,
      selectedText: context.selectedText,
      workspaceHints: context.workspaceHints,
      cursorBefore: context.cursorBefore,
      cursorAfter: context.cursorAfter
    },
    intent: {
      mode
    },
    options: {
      stream: false,
      privacyMode: "standard",
      allowTrainingCapture: false
    }
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });
  const body = await res.json();
  if (!res.ok) {
    return {
      ok: false,
      processedText: text,
      status: res.status,
      error: body.error || body.message || `Gateway returned ${res.status}`
    };
  }
  return {
    ok: true,
    processedText: body.output?.text || text,
    status: res.status,
    metadata: {
      route: body.processing?.route,
      model: body.processing?.model,
      latencyMs: body.processing?.latencyMs,
      estimatedCostUsd: body.processing?.estimatedCostUsd
    }
  };
}

// src/output-channel.ts
var vscode4 = __toESM(require("vscode"));
var channel = null;
function getGatewayChannel() {
  if (!channel) {
    channel = vscode4.window.createOutputChannel("L33t Gateway");
  }
  return channel;
}
function disposeChannel() {
  channel?.dispose();
  channel = null;
}
function logGatewayRequest(text, url) {
  const ch = getGatewayChannel();
  ch.appendLine(`[${(/* @__PURE__ */ new Date()).toISOString()}] POST ${url}`);
  ch.appendLine(`  Raw text (${text.length} chars): "${text.slice(0, 200)}${text.length > 200 ? "..." : ""}"`);
}
function logGatewayResponse(result) {
  const ch = getGatewayChannel();
  ch.appendLine(`  Status: ${result.status}`);
  if (result.ok) {
    ch.appendLine(`  Route: ${result.metadata?.route || "unknown"}`);
    ch.appendLine(`  Model: ${result.metadata?.model || "unknown"}`);
    ch.appendLine(`  Latency: ${result.metadata?.latencyMs ?? "?"}ms`);
    ch.appendLine(`  Cost: $${(result.metadata?.estimatedCostUsd ?? 0).toFixed(6)}`);
    ch.appendLine(`  Processed (${result.processedText.length} chars): "${result.processedText.slice(0, 200)}${result.processedText.length > 200 ? "..." : ""}"`);
  } else {
    ch.appendLine(`  Error: ${result.error || "unknown"}`);
  }
  ch.appendLine("");
}
function logGatewayError(message) {
  const ch = getGatewayChannel();
  ch.appendLine(`[${(/* @__PURE__ */ new Date()).toISOString()}] ERROR: ${message}`);
  ch.appendLine("");
}
function logGatewayInfo(message) {
  const ch = getGatewayChannel();
  ch.appendLine(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${message}`);
}

// src/extension.ts
var recognizer;
var statusBar;
var lastPartialText = "";
var finalInserted = false;
var currentTarget = { type: "none" };
var gatewayApiKey = null;
var gatewayUrl = "https://gateway.l33tspeak.dev";
var enableGateway = false;
var selectedMode = null;
function getEditorContext() {
  const editor = vscode5.window.activeTextEditor;
  const doc = editor?.document;
  let surface = "editor";
  if (vscode5.window.activeTerminal && !vscode5.window.activeTextEditor) {
    surface = "terminal";
  }
  return {
    app: "vscode",
    surface,
    fileType: doc?.languageId,
    selectedText: editor ? doc?.getText(editor.selection) : void 0,
    cursorBefore: editor && doc ? doc.getText(
      new vscode5.Range(
        new vscode5.Position(Math.max(0, editor.selection.active.line - 1), 0),
        editor.selection.active
      )
    ) : void 0,
    cursorAfter: editor && doc ? doc.getText(
      new vscode5.Range(
        editor.selection.active,
        new vscode5.Position(Math.min(doc.lineCount - 1, editor.selection.active.line + 1), 0)
      )
    ) : void 0
  };
}
function resolveMode(context) {
  if (selectedMode)
    return selectedMode;
  if (context.surface === "commit")
    return "commit-message";
  const ft = context.fileType || "";
  if (ft === "markdown" || ft === "md")
    return "markdown";
  if (/^(typescript|javascript|python|go|rust|java|cpp|csharp|php|ruby|swift|kotlin|scala)$/.test(ft))
    return "code-comment";
  return "auto";
}
async function processAndInsert(text) {
  if (!enableGateway || !gatewayApiKey) {
    if (enableGateway && !gatewayApiKey) {
      logGatewayError("Gateway enabled but API key not loaded yet. Use 'Set Gateway API Key' command.");
    }
    insertText(text, currentTarget);
    return;
  }
  const context = getEditorContext();
  const cfg = vscode5.workspace.getConfiguration("l33t-speak");
  const lang = cfg.get("language", "en-US");
  const mode = resolveMode(context);
  getGatewayChannel().show(true);
  logGatewayRequest(text, gatewayUrl);
  logGatewayInfo(`Mode: ${mode} (${selectedMode ? "manual" : "auto-detected"})`);
  statusBar.setProcessingState(mode);
  try {
    const result = await sendToGateway(
      text,
      gatewayApiKey,
      gatewayUrl,
      context,
      lang,
      mode
    );
    logGatewayResponse(result);
    if (result.ok) {
      insertText(result.processedText, currentTarget);
    } else {
      logGatewayError(
        `Gateway returned ${result.status}: ${result.error || "unknown"}`
      );
      insertText(text, currentTarget);
    }
  } catch (err) {
    logGatewayError(`Gateway unreachable: ${err.message}`);
    insertText(text, currentTarget);
  } finally {
    statusBar.clearProcessing();
  }
}
async function activate(context) {
  const config = vscode5.workspace.getConfiguration("l33t-speak");
  const preferredEngine = config.get("preferredEngine", "auto");
  enableGateway = config.get("enableGateway", false);
  gatewayUrl = config.get("gatewayUrl", "https://gateway.l33tspeak.dev");
  const stored = await context.secrets.get("l33t-speak.gatewayApiKey");
  gatewayApiKey = stored || null;
  if (gatewayApiKey) {
    enableGateway = true;
    gatewayUrl = config.get("gatewayUrl", "https://gateway.l33tspeak.dev");
  }
  getGatewayChannel().show(true);
  logGatewayInfo(`Gateway ${enableGateway ? "ENABLED" : "disabled"} \u2014 ${gatewayUrl}`);
  if (enableGateway && !gatewayApiKey) {
    logGatewayError("No API key set. Use Cmd+Shift+P \u2192 'Set Gateway API Key'.");
    vscode5.window.showWarningMessage("L33t Speak: Gateway is enabled but no API key is set.");
  }
  context.subscriptions.push(
    vscode5.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("l33t-speak.enableGateway")) {
        enableGateway = vscode5.workspace.getConfiguration("l33t-speak").get("enableGateway", false);
        logGatewayInfo(`Gateway ${enableGateway ? "enabled" : "disabled"}`);
      }
      if (e.affectsConfiguration("l33t-speak.gatewayUrl")) {
        gatewayUrl = vscode5.workspace.getConfiguration("l33t-speak").get("gatewayUrl", "https://gateway.l33tspeak.dev");
        logGatewayInfo(`Gateway URL set to ${gatewayUrl}`);
      }
    })
  );
  const engines = buildEngineList(
    context.extensionPath,
    context.extensionUri,
    preferredEngine
  );
  try {
    recognizer = new RecognizerManager(engines);
  } catch (e) {
    vscode5.window.showErrorMessage(
      `L33t Speak: ${e.message}. Voice-to-text is unavailable.`
    );
    return;
  }
  statusBar = new StatusBarManager();
  const recordingContext = "l33t-speak.isRecording";
  vscode5.commands.executeCommand("setContext", recordingContext, false);
  recognizer.onStateChange = (state) => {
    if (state !== "error") {
      statusBar.setState(state);
    }
    const recording = state === "recording";
    vscode5.commands.executeCommand("setContext", recordingContext, recording);
  };
  recognizer.onResult = (result) => {
    if (result.type === "final") {
      finalInserted = true;
      try {
        processAndInsert(result.text);
      } catch (e) {
        logGatewayError(`processAndInsert crashed: ${e.message}`);
        insertText(result.text, currentTarget);
      }
      lastPartialText = "";
    } else {
      lastPartialText = result.text;
      statusBar.setPartialText(result.text);
    }
  };
  recognizer.onError = (error) => {
    if (!recognizer.isRecording)
      return;
    vscode5.window.showErrorMessage(`L33t Speak: ${error}`);
    statusBar.setState("error");
  };
  function startRecording(target) {
    lastPartialText = "";
    finalInserted = false;
    currentTarget = target;
    const cfg = vscode5.workspace.getConfiguration("l33t-speak");
    const deviceId = cfg.get("microphone", null);
    const lang = cfg.get("language", "en-US");
    recognizer.start(deviceId, lang);
    playStartTone();
  }
  function stopRecording() {
    const pendingText = lastPartialText;
    const target = currentTarget;
    recognizer.stop();
    playStopTone();
    setTimeout(() => {
      if (!finalInserted && pendingText) {
        processAndInsert(pendingText);
      }
      lastPartialText = "";
    }, 500);
  }
  function cancelRecording() {
    lastPartialText = "";
    finalInserted = true;
    recognizer.stop();
    playCancelTone();
    statusBar.setState("idle");
  }
  const toggleCmd = vscode5.commands.registerCommand(
    "l33t-speak.toggleDictation",
    () => {
      if (recognizer.isRecording) {
        stopRecording();
      } else {
        startRecording(getEditorTarget());
      }
    }
  );
  const toggleTerminalCmd = vscode5.commands.registerCommand(
    "l33t-speak.toggleDictationTerminal",
    () => {
      if (recognizer.isRecording) {
        stopRecording();
      } else {
        startRecording(getTerminalTarget());
      }
    }
  );
  const startCmd = vscode5.commands.registerCommand(
    "l33t-speak.startDictation",
    () => {
      startRecording(getEditorTarget());
    }
  );
  const stopCmd = vscode5.commands.registerCommand(
    "l33t-speak.stopDictation",
    () => {
      stopRecording();
    }
  );
  const cancelCmd = vscode5.commands.registerCommand(
    "l33t-speak.cancelDictation",
    () => {
      cancelRecording();
    }
  );
  const selectMicCmd = vscode5.commands.registerCommand(
    "l33t-speak.selectMicrophone",
    async () => {
      try {
        const devices = await recognizer.listDevices();
        const items = devices.map((d) => ({
          label: d.name,
          description: d.id
        }));
        const selected = await vscode5.window.showQuickPick(items, {
          placeHolder: "Select a microphone"
        });
        if (selected) {
          const cfg = vscode5.workspace.getConfiguration("l33t-speak");
          await cfg.update(
            "microphone",
            selected.description,
            vscode5.ConfigurationTarget.Global
          );
          statusBar.setMicName(selected.label);
        }
      } catch (e) {
        vscode5.window.showErrorMessage(
          `L33t Speak: Failed to list microphones: ${e.message}`
        );
      }
    }
  );
  const setApiKeyCmd = vscode5.commands.registerCommand(
    "l33t-speak.setGatewayApiKey",
    async () => {
      const key = await vscode5.window.showInputBox({
        prompt: "Enter your l33t gateway API key",
        password: true,
        placeHolder: "sk-..."
      });
      if (key !== void 0) {
        await context.secrets.store("l33t-speak.gatewayApiKey", key);
        gatewayApiKey = key || null;
        enableGateway = true;
        const ch = getGatewayChannel();
        ch.show(true);
        logGatewayInfo(key ? "Gateway enabled \u2014 API key saved to secure storage" : "Gateway API key cleared");
        if (!key) {
          vscode5.window.showInformationMessage("L33t Speak: Gateway API key cleared.");
        } else {
          vscode5.window.showInformationMessage("L33t Speak: Gateway enabled and API key saved.");
        }
      }
    }
  );
  statusBar.setOnModeChange((mode) => {
    selectedMode = mode;
    logGatewayInfo(`Mode manually set to: ${mode}`);
  });
  const selectModeCmd = vscode5.commands.registerCommand(
    "l33t-speak.selectMode",
    async () => {
      const items = [
        { label: "$(symbol-color) Auto", description: "Detect mode from file type", mode: "auto" },
        { label: "$(markdown) Markdown", description: "# headers, lists, bullets", mode: "markdown" },
        { label: "$(code) Code Comment", description: "Punctuation substitution for code", mode: "code-comment" },
        { label: "$(terminal) Terminal", description: "CLI flags, no punctuation", mode: "terminal" },
        { label: "$(git-commit) Commit Message", description: "72 char cap, git style", mode: "commit-message" },
        { label: "$(wand) Prompt Magic", description: "Enhance wording, infer intent, verbose", mode: "prompt-magic" }
      ];
      const pick = await vscode5.window.showQuickPick(items, {
        placeHolder: `Current: ${selectedMode || "auto"}`
      });
      if (pick) {
        selectedMode = pick.mode;
        statusBar.setMode(pick.mode);
        logGatewayInfo(`Mode set to: ${pick.mode}`);
      }
    }
  );
  context.subscriptions.push(
    toggleCmd,
    toggleTerminalCmd,
    startCmd,
    stopCmd,
    cancelCmd,
    selectMicCmd,
    setApiKeyCmd,
    selectModeCmd
  );
  context.subscriptions.push(statusBar);
  context.subscriptions.push({ dispose: () => recognizer.dispose() });
  context.subscriptions.push({ dispose: () => disposeChannel() });
}
function buildEngineList(extensionPath, extensionUri, preferred) {
  const macos = new MacOSEngine(extensionPath);
  const windows = new WindowsEngine(extensionPath);
  const webview = new WebViewEngine(extensionUri);
  if (preferred === "macos")
    return [macos, webview];
  if (preferred === "windows")
    return [windows, webview];
  if (preferred === "webview")
    return [webview];
  if (process.platform === "darwin")
    return [macos, webview];
  if (process.platform === "win32")
    return [windows, webview];
  return [webview];
}
function deactivate() {
  recognizer?.dispose();
  statusBar?.dispose();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
