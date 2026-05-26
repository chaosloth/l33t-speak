# Task 1: Project Scaffolding & Build

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `esbuild.config.mjs`
- Create: `.vscodeignore`

---

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "l33t-speak",
  "displayName": "L33t Speak - Voice to Text",
  "description": "Voice-to-text input using OS-native dictation",
  "version": "0.0.1",
  "engines": { "vscode": "^1.74.0" },
  "categories": ["Other"],
  "activationEvents": [],
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [
      { "command": "l33t-speak.toggleDictation", "title": "Toggle Dictation", "icon": "$(mic)" },
      { "command": "l33t-speak.startDictation", "title": "Start Dictation" },
      { "command": "l33t-speak.stopDictation", "title": "Stop Dictation" },
      { "command": "l33t-speak.selectMicrophone", "title": "Select Microphone" }
    ],
    "keybindings": [
      { "command": "l33t-speak.toggleDictation", "key": "ctrl+shift+d", "mac": "cmd+shift+d", "when": "editorTextFocus" },
      { "command": "l33t-speak.startDictation", "key": "ctrl+shift+space", "mac": "cmd+shift+space", "when": "editorTextFocus && !l33t-speak.isRecording" },
      { "command": "l33t-speak.stopDictation", "key": "ctrl+shift+space", "mac": "cmd+shift+space", "when": "editorTextFocus && l33t-speak.isRecording" }
    ],
    "menus": {
      "editor/title": [
        { "command": "l33t-speak.toggleDictation", "group": "navigation" }
      ]
    },
    "configuration": {
      "title": "L33t Speak",
      "properties": {
        "l33t-speak.preferredEngine": {
          "type": "string",
          "default": "auto",
          "enum": ["auto", "macos", "windows", "webview"],
          "description": "Speech recognition engine to use"
        },
        "l33t-speak.microphone": {
          "type": ["string", "null"],
          "default": null,
          "description": "Device ID of preferred microphone"
        },
        "l33t-speak.language": {
          "type": "string",
          "default": "en-US",
          "description": "BCP-47 language code for speech recognition"
        },
        "l33t-speak.insertMode": {
          "type": "string",
          "default": "final",
          "enum": ["final", "streaming"],
          "description": "Insert text on final result only, or stream interim results"
        }
      }
    }
  },
  "scripts": {
    "build": "node esbuild.config.mjs",
    "watch": "node esbuild.config.mjs --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/vscode": "^1.74.0",
    "esbuild": "^0.20.0",
    "typescript": "^5.4.0",
    "vitest": "^1.6.0",
    "@vscode/test-electron": "^2.3.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "target": "ES2020",
    "lib": ["ES2020"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "src/test/**/*"]
}
```

- [ ] **Step 3: Create `esbuild.config.mjs`**

```javascript
import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");

const config = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.js",
  external: ["vscode"],
  format: "cjs",
  platform: "node",
  target: "node18",
  sourcemap: true,
};

if (watch) {
  const ctx = await esbuild.context(config);
  await ctx.watch();
  console.log("Watching for changes...");
} else {
  await esbuild.build(config);
  console.log("Build complete");
}
```

- [ ] **Step 4: Create `.vscodeignore`**

```
src/**
helpers/**
node_modules/**
tsconfig.json
esbuild.config.mjs
.gitignore
```

- [ ] **Step 5: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, `package-lock.json` generated

- [ ] **Step 6: Verify build runs (will fail — no source yet, but esbuild should report the missing entry)**

Run: `npm run build`
Expected: Error about missing `src/extension.ts` — confirms esbuild is configured correctly

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json esbuild.config.mjs .vscodeignore package-lock.json
git commit -m "feat: scaffold VS Code extension project with build tooling"
```
