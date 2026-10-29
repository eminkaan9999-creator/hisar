// HİSAR ŞANTİYE: bu klasörün kendi servis çalışanı. Hiçbir şeyi önbelleğe almaz, her dosya her seferinde GitHub'dan gelir;
// sitenin kök uygulamasının servis çalışanı bu klasöre karışmasın diye burada duruyor.
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
