import CoreBluetooth
import UIKit

/// Sayfanın kullandığı Web Bluetooth işlevlerini iPhone'un Bluetooth'una (CoreBluetooth) bağlar:
/// cihaz seçici, bağlanma (sensör kimliği = iPhone'un verdiği UUID), servis/özellik keşfi, bildirimler, yazma.
/// Android'deki Ble.java'nın karşılığı. Bütün işlemler ana iş parçacığında; GATT işlemleri sırayla (kuyrukla).
/// Sayfaya dönüşler: __hn.ok(id, json) / __hn.err(id, ad, mesaj) / __hn.data([[uuid, b64]...]) / __hn.disc(kimlik)
final class Ble: NSObject, CBCentralManagerDelegate, CBPeripheralDelegate {
    typealias Fail = (String, String) -> Void

    private let js: (String) -> Void
    private let host: () -> UIViewController?
    private let knownChanged: () -> Void
    private var cm: CBCentralManager?

    // hazırlık (izin, Bluetooth açık)
    private var readyOk: [() -> Void] = []
    private var readyFail: [Fail] = []
    private var readyTimer: Timer?
    private var askedByUser = false

    // cihaz seçici
    private var reqId = -1
    private var filters: [[String: Any]] = []
    private var chooser: DeviceChooser?
    private var choosing = false
    private var found: [UUID] = []
    private var names: [UUID: String] = [:]
    private var rssi: [UUID: Int] = [:]
    private var seen: [UUID: CBPeripheral] = [:]
    private var scanTimer: Timer?
    private var listTimer: Timer?

    // bağlantı
    private var per: CBPeripheral?
    private var addr = ""
    private var connected = false
    private var connecting = false
    private var disconnecting = false
    private var connId = -1
    private var connTimer: Timer?
    private var discTimer: Timer?
    private var pendingSvc = 0
    private var target: UUID?                        // iPhone'un tanımadığı sensör: taramayla aranır
    private var closing: [UUID: Timer] = [:]         // iptal edilen bağlantılar: geç gelen olayları yok sayılır
    private var deferred: (id: Int, uuid: UUID)?     // iptal bitince yapılacak bağlantı

    // GATT işlem kuyruğu
    private enum Start { case started, done, waitWrite, fail(String) }
    private struct Op { let id: Int; let run: () -> Start }
    private var ops: [Op] = []
    private var cur: Op?
    private var opTimer: Timer?
    private var waitingWrite = false

    // gelen bildirimler: toplu olarak sayfaya
    private var rx: [String] = []
    private var flushPosted = false

    init(js: @escaping (String) -> Void, host: @escaping () -> UIViewController?, knownChanged: @escaping () -> Void) {
        self.js = js
        self.host = host
        self.knownChanged = knownChanged
        super.init()
    }

    // MARK: - UUID biçimi (Android'deki UUID.toString(): küçük harf, 128 bit)

    private static let base = "-0000-1000-8000-00805f9b34fb"

    static func norm(_ s: String) -> String {
        let l = s.lowercased()
        let hex = !l.isEmpty && l.allSatisfy { $0.isHexDigit }
        if hex && l.count == 4 { return "0000" + l + base }
        if hex && l.count == 8 { return l + base }
        return l
    }

    static func full(_ u: CBUUID) -> String { norm(u.uuidString) }

    private static func uuidText(_ v: Any) -> String {
        if let n = v as? NSNumber {
            let x = n.uint32Value
            return norm(x > 0xFFFF ? String(format: "%08x", x) : String(format: "%04x", x))
        }
        return norm("\(v)")
    }

    // MARK: - sayfaya dönüş

    private func ok(_ id: Int, _ json: String) {
        if id < 0 { return }
        js("window.__hn&&__hn.ok(\(id),\(jsQuote(json)))")
    }

    private func err(_ id: Int, _ name: String, _ msg: String) {
        if id < 0 { return }
        Log.i("ble: \(id) → \(name): \(msg)")
        js("window.__hn&&__hn.err(\(id),\(jsQuote(name)),\(jsQuote(msg)))")
    }

    private func sendDisc() {
        Log.i("ble: sayfaya kopma bildirildi")
        js("window.__hn&&__hn.disc(\(jsQuote(addr)))")
    }

    // MARK: - hazırlık

