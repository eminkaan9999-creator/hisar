import UIKit

/// Uygulama bilgisi ve küçük yardımcılar.
enum App {
    /// Zemin rengi (sayfanın --bg rengi): #252525
    static let bg = UIColor(red: 0x25 / 255.0, green: 0x25 / 255.0, blue: 0x25 / 255.0, alpha: 1)

    /// Sürüm: sayfanın VER değeri (CI'da), ör. VER 8 → "8.0", kod 800 (Android ile aynı düzen)
    static var versionName: String { Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "?" }
    static var versionCode: Int { Int(Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "") ?? 0 }

    /// Cihaz modeli (ör. iPhone15,2); simülatörde taklit edilen model.
    static var model: String {
        if let m = ProcessInfo.processInfo.environment["SIMULATOR_MODEL_IDENTIFIER"] { return m + " (simülatör)" }
        var u = utsname()
        uname(&u)
        return withUnsafeBytes(of: u.machine) { raw in String(decoding: raw.prefix { $0 != 0 }, as: UTF8.self) }
    }

    /// HisarNative.info(): Android'deki alanlar (versionName, versionCode, model) ve platform "ios".
    static func infoJSON() -> String {
        json(["platform": "ios", "versionName": versionName, "versionCode": versionCode,
              "os": UIDevice.current.systemVersion, "model": "Apple " + model])
    }

    static func json(_ o: Any) -> String {
        guard JSONSerialization.isValidJSONObject(o),
              let d = try? JSONSerialization.data(withJSONObject: o, options: [.sortedKeys]),
              let s = String(data: d, encoding: .utf8) else { return "{}" }
        return s
    }
}

/// JS metin değeri: tırnaklı ve kaçışlı ("...").
func jsQuote(_ s: String) -> String {
    guard let d = try? JSONSerialization.data(withJSONObject: [s], options: []),
          let t = String(data: d, encoding: .utf8), t.count >= 2 else { return "\"\"" }
    return String(t.dropFirst().dropLast())
        .replacingOccurrences(of: "\u{2028}", with: "\\u2028")
        .replacingOccurrences(of: "\u{2029}", with: "\\u2029")
}

/// Günlük: NSLog (Xcode, Konsol). Simülatörde ayrıca Library/Caches/hisar-log.txt: CI açılış testi bu dosyayı okur.
enum Log {
    private static let q = DispatchQueue(label: "com.hisar.tetik.log")
    #if targetEnvironment(simulator)
    private static let file: URL? = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first?
        .appendingPathComponent("hisar-log.txt")
    #else
    private static let file: URL? = nil
    #endif
    private static let stamp: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "HH:mm:ss.SSS"
        return f
    }()

    static func i(_ s: String) {
        NSLog("HisarTetik %@", s)
        guard let url = file else { return }
        let now = Date()
        q.async {
            guard let data = (stamp.string(from: now) + " " + s + "\n").data(using: .utf8) else { return }
            if let h = try? FileHandle(forWritingTo: url) {
                _ = try? h.seekToEnd()
                try? h.write(contentsOf: data)
                try? h.close()
            } else {
                try? data.write(to: url)
            }
        }
    }
}
