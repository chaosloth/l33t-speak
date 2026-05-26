import { describe, it, expect, vi } from "vitest";
import { insertText, InsertTarget } from "../insertion";

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
  it("shows warning when target is none", async () => {
    const vscode = await import("vscode");
    const target: InsertTarget = { type: "none" };
    const result = await insertText("hello", target);
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

    const target: InsertTarget = { type: "editor", editor: mockEditor as any };
    const result = await insertText("world", target);
    expect(result).toBe(true);
    expect(mockEdit).toHaveBeenCalledWith(
      { line: 0, character: 5 },
      "world"
    );
  });

  it("sends text to terminal without newline", async () => {
    const mockSendText = vi.fn();
    const mockTerminal = { sendText: mockSendText } as any;

    const target: InsertTarget = { type: "terminal", terminal: mockTerminal };
    const result = await insertText("hello world", target);
    expect(result).toBe(true);
    expect(mockSendText).toHaveBeenCalledWith("hello world", false);
  });
});
