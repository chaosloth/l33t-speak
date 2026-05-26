# Task 6: macOS Engine

**Files:**
- Create: `src/engines/macos.ts`

---

- [ ] **Step 1: Create `src/engines/macos.ts`**

```typescript
import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import {
  RecognitionEngine,
  AudioDevice,
  RecognitionResult,
  HelperMessage,
  HelperCommand,
} from "../types";

export class MacOSEngine implements RecognitionEngine {
  readonly name = "macos";
  private process: ChildProcess | null = null;
  private helperPath: string;
  private buffer = "";

  onResult: ((result: RecognitionResult) => void) | null = null;
  onError: ((error: string) => void) | null = null;

  constructor(extensionPath: string) {
    this.helperPath = path.join(extensionPath, "bin", "darwin", "dictation-helper");
  }

  get isAvailable(): boolean {
    return process.platform === "darwin";
  }

  async start(deviceId: string | null, lang: string): Promise<void> {
    if (this.process) return;

    this.process = spawn(this.helperPath, [], { stdio: ["pipe", "pipe", "pipe"] });

    this.process.stdout!.on("data", (data: Buffer) => {
      this.buffer += data.toString();
      const lines = this.buffer.split("\n");
      this.buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg: HelperMessage = JSON.parse(line);
          if (msg.type === "partial" || msg.type === "final") {
            this.onResult?.(msg);
          } else if (msg.type === "error") {
            this.onError?.(msg.message);
          }
        } catch {
          this.onError?.(`Failed to parse helper output: ${line}`);
        }
      }
    });

    this.process.stderr!.on("data", (data: Buffer) => {
      this.onError?.(data.toString().trim());
    });

    this.process.on("exit", (code) => {
      this.process = null;
      if (code !== 0 && code !== null) {
        this.onError?.(`Helper exited with code ${code}`);
      }
    });

    this.sendCommand({ cmd: "start", deviceId: deviceId || undefined, lang });
  }

  async stop(): Promise<void> {
    if (!this.process) return;
    this.sendCommand({ cmd: "stop" });
  }

  async listDevices(): Promise<AudioDevice[]> {
    return new Promise((resolve, reject) => {
      if (!this.process) {
        this.process = spawn(this.helperPath, [], { stdio: ["pipe", "pipe", "pipe"] });
      }

      const originalOnResult = this.onResult;
      let buffer = "";

      const handler = (data: Buffer) => {
        buffer += data.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg: HelperMessage = JSON.parse(line);
            if (msg.type === "devices") {
              this.process!.stdout!.off("data", handler);
              resolve(msg.list);
            }
          } catch {
            reject(new Error(`Failed to parse: ${line}`));
          }
        }
      };

      this.process.stdout!.on("data", handler);
      this.sendCommand({ cmd: "listDevices" });

      setTimeout(() => {
        this.process!.stdout!.off("data", handler);
        reject(new Error("Timeout listing devices"));
      }, 5000);
    });
  }

  private sendCommand(cmd: HelperCommand): void {
    if (this.process?.stdin?.writable) {
      this.process.stdin.write(JSON.stringify(cmd) + "\n");
    }
  }

  dispose(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/engines/macos.ts
git commit -m "feat: add macOS engine that spawns Swift helper binary"
```