    private func ensureReady(user: Bool, _ ok: @escaping () -> Void, _ fail: @escaping Fail) {
        switch CBManager.authorization {
        case .denied:
            if user { settingsAlert() }
            fail("NotAllowedError", "Bluetooth izni verilmedi.")
            return
        case .restricted:
            fail("NotAllowedError", "Bluetooth bu iPhone'da kısıtlanmış.")
            return
        default:
            break
        }
        if user { askedByUser = true }
        readyOk.append(ok)
        readyFail.append(fail)
        if cm == nil {
            Log.i("ble: Bluetooth başlatılıyor")
            cm = CBCentralManager(delegate: self, queue: nil, options: [CBCentralManagerOptionShowPowerAlertKey: true])
        }
        checkReady()
        if !readyOk.isEmpty && readyTimer == nil {
            readyTimer = Timer.scheduledTimer(withTimeInterval: 60, repeats: false) { [weak self] _ in
                self?.finishReady(false, "NotAllowedError", "Bluetooth hazır olmadı. Bluetooth açık mı, HİSAR TETİK'in Bluetooth izni var mı?")
            }
        }
    }

    private func checkReady() {
        guard let c = cm, !readyOk.isEmpty else { return }
        switch c.state {
        case .poweredOn: finishReady(true)
        case .unknown, .resetting: break   // izin sorusu ya da açılış sürüyor
        case .poweredOff: finishReady(false, "NotAllowedError", "Bluetooth kapalı. Bluetooth'u açıp tekrar dene.")
        case .unauthorized:
            if askedByUser { settingsAlert() }
            finishReady(false, "NotAllowedError", "Bluetooth izni verilmedi.")
        case .unsupported: finishReady(false, "NotSupportedError", "Bu cihazda Bluetooth LE yok.")
        @unknown default: finishReady(false, "NotSupportedError", "Bluetooth kullanılamıyor.")
        }
    }

    private func finishReady(_ success: Bool, _ name: String = "", _ msg: String = "") {
        readyTimer?.invalidate()
        readyTimer = nil
        let oks = readyOk, fails = readyFail
        readyOk = []
        readyFail = []
        askedByUser = false
        if success { oks.forEach { $0() } } else { fails.forEach { $0(name, msg) } }
    }

    private func settingsAlert() {
        guard let t = host() else { return }
        let a = UIAlertController(title: "Bluetooth izni kapalı",
                                  message: "Sensöre bağlanmak için HİSAR TETİK'e Bluetooth izni gerekir. Ayarlar'dan izni açıp tekrar dene.",
                                  preferredStyle: .alert)
        a.addAction(UIAlertAction(title: "Ayarları aç", style: .default) { _ in
            if let u = URL(string: UIApplication.openSettingsURLString) { UIApplication.shared.open(u) }
        })
        a.addAction(UIAlertAction(title: "Kapat", style: .cancel))
        t.present(a, animated: true)
    }

    private static func stateName(_ s: CBManagerState) -> String {
        switch s {
        case .poweredOn: return "açık"
        case .poweredOff: return "kapalı"
        case .unauthorized: return "izin yok"
        case .unsupported: return "desteklenmiyor"
        case .resetting: return "yeniden başlıyor"
        case .unknown: return "bilinmiyor"
        @unknown default: return "?"
        }
    }

    func centralManagerDidUpdateState(_ c: CBCentralManager) {
        Log.i("ble: Bluetooth durumu: \(Ble.stateName(c.state))")
        checkReady()
        if c.state == .poweredOn {
            updateScan()   // seçici açıkken Bluetooth yeniden açıldıysa arama sürer
            if choosing { chooser?.setStatus(found.isEmpty ? DeviceChooser.searching : "Sensörüne dokun:", searching: true) }
            return
        }
        if c.state == .unknown { return }
        // Bluetooth kapandı ya da izin kalktı: iPhone bağlantıları kendisi bırakır, olay gelmez
        if choosing { chooser?.setStatus("Bluetooth kapalı. Bluetooth'u açınca arama sürer.", searching: false) }
        target = nil
        closing.values.forEach { $0.invalidate() }
        closing.removeAll()
        if let d = deferred { deferred = nil; err(d.id, "NetworkError", "Bluetooth kapandı") }
        if connecting { failConnect("Bluetooth kapandı"); return }
        if per != nil {
            let was = connected
            failOps("Bluetooth kapandı")
            discTimer?.invalidate()
            discTimer = nil
            per = nil
            connected = false
            disconnecting = false
            if was { sendDisc() }
        }
    }

