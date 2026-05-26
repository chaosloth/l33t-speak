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
