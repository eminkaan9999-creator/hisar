import Foundation

/// Sayfa dosyaları. Uygulamayla gelen www (index.html = web sürümü tetik/index.html, bridge.js, fonts/)
/// Documents/www'ye kopyalanır ve sayfa hep oradan açılır: adres hiç değişmez, böylece localStorage'daki
/// antrenman geçmişi uygulama güncellemelerinde ve sayfa güncellemelerinde korunur.
final class PageStore {
    /// Kendini güncelleme: GitHub Pages'teki web sürümü
    static let updateURL = "https://eminkaan9999-creator.github.io/hisar/tetik/index.html"

    struct Failure: Error { let msg: String }

    private let fm = FileManager.default
    let www: URL
    let bundled: URL?
    private var updating = false

    var index: URL { www.appendingPathComponent("index.html") }

    init() {
        www = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("www", isDirectory: true)
        bundled = Bundle.main.url(forResource: "www", withExtension: nil)
    }

    /// Sayfadaki "const VER=8" değeri
    static func ver(_ html: String) -> Int? {
        guard let r = html.range(of: "const VER=[0-9]+", options: .regularExpression) else { return nil }
        return Int(html[r].dropFirst("const VER=".count))
    }

    var installedVer: Int? { (try? String(contentsOf: index, encoding: .utf8)).flatMap(PageStore.ver) }
    var bundledVer: Int? {
        bundled.flatMap { try? String(contentsOf: $0.appendingPathComponent("index.html"), encoding: .utf8) }.flatMap(PageStore.ver)
    }

    /// Açılacak sayfa: Documents/www/index.html (olağan dışı bir hatada uygulamadaki kopya)
    var pageURL: URL {
        if fm.fileExists(atPath: index.path) { return index }
        Log.i("Documents/www/index.html yok; uygulamadaki kopya açılıyor")
        return bundled?.appendingPathComponent("index.html") ?? index
    }
    var readAccess: URL { fm.fileExists(atPath: index.path) ? www : (bundled ?? www) }

    /// Açılışta: ilk kurulumda ya da uygulamayla gelen sayfanın VER'i daha yeniyse Documents/www'ye kopyalar.
    func prepare() {
        do {
            try fm.createDirectory(at: www, withIntermediateDirectories: true)
            guard let src = bundled else { Log.i("uygulamada www klasörü yok"); return }
            try syncAssets(from: src)
            let bHtml = try String(contentsOf: src.appendingPathComponent("index.html"), encoding: .utf8)
            let bVer = PageStore.ver(bHtml) ?? 0
            let dHtml = try? String(contentsOf: index, encoding: .utf8)
            if let d = dHtml, let dVer = PageStore.ver(d), dVer >= bVer {
                if hasFonts && d.contains("https://fonts.googleapis.com/css2") {
                    try writeIndex(d)
                    Log.i("sayfa \(dVer): yazı tipleri uygulamadaki dosyalara bağlandı")
                }
                Log.i("sayfa sürümü \(dVer) (uygulamayla gelen \(bVer))")
            } else {
                try writeIndex(bHtml)
                Log.i("sayfa kuruldu: sürüm \(bVer)" + (dHtml.flatMap(PageStore.ver).map { " (önceki \($0))" } ?? " (ilk kurulum)"))
            }
        } catch {
            Log.i("sayfa hazırlanamadı: \(error.localizedDescription)")
        }
    }

    /// index.html dışındaki dosyalar (fonts/, bridge.js): uygulama değiştiyse ya da eksikse yenilenir.
    private func syncAssets(from src: URL) throws {
        let names = try fm.contentsOfDirectory(atPath: src.path).filter { $0 != "index.html" }
        let sig = signature(src)
        let missing = names.contains { !fm.fileExists(atPath: www.appendingPathComponent($0).path) }
        if !missing && UserDefaults.standard.string(forKey: "www.imza") == sig { return }
        for n in names {
            let to = www.appendingPathComponent(n)
            if fm.fileExists(atPath: to.path) { try fm.removeItem(at: to) }
            try fm.copyItem(at: src.appendingPathComponent(n), to: to)
        }
        UserDefaults.standard.set(sig, forKey: "www.imza")
        Log.i("sayfa dosyaları kopyalandı: \(names.sorted().joined(separator: ", "))")
    }