    // MARK: - cihaz seçici

    func requestDevice(id: Int, opts: String) {
        if reqId != -1 { err(id, "InvalidStateError", "Sensör listesi zaten açık."); return }
        filters = []
        if let d = opts.data(using: .utf8), let o = (try? JSONSerialization.jsonObject(with: d)) as? [String: Any] {
            filters = o["filters"] as? [[String: Any]] ?? []
        }
        reqId = id
        Log.i("ble: sensör seçici (istek \(id)) \(opts)")
        ensureReady(user: true, { [weak self] in self?.showChooser() }, { [weak self] n, m in
            guard let self = self else { return }
            let r = self.reqId
            self.reqId = -1
            self.err(r, n, m)
        })
    }

    private func showChooser() {
        guard reqId != -1 else { return }
        guard let t = host() else { cancelChooser(); return }
        found.removeAll()
        names.removeAll()
        rssi.removeAll()
        seen.removeAll()
        let ch = DeviceChooser()
        ch.onPick = { [weak self] i in self?.pick(i) }
        ch.onCancel = { [weak self] in self?.cancelChooser() }
        chooser = ch
        let nav = UINavigationController(rootViewController: ch)
        nav.overrideUserInterfaceStyle = .dark
        nav.modalPresentationStyle = .pageSheet
        if let s = nav.sheetPresentationController {
            s.detents = [.medium(), .large()]
            s.prefersGrabberVisible = true
        }
        nav.presentationController?.delegate = ch
        t.present(nav, animated: true)
        choosing = true
        updateScan()
        scanTimer?.invalidate()
        scanTimer = Timer.scheduledTimer(withTimeInterval: 45, repeats: false) { [weak self] _ in self?.onScanTimeout() }
    }

    /// Tarama: seçici açıkken (sinyal gücü için tekrarlı) ya da tanınmayan sensör aranırken
    private func updateScan() {
        guard let c = cm, c.state == .poweredOn else { return }
        if choosing || target != nil {
            c.scanForPeripherals(withServices: nil, options: [CBCentralManagerScanOptionAllowDuplicatesKey: choosing])
        } else if c.isScanning {
            c.stopScan()
        }
    }

    private func onScanTimeout() {
        guard choosing else { return }
        choosing = false
        updateScan()
        chooser?.setStatus(found.isEmpty
            ? "Sensör bulunamadı. Sensörün açık ve yakında olduğundan emin ol, İptal'e basıp tekrar dene."
            : "Arama bitti. Listeden sensörü seç.", searching: false)
    }

    private func matches(_ name: String?, _ uuids: [String]) -> Bool {
        if filters.isEmpty { return true }
        for f in filters {
            var ok = true
            if let pre = f["namePrefix"] as? String { ok = name?.hasPrefix(pre) ?? false }
            if ok, let n = f["name"] as? String { ok = name == n }
            if ok, let s = f["services"] as? [Any] {
                for x in s where !uuids.contains(Ble.uuidText(x)) { ok = false; break }
            }
            if ok { return true }
        }
        return false
    }

    func centralManager(_ c: CBCentralManager, didDiscover p: CBPeripheral, advertisementData adv: [String: Any], rssi r: NSNumber) {
        let u = p.identifier
        if let t = target, t == u {
            target = nil
            updateScan()
            if connecting && per == nil {
                Log.i("ble: sensör bulundu")
                startConnect(p)
            }
        }
        guard choosing, reqId != -1 else { return }
        var name = adv[CBAdvertisementDataLocalNameKey] as? String
        if name?.isEmpty ?? true { name = p.name }
        if name?.isEmpty ?? true { name = names[u] }
        if !found.contains(u) {
            var svcs = (adv[CBAdvertisementDataServiceUUIDsKey] as? [CBUUID]) ?? []
            svcs += (adv[CBAdvertisementDataOverflowServiceUUIDsKey] as? [CBUUID]) ?? []
            if !matches(name, svcs.map(Ble.full)) { return }
        }
        if let n = name, !n.isEmpty { names[u] = n }
        let v = r.intValue
        if v != 127 && v < 0 { rssi[u] = v }
        seen[u] = p
        if !found.contains(u) {
            found.append(u)
            refreshChooser()
        } else if listTimer == nil {   // sinyal değişimleri saniyede bir gösterilir
            listTimer = Timer.scheduledTimer(withTimeInterval: 1, repeats: false) { [weak self] _ in self?.refreshChooser() }
        }
    }

