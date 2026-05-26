# Task 11: Windows PowerShell Helper

**Files:**
- Create: `bin/win32/dictation-helper.ps1`

---

- [ ] **Step 1: Create `bin/win32/dictation-helper.ps1`**

```powershell
Add-Type -AssemblyName System.Speech

$recognizer = $null
$stream = [Console]::OpenStandardInput()
$reader = New-Object System.IO.StreamReader($stream)

function Send-Json($obj) {
    $json = $obj | ConvertTo-Json -Compress
    [Console]::WriteLine($json)
    [Console]::Out.Flush()
}

function Get-AudioDevices {
    $devices = @()
    $index = 0
    foreach ($device in [System.Speech.Recognition.SpeechRecognitionEngine]::InstalledRecognizers()) {
        $devices += @{ id = $device.Id; name = $device.Description }
        $index++
    }
    # Also try to enumerate via WMI for actual microphones
    try {
        $wmiDevices = Get-WmiObject Win32_SoundDevice | Where-Object { $_.StatusInfo -eq 3 }
        foreach ($dev in $wmiDevices) {
            $devices += @{ id = $dev.DeviceID; name = $dev.Name }
        }
    } catch {}
    Send-Json @{ type = "devices"; list = $devices }
}

function Start-Recognition($lang, $deviceId) {
    try {
        $culture = New-Object System.Globalization.CultureInfo($lang)
        $script:recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine($culture)
        $script:recognizer.SetInputToDefaultAudioDevice()

        $grammar = New-Object System.Speech.Recognition.DictationGrammar
        $script:recognizer.LoadGrammar($grammar)

        Register-ObjectEvent -InputObject $script:recognizer -EventName SpeechRecognized -Action {
            $text = $Event.SourceEventArgs.Result.Text
            Send-Json @{ type = "final"; text = $text }
        } | Out-Null

        Register-ObjectEvent -InputObject $script:recognizer -EventName SpeechHypothesized -Action {
            $text = $Event.SourceEventArgs.Result.Text
            Send-Json @{ type = "partial"; text = $text }
        } | Out-Null

        Register-ObjectEvent -InputObject $script:recognizer -EventName RecognizeCompleted -Action {
            if ($Event.SourceEventArgs.Error) {
                Send-Json @{ type = "error"; message = $Event.SourceEventArgs.Error.Message }
            }
        } | Out-Null

        $script:recognizer.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)
    } catch {
        Send-Json @{ type = "error"; message = $_.Exception.Message }
    }
}

function Stop-Recognition {
    if ($script:recognizer) {
        $script:recognizer.RecognizeAsyncStop()
        $script:recognizer.Dispose()
        $script:recognizer = $null
    }
}

# Main loop: read JSON commands from stdin
while ($true) {
    $line = $reader.ReadLine()
    if ($null -eq $line) { break }
    if ($line.Trim() -eq "") { continue }

    try {
        $cmd = $line | ConvertFrom-Json
        switch ($cmd.cmd) {
            "start" {
                $lang = if ($cmd.lang) { $cmd.lang } else { "en-US" }
                $deviceId = $cmd.deviceId
                Start-Recognition -lang $lang -deviceId $deviceId
            }
            "stop" {
                Stop-Recognition
            }
            "listDevices" {
                Get-AudioDevices
            }
        }
    } catch {
        Send-Json @{ type = "error"; message = "Failed to parse command: $line" }
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add bin/win32/dictation-helper.ps1
git commit -m "feat: add Windows PowerShell helper for speech recognition"
```
