# TekeliBrowser - Hızlı Başlangıç Rehberi ⚡

## 🎯 3 Adımda Başla

### 1️⃣ Bağımlılıkları Yükle

```bash
npm install
```

⏱️ **Süre**: ~3-5 dakika (internet hızına bağlı)

Bu komut şunları yükleyecek:
- Electron (Desktop framework)
- React & React DOM (UI)
- TypeScript (Type safety)
- Vite (Build tool)
- Tailwind CSS (Styling)
- Framer Motion (Animations)
- Ve diğer bağımlılıklar...

### 2️⃣ Geliştirme Modunda Çalıştır

```bash
npm run electron:dev
```

⏱️ **Süre**: ~10-15 saniye

Bu komut:
1. Vite dev server'ı başlatır (http://localhost:5173)
2. TypeScript kodları derler
3. Electron uygulamasını açar
4. Hot reload özelliğini aktif eder

### 3️⃣ Tarayıcıyı Kullan! 🎉

Uygulama açıldığında:
- ✅ Varsayılan olarak Google.com yüklenir
- ✅ Yeni sekme eklemek için üstteki **+** butonuna tıklayın
- ✅ URL çubuğuna adres yazın ve Enter'a basın
- ✅ Geri/İleri/Yenile butonlarını kullanın
- ✅ Split View için üstteki ikili pencere ikonuna tıklayın
- ✅ AI Sidebar için profil ikonuna tıklayın

---

## 🚨 Sorun mu Yaşıyorsunuz?

### Port 5173 Kullanımda

**Hata**: `Port 5173 is already in use`

**Çözüm**: Portu değiştirin:
```typescript
// vite.config.ts dosyasında
server: {
  port: 5174  // Farklı bir port numarası
}
```

### Node Modules Hatası

**Hata**: `Cannot find module ...`

**Çözüm**: Temiz kurulum yapın:
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

### Electron Açılmıyor

**Hata**: Electron penceresi açılmıyor

**Çözüm**:
1. DevTools'u kapatmak için `electron/main.ts` içinde:
   ```typescript
   // mainWindow.webContents.openDevTools(); // Bu satırı yorum satırı yapın
   ```
2. Uygulamayı yeniden başlatın

### TypeScript Hataları

**Hata**: TypeScript derleme hataları

**Çözüm**:
```bash
npx tsc --noEmit  # Hataları görmek için
```

### Git Commit Sorunu

**Hata**: Git lock file hatası (OneDrive kullanıyorsanız)

**Çözüm**: `.git` klasörünün OneDrive ile senkronize olmamasını sağlayın:
```bash
# OneDrive ayarlarından .git klasörünü hariç tutun
# veya projeyi OneDrive dışında bir yere taşıyın
```

---

## 📋 Sistem Gereksinimleri

### Minimum
- **Node.js**: v18.0.0+
- **npm**: v9.0.0+
- **RAM**: 4GB
- **Disk**: 500MB boş alan

### Önerilen
- **Node.js**: v20.0.0+
- **npm**: v10.0.0+
- **RAM**: 8GB
- **Disk**: 1GB boş alan
- **SSD**: Daha hızlı performans için

---

## 🎨 İlk Adımlar

### 1. Yeni Sekme Oluşturun

- **Yöntem 1**: Üstteki `+` butonuna tıklayın
- **Yöntem 2**: `Ctrl+T` (yakında gelecek)

### 2. Web Sitesine Gidin

URL çubuğuna yazın:
```
google.com          → https://google.com
youtube             → Google'da arama yapar
https://github.com  → GitHub'a gider
```

### 3. Split View Kullanın

1. En az 2 sekme açın
2. Adres çubuğunun sağındaki ikili pencere ikonuna tıklayın
3. İki sekme yan yana görüntülenir
4. Tekrar tıklayarak kapatın

### 4. AI Sidebar'ı Keşfedin

1. Adres çubuğunun sağındaki profil ikonuna tıklayın
2. Sidebar sağdan açılır
3. Yakında gelecek AI özelliklerini görün
4. X ile kapatın

---

## 🛠️ Geliştirme Komutları

### Development
```bash
npm run dev              # Sadece Vite server
npm run electron:dev     # Electron + Vite (önerilen)
```

### Production Build
```bash
npm run build            # TypeScript + Vite build
npm run electron:build   # Electron installer oluştur
```

### Preview
```bash
npm run preview          # Production build'i önizle
```

---

## 🎯 Sonraki Adımlar

### Öğrenin
- [ ] `ARCHITECTURE.md` - Mimariyi anlayın
- [ ] `FEATURES.md` - Gelecek özellikleri görün
- [ ] `CONTRIBUTING.md` - Katkıda bulunun

### Özelleştirin
- [ ] Temayı değiştirin (`tailwind.config.js`)
- [ ] Başlangıç URL'ini ayarlayın (`App.tsx`)
- [ ] Kısayol tuşları ekleyin (yakında)

### Geliştirin
- [ ] Yeni özellik ekleyin
- [ ] Hata düzeltin
- [ ] Dokümantasyon geliştirin

---

## 💡 İpuçları

### Performance
- **Çok fazla sekme**: RAM kullanımı artar (her sekme izole)
- **Dev Tools**: Sadece geliştirme modunda açık
- **Hot Reload**: Kod değişiklikleri otomatik yüklenir

### Kullanım
- **Omnibox**: URL veya arama terimi yazın
- **Sekmeler**: Üzerinde hover yapınca X butonu görünür
- **Split View**: 2+ sekme olmalı
- **Window Controls**: Üst sağdaki minimize/maximize/close

### Geliştirme
- **TypeScript**: Type safety için her zaman tip kullanın
- **Tailwind**: Utility-first CSS yaklaşımı
- **Framer Motion**: Smooth animasyonlar için
- **IPC**: Main-Renderer iletişimi için preload kullanın

---

## 📚 Dokümantasyon

| Dosya | Açıklama |
|-------|----------|
| `README.md` | Genel proje bilgisi |
| `INSTALLATION.md` | Detaylı kurulum rehberi |
| `ARCHITECTURE.md` | Teknik mimari dokümantasyonu |
| `FEATURES.md` | Özellik listesi ve yol haritası |
| `CONTRIBUTING.md` | Katkıda bulunma rehberi |
| `QUICKSTART.md` | Bu dosya - Hızlı başlangıç |

---

## 🆘 Yardım

### Hala sorun mu yaşıyorsunuz?

1. **GitHub Issues**: Hata bildirin
2. **Discussions**: Soru sorun
3. **Email**: tekeli-browser@example.com
4. **Twitter**: @TekeliBrowser

### Yararlı Kaynaklar

- [Electron Docs](https://www.electronjs.org/docs)
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Tailwind CSS Docs](https://tailwindcss.com)

---

## ✨ Başarılar!

TekeliBrowser'ı kullandığınız için teşekkürler! 

Herhangi bir sorunuz veya öneriniz varsa çekinmeden iletişime geçin.

**Happy Browsing! 🚀**