    private func refreshChooser() {
        listTimer?.invalidate()
        listTimer = nil
        guard let ch = chooser else { return }
        ch.rows = found.map { (names[$0] ?? "Adsız cihaz", label($0)) }
        ch.reload()
        if choosing { ch.setStatus("Sensörüne dokun:", searching: true) }
    }

    private func label(_ u: UUID) -> String {
        let id = String(u.uuidString.suffix(5))
        guard let s = rssi[u] else { return "Sinyal bekleniyor · \(id)" }
        let q = s > -60 ? "çok iyi" : s > -70 ? "iyi" : s > -80 ? "orta" : "zayıf"
        return "Sinyal \(q) (\(s) dBm) · \(id)"
    }

    private func pick(_ i: Int) {
        guard reqId != -1, i >= 0, i < found.count else { return }
        choosing = false
        scanTimer?.invalidate()
        updateScan()
        let u = found[i]
        let n = names[u] ?? ""
        let d = UserDefaults.standard
        d.set(u.uuidString, forKey: "ble.id")
        d.set(n, forKey: "ble.name")
        knownChanged()
        let id = reqId
        reqId = -1
        dismissChooser()
        Log.i("ble: seçildi: \(n) \(u.uuidString)")
        ok(id, App.json(["id": u.uuidString, "name": n]))
    }

    private func cancelChooser() {
        guard reqId != -1 else { return }
        choosing = false
        scanTimer?.invalidate()
        updateScan()
        let id = reqId
        reqId = -1
        dismissChooser()
        err(id, "NotFoundError", "User cancelled the requestDevice() chooser.")
    }

    private func dismissChooser() {
        listTimer?.invalidate()
        listTimer = nil
        if let ch = chooser {
            ch.onPick = nil
            ch.onCancel = nil
            if let nav = ch.navigationController { nav.dismiss(animated: true) } else { ch.dismiss(animated: true) }
        }
        chooser = nil
    }

    /// Daha önce seçilen sensör (açılışta listesiz bağlanmak için): {"id","name"} ya da ""
    static func knownDevice() -> String {
        let d = UserDefaults.standard
        guard let s = d.string(forKey: "ble.id"), UUID(uuidString: s) != nil else { return "" }
        return App.json(["id": s, "name": d.string(forKey: "ble.name") ?? ""])
    }

    // MARK: - bağlanma

    func connect(id: Int, address: String) {
        guard let u = UUID(uuidString: address) else { err(id, "NotFoundError", "Geçersiz sensör kimliği"); return }
        ensureReady(user: false, { [weak self] in self?.doConnect(id, u) }, { [weak self] n, m in self?.err(id, n, m) })
    }

    private func doConnect(_ id: Int, _ u: UUID) {
        guard let c = cm, c.state == .poweredOn else { err(id, "NetworkError", "Bluetooth hazır değil"); return }
        if let p = per, p.identifier == u {
            if connected && !connecting && !disconnecting { ok(id, servicesJson()); return }
            if connecting {   // aynı sensöre zaten bağlanılıyor: yeni istek eskisinin yerini alır
                err(connId, "NetworkError", "Yeni bağlantı isteği")
                connId = id
                startConnTimer()
                return
            }
            if disconnecting { deferConnect(id, u); return }
        }
        if closing[u] != nil { deferConnect(id, u); return }
        if connecting && connId != -1 {
            err(connId, "NetworkError", "Yeni bağlantı isteği")
            connId = -1
        }
        if target != nil { target = nil; updateScan() }
        closePeripheral()
        if closing[u] != nil { deferConnect(id, u); return }
        addr = u.uuidString
        connId = id
        connecting = true
        pendingSvc = 0
        startConnTimer()
        if let p = c.retrievePeripherals(withIdentifiers: [u]).first ?? seen[u] {
            startConnect(p)
        } else {
            Log.i("ble: sensör bu iPhone'da kayıtlı değil; aranıyor")
            target = u
            updateScan()
        }
    }

