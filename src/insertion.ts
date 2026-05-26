import * as vscode from "vscode";

export type InsertTarget =
  | { type: "editor"; editor: vscode.TextEditor }
  | { type: "terminal"; terminal: vscode.Terminal }
  | { type: "none" };

export function getEditorTarget(): InsertTarget {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    return { type: "editor", editor };
  }
  return { type: "none" };
}

export function getTerminalTarget(): InsertTarget {
  const terminal = vscode.window.activeTerminal;
  if (terminal) {
    return { type: "terminal", terminal };
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
