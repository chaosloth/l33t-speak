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