    private func signature(_ dir: URL) -> String {
        var parts: [String] = []
        if let e = fm.enumerator(at: dir, includingPropertiesForKeys: [.fileSizeKey]) {
            for case let u as URL in e {
                let size = (try? u.resourceValues(forKeys: [.fileSizeKey]))?.fileSize ?? 0
                parts.append(u.lastPathComponent + ":" + String(size))
            }
        }
        return parts.sorted().joined(separator: ",")
    }

    private var hasFonts: Bool { fm.fileExists(atPath: www.appendingPathComponent("fonts/fonts.css").path) }

    /// build.py --apk ile aynı düzenli ifadeler: Google Fonts yerine uygulamadaki yazı tipleri
    /// (internetli de internetsiz de aynı görünüm). Yazı tipleri yoksa sayfa olduğu gibi kalır.
    func fontRewrite(_ html: String) -> String {
        guard hasFonts else { return html }
        return html
            .replacingOccurrences(of: #"<link rel="preconnect" href="https://fonts\.googleapis\.com">\s*"#,
                                  with: "", options: .regularExpression)
            .replacingOccurrences(of: #"<link rel="stylesheet" href="https://fonts\.googleapis\.com/css2[^"]*">"#,
                                  with: #"<link rel="stylesheet" href="fonts/fonts.css">"#, options: .regularExpression)
    }

    /// Yazı tiplerini bağlar ve index.html'yi atomik olarak değiştirir (önce geçici dosya, sonra yeniden adlandırma).
    func writeIndex(_ html: String) throws {
        try Data(fontRewrite(html).utf8).write(to: index, options: .atomic)
    }

    /// HisarNative.update(): web sürümünü indirir, denetler (const VER=, sürüm ≥ yüklü sürüm), kurar.
    /// Başarıda (yeni sürüm, önceki sürüm); hatada Türkçe mesaj döner. Ana iş parçacığında çağrılır ve döner.
    func update(_ done: @escaping (Result<(Int, Int), Failure>) -> Void) {
        if updating { Log.i("güncelleme zaten sürüyor"); return }
        updating = true
        let cur = installedVer ?? bundledVer ?? 0
        var c = URLComponents(string: PageStore.updateURL)!
        c.queryItems = [URLQueryItem(name: "t", value: String(Int64(Date().timeIntervalSince1970 * 1000)))]
        let url = c.url!
        var req = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalAndRemoteCacheData, timeoutInterval: 30)
        req.setValue("no-cache, no-store", forHTTPHeaderField: "Cache-Control")
        req.setValue("no-cache", forHTTPHeaderField: "Pragma")
        let cfg = URLSessionConfiguration.ephemeral
        cfg.requestCachePolicy = .reloadIgnoringLocalAndRemoteCacheData
        cfg.urlCache = nil
        let session = URLSession(configuration: cfg)
        Log.i("güncelleme: indiriliyor \(url.absoluteString)")
        session.downloadTask(with: req) { tmp, resp, error in
            // geçici dosya bu blok bitince silinir: hemen okunur
            let r: Result<String, Failure>
            if let e = error {
                r = .failure(Failure(msg: "İndirilemedi: \(e.localizedDescription)"))
            } else if let h = resp as? HTTPURLResponse, h.statusCode != 200 {
                r = .failure(Failure(msg: "Sunucu yanıtı \(h.statusCode)"))
            } else if let t = tmp, let d = try? Data(contentsOf: t), let s = String(data: d, encoding: .utf8) {
                r = .success(s)
            } else {
                r = .failure(Failure(msg: "İndirilen dosya okunamadı"))
            }
            DispatchQueue.main.async { self.install(r, cur: cur, done: done) }
        }.resume()
        session.finishTasksAndInvalidate()
    }

    private func install(_ r: Result<String, Failure>, cur: Int, done: (Result<(Int, Int), Failure>) -> Void) {
        updating = false
        switch r {
        case .failure(let f):
            done(.failure(f))
        case .success(let html):
            guard html.contains("const VER="), let nv = PageStore.ver(html) else {
                done(.failure(Failure(msg: "İndirilen dosya HİSAR TETİK sayfası değil"))); return
            }
            guard html.contains("</html>") else { done(.failure(Failure(msg: "İndirilen dosya eksik"))); return }
            guard nv >= cur else { done(.failure(Failure(msg: "İndirilen sürüm (\(nv)) yüklü sürümden (\(cur)) eski"))); return }
            do {
                try writeIndex(html)
                done(.success((nv, cur)))
            } catch {
                done(.failure(Failure(msg: "Kaydedilemedi: \(error.localizedDescription)")))
            }
        }
    }
}
