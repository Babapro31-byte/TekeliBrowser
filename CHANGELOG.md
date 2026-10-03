## [4.0.0]

Yeniden yazım. Eski sürümlerdeki çekirdek sorunlar giderildi.

### Mimari
- Tek `<webview>` yerine sekme başına `WebContentsView`; `tekeli://` iç sayfaları (yeni sekme, ayarlar, geçmiş, yer imleri, indirmeler, hata).
- Ayarlar tek yerde (ana süreç), şema doğrulamalı ve atomik yazılır; açılışta yüklenir.
- Electron 28 → 44, Vite 7, `node:sqlite` (WASM/sql.js kalktı).
- Tek kısayol tablosu (büyük/küçük harf duyarsız), tip güvenli ve sender doğrulamalı IPC.

### Gizlilik ve güvenlik
- Tek istek hattı: HTTPS-only (yedekli uyarı sayfası), Ghostery reklam/izleyici motoru (kozmetik filtre + scriptlet dahil), izleme parametresi temizleme, üçüncü taraf çerez filtresi (registrable domain ile), GPC.
- Sertifika hataları için uyarı sayfası (otomatik kabul yok); tam origin anahtarlı site izinleri ve izin çubuğu.
- Gizli pencere (bellek içi oturum), tarama verilerini gerçekten temizleme, çıkışta temizleme.
- Şifre yöneticisi `safeStorage` ile yeniden yazıldı.
- Eski sürümdeki `executeJavaScript` enjeksiyonu, `file://` webview izni ve substring tabanlı engelleme hataları kaldırıldı.

### Arayüz
- Figma tasarımından üretilen token'lar; Koyu/Açık/OLED; Inter ve ikonlar yerel (Google CDN yok).
- Ayarlar sayfası ortalı ve sekme olarak açılır; sahte durum çubuğu ve ölü düğmeler kaldırıldı.

### Güncelleme
- Zorla yeniden başlatma yok; Ayarlar > Güncelleme ve araç çubuğu bildirimi.
- Sürüm yayını önce taslak, tüm dosyalar yüklenince yayın (latest.yml 404 yarışı biter).
