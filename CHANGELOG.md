## [1.0.0]

İlk kararlı sürüm. Tarayıcı baştan yazıldı; önceki deneme sürümlerinin yerini alır.

### Mimari
- Sekme başına bir `WebContentsView`; `tekeli://` iç sayfaları (yeni sekme, ayarlar, geçmiş, yer imleri, indirmeler, hata).
- Ayarlar tek yerde (ana süreç), şema doğrulamalı ve atomik yazılır; açılışta yüklenir.
- Electron 44, Vite 7, `node:sqlite`. Tek kısayol tablosu, tip güvenli ve sender doğrulamalı IPC.

### Gizlilik ve güvenlik
- Tek istek hattı: yalnızca-HTTPS (yedekli uyarı sayfası), Ghostery reklam/izleyici motoru (kozmetik filtre + scriptlet dahil), izleme parametresi temizleme, üçüncü taraf çerez filtresi, GPC, parmak izi koruması, güvenli DNS.
- Sertifika hataları için uyarı sayfası (otomatik kabul yok); tam origin anahtarlı site izinleri ve izin çubuğu.
- Gizli pencere (bellek içi oturum), tarama verilerini temizleme (geçmiş için zaman aralığı; çerez, site verisi ve önbellek her zaman tamamen silinir), çıkışta temizleme.
- Şifre yöneticisi `safeStorage` ile şifreli; giriş formundan "kaydet?" çubuğu; tıklayınca doldurma (yalnızca kayıtlı origin'in ana çerçevesine, sessiz doldurma yok).

### Arayüz
- Koyu / Açık / OLED temalar, 5 vurgu rengi, TR/EN. Inter ve ikonlar yerel.
- Ayarlar sayfası ortalı ve sekme olarak açılır.
- Yer imi klasörleri; Chrome/Firefox HTML dosyasından içe ve dışa aktarma.
- OAuth / "ile giriş yap" pencereleri çalışır (`window.opener` ve oturum korunur, adres başlıkta görünür).

### Güncelleme
- Zorla yeniden başlatma yok; Ayarlar > Güncelleme ve araç çubuğu bildirimi.
- GitHub Releases: sürüm önce taslak olarak oluşturulur, tüm dosyalar (`latest.yml` dahil) yüklenince yayınlanır.
