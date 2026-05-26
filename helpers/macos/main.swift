import Foundation
import Speech
import AVFoundation

class DictationHelper {
    private let recognizer: SFSpeechRecognizer
    private let audioEngine = AVAudioEngine()
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private var inputDeviceId: String?

    init(locale: String) {
        self.recognizer = SFSpeechRecognizer(locale: Locale(identifier: locale))!
    }

    func sendJSON(_ dict: [String: Any]) {
        if let data = try? JSONSerialization.data(withJSONObject: dict),
           let str = String(data: data, encoding: .utf8) {
            print(str)
            fflush(stdout)
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

    func start(deviceId: String?) {
        SFSpeechRecognizer.requestAuthorization { status in
            guard status == .authorized else {
                self.sendJSON(["type": "error", "message": "Speech recognition not authorized (status: \(status.rawValue))"])
                return
            }
            self.beginRecognition(deviceId: deviceId)
        }
    }

    private func beginRecognition(deviceId: String?) {
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let request = recognitionRequest else {
            sendJSON(["type": "error", "message": "Failed to create recognition request"])
            return
        }
        request.shouldReportPartialResults = true

        let inputNode = audioEngine.inputNode

        recognitionTask = recognizer.recognitionTask(with: request) { result, error in
            if let result = result {
                let text = result.bestTranscription.formattedString
                if result.isFinal {
                    self.sendJSON(["type": "final", "text": text])
                } else {
                    self.sendJSON(["type": "partial", "text": text])
                }
            }
            if let error = error {
                self.sendJSON(["type": "error", "message": error.localizedDescription])
                self.stopRecognition()
            }
        }

        let format = inputNode.outputFormat(forBus: 0)
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
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        recognitionRequest?.endAudio()
        recognitionRequest = nil
        recognitionTask?.cancel()
        recognitionTask = nil
    }
}

// MARK: - Main stdin loop

let helper = DictationHelper(locale: "en-US")

while let line = readLine() {
    guard let data = line.data(using: .utf8),
          let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
          let cmd = json["cmd"] as? String else {
        continue
    }

    switch cmd {
    case "start":
        let deviceId = json["deviceId"] as? String
        let lang = json["lang"] as? String ?? "en-US"
        helper.start(deviceId: deviceId)
    case "stop":
        helper.stopRecognition()
    case "listDevices":
        helper.listDevices()
    default:
        break
    }
}
