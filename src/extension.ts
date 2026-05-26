import * as vscode from "vscode";
import { RecognizerManager } from "./recognizer";
import { StatusBarManager } from "./statusBar";
import { MacOSEngine } from "./engines/macos";
import { WindowsEngine } from "./engines/windows";
import { WebViewEngine } from "./engines/webview";
import { insertText, setTerminalFocused } from "./insertion";
import { playStartTone, playStopTone, playCancelTone } from "./tones";
import { RecognitionEngine } from "./types";

let recognizer: RecognizerManager;
let statusBar: StatusBarManager;
let lastPartialText: string = "";
let finalInserted: boolean = false;

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

  // Track terminal focus via context key changes
  // VS Code sets 'terminalFocus' context — we mirror it by watching editor focus
  vscode.window.onDidChangeActiveTextEditor((editor) => {
    setTerminalFocused(!editor);
  });
  // If no editor is active at start, terminal may be focused
  setTerminalFocused(!vscode.window.activeTextEditor);

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
      insertText(result.text);
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

  function startRecording() {
    lastPartialText = "";
    finalInserted = false;
    const config = vscode.workspace.getConfiguration("l33t-speak");
    const deviceId = config.get<string | null>("microphone", null);
    const lang = config.get<string>("language", "en-US");
    recognizer.start(deviceId, lang);
    playStartTone();
  }

  function stopRecording() {
    const pendingText = lastPartialText;
    recognizer.stop();
    playStopTone();
    setTimeout(() => {
      if (!finalInserted && pendingText) {
        insertText(pendingText);
      }
      lastPartialText = "";
    }, 500);
  }

  function cancelRecording() {
    lastPartialText = "";
    finalInserted = true; // prevent the fallback from inserting
    recognizer.stop();
    playCancelTone();
    statusBar.setState("idle");
  }

  const toggleCmd = vscode.commands.registerCommand(
    "l33t-speak.toggleDictation",
    () => {
      if (recognizer.isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  );

  const startCmd = vscode.commands.registerCommand(
    "l33t-speak.startDictation",
    () => {
      startRecording();
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

  context.subscriptions.push(
    toggleCmd, startCmd, stopCmd, cancelCmd, selectMicCmd
  );
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

  if (process.platform === "darwin") return [macos, webview];
  if (process.platform === "win32") return [windows, webview];
  return [webview];
}

export function deactivate() {
  recognizer?.dispose();
  statusBar?.dispose();
}
