import * as vscode from "vscode";

export type InsertTarget =
  | { type: "editor"; editor: vscode.TextEditor }
  | { type: "terminal"; terminal: vscode.Terminal }
  | { type: "none" };

/**
 * Capture the current insertion target at the moment recording starts.
 * This snapshots where text should go, since focus may shift during recording.
 */
export function captureInsertTarget(): InsertTarget {
  // If there's an active terminal and no visible text editor selection happening,
  // we need a heuristic. The best we can do: if the user triggered the command
  // while terminal was focused, activeTextEditor will still be set but the
  // terminal is what they intended.
  //
  // We use a trick: check if the active editor's viewColumn is undefined —
  // this happens for output panels but not real editors. Not perfect.
  //
  // Most reliable: expose a "target" setting, or check the last focused panel.
  // For now: we'll use terminalFocusTracking via context subscription.

  // This will be set by the focus tracker in extension.ts
  if (_lastFocusWasTerminal && vscode.window.activeTerminal) {
    return { type: "terminal", terminal: vscode.window.activeTerminal };
  }

  const editor = vscode.window.activeTextEditor;
  if (editor) {
    return { type: "editor", editor };
  }

  if (vscode.window.activeTerminal) {
    return { type: "terminal", terminal: vscode.window.activeTerminal };
  }

  return { type: "none" };
}

export async function insertText(
  text: string,
  target: InsertTarget
): Promise<boolean> {
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
      vscode.window.showWarningMessage(
        "No active editor or terminal to insert dictation"
      );
      return false;
  }
}

let _lastFocusWasTerminal = false;

export function setLastFocusWasTerminal(value: boolean): void {
  _lastFocusWasTerminal = value;
}
