import * as vscode from "vscode";
import { RecognizerManager } from "./recognizer";
import { StatusBarManager } from "./statusBar";
import { MacOSEngine } from "./engines/macos";
import { WindowsEngine } from "./engines/windows";
import { WebViewEngine } from "./engines/webview";
import {
  insertText,
  getEditorTarget,
  getTerminalTarget,
  InsertTarget,
} from "./insertion";
import { playStartTone, playStopTone, playCancelTone } from "./tones";
import { RecognitionEngine } from "./types";
import { sendToGateway, GatewayContext } from "./gateway-client";
import {
  getGatewayChannel,
  disposeChannel,
  logGatewayRequest,
  logGatewayResponse,
  logGatewayError,
  logGatewayInfo,
} from "./output-channel";
import type { ProcessMode } from "./statusBar";

let recognizer: RecognizerManager;
let statusBar: StatusBarManager;
let lastPartialText: string = "";
let finalInserted: boolean = false;
let currentTarget: InsertTarget = { type: "none" };
let gatewayApiKey: string | null = null;
let gatewayUrl: string = "https://gateway.l33tspeak.dev";
let enableGateway: boolean = false;
let selectedMode: ProcessMode | null = null;

function getEditorContext(): GatewayContext {
  const editor = vscode.window.activeTextEditor;
  const doc = editor?.document;

  let surface: GatewayContext["surface"] = "editor";
  if (vscode.window.activeTerminal && !vscode.window.activeTextEditor) {
    surface = "terminal";
  }

  return {
    app: "vscode",
    surface,
    fileType: doc?.languageId,
    selectedText: editor ? doc?.getText(editor.selection) : undefined,
    cursorBefore: editor && doc
      ? doc.getText(
          new vscode.Range(
            new vscode.Position(Math.max(0, editor.selection.active.line - 1), 0),
            editor.selection.active
          )
        )
      : undefined,
    cursorAfter: editor && doc
      ? doc.getText(
          new vscode.Range(
            editor.selection.active,
            new vscode.Position(Math.min(doc.lineCount - 1, editor.selection.active.line + 1), 0)
          )
        )
      : undefined,
  };
}

function resolveMode(context: GatewayContext): string {
  if (selectedMode) return selectedMode;
  if (context.surface === 'commit') return 'commit-message';

  const ft = context.fileType || '';
  if (ft === 'markdown' || ft === 'md') return 'markdown';
  if (/^(typescript|javascript|python|go|rust|java|cpp|csharp|php|ruby|swift|kotlin|scala)$/.test(ft)) return 'code-comment';

  return 'auto';
}

async function processAndInsert(text: string): Promise<void> {
  if (!enableGateway || !gatewayApiKey) {
    if (enableGateway && !gatewayApiKey) {
      logGatewayError("Gateway enabled but API key not loaded yet. Use 'Set Gateway API Key' command.");
    }
    insertText(text, currentTarget);
    return;
  }

  const context = getEditorContext();
  const cfg = vscode.workspace.getConfiguration("l33t-speak");
  const lang = cfg.get<string>("language", "en-US");
  const mode = resolveMode(context);

  getGatewayChannel().show(true);
  logGatewayRequest(text, gatewayUrl);
  logGatewayInfo(`Mode: ${mode} (${selectedMode ? "manual" : "auto-detected"})`);  statusBar.setProcessingState(mode);

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
  } catch (err: any) {
    logGatewayError(`Gateway unreachable: ${err.message}`);
    insertText(text, currentTarget);
  } finally {
    statusBar.clearProcessing();
  }
}

