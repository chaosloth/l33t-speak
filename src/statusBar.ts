import * as vscode from "vscode";
import { EngineState } from "./types";

export type ProcessMode =
  | "auto"
  | "markdown"
  | "code-comment"
  | "terminal"
  | "commit-message"
  | "prompt-magic";

const MODE_LABELS: Record<ProcessMode, string> = {
  "auto": "$(symbol-color) Auto",
  "markdown": "$(markdown) Markdown",
  "code-comment": "$(code) Code",
  "terminal": "$(terminal) Terminal",
  "commit-message": "$(git-commit) Commit",
  "prompt-magic": "$(wand) Magic",
};

const MODE_ORDER: ProcessMode[] = [
  "auto",
  "markdown",
  "code-comment",
  "terminal",
  "commit-message",
  "prompt-magic",
];

const RAINBOW_COLORS = [
  "statusBarItem.errorBackground",
  "statusBarItem.warningBackground",
  "statusBarItem.prominentBackground",
  "statusBarItem.errorBackground",
  "statusBarItem.warningBackground",
  "statusBarItem.prominentBackground",
];

const RAINBOW_EMOJI = ["🟥", "🟧", "🟨", "🟩", "🟦", "🟪"];

export class StatusBarManager {
  private item: vscode.StatusBarItem;
  private modeItem: vscode.StatusBarItem;
  private state: EngineState = "idle";
  private micName: string = "Default";
  private currentMode: ProcessMode = "auto";
  private onModeChange: ((mode: ProcessMode) => void) | null = null;
  private rainbowInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
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

  setOnModeChange(cb: (mode: ProcessMode) => void): void {
    this.onModeChange = cb;
  }

  setMode(mode: ProcessMode): void {
    this.currentMode = mode;
    this.updateMode();
  }

  getMode(): ProcessMode {
    return this.currentMode;
  }

  cycleMode(): void {
    const idx = MODE_ORDER.indexOf(this.currentMode);
    const next = MODE_ORDER[(idx + 1) % MODE_ORDER.length]!;
    this.currentMode = next;
    this.updateMode();
    this.onModeChange?.(next);
  }

  setTooltipForMode(mode: ProcessMode): string {
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

  private updateMode(): void {
    this.modeItem.text = MODE_LABELS[this.currentMode];
    this.modeItem.tooltip = `${this.setTooltipForMode(this.currentMode)}\nClick to cycle mode`;
  }

  setState(state: EngineState): void {
    this.state = state;
    this.update();
  }

  setMicName(name: string): void {
    this.micName = name;
    this.update();
  }

  setPartialText(text: string): void {
    if (this.state === "recording" && text) {
      const maxLen = 30;
      const display = text.length > maxLen ? "…" + text.slice(-maxLen) : text;
      this.item.text = `$(mic-filled) ${display}`;
      this.item.tooltip = text;
    }
  }

  setProcessingState(route: string): void {
    this.state = "processing" as any;
    const label = route === 'rules-engine' ? 'Formatting...' : 'Enhancing...';
    this.item.tooltip = `Gateway processing via ${route}...`;

    this.clearRainbow();
    let idx = 0;
    this.rainbowInterval = setInterval(() => {
      const emoji = RAINBOW_EMOJI[idx % RAINBOW_EMOJI.length]!;
      const color = RAINBOW_COLORS[idx % RAINBOW_COLORS.length]!;
      this.item.text = `$(sync~spin) ${emoji} ${label}`;
      this.item.backgroundColor = new vscode.ThemeColor(color);
      idx++;
    }, 300);
  }

  clearProcessing(): void {
    this.clearRainbow();
    if (this.state === "processing") {
      this.state = "idle" as any;
      this.update();
    }
  }

  private clearRainbow(): void {
    if (this.rainbowInterval) {
      clearInterval(this.rainbowInterval);
      this.rainbowInterval = null;
    }
  }

  private update(): void {
    switch (this.state) {
      case "idle":
        this.item.text = `$(mic) ${this.micName}`;
        this.item.backgroundColor = undefined;
        this.item.tooltip = "Click to select microphone";
        break;
      case "recording":
        this.item.text = `$(mic-filled) Recording...`;
        this.item.backgroundColor = new vscode.ThemeColor(
          "statusBarItem.errorBackground"
        );
        this.item.tooltip = "Dictation active — click to select microphone";
        break;
      case "processing":
        this.item.text = `$(sync~spin) 🟥 Enhancing...`;
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

  dispose(): void {
    this.clearRainbow();
    this.item.dispose();
    this.modeItem.dispose();
  }
}
