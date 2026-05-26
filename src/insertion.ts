import * as vscode from "vscode";

let _terminalFocused = false;

export function setTerminalFocused(focused: boolean): void {
  _terminalFocused = focused;
}

export async function insertText(text: string): Promise<boolean> {
  // If terminal is focused, type into it (works for Claude Code, shells, etc.)
  if (_terminalFocused && vscode.window.activeTerminal) {
    vscode.window.activeTerminal.sendText(text, false);
    return true;
  }

  // Otherwise insert into the active text editor
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    return editor.edit((editBuilder) => {
      for (const selection of editor.selections) {
        editBuilder.insert(selection.active, text);
      }
    });
  }

  // Fallback: try terminal anyway
  if (vscode.window.activeTerminal) {
    vscode.window.activeTerminal.sendText(text, false);
    return true;
  }

  vscode.window.showWarningMessage(
    "No active editor or terminal to insert dictation"
  );
  return false;
}
