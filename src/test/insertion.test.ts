import { describe, it, expect, vi } from "vitest";
import { insertTextAtCursor } from "../insertion";

vi.mock(
  "vscode",
  () => ({
    window: { activeTextEditor: undefined, showWarningMessage: vi.fn() },
    workspace: {},
  }),
  { virtual: true }
);

describe("insertTextAtCursor", () => {
  it("shows warning when no active editor", async () => {
    const vscode = await import("vscode");
    const result = await insertTextAtCursor("hello");
    expect(result).toBe(false);
    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
      "No active text editor to insert dictation"
    );
  });

  it("inserts text at cursor position", async () => {
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

    const result = await insertTextAtCursor("world");
    expect(result).toBe(true);
    expect(mockEdit).toHaveBeenCalledWith(
      { line: 0, character: 5 },
      "world"
    );
  });
});
