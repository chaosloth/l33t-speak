# Task 3: Text Insertion Module

**Files:**
- Create: `src/insertion.ts`
- Create: `src/test/insertion.test.ts`

---

- [ ] **Step 1: Write the failing test**

Create `src/test/insertion.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/insertion.test.ts`
Expected: FAIL — module `../insertion` not found

- [ ] **Step 3: Write minimal implementation**

Create `src/insertion.ts`:

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/insertion.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/insertion.ts src/test/insertion.test.ts
git commit -m "feat: add text insertion at cursor with multi-cursor support"
```
