#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/../../bin/darwin"
mkdir -p "$OUTPUT_DIR"

swiftc "$SCRIPT_DIR/main.swift" -o "$OUTPUT_DIR/dictation-helper" -framework Speech -framework AVFoundation

# Embed Info.plist so macOS grants microphone/speech permissions
cp "$SCRIPT_DIR/Info.plist" "$OUTPUT_DIR/Info.plist"

# Ad-hoc sign with entitlements for microphone access
codesign --force --sign - --entitlements /dev/stdin "$OUTPUT_DIR/dictation-helper" <<ENTITLEMENTS
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.device.audio-input</key>
    <true/>
</dict>
</plist>
ENTITLEMENTS

echo "Built and signed dictation-helper -> $OUTPUT_DIR/dictation-helper"
