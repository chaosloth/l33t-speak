import { describe, it, expect, vi } from "vitest";
import { insertText } from "../insertion";

vi.mock(
  "vscode",
  () => ({
    window: {
      activeTextEditor: undefined,
      activeTerminal: undefined,
      showWarningMessage: vi.fn(),
    },
    workspace: {},
  }),
  { virtual: true }
);

describe("insertText", () => {
  it("shows warning when no active editor or terminal", async () => {
    const vscode = await import("vscode");
    (vscode.window as any).activeTextEditor = undefined;
    (vscode.window as any).activeTerminal = undefined;
    const result = await insertText("hello");
    expect(result).toBe(false);
    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
      "No active editor or terminal to insert dictation"
    );
  });

  it("inserts text at cursor position in editor", async () => {
    const mockEdit = vi.fn().mockResolvedValue(true);
    const mockEditor = {
      selections: [{ active: { line: 0, character: 5 } }],
      edit: (callback: (editBuilder: any) => void) => {
        const builder = { insert: mockEdit };
        callback(builder);
        return Promise.resolve(true);
      },
    };

    const vscode = await import("vscode");
    (vscode.window as any).activeTextEditor = mockEditor;

    const result = await insertText("world");
    expect(result).toBe(true);
    expect(mockEdit).toHaveBeenCalledWith(
      { line: 0, character: 5 },
      "world"
    );
  });
});
