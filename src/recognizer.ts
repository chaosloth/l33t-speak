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
