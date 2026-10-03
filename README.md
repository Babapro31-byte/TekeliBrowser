# TekeliBrowser

Özel, hızlı, korumalı masaüstü tarayıcı (Windows). Electron + React.

- **Gerçek sekmeler:** her sekme ayrı bir `WebContentsView`; sekme değiştirince sayfa, kaydırma ve form durumu korunur.
- **Gizlilik varsayılan:** reklam/izleyici engelleme (Ghostery motoru, EasyList/EasyPrivacy/uBlock), site başı aç/kapa, yalnızca-HTTPS (yedekli, yerel adres muaf), güvenli DNS, üçüncü taraf çerez engeli, GPC, parmak izi koruması (Kapalı/Standart/Sıkı), gizli pencere, sertifika uyarıları, site izinleri.
- **Şifre yöneticisi:** `safeStorage` (Windows DPAPI) ile şifreli; giriş formundan "kaydet?" çubuğu.
- **Otomatik güncelleme:** GitHub Releases; yeniden başlatmaya sen karar verirsin.
- **Tema:** Koyu / Açık / OLED + 5 vurgu rengi, TR/EN.

## Geliştirme

```bash
npm install
npm run dev        # Vite + Electron
npm run typecheck  # renderer + main process
npm test           # birim testler (vitest)
npm run build      # NSIS kurulum dosyası -> release/
```

Gereksinimler: Node 24+, Windows. Mimari için [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), tasarım token'ları için [design-system/TOKENS.md](design-system/TOKENS.md).

## Sürüm çıkarma

`package.json` sürümünü yükselt, `vX.Y.Z` etiketi at. `release.yml` kurulum dosyasını önce taslak sürüme yükler, tüm dosyalar (`latest.yml` dahil) hazır olunca yayınlar. Kurulum dosyası imzasızdır; Windows SmartScreen uyarı gösterebilir.

## Bilinen eksikler

- Şifreler için otomatik doldurma yok (kaydetme/yönetme var).
- Parmak izi "Sıkı" modu bazı siteleri bozabilir.
- Çerez/site verisi temizleme zaman aralığı desteklemez (her zaman).
