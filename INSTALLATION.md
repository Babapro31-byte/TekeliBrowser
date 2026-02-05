# TekeliBrowser - Kurulum Rehberi 🚀

## Hızlı Başlangıç

### 1. Bağımlılıkları Yükleyin

Proje dizininde aşağıdaki komutu çalıştırın:

```bash
npm install
```

Bu komut tüm gerekli paketleri yükleyecektir:
- Electron (v28.2.0)
- React & React DOM (v18.2.0)
- Vite (v5.0.11)
- TypeScript (v5.3.3)
- Tailwind CSS (v3.4.1)
- Framer Motion (v11.0.0)
- ve diğer bağımlılıklar...

### 2. Geliştirme Modunda Çalıştırın

```bash
npm run electron:dev
```

Bu komut:
- Vite dev server'ı başlatır (port 5173)
- Electron uygulamasını otomatik olarak açar
- Hot reload özelliğini etkinleştirir

### 3. Production Build Oluşturun

```bash
npm run build
```

Bu komut:
- React uygulamasını derler
- Electron kodlarını build eder
- Platform spesifik installer oluşturur (release/ klasöründe)

## Alternatif Komutlar

### Sadece Vite Dev Server Çalıştırma
```bash
npm run dev
```

### Production Preview
```bash
npm run preview
```

### Electron Builder ile Paketleme
```bash
npm run electron:build
```

## Sorun Giderme

### Port 5173 Kullanımda Hatası
Eğer port meşgul ise, `vite.config.ts` dosyasında port numarasını değiştirebilirsiniz:
```typescript
server: {
  port: 5174 // veya başka bir port
}
```

### Webview Yükleme Hatası
Electron'un webview özelliği varsayılan olarak etkindir. Eğer sorun yaşarsanız, `electron/main.ts` dosyasında `webviewTag: true` ayarının olduğundan emin olun.

### TypeScript Hataları
Eğer TypeScript hatası alıyorsanız:
```bash
npm run build
```
komutu ile derleyip hataları kontrol edin.

### Node Modules Hatası
Eğer bağımlılık hatası alıyorsanız:
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

## Sistem Gereksinimleri

- **Node.js**: v18.0.0 veya üzeri
- **npm**: v9.0.0 veya üzeri
- **İşletim Sistemi**: Windows 10/11, macOS 10.13+, Linux (Ubuntu 18.04+)
- **RAM**: Minimum 4GB
- **Disk Alanı**: ~500MB (node_modules dahil)

## İlk Çalıştırmada Ne Beklemeli?

1. **Frameless Window**: Özel titlebar ile çerçevesiz pencere açılacak
2. **Varsayılan Sekme**: Google.com ile bir sekme otomatik açılacak
3. **Modern Arayüz**: Koyu tema, neon vurgular ve glassmorphism efektler
4. **Çalışan Özellikler**:
   - ✅ Sekme ekleme/kapatma
   - ✅ URL navigasyonu
   - ✅ Geri/İleri/Yenile butonları
   - ✅ Split view toggle (2+ sekme varsa)
   - ✅ AI Sidebar toggle
   - ✅ Pencere kontrolleri (minimize, maximize, close)

## Geliştirme İpuçları

### Hot Reload
Kod değişiklikleriniz otomatik olarak uygulamaya yansır:
- **React bileşenleri**: Anında güncellenir
- **Electron main process**: Uygulama yeniden başlar
- **Tailwind CSS**: Anında güncellenir

### DevTools
Geliştirme modunda Chrome DevTools otomatik olarak açılır. Kapatmak için `electron/main.ts` dosyasında:
```typescript
// mainWindow.webContents.openDevTools(); // Bu satırı yorum satırı yapın
```

### Webview DevTools
Webview içeriğini debug etmek için webview'e sağ tıklayıp "Inspect Element" seçin.

## Platform Spesifik Bilgiler

### Windows
- Installer format: NSIS
- Uygulama ikonu: `.ico` formatında olmalı
- Yönetici izni gerekebilir

### macOS
- Installer format: DMG
- Uygulama ikonu: `.icns` formatında olmalı
- Code signing gerekebilir (App Store dağıtımı için)

### Linux
- Installer format: AppImage
- Uygulama ikonu: `.png` formatında olmalı
- Executable izinleri gerekebilir

## Sonraki Adımlar

1. ✅ Temel tarayıcı fonksiyonları çalışıyor
2. 🔜 Bookmark yönetimi eklenecek
3. 🔜 History tracking eklenecek
4. 🔜 AI Asistan entegrasyonu
5. 🔜 Extension desteği
6. 🔜 Gelişmiş güvenlik özellikleri

## Destek

Sorun yaşıyorsanız:
1. GitHub Issues'da sorun bildirin
2. README.md dosyasını kontrol edin
3. Electron ve React dokümantasyonlarına bakın

---

**İyi kodlamalar! 🎉**