    private func startConnect(_ p: CBPeripheral) {
        per = p
        p.delegate = self
        Log.i("ble: bağlanılıyor: \(p.name ?? "adsız") \(p.identifier.uuidString)")
        cm?.connect(p, options: nil)
    }

    private func startConnTimer() {
        connTimer?.invalidate()
        connTimer = Timer.scheduledTimer(withTimeInterval: 15, repeats: false) { [weak self] _ in self?.onConnectTimeout() }
    }

    private func deferConnect(_ id: Int, _ u: UUID) {
        if let d = deferred { err(d.id, "NetworkError", "Yeni bağlantı isteği") }
        deferred = (id, u)
    }

    private func runDeferred() {
        guard let d = deferred else { return }
        deferred = nil
        doConnect(d.id, d.uuid)
    }

    private func onConnectTimeout() {
        guard connecting else { return }
        failConnect(target != nil ? "Sensör bulunamadı (açık ve yakında mı?)" : "Bağlantı zaman aşımına uğradı")
    }

    private func failConnect(_ msg: String) {
        connTimer?.invalidate()
        connTimer = nil
        if target != nil { target = nil; updateScan() }
        let c = connId
        connId = -1
        closePeripheral()
        Log.i("ble: bağlanamadı: \(msg)")
        err(c, "NetworkError", msg)
    }

    func centralManager(_ c: CBCentralManager, didConnect p: CBPeripheral) {
        guard p === per, connecting else {
            if p !== per && closing[p.identifier] == nil { c.cancelPeripheralConnection(p) }
            return
        }
        connected = true
        Log.i("ble: bağlandı; servisler okunuyor (paket en çok \(p.maximumWriteValueLength(for: .withoutResponse)) bayt)")
        p.discoverServices(nil)
    }

    func centralManager(_ c: CBCentralManager, didFailToConnect p: CBPeripheral, error: Error?) {
        if closing[p.identifier] != nil { closingDone(p.identifier); return }
        guard p === per, connecting else { return }
        failConnect("Bağlanamadı (\(error?.localizedDescription ?? "bilinmeyen hata"))")
    }

    func centralManager(_ c: CBCentralManager, didDisconnectPeripheral p: CBPeripheral, error: Error?) {
        if closing[p.identifier] != nil { closingDone(p.identifier); return }   // kendi iptal ettiğimiz bağlantı
        guard p === per else { return }
        Log.i("ble: bağlantı koptu" + (error.map { " (\($0.localizedDescription))" } ?? ""))
        if connecting { failConnect("Bağlantı koptu"); return }
        let was = connected
        discTimer?.invalidate()
        discTimer = nil
        failOps("Bağlantı koptu")
        per = nil
        connected = false
        disconnecting = false
        if was { sendDisc() }
        runDeferred()
    }

    func peripheral(_ p: CBPeripheral, didDiscoverServices error: Error?) {
        guard p === per, connecting else { return }
        if let e = error { failConnect("Servisler okunamadı (\(e.localizedDescription))"); return }
        let list = p.services ?? []
        pendingSvc = list.count
        if list.isEmpty { connectDone(); return }
        for s in list { p.discoverCharacteristics(nil, for: s) }
    }

    func peripheral(_ p: CBPeripheral, didDiscoverCharacteristicsFor s: CBService, error: Error?) {
        guard p === per, connecting else { return }
        if let e = error { Log.i("ble: özellikler okunamadı \(Ble.full(s.uuid)): \(e.localizedDescription)") }
        pendingSvc -= 1
        if pendingSvc <= 0 { connectDone() }
    }

    func peripheral(_ p: CBPeripheral, didModifyServices invalidatedServices: [CBService]) {
        Log.i("ble: sensör servisleri değişti (\(invalidatedServices.count))")
    }

    private func connectDone() {
        connecting = false
        connTimer?.invalidate()
        connTimer = nil
        let c = connId
        connId = -1
        Log.i("ble: hazır (\(per?.services?.count ?? 0) servis)")
        ok(c, servicesJson())
    }

