# Task 2: Types & Interfaces

**Files:**
- Create: `src/types.ts`

---

- [ ] **Step 1: Create `src/types.ts`**

```typescript
export interface AudioDevice {
  id: string;
  name: string;
}

export interface RecognitionResult {
  type: "partial" | "final";
  text: string;
}

export interface DeviceListResult {
  type: "devices";
  list: AudioDevice[];
}

export interface EngineError {
  type: "error";
  message: string;
}

export type HelperMessage = RecognitionResult | DeviceListResult | EngineError;

export interface HelperCommand {
  cmd: "start" | "stop" | "listDevices";
  deviceId?: string;
  lang?: string;
}

export type EngineState = "idle" | "recording" | "error";

export interface RecognitionEngine {
  readonly name: string;
  readonly isAvailable: boolean;
  start(deviceId: string | null, lang: string): Promise<void>;
  stop(): Promise<void>;
  listDevices(): Promise<AudioDevice[]>;
  onResult: ((result: RecognitionResult) => void) | null;
  onError: ((error: string) => void) | null;
  dispose(): void;
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors (file has no imports from vscode)

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add shared types for engine protocol and interfaces"
```
