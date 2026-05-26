import { exec } from "child_process";

export function playStartTone(): void {
  if (process.platform === "darwin") {
    exec('afplay /System/Library/Sounds/Tink.aiff -v 0.5');
  } else if (process.platform === "win32") {
    exec('powershell -c "[System.Media.SystemSounds]::Beep.Play()"');
  }
}

export function playStopTone(): void {
  if (process.platform === "darwin") {
    exec('afplay /System/Library/Sounds/Pop.aiff -v 0.5');
  } else if (process.platform === "win32") {
    exec('powershell -c "[System.Media.SystemSounds]::Hand.Play()"');
  }
}

export function playCancelTone(): void {
  if (process.platform === "darwin") {
    exec('afplay /System/Library/Sounds/Basso.aiff -v 0.3');
  } else if (process.platform === "win32") {
    exec('powershell -c "[System.Media.SystemSounds]::Exclamation.Play()"');
  }
}
