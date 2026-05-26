# Voice-to-Text VS Code Extension — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a VS Code extension that captures speech via OS-native dictation and inserts text at the cursor.

**Architecture:** TypeScript extension with a RecognizerManager that dispatches to platform-specific engines (macOS Swift binary, Windows PowerShell script, WebView fallback). Engines communicate via JSON lines over stdin/stdout. Status bar provides mic selection and recording state.

**Tech Stack:** TypeScript, VS Code Extension API, esbuild, Swift (macOS helper), PowerShell (Windows helper), Web Speech API (fallback)

---

## File Structure

| File | Responsibility |
|------|---------------|
| `package.json` | Extension manifest: commands, keybindings, settings, activation events |
| `tsconfig.json` | TypeScript config targeting ES2020, strict mode |
| `esbuild.config.mjs` | Bundle extension to single file |
| `src/extension.ts` | Activation, command registration, wiring components |
| `src/types.ts` | Shared interfaces: `RecognitionEngine`, message types |
| `src/recognizer.ts` | `RecognizerManager` — engine selection, lifecycle, event forwarding |
| `src/engines/macos.ts` | macOS engine — spawns Swift helper, parses JSON lines |
| `src/engines/windows.ts` | Windows engine — spawns PowerShell helper, parses JSON lines |
| `src/engines/webview.ts` | WebView engine — creates hidden panel, manages messaging |
| `src/statusBar.ts` | Status bar item — state display, mic picker |
| `src/insertion.ts` | Insert text at active editor cursor(s) |
| `helpers/macos/main.swift` | Swift CLI using SFSpeechRecognizer + AVAudioEngine |
| `bin/win32/dictation-helper.ps1` | PowerShell script using System.Speech.Recognition |
| `media/webview/index.html` | Web Speech API HTML/JS for WebView fallback |
| `src/test/extension.test.ts` | Integration tests for command registration |
| `src/test/recognizer.test.ts` | Unit tests for RecognizerManager |
| `src/test/insertion.test.ts` | Unit tests for text insertion logic |

## Task List

Tasks are in separate files for manageability:

1. [Task 1: Project scaffolding & build](./tasks/task-01-scaffolding.md)
2. [Task 2: Types & interfaces](./tasks/task-02-types.md)
3. [Task 3: Text insertion module](./tasks/task-03-insertion.md)
4. [Task 4: Status bar module](./tasks/task-04-status-bar.md)
5. [Task 5: RecognizerManager](./tasks/task-05-recognizer.md)
6. [Task 6: macOS engine](./tasks/task-06-macos-engine.md)
7. [Task 7: Windows engine](./tasks/task-07-windows-engine.md)
8. [Task 8: WebView fallback engine](./tasks/task-08-webview-engine.md)
9. [Task 9: Extension entry point & commands](./tasks/task-09-extension.md)
10. [Task 10: macOS Swift helper](./tasks/task-10-swift-helper.md)
11. [Task 11: Windows PowerShell helper](./tasks/task-11-powershell-helper.md)
12. [Task 12: WebView HTML](./tasks/task-12-webview-html.md)
13. [Task 13: End-to-end manual testing](./tasks/task-13-e2e-testing.md)
