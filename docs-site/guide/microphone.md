# Microphone Selection

## Quick Select

Click the microphone name in the status bar (bottom right) to open a quick-pick list of available input devices.

Select a device and it becomes your default for all future dictation sessions.

## Via Settings

You can also set the microphone device ID directly in settings:

```json
{
  "l33t-speak.microphone": "BuiltInMicrophoneDevice"
}
```

Device IDs are shown in the quick-pick list description. Set to `null` to use the system default.

## Supported Devices

The extension enumerates all audio input devices available to your system:

- Built-in microphones
- USB microphones
- Bluetooth headsets
- Virtual audio devices (e.g., Zoom, Teams)
- iPhone Continuity microphone