    /// Android'deki servicesJson ile aynı biçim: [{uuid, chars:[{uuid, props:{read,write,writeWithoutResponse,notify,indicate}}]}]
    private func servicesJson() -> String {
        var out: [[String: Any]] = []
        for s in per?.services ?? [] {
            var cs: [[String: Any]] = []
            for c in s.characteristics ?? [] {
                let pr = c.properties
                cs.append(["uuid": Ble.full(c.uuid),
                           "props": ["read": pr.contains(.read), "write": pr.contains(.write),
                                     "writeWithoutResponse": pr.contains(.writeWithoutResponse),
                                     "notify": pr.contains(.notify), "indicate": pr.contains(.indicate)]])
            }
            out.append(["uuid": Ble.full(s.uuid), "chars": cs])
        }
        guard let d = try? JSONSerialization.data(withJSONObject: out), let t = String(data: d, encoding: .utf8) else { return "[]" }
        return t
    }

    /// Sayfa bağlantıyı kesti (gatt.disconnect)
    func disconnect() {
        failOps("Bağlantı kesildi")
        if let d = deferred { deferred = nil; err(d.id, "NetworkError", "Bağlantı kesildi") }
        guard let p = per else { return }
        if connecting { failConnect("Bağlantı kesildi"); return }
        disconnecting = true
        if let c = cm, c.state == .poweredOn { c.cancelPeripheralConnection(p) }
        discTimer?.invalidate()
        discTimer = Timer.scheduledTimer(withTimeInterval: 1.2, repeats: false) { [weak self] _ in self?.onDisconnectFallback() }
    }

    private func onDisconnectFallback() {   // olay gelmezse de sayfaya kopma bildirilir
        guard per != nil, connected || disconnecting else { return }
        let was = connected
        closePeripheral()
        if was { sendDisc() }
        runDeferred()
    }

    private func closePeripheral() {
        discTimer?.invalidate()
        discTimer = nil
        if let p = per, let c = cm, c.state == .poweredOn, p.state != .disconnected {
            c.cancelPeripheralConnection(p)
            markClosing(p.identifier)
        }
        per = nil
        connected = false
        connecting = false
        disconnecting = false
        pendingSvc = 0
    }

    private func markClosing(_ u: UUID) {
        closing[u]?.invalidate()
        closing[u] = Timer.scheduledTimer(withTimeInterval: 1, repeats: false) { [weak self] _ in self?.closingDone(u) }
    }

    private func closingDone(_ u: UUID) {
        closing[u]?.invalidate()
        closing[u] = nil
        if let d = deferred, d.uuid == u { runDeferred() }
    }

    // MARK: - GATT işlem kuyruğu

    private func find(_ svc: String, _ chr: String) -> CBCharacteristic? {
        let ws = Ble.norm(svc), wc = Ble.norm(chr)
        for s in per?.services ?? [] where Ble.full(s.uuid) == ws {
            for c in s.characteristics ?? [] where Ble.full(c.uuid) == wc { return c }
        }
        return nil
    }

    private func enqueue(_ id: Int, _ run: @escaping () -> Start) {
        ops.append(Op(id: id, run: run))
        pump()
    }

    private func pump() {
        guard cur == nil, !ops.isEmpty else { return }
        let o = ops.removeFirst()
        cur = o
        runOp(o)
    }

    private func runOp(_ o: Op) {
        guard per != nil, connected, !connecting else {
            cur = nil
            err(o.id, "NetworkError", "GATT Server is disconnected.")
            pump()
            return
        }
        switch o.run() {
        case .started, .waitWrite:   // yanıt (ya da yanıtsız yazma için gönderme sırası) beklenir
            opTimer?.invalidate()
            opTimer = Timer.scheduledTimer(withTimeInterval: 6, repeats: false) { [weak self] _ in self?.opDone(false, "zaman aşımı") }
        case .done:
            cur = nil
            ok(o.id, "true")
            pump()
        case .fail(let m):
            cur = nil
            err(o.id, "NetworkError", m)
            pump()
        }
    }

    private func opDone(_ success: Bool, _ why: String) {
        guard let o = cur else { return }
        opTimer?.invalidate()
        opTimer = nil
        waitingWrite = false
        cur = nil
        if success { ok(o.id, "true") } else { err(o.id, "NetworkError", "GATT işlemi başarısız: " + why) }
        pump()
    }

