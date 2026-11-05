import UIKit
import WebKit

/// Tam ekran sayfa (WKWebView, güvenli alan içinde) ve sayfanın çağırdığı yerel işlevler (window.HisarNative).
/// Android'deki MainActivity'nin karşılığı. Sayfa hep Documents/www/index.html'den açılır (PageStore).
final class WebViewController: UIViewController, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
    private let pages = PageStore()
    private let ucc = WKUserContentController()
    private var web: WKWebView!
    private var ble: Ble!
    private lazy var konum = Konum()      // Sensörü bul: telefonun konumu
    private var testHooksDone = false

    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { .portrait }

    override func loadView() {
        let v = UIView()
        v.backgroundColor = App.bg
        view = v
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        pages.prepare()
        ble = Ble(js: { [weak self] code in self?.js(code) },
                  host: { [weak self] in self?.top() },
                  knownChanged: { [weak self] in self?.knownChanged() })

        let proxy = WeakMessageHandler(self)
        ucc.add(proxy, name: "hn")
        ucc.add(proxy, name: "log")
        installScripts()

        let cfg = WKWebViewConfiguration()
        cfg.userContentController = ucc
        cfg.websiteDataStore = .default()
        cfg.allowsInlineMediaPlayback = true
        cfg.mediaTypesRequiringUserActionForPlayback = []
        cfg.applicationNameForUserAgent = "Mobile/15E148 HisarTetikiOS/\(App.versionName)"
        cfg.preferences.javaScriptCanOpenWindowsAutomatically = false

        let w = WKWebView(frame: .zero, configuration: cfg)
        w.navigationDelegate = self
        w.uiDelegate = self
        w.isOpaque = false
        w.backgroundColor = App.bg
        w.scrollView.backgroundColor = App.bg
        w.scrollView.contentInsetAdjustmentBehavior = .never
        w.scrollView.bounces = false
        w.allowsBackForwardNavigationGestures = false
        w.allowsLinkPreview = false
        if #available(iOS 16.4, *) { w.isInspectable = true }   // Mac'te Safari ile hata ayıklama
        w.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(w)
        let g = view.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            w.topAnchor.constraint(equalTo: g.topAnchor),
            w.bottomAnchor.constraint(equalTo: g.bottomAnchor),
            w.leadingAnchor.constraint(equalTo: g.leadingAnchor),
            w.trailingAnchor.constraint(equalTo: g.trailingAnchor),
        ])
        web = w
        // "-sayfa ayarlar/baglanti" açılış argümanı o sayfayı açar (Android'deki "sayfa" ekstrası gibi; testler için)
        loadPage(route: UserDefaults.standard.string(forKey: "sayfa"))
    }

    /// documentStart: önce HisarNative (Kopru/hisar-native.js), hemen ardından Android ile ortak bridge.js.
    private func installScripts() {
        ucc.removeAllUserScripts()
        if let u = Bundle.main.url(forResource: "hisar-native", withExtension: "js"),
           let t = try? String(contentsOf: u, encoding: .utf8) {
            let src = t.replacingOccurrences(of: "__HN_INFO__", with: jsQuote(App.infoJSON()))
                .replacingOccurrences(of: "__HN_KNOWN__", with: jsQuote(Ble.knownDevice()))
            ucc.addUserScript(WKUserScript(source: src, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        } else {
            Log.i("hisar-native.js bulunamadı")
        }
        if let u = pages.bundled?.appendingPathComponent("bridge.js"), let b = try? String(contentsOf: u, encoding: .utf8) {
            ucc.addUserScript(WKUserScript(source: b, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        } else {
            Log.i("bridge.js bulunamadı")
        }
    }

    private func loadPage(route: String? = nil) {
        var url = pages.pageURL
        if let r = route, r.range(of: "^[a-z0-9/_-]{1,60}$", options: .regularExpression) != nil,
           var c = URLComponents(url: url, resolvingAgainstBaseURL: false) {
            c.fragment = r
            url = c.url ?? url
        }
        Log.i("sayfa açılıyor: \(url.path)" + (route.map { "#\($0)" } ?? ""))
        web.loadFileURL(url, allowingReadAccessTo: pages.readAccess)
    }

    func js(_ code: String) {
        guard Thread.isMainThread else {
            DispatchQueue.main.async { [weak self] in self?.js(code) }
            return
        }
        web?.evaluateJavaScript(code, completionHandler: nil)
    }

    /// En üstteki görünüm denetleyicisi (seçici, paylaşım menüsü ve uyarılar bunun üstünde açılır)
    func top() -> UIViewController? {
        guard view.window != nil else { return nil }
        var t: UIViewController = self
        while let p = t.presentedViewController, !p.isBeingDismissed { t = p }
        return t
    }

    private func knownChanged() {
        js("window.__hnSetKnown&&window.__hnSetKnown(\(jsQuote(Ble.knownDevice())))")
        installScripts()   // sayfa yeniden açılınca da güncel olsun
    }

    // MARK: - sayfadan gelen çağrılar (HisarNative)

    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "log" {
            if let o = message.body as? [String: Any] {
                Log.i("js \(o["l"] as? String ?? "log"): \(o["m"] as? String ?? "")")
            }
            return
        }
        guard message.name == "hn", let o = message.body as? [String: Any], let fn = o["fn"] as? String else { return }
        let a = o["args"] as? [Any] ?? []
        func s(_ i: Int) -> String { i < a.count ? (a[i] as? String ?? "\(a[i])") : "" }
        func n(_ i: Int) -> Int { i < a.count ? ((a[i] as? NSNumber)?.intValue ?? -1) : -1 }
        func b(_ i: Int) -> Bool { i < a.count ? ((a[i] as? NSNumber)?.boolValue ?? false) : false }
        switch fn {
        case "bleRequest": ble.requestDevice(id: n(0), opts: s(1))
        case "bleConnect": ble.connect(id: n(0), address: s(1))
        case "bleDisconnect": ble.disconnect()
        case "bleNotify": ble.setNotify(id: n(0), svc: s(1), chr: s(2), on: b(3))
        case "bleWrite":
            ble.write(id: n(0), svc: s(1), chr: s(2), data: Data(base64Encoded: s(3), options: .ignoreUnknownCharacters), withResponse: b(4))
        case "keepScreenOn": UIApplication.shared.isIdleTimerDisabled = b(0)
        case "openUrl": openExternal(s(0))
        case "saveFile": saveFile(name: s(0), mime: s(1), text: s(2))
        case "shareFile": shareFile(name: s(0), mime: s(1), b64: s(2))
        case "update": runUpdate()
        case "reloadPage": loadPage()
        case "konum": konum.iste { [weak self] j in self?.js("window.__hisarKonum&&window.__hisarKonum(\(j))") }
        case "exitApp": Log.i("exitApp: iPhone'da uygulama kendini kapatmaz")
        default: Log.i("bilinmeyen çağrı: \(fn)")
        }
    }

    private func openExternal(_ s: String) {
        guard let u = URL(string: s), let sch = u.scheme?.lowercased(),
              ["http", "https", "mailto", "tel", "sms", "itms-apps"].contains(sch) else {
            Log.i("açılmayan adres: \(s)")
            return
        }
        UIApplication.shared.open(u, options: [:]) { [weak self] ok in if !ok { self?.toast("Bağlantı açılamadı") } }
    }

    /// Dışa aktarma (JSON/CSV): paylaşım menüsü ("Dosyalar'a Kaydet" dahil); sonra Android'deki gibi __hisarSaved(tamam, ad)
    private func saveFile(name: String, mime: String, text: String) {
        Log.i("saveFile: \(name) (\(mime), \(text.utf8.count) bayt)")
        do {
            let url = try tempFile(name, Data(text.utf8))
            share(url) { [weak self] ok in
                self?.js("window.__hisarSaved&&window.__hisarSaved(\(ok),\(jsQuote(name)))")
            }
        } catch {
            js("window.__hisarSaved&&window.__hisarSaved(false,\(jsQuote(name)))")
        }
    }

    /// Oturum raporu (PNG/PDF) ve ham veri (CSV): paylaşım menüsü (WhatsApp, e-posta, Fotoğraflar, Dosyalar...)
    private func shareFile(name: String, mime: String, b64: String) {
        Log.i("shareFile: \(name) (\(mime), \(b64.count) karakter base64)")
        guard let data = Data(base64Encoded: b64, options: .ignoreUnknownCharacters), let url = try? tempFile(name, data) else {
            toast("Paylaşılamadı")
            return
        }
        share(url, done: nil)
    }

    private func tempFile(_ name: String, _ data: Data) throws -> URL {
        let fm = FileManager.default
        let dir = fm.temporaryDirectory.appendingPathComponent("paylas", isDirectory: true)
        try fm.createDirectory(at: dir, withIntermediateDirectories: true)
        if let old = try? fm.contentsOfDirectory(at: dir, includingPropertiesForKeys: [.contentModificationDateKey]) {
            for f in old {   // bir saatten eski paylaşımlar silinir
                let d = (try? f.resourceValues(forKeys: [.contentModificationDateKey]))?.contentModificationDate ?? .distantPast
                if Date().timeIntervalSince(d) > 3600 { try? fm.removeItem(at: f) }
            }
        }
        var safe = name.replacingOccurrences(of: "[^A-Za-z0-9._-]", with: "_", options: .regularExpression)
        if safe.isEmpty { safe = "hisar-tetik" }
        let url = dir.appendingPathComponent(safe)
        try data.write(to: url, options: .atomic)
        return url
    }

    private func share(_ url: URL, done: ((Bool) -> Void)?) {
        guard let t = top() else { done?(false); return }
        let av = UIActivityViewController(activityItems: [url], applicationActivities: nil)
        var called = false
        av.completionWithItemsHandler = { _, completed, _, _ in
            if called { return }
            called = true
            done?(completed)
        }
        if let p = av.popoverPresentationController {
            p.sourceView = view
            p.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.maxY - 80, width: 1, height: 1)
        }
        t.present(av, animated: true)
    }

    /// HisarNative.update(): sayfanın yeni sürümü indirilip kurulur, sayfa aynı adresten yeniden açılır.
    private func runUpdate() {
        pages.update { [weak self] r in
            guard let self = self else { return }
            switch r {
            case .success(let v):
                Log.i("güncelleme tamam: sürüm \(v.0) (önceki \(v.1)); sayfa uygun olunca yeniden açılacak")
                // oturum ya da sensör güncellemesi sürüyorsa sayfa bekletir, bitince HisarNative.reloadPage() ile açar
                self.js("window.__hisarUpdateReady?window.__hisarUpdateReady(\(v.0)):window.HisarNative.reloadPage()")
            case .failure(let f):
                Log.i("güncelleme hatası: \(f.msg)")
                self.js("window.__hisarUpdateFailed&&window.__hisarUpdateFailed(\(jsQuote(f.msg)))")
            }
        }
    }

    private func toast(_ text: String) {
        let l = UILabel()
        l.text = text
        l.textColor = .white
        l.backgroundColor = UIColor(white: 0.08, alpha: 0.92)
        l.font = .systemFont(ofSize: 15, weight: .medium)
        l.textAlignment = .center
        l.numberOfLines = 0
        l.layer.cornerRadius = 10
        l.clipsToBounds = true
        l.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(l)
        NSLayoutConstraint.activate([
            l.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            l.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -90),
            l.widthAnchor.constraint(lessThanOrEqualTo: view.widthAnchor, constant: -40),
            l.widthAnchor.constraint(greaterThanOrEqualToConstant: 160),
            l.heightAnchor.constraint(greaterThanOrEqualToConstant: 42),
        ])
        l.alpha = 0
        UIView.animate(withDuration: 0.2) { l.alpha = 1 }
        UIView.animate(withDuration: 0.3, delay: 2.2, options: [], animations: { l.alpha = 0 }, completion: { _ in l.removeFromSuperview() })
    }

    // MARK: - gezinme

    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let u = action.request.url else { decisionHandler(.cancel); return }
        let sch = (u.scheme ?? "").lowercased()
        if ["file", "about", "blob", "data"].contains(sch) { decisionHandler(.allow); return }
        if action.targetFrame?.isMainFrame != false || action.navigationType == .linkActivated {
            openExternal(u.absoluteString)   // aparat, sensör yazılımı yükleme sayfası...: Safari'de
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        let probe = "(function(){var ls=-1;try{ls=localStorage.length}catch(e){}return JSON.stringify({t:document.title,"
            + "bt:typeof(navigator.bluetooth&&navigator.bluetooth.requestDevice),hn:!!window.__hn,app:!!window.__hisar,ls:ls,"
            + "yerel:!!document.querySelector('link[href=\"fonts/fonts.css\"]')})})()"
        webView.evaluateJavaScript(probe) { [weak self] res, err in
            guard let self = self else { return }
            let ver = self.pages.installedVer.map(String.init) ?? "?"
            if let s = res as? String, let d = s.data(using: .utf8),
               let o = (try? JSONSerialization.jsonObject(with: d)) as? [String: Any] {
                func yn(_ k: String) -> String { (o[k] as? Bool) == true ? "evet" : "hayır" }
                Log.i("sayfa hazır: title=\"\(o["t"] as? String ?? "")\" ver=\(ver) köprü=\(o["bt"] as? String ?? "?") "
                      + "__hn=\(yn("hn")) uygulama=\(yn("app")) localStorage=\((o["ls"] as? NSNumber)?.intValue ?? -1) "
                      + "yazıtipi=\((o["yerel"] as? Bool) == true ? "yerel" : "google")")
            } else {
                Log.i("sayfa hazır: title=? (\(err?.localizedDescription ?? "yanıt yok"))")
            }
            self.runTestHooks()
        }
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        Log.i("sayfa hatası: \(error.localizedDescription)")
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        Log.i("sayfa açılamadı: \(error.localizedDescription)")
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        Log.i("sayfa işlemi kapandı; yeniden açılıyor")
        loadPage()
    }

    // MARK: - sayfa pencereleri ve izinler

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let u = navigationAction.request.url { openExternal(u.absoluteString) }   // target="_blank" bağlantılar
        return nil
    }

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        guard let t = top() else { completionHandler(); return }
        let a = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        a.addAction(UIAlertAction(title: "Tamam", style: .default) { _ in completionHandler() })
        t.present(a, animated: true)
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        guard let t = top() else { completionHandler(false); return }
        let a = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        a.addAction(UIAlertAction(title: "İptal", style: .cancel) { _ in completionHandler(false) })
        a.addAction(UIAlertAction(title: "Tamam", style: .default) { _ in completionHandler(true) })
        t.present(a, animated: true)
    }

    func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String, defaultText: String?,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (String?) -> Void) {
        guard let t = top() else { completionHandler(nil); return }
        let a = UIAlertController(title: nil, message: prompt, preferredStyle: .alert)
        a.addTextField { $0.text = defaultText }
        a.addAction(UIAlertAction(title: "İptal", style: .cancel) { _ in completionHandler(nil) })
        a.addAction(UIAlertAction(title: "Tamam", style: .default) { [weak a] _ in completionHandler(a?.textFields?.first?.text) })
        t.present(a, animated: true)
    }

    /// "Telefon" kaynağı (DeviceMotionEvent.requestPermission): kullanıcı kendisi seçtiği için ayrıca sorulmaz.
    func webView(_ webView: WKWebView, requestDeviceOrientationAndMotionPermissionFor origin: WKSecurityOrigin,
                 initiatedByFrame frame: WKFrameInfo, decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        decisionHandler(.grant)
    }

    // MARK: - CI açılış testi kancaları (yalnız simülatörde)

    private func runTestHooks() {
        #if targetEnvironment(simulator)
        if testHooksDone { return }
        testHooksDone = true
        let d = UserDefaults.standard
        if let code = d.string(forKey: "hisarJS"), !code.isEmpty {
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) { [weak self] in
                self?.web.evaluateJavaScript(code + "\n;void 0") { _, e in
                    Log.i("test JS: " + (e.map { "hata: \($0.localizedDescription)" } ?? "çalıştı"))
                }
            }
        }
        if d.string(forKey: "hisarTest") == "guncelle" {
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) { [weak self] in
                Log.i("test: güncelleme başlıyor")
                self?.runUpdate()
            }
        }
        #endif
    }
}

/// WKUserContentController betik işleyicisini güçlü tutar; döngü olmasın diye zayıf aracı.
final class WeakMessageHandler: NSObject, WKScriptMessageHandler {
    weak var target: WKScriptMessageHandler?
    init(_ t: WKScriptMessageHandler) { target = t }
    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        target?.userContentController(controller, didReceive: message)
    }
}
