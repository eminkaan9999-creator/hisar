package com.hisar.tetik;
import com.sun.net.httpserver.HttpServer;
import java.io.*; import java.net.InetSocketAddress; import java.nio.charset.StandardCharsets; import java.nio.file.*;
import java.util.concurrent.*; import java.util.concurrent.atomic.*;
/** PageStore.java masaüstü testi: Android'siz, saplama (stub) sınıflarla; yerel HTTP sunucusundan indirme. */
public class PageStoreTest {
  static int fails = 0, passes = 0;
  static void check(boolean c, String m) { if (c) { passes++; System.out.println("✓ " + m); } else { fails++; System.out.println("✗ " + m); } }
  static String page(int v, boolean bridge, boolean end) {
    return "<!doctype html><html><head>" + (bridge ? "<script src=\"bridge.js\"></script>" : "") +
      "<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link rel=\"stylesheet\" href=\"https://fonts.googleapis.com/css2?family=Inter&display=swap\">" +
      "</head><body><script>const VER=" + v + ";window.__hisar={};</script></body>" + (end ? "</html>\n" : "");
  }
  static volatile String body = ""; static volatile int status = 200; static AtomicInteger hits = new AtomicInteger(); static volatile long delay = 0;
  static String[] run(PageStore ps) throws Exception { return run(ps, false); }
  static String[] run(PageStore ps, boolean force) throws Exception {
    CompletableFuture<String[]> f = new CompletableFuture<>();
    ps.update(force, new PageStore.Done() { public void ok(int n, int o) { f.complete(new String[]{"ok", n + "", o + ""}); } public void fail(String m) { f.complete(new String[]{"fail", m}); } });
    return f.get(20, TimeUnit.SECONDS);
  }
  public static void main(String[] a) throws Exception {
    Path tmp = Files.createTempDirectory("ps"); File assets = tmp.resolve("assets").toFile(), files = tmp.resolve("files").toFile();
    new File(assets, "www/fonts").mkdirs(); files.mkdirs();
    Files.write(new File(assets, "www/index.html").toPath(), page(12, true, true).getBytes(StandardCharsets.UTF_8));
    Files.write(new File(assets, "www/fonts/fonts.css").toPath(), "x".getBytes());
    HttpServer srv = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    srv.createContext("/", ex -> { hits.incrementAndGet(); try { Thread.sleep(delay); } catch (InterruptedException e) {} byte[] b = body.getBytes(StandardCharsets.UTF_8); ex.sendResponseHeaders(status, b.length == 0 ? -1 : b.length); if (b.length > 0) ex.getResponseBody().write(b); ex.close(); });
    srv.start(); String url = "http://127.0.0.1:" + srv.getAddress().getPort() + "/hisar/tetik/apk/index.html";
    android.content.Context ctx = new android.content.Context(); ctx.filesDir = files; ctx.assets = new android.content.res.AssetManager(assets);

    PageStore ps = new PageStore(ctx); ps.url = url;
    check(ps.pageVer() == 12 && !ps.usingDownloaded() && PageStore.ver(PageStore.readAll(ps.open())) == 12, "ilk açılış: APK içindeki sayfa (12)");
    body = page(13, true, true); String[] r = run(ps);
    String stored = PageStore.readFile(ps.index);
    check(r[0].equals("ok") && r[1].equals("13") && r[2].equals("12"), "13 indirildi ve kuruldu " + String.join(",", r));
    check(ps.usingDownloaded() && PageStore.ver(PageStore.readAll(ps.open())) == 13, "artık indirilen sayfa sunuluyor");
    check(stored.contains("href=\"fonts/fonts.css\"") && !stored.contains("fonts.googleapis.com"), "yazı tipleri APK'dakilere bağlandı");
    check(!new File(ps.dir, "index.html.yeni").exists(), "geçici dosya kalmadı");
    PageStore ps2 = new PageStore(ctx); ps2.url = url;
    check(ps2.pageVer() == 13 && ps2.usingDownloaded(), "uygulama yeniden açılınca indirilen 13 sunuluyor");
    body = page(11, true, true); r = run(ps2); check(r[0].equals("fail") && r[1].contains("eski") && ps2.pageVer() == 13, "eski sürüm (11) kurulmaz: " + r[r.length - 1]);
    status = 404; body = ""; r = run(ps2); check(r[0].equals("fail") && r[1].equals("Sunucu yanıtı 404"), "404: " + r[r.length - 1]); status = 200;
    body = "<html>hata</html>"; r = run(ps2); check(r[0].equals("fail") && r[1].contains("sayfası değil"), "HİSAR sayfası olmayan dosya kurulmaz: " + r[1]);
    body = page(14, false, true); r = run(ps2); check(r[0].equals("fail") && r[1].contains("Android sayfası değil"), "web sürümü (bridge.js yok) kurulmaz: " + r[1]);
    body = page(14, true, false); r = run(ps2); check(r[0].equals("fail") && r[1].contains("eksik"), "yarım inen dosya kurulmaz: " + r[1]);
    check(PageStore.ver(PageStore.readFile(ps2.index)) == 13, "başarısız denemeler kurulu sayfayı bozmadı");
    // aynı anda iki istek: ikincisi yok sayılır
    body = page(14, true, true); delay = 600; hits.set(0);
    CompletableFuture<String> f1 = new CompletableFuture<>(), f2 = new CompletableFuture<>();
    ps2.update(false, new PageStore.Done() { public void ok(int n, int o) { f1.complete("ok" + n); } public void fail(String m) { f1.complete(m); } });
    ps2.update(false, new PageStore.Done() { public void ok(int n, int o) { f2.complete("ok" + n); } public void fail(String m) { f2.complete(m); } });
    check(f1.get(10, TimeUnit.SECONDS).equals("ok14") && !f2.isDone() && hits.get() == 1, "aynı anda ikinci güncelleme isteği yok sayıldı"); delay = 0;
    // APK güncellendi: içindeki sayfa (15) indirilenden (14) yeni → indirilen silinir
    Files.write(new File(assets, "www/index.html").toPath(), page(15, true, true).getBytes(StandardCharsets.UTF_8));
    PageStore ps3 = new PageStore(ctx); ps3.url = url;
    check(ps3.pageVer() == 15 && !ps3.usingDownloaded() && !ps3.index.exists(), "yeni APK'daki sayfa (15) eski indirileni (14) geçersiz kıldı");
    body = page(15, true, true); r = run(ps3); check(r[0].equals("fail") && r[1].contains("zaten yüklü") && !ps3.usingDownloaded(), "sayfanın isteğinde aynı sürüm (15) yeniden kurulmaz: " + r[r.length - 1]);
    r = run(ps3, true); check(r[0].equals("ok") && ps3.usingDownloaded(), "test ekstrasıyla (force) aynı sürüm yeniden kurulur (15→15)");
    // yazı tipi yoksa sayfa olduğu gibi
    new File(assets, "www/fonts/fonts.css").delete(); PageStore ps4 = new PageStore(ctx); check(ps4.fontRewrite(page(16, true, true)).contains("fonts.googleapis.com/css2"), "APK'da yazı tipi yoksa bağlantılar değişmez");
    srv.stop(0);
    System.out.println("\nPageStore testi: " + passes + " geçti, " + fails + " başarısız"); System.exit(fails > 0 ? 1 : 0);
  }
}
