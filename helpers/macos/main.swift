import Foundation
import Speech
import AVFoundation

class DictationHelper {
    private var recognizer: SFSpeechRecognizer?
    private let audioEngine = AVAudioEngine()
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?

    init() {}

    func sendJSON(_ dict: [String: Any]) {
        if let data = try? JSONSerialization.data(withJSONObject: dict),
           let str = String(data: data, encoding: .utf8) {
            FileHandle.standardOutput.write((str + "\n").data(using: .utf8)!)
        }
    }

    func listDevices() {
        let devices = AVCaptureDevice.DiscoverySession(
            deviceTypes: [.builtInMicrophone, .externalUnknown],
            mediaType: .audio,
            position: .unspecified
        ).devices

        let list = devices.map { ["id": $0.uniqueID, "name": $0.localizedName] }
        sendJSON(["type": "devices", "list": list])
    }

    func start(lang: String, deviceId: String?) {
        let locale = Locale(identifier: lang)
        recognizer = SFSpeechRecognizer(locale: locale)

        guard let recognizer = recognizer, recognizer.isAvailable else {
            sendJSON(["type": "error", "message": "Speech recognizer not available for locale: \(lang)"])
            return
        }

        // Check current auth status without requesting (request hangs for CLI tools)
        let status = SFSpeechRecognizer.authorizationStatus()
        switch status {
        case .authorized:
            beginRecognition()
        case .notDetermined:
            // For CLI tools, requestAuthorization hangs without a proper app bundle.
            // Try to proceed anyway — the system may grant access based on the parent process.
            beginRecognition()
        case .denied, .restricted:
            sendJSON(["type": "error", "message": "Speech recognition not authorized. Grant permission in System Settings > Privacy & Security > Speech Recognition."])
        @unknown default:
            beginRecognition()
        }
    }

    private func beginRecognition() {
        if audioEngine.isRunning {
            stopRecognition()
        }

        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let request = recognitionRequest else {
            sendJSON(["type": "error", "message": "Failed to create recognition request"])
            return
        }
        request.shouldReportPartialResults = true

        let inputNode = audioEngine.inputNode
        let format = inputNode.outputFormat(forBus: 0)

        guard format.sampleRate > 0 else {
            sendJSON(["type": "error", "message": "No audio input available (sample rate is 0)"])
            return
        }

        recognitionTask = recognizer?.recognitionTask(with: request) { result, error in
            if let result = result {
                let text = result.bestTranscription.formattedString
                if result.isFinal {
                    self.sendJSON(["type": "final", "text": text])
                    DispatchQueue.main.async {
                        self.cleanupAfterFinal()
                    }
                } else {
                    self.sendJSON(["type": "partial", "text": text])
                }
            }
            if let error = error as? NSError {
                // Code 216 = "canceled" — expected when we stop, not a real error
                if error.code != 216 {
                    self.sendJSON(["type": "error", "message": error.localizedDescription])
                }
            }
        }

        inputNode.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in
            request.append(buffer)
        }

        do {
            audioEngine.prepare()
            try audioEngine.start()
        } catch {
            sendJSON(["type": "error", "message": "Audio engine failed: \(error.localizedDescription)"])
        }
    }

    func stopRecognition() {
        if audioEngine.isRunning {
            audioEngine.stop()
            audioEngine.inputNode.removeTap(onBus: 0)
        }
        // Signal end of audio — this lets the recognizer emit a final result
        recognitionRequest?.endAudio()
        recognitionRequest = nil

        // Wait briefly for the final result, then force cleanup
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            self.cleanupAfterFinal()
        }
    }

    private func cleanupAfterFinal() {
        recognitionTask?.cancel()
        recognitionTask = nil
        recognitionRequest = nil
    }

    func handleCommand(_ json: [String: Any]) {
        guard let cmd = json["cmd"] as? String else { return }

        switch cmd {
        case "start":
            let lang = json["lang"] as? String ?? "en-US"
            let deviceId = json["deviceId"] as? String
            start(lang: lang, deviceId: deviceId)
        case "stop":
            stopRecognition()
        case "listDevices":
            listDevices()
        default:
            break
        }
    }
}

// MARK: - Main with RunLoop

let helper = DictationHelper()

// Read stdin on a background thread so the main RunLoop stays free
// for AVAudioEngine and SFSpeechRecognizer callbacks
DispatchQueue.global(qos: .userInitiated).async {
    let handle = FileHandle.standardInput
    var buffer = Data()

    while true {
        let data = handle.availableData
        if data.isEmpty {
            // stdin closed
            DispatchQueue.main.async { exit(0) }
            return
        }
        buffer.append(data)

        // Process complete lines
        while let newlineRange = buffer.range(of: Data("\n".utf8)) {
            let lineData = buffer.subdata(in: buffer.startIndex..<newlineRange.lowerBound)
            buffer.removeSubrange(buffer.startIndex...newlineRange.lowerBound)

            guard let line = String(data: lineData, encoding: .utf8),
                  !line.trimmingCharacters(in: .whitespaces).isEmpty,
                  let jsonData = line.data(using: .utf8),
                  let json = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any] else {
                continue
            }

            DispatchQueue.main.async {
                helper.handleCommand(json)
            }
        }
    }
}

// Keep the main RunLoop alive
RunLoop.main.run()
