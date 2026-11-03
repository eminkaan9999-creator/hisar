import UIKit

/// HİSAR TETİK iPhone uygulaması: tek pencere, tam ekran sayfa (WebViewController).
/// Bluetooth (Web Bluetooth yerine CoreBluetooth) Ble.swift'te; sayfa Documents/www'den açılır (PageStore.swift).
@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        let args = ProcessInfo.processInfo.arguments.dropFirst().joined(separator: " ")
        Log.i("=== açılış: HİSAR TETİK \(App.versionName) (\(App.versionCode)), iOS \(UIDevice.current.systemVersion), \(App.model)"
              + (args.isEmpty ? "" : ", argümanlar: \(args)"))
        return true
    }

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let c = UISceneConfiguration(name: "Default", sessionRole: connectingSceneSession.role)
        c.delegateClass = SceneDelegate.self
        return c
    }
}

final class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let ws = scene as? UIWindowScene else { return }
        let w = UIWindow(windowScene: ws)
        w.overrideUserInterfaceStyle = .dark
        w.backgroundColor = App.bg
        w.rootViewController = WebViewController()
        w.makeKeyAndVisible()
        window = w
    }
}