    private func failOps(_ why: String) {
        opTimer?.invalidate()
        opTimer = nil
        waitingWrite = false
        if let o = cur { cur = nil; err(o.id, "NetworkError", why) }
        let rest = ops
        ops = []
        rest.forEach { err($0.id, "NetworkError", why) }
    }

    func setNotify(id: Int, svc: String, chr: String, on: Bool) {
        enqueue(id) { [weak self] in
            guard let self = self, let p = self.per, let c = self.find(svc, chr) else { return .fail("Özellik bulunamadı") }
            if c.isNotifying == on { return .done }
            if on && !c.properties.contains(.notify) && !c.properties.contains(.indicate) { return .fail("Bu özellik bildirim göndermiyor") }
            p.setNotifyValue(on, for: c)
            return .started
        }
    }

    /// Yazma. Yanıtsız yazma tek pakete (maximumWriteValueLength) sığmalı; sığmazsa veri bölünmez,
    /// özellik izin veriyorsa yanıtlı (uzun) yazmayla gider. iPhone'un gönderme sırası doluysa beklenir.
    func write(id: Int, svc: String, chr: String, data: Data?, withResponse: Bool) {
        guard let data = data else { err(id, "NetworkError", "Geçersiz veri (base64)"); return }
        enqueue(id) { [weak self] in
            guard let self = self, let p = self.per, let c = self.find(svc, chr) else { return .fail("Özellik bulunamadı") }
            let pr = c.properties
            var type: CBCharacteristicWriteType = withResponse ? .withResponse : .withoutResponse
            if type == .withoutResponse && !pr.contains(.writeWithoutResponse) && pr.contains(.write) { type = .withResponse }
            if type == .withResponse && !pr.contains(.write) && pr.contains(.writeWithoutResponse) { type = .withoutResponse }
            let maxNR = p.maximumWriteValueLength(for: .withoutResponse)
            let maxR = p.maximumWriteValueLength(for: .withResponse)
            if type == .withoutResponse && data.count > maxNR {
                guard pr.contains(.write), data.count <= maxR else {
                    return .fail("Veri bir pakete sığmıyor (\(data.count) > \(maxNR) bayt)")
                }
                type = .withResponse
            }
            if type == .withResponse && data.count > maxR { return .fail("Veri çok uzun (\(data.count) > \(maxR) bayt)") }
            if type == .withoutResponse {
                if !p.canSendWriteWithoutResponse {
                    self.waitingWrite = true
                    return .waitWrite
                }
                p.writeValue(data, for: c, type: .withoutResponse)
                return .done
            }
            p.writeValue(data, for: c, type: .withResponse)
            return .started
        }
    }

    func peripheral(_ p: CBPeripheral, didUpdateNotificationStateFor c: CBCharacteristic, error: Error?) {
        guard p === per, !waitingWrite else { return }
        opDone(error == nil, error?.localizedDescription ?? "")
    }

    func peripheral(_ p: CBPeripheral, didWriteValueFor c: CBCharacteristic, error: Error?) {
        guard p === per, !waitingWrite else { return }
        opDone(error == nil, error?.localizedDescription ?? "")
    }

    func peripheralIsReady(toSendWriteWithoutResponse p: CBPeripheral) {
        guard p === per, waitingWrite, let o = cur else { return }
        waitingWrite = false
        opTimer?.invalidate()
        opTimer = nil
        runOp(o)
    }

    // MARK: - bildirimler (Android ile aynı biçim: __hn.data([["uuid","base64"],...]), en çok 300'lük demetler)

    func peripheral(_ p: CBPeripheral, didUpdateValueFor c: CBCharacteristic, error: Error?) {
        guard p === per, error == nil, let v = c.value else { return }
        rx.append("[\"" + Ble.full(c.uuid) + "\",\"" + v.base64EncodedString() + "\"]")
        if !flushPosted {
            flushPosted = true
            DispatchQueue.main.async { [weak self] in self?.flush() }
        }
    }

    private func flush() {
        flushPosted = false
        if rx.isEmpty { return }
        let n = min(300, rx.count)
        let batch = rx[0..<n].joined(separator: ",")
        rx.removeFirst(n)
        js("window.__hn&&__hn.data([" + batch + "])")
        if !rx.isEmpty {
            flushPosted = true
            DispatchQueue.main.async { [weak self] in self?.flush() }
        }
    }
}
