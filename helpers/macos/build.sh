#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/../../bin/darwin"
mkdir -p "$OUTPUT_DIR"
swiftc "$SCRIPT_DIR/main.swift" -o "$OUTPUT_DIR/dictation-helper" -framework Speech -framework AVFoundation
echo "Built dictation-helper -> $OUTPUT_DIR/dictation-helper"
