import * as vscode from "vscode";
import { EngineState } from "./types";

export class StatusBarManager {
  private item: vscode.StatusBarItem;
  private state: EngineState = "idle";
  private micName: string = "Default";

  constructor() {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.item.command = "l33t-speak.selectMicrophone";
    this.update();
    this.item.show();
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
      this.item.text = `$(mic-filled) "${text}"`;
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
    this.item.dispose();
  }
}
