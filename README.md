# TekeliBrowser 🚀

Ultra-modern masaüstü tarayıcısı - Chrome'un kullanım kolaylığını geleceğin tasarımıyla birleştiriyor.

## ✨ Özellikler

- **Glassmorphism & Neon Tasarım**: Fütüristik ve modern arayüz
- **Chrome Stili Sekmeler**: Üstte sürüklenebilir sekme çubuğu
- **Split View**: Ekranı dikey olarak ikiye bölme özelliği
- **AI Sidebar**: Gizlenebilir yapay zeka asistan paneli (yakında)
- **Çerçevesiz Pencere**: Tam özelleştirilmiş titlebar
- **Hızlı ve Performanslı**: Electron + React + Vite

## 🛠️ Teknoloji Yığını

- **Electron.js** - Desktop framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- Node.js 18 veya üzeri
- npm veya yarn

### Adımlar

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Geliştirme modunda çalıştırın:
```bash
npm run electron:dev
```

3. Production build:
```bash
npm run build
```

## 📁 Proje Yapısı

```
TekeliBrowser/
├── electron/           # Electron main process
│   ├── main.ts        # Ana electron dosyası
│   └── preload.ts     # IPC bridge
├── src/               # React renderer process
│   ├── components/    # UI bileşenleri
│   │   ├── Titlebar.tsx
│   │   ├── TabBar.tsx
│   │   ├── AddressBar.tsx
│   │   ├── WebViewContainer.tsx
│   │   └── AISidebar.tsx
│   ├── App.tsx        # Ana uygulama
│   ├── main.tsx       # React entry point
│   └── index.css      # Global styles
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 🎨 Tasarım Özellikleri

- **Koyu Tema**: Varsayılan olarak göz dostu karanlık tema
- **Neon Vurgular**: Mavi (#00f0ff) ve mor (#b026ff) neon efektler
- **Blur Efektleri**: Hafif arka plan bulanıklığı
- **Smooth Animations**: Framer Motion ile akıcı geçişler

## 🔧 Geliştirme

### Sekme Yönetimi
Sekmeler state management ile yönetilir ve her sekme kendi webview örneğini içerir.

### IPC İletişimi
Main ve renderer process arası güvenli IPC bridge ile iletişim sağlanır.

### Split View
İki sekmeyi aynı anda görüntüleme özelliği ile çoklu görev yapabilirsiniz.

## 📝 Lisans

MIT

## 👨‍💻 Geliştirici

Cursor AI 

