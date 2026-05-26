# Task 5: RecognizerManager

**Files:**
- Create: `src/recognizer.ts`
- Create: `src/test/recognizer.test.ts`

---

- [ ] **Step 1: Write the failing test**

Create `src/test/recognizer.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RecognizerManager } from "../recognizer";
import { RecognitionEngine, AudioDevice, RecognitionResult } from "../types";

function createMockEngine(available: boolean): RecognitionEngine {
  return {
    name: "mock",
    isAvailable: available,
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    listDevices: vi.fn().mockResolvedValue([
      { id: "dev1", name: "Mock Mic" },
    ]),
    onResult: null,
    onError: null,
    dispose: vi.fn(),
  };
}

describe("RecognizerManager", () => {
  it("selects the first available engine", () => {
    const unavailable = createMockEngine(false);
    const available = createMockEngine(true);
    const manager = new RecognizerManager([unavailable, available]);
    expect(manager.activeEngineName).toBe("mock");
  });

  it("throws if no engine is available", () => {
    const unavailable = createMockEngine(false);
    expect(() => new RecognizerManager([unavailable])).toThrow(
      "No speech recognition engine available"
    );
  });

  it("starts and stops recording", async () => {
    const engine = createMockEngine(true);
    const manager = new RecognizerManager([engine]);
    await manager.start(null, "en-US");
    expect(engine.start).toHaveBeenCalledWith(null, "en-US");
    expect(manager.isRecording).toBe(true);

    await manager.stop();
    expect(engine.stop).toHaveBeenCalled();
    expect(manager.isRecording).toBe(false);
  });

  it("forwards results via callback", async () => {
    const engine = createMockEngine(true);
    const manager = new RecognizerManager([engine]);
    const results: RecognitionResult[] = [];
    manager.onResult = (r) => results.push(r);

    await manager.start(null, "en-US");
    engine.onResult!({ type: "final", text: "hello" });

    expect(results).toEqual([{ type: "final", text: "hello" }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/test/recognizer.test.ts`
Expected: FAIL — module `../recognizer` not found

- [ ] **Step 3: Write implementation**

Create `src/recognizer.ts`:

```typescript
import {
  RecognitionEngine,
  RecognitionResult,
  AudioDevice,
  EngineState,
} from "./types";

export class RecognizerManager {
  private engine: RecognitionEngine;
  private _isRecording = false;

  onResult: ((result: RecognitionResult) => void) | null = null;
  onError: ((error: string) => void) | null = null;
  onStateChange: ((state: EngineState) => void) | null = null;

  constructor(engines: RecognitionEngine[]) {
    const available = engines.find((e) => e.isAvailable);
    if (!available) {
      throw new Error("No speech recognition engine available");
    }
    this.engine = available;
    this.engine.onResult = (result) => this.onResult?.(result);
    this.engine.onError = (error) => {
      this._isRecording = false;
      this.onStateChange?.("error");
      this.onError?.(error);
    };
  }

  get activeEngineName(): string {
    return this.engine.name;
  }

  get isRecording(): boolean {
    return this._isRecording;
  }

  async start(deviceId: string | null, lang: string): Promise<void> {
    if (this._isRecording) return;
    await this.engine.start(deviceId, lang);
    this._isRecording = true;
    this.onStateChange?.("recording");
  }

  async stop(): Promise<void> {
    if (!this._isRecording) return;
    await this.engine.stop();
    this._isRecording = false;
    this.onStateChange?.("idle");
  }

  async toggle(deviceId: string | null, lang: string): Promise<void> {
    if (this._isRecording) {
      await this.stop();
    } else {
      await this.start(deviceId, lang);
    }
  }

  async listDevices(): Promise<AudioDevice[]> {
    return this.engine.listDevices();
  }

  dispose(): void {
    this.engine.dispose();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/test/recognizer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/recognizer.ts src/test/recognizer.test.ts
git commit -m "feat: add RecognizerManager with engine selection and lifecycle"
```
