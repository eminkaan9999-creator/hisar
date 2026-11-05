import CoreLocation

/// Sensörü bul: telefonun konumu (sensörün son görüldüğü yer). Sensörde GPS yok; konumu telefon verir.
/// Sonuç JSON metni olarak döner: {"lat":..,"lon":..,"acc":..} ya da {"hata":"izin"|"kapali"|"konum"}.
/// Konum yalnız sayfaya verilir (telefonda saklanır), hiçbir yere gönderilmez.
final class Konum: NSObject, CLLocationManagerDelegate {
    private let lm = CLLocationManager()
    private var bekleyen: [(String) -> Void] = []
    private var istendi = false
    private var nesil = 0                          // her yeni istek için artar; eski zamanlayıcı yeni isteği bitirmez

    override init() {
        super.init()
        lm.delegate = self
        lm.desiredAccuracy = kCLLocationAccuracyBest
    }

    func iste(_ cb: @escaping (String) -> Void) {
        bekleyen.append(cb)
        if bekleyen.count > 1 { return }          // süren istek var: aynı sonuç hepsine gider
        nesil += 1
        let n = nesil
        guard CLLocationManager.locationServicesEnabled() else { bitir("{\"hata\":\"kapali\"}"); return }
        switch lm.authorizationStatus {
        case .notDetermined:
            istendi = true
            lm.requestWhenInUseAuthorization()    // sonuç: locationManagerDidChangeAuthorization
        case .denied, .restricted:
            bitir("{\"hata\":\"izin\"}")
        default:
            lm.requestLocation()
        }
        // en çok 20 sn: yeni konum gelmezse son bilinen (2 dakikadan yeni) konum
        DispatchQueue.main.asyncAfter(deadline: .now() + 20) { [weak self] in
            guard let self = self, self.nesil == n, !self.bekleyen.isEmpty else { return }
            if let l = self.lm.location, Date().timeIntervalSince(l.timestamp) < 120 { self.bitir(Konum.json(l)) }
            else { self.bitir("{\"hata\":\"zaman\"}") }
        }
    }

    func locationManagerDidChangeAuthorization(_ m: CLLocationManager) {
        guard istendi, !bekleyen.isEmpty else { return }
        switch m.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            istendi = false
            m.requestLocation()
        case .denied, .restricted:
            istendi = false
            bitir("{\"hata\":\"izin\"}")
        default:
            break
        }
    }

    func locationManager(_ m: CLLocationManager, didUpdateLocations locs: [CLLocation]) {
        guard let l = locs.last, !bekleyen.isEmpty else { return }
        bitir(Konum.json(l))
    }

    func locationManager(_ m: CLLocationManager, didFailWithError e: Error) {
        guard !bekleyen.isEmpty else { return }
        if let ce = e as? CLError, ce.code == .denied { bitir("{\"hata\":\"izin\"}"); return }
        if let l = m.location, Date().timeIntervalSince(l.timestamp) < 120 { bitir(Konum.json(l)); return }
        bitir("{\"hata\":\"konum\"}")
    }

    private static func json(_ l: CLLocation) -> String {
        String(format: "{\"lat\":%.6f,\"lon\":%.6f,\"acc\":%.0f}", l.coordinate.latitude, l.coordinate.longitude, max(0, l.horizontalAccuracy))
    }

    private func bitir(_ s: String) {
        let cbs = bekleyen
        bekleyen = []
        cbs.forEach { $0(s) }
    }
}
