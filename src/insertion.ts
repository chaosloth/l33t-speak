import * as vscode from "vscode";

export async function insertTextAtCursor(text: string): Promise<boolean> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage(
      "No active text editor to insert dictation"
    );
    return false;
  }

  return editor.edit((editBuilder) => {
    for (const selection of editor.selections) {
      editBuilder.insert(selection.active, text);
    }
  });
}