export async function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration("l33t-speak");
  const preferredEngine = config.get<string>("preferredEngine", "auto");
  enableGateway = config.get<boolean>("enableGateway", false);
  gatewayUrl = config.get<string>("gatewayUrl", "https://gateway.l33tspeak.dev");

  // Read API key from secure storage (block on first read)
  const stored = await context.secrets.get("l33t-speak.gatewayApiKey");
  gatewayApiKey = stored || null;

  // Having a stored key implies the user wants the gateway on
  if (gatewayApiKey) {
    enableGateway = true;
    gatewayUrl = config.get<string>("gatewayUrl", "https://gateway.l33tspeak.dev");
  }

  getGatewayChannel().show(true);
  logGatewayInfo(`Gateway ${enableGateway ? "ENABLED" : "disabled"} — ${gatewayUrl}`);
  if (enableGateway && !gatewayApiKey) {
    logGatewayError("No API key set. Use Cmd+Shift+P → 'Set Gateway API Key'.");
    vscode.window.showWarningMessage("L33t Speak: Gateway is enabled but no API key is set.");
  }

  // Listen for config changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("l33t-speak.enableGateway")) {
        enableGateway = vscode.workspace.getConfiguration("l33t-speak").get<boolean>("enableGateway", false);
        logGatewayInfo(`Gateway ${enableGateway ? "enabled" : "disabled"}`);
      }
      if (e.affectsConfiguration("l33t-speak.gatewayUrl")) {
        gatewayUrl = vscode.workspace.getConfiguration("l33t-speak").get<string>("gatewayUrl", "https://gateway.l33tspeak.dev");
        logGatewayInfo(`Gateway URL set to ${gatewayUrl}`);
      }
    })
  );

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
    if (state !== "error") {
      statusBar.setState(state);
    }
    const recording = state === "recording";
    vscode.commands.executeCommand("setContext", recordingContext, recording);
  };

  recognizer.onResult = (result) => {
    if (result.type === "final") {
      finalInserted = true;
      try {
        processAndInsert(result.text);
      } catch (e: any) {
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
    if (!recognizer.isRecording) return;
    vscode.window.showErrorMessage(`L33t Speak: ${error}`);
    statusBar.setState("error");
  };

  function startRecording(target: InsertTarget) {
    lastPartialText = "";
    finalInserted = false;
    currentTarget = target;
    const cfg = vscode.workspace.getConfiguration("l33t-speak");
    const deviceId = cfg.get<string | null>("microphone", null);
    const lang = cfg.get<string>("language", "en-US");
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

  // Start dictation targeting the editor
  const toggleCmd = vscode.commands.registerCommand(
    "l33t-speak.toggleDictation",
    () => {
      if (recognizer.isRecording) {
        stopRecording();
      } else {
        startRecording(getEditorTarget());
      }
    }
  );

  // Start dictation targeting the terminal
  const toggleTerminalCmd = vscode.commands.registerCommand(
    "l33t-speak.toggleDictationTerminal",
    () => {
      if (recognizer.isRecording) {
        stopRecording();
      } else {
        startRecording(getTerminalTarget());
      }
    }
  );

  const startCmd = vscode.commands.registerCommand(
    "l33t-speak.startDictation",
    () => {
      startRecording(getEditorTarget());
    }
  );

  const stopCmd = vscode.commands.registerCommand(
    "l33t-speak.stopDictation",
    () => {
      stopRecording();
    }
  );

  const cancelCmd = vscode.commands.registerCommand(
    "l33t-speak.cancelDictation",
    () => {
      cancelRecording();
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
          const cfg = vscode.workspace.getConfiguration("l33t-speak");
          await cfg.update(
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

  const setApiKeyCmd = vscode.commands.registerCommand(
    "l33t-speak.setGatewayApiKey",
    async () => {
      const key = await vscode.window.showInputBox({
        prompt: "Enter your l33t gateway API key",
        password: true,
        placeHolder: "sk-...",
      });
      if (key !== undefined) {
        await context.secrets.store("l33t-speak.gatewayApiKey", key);
        gatewayApiKey = key || null;
        enableGateway = true;
        const ch = getGatewayChannel();
        ch.show(true);
        logGatewayInfo(key ? "Gateway enabled — API key saved to secure storage" : "Gateway API key cleared");
        if (!key) {
          vscode.window.showInformationMessage("L33t Speak: Gateway API key cleared.");
        } else {
          vscode.window.showInformationMessage("L33t Speak: Gateway enabled and API key saved.");
        }
      }
    }
  );

  // Wire status bar mode click
  statusBar.setOnModeChange((mode) => {
    selectedMode = mode;
    logGatewayInfo(`Mode manually set to: ${mode}`);
  });

  const selectModeCmd = vscode.commands.registerCommand(
    "l33t-speak.selectMode",
    async () => {
      const items: { label: string; description: string; mode: ProcessMode }[] = [
        { label: "$(symbol-color) Auto", description: "Detect mode from file type", mode: "auto" },
        { label: "$(markdown) Markdown", description: "# headers, lists, bullets", mode: "markdown" },
        { label: "$(code) Code Comment", description: "Punctuation substitution for code", mode: "code-comment" },
        { label: "$(terminal) Terminal", description: "CLI flags, no punctuation", mode: "terminal" },
        { label: "$(git-commit) Commit Message", description: "72 char cap, git style", mode: "commit-message" },
        { label: "$(wand) Prompt Magic", description: "Enhance wording, infer intent, verbose", mode: "prompt-magic" },
      ];

      const pick = await vscode.window.showQuickPick(items, {
        placeHolder: `Current: ${selectedMode || "auto"}`,
      });

      if (pick) {
        selectedMode = pick.mode;
        statusBar.setMode(pick.mode);
        logGatewayInfo(`Mode set to: ${pick.mode}`);
      }
    }
  );

  context.subscriptions.push(
    toggleCmd, toggleTerminalCmd, startCmd, stopCmd, cancelCmd, selectMicCmd, setApiKeyCmd, selectModeCmd
  );
  context.subscriptions.push(statusBar);
  context.subscriptions.push({ dispose: () => recognizer.dispose() });
  context.subscriptions.push({ dispose: () => disposeChannel() });
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

  if (process.platform === "darwin") return [macos, webview];
  if (process.platform === "win32") return [windows, webview];
  return [webview];
}

export function deactivate() {
  recognizer?.dispose();
  statusBar?.dispose();
}
