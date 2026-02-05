# TekeliBrowser - Mimari Dokümantasyon 🏗️

## Genel Bakış

TekeliBrowser, Electron framework'ü kullanarak masaüstü platformunda çalışan modern bir web tarayıcısıdır. İki ana süreçten oluşur:

1. **Main Process** (Electron) - Node.js ortamında çalışır
2. **Renderer Process** (React) - Chromium render engine'de çalışır

## Mimari Şema

```
┌─────────────────────────────────────────────────────┐
│                   TekeliBrowser                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────┐      ┌──────────────────┐   │
│  │  Main Process    │◄────►│ Renderer Process │   │
│  │  (Electron)      │ IPC  │    (React)       │   │
│  │                  │      │                  │   │
│  │  - Window Mgmt   │      │  - UI Components │   │
│  │  - Menu          │      │  - State Mgmt    │   │
│  │  - IPC Handler   │      │  - User Events   │   │
│  └──────────────────┘      └──────────────────┘   │
│           │                          │             │
│           │                          │             │
│           ▼                          ▼             │
│  ┌──────────────────┐      ┌──────────────────┐   │
│  │   Preload.ts     │      │   WebView Tags   │   │
│  │  (IPC Bridge)    │      │  (Web Content)   │   │
│  └──────────────────┘      └──────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Klasör Yapısı ve Sorumluluklar

### `/electron` - Main Process

#### `main.ts`
**Sorumluluklar:**
- Frameless browser window oluşturma
- IPC event handler'ları kaydetme
- Uygulama yaşam döngüsü yönetimi
- WebView güvenlik politikaları

**Önemli Fonksiyonlar:**
```typescript
createWindow()           // Ana pencereyi oluşturur
ipcMain.handle()        // IPC isteklerini işler
app.whenReady()         // Uygulama hazır olduğunda
```

#### `preload.ts`
**Sorumluluklar:**
- Güvenli IPC bridge sağlama
- Context isolation ile API expose etme
- TypeScript type definitions

**Exposed API:**
```typescript
window.electron.minimizeWindow()
window.electron.maximizeWindow()
window.electron.closeWindow()
window.electron.createTab()
window.electron.navigateTab()
window.electron.closeTab()
```

### `/src` - Renderer Process

#### `App.tsx` - Ana Uygulama
**State Management:**
```typescript
tabs: Tab[]              // Tüm sekmeler
activeTabId: string      // Aktif sekme ID'si
splitView: boolean       // Split view durumu
secondaryTabId: string   // İkinci panel sekme ID'si
sidebarOpen: boolean     // AI sidebar durumu
```

**Ana Fonksiyonlar:**
```typescript
addTab()                 // Yeni sekme ekle
closeTab()              // Sekme kapat
updateTabUrl()          // Sekme URL güncelle
updateTabTitle()        // Sekme başlık güncelle
toggleSplitView()       // Split view aç/kapat
navigateTab()           // Sekme navigasyonu
```

#### `/components` - UI Bileşenleri

##### `Titlebar.tsx`
- **Amaç**: Özel pencere başlığı
- **Özellikler**: 
  - Sürüklenebilir alan
  - Minimize/Maximize/Close butonları
  - TekeliBrowser logosu ve animasyonu

##### `TabBar.tsx`
- **Amaç**: Chrome-stili sekme yönetimi
- **Özellikler**:
  - Glassmorphism efektli sekmeler
  - Sekme ekleme/kapatma
  - Aktif sekme göstergesi
  - Animasyonlu geçişler

##### `AddressBar.tsx`
- **Amaç**: URL girişi ve navigasyon kontrolleri
- **Özellikler**:
  - Omnibox (URL/Arama birleşik giriş)
  - Geri/İleri/Yenile butonları
  - Split View toggle
  - AI Sidebar toggle
  - Neon focus efekti

##### `WebViewContainer.tsx`
- **Amaç**: Web içeriği gösterimi
- **Özellikler**:
  - Electron webview yönetimi
  - Sayfa yükleme durumu
  - Başlık güncelleme
  - Navigasyon event handling

##### `AISidebar.tsx`
- **Amaç**: AI asistan paneli
- **Özellikler**:
  - Animasyonlu açılma/kapanma
  - Gelecek özellikler listesi
  - Modern glassmorphism tasarım

## Veri Akışı

### 1. Sekme Oluşturma
```
User Click → AddTab() → Update State → Re-render TabBar → Create WebView
```

### 2. URL Navigasyonu
```
User Input → handleKeyPress → updateTabUrl() → WebView loadURL() → onTitleUpdate
```

### 3. Split View Activation
```
Toggle Button → toggleSplitView() → Set secondaryTabId → Animate Split Layout
```

### 4. Window Controls
```
User Click → window.electron.minimizeWindow() → IPC → Main Process → BrowserWindow API
```

## State Management Stratejı

### Local State (useState)
Tüm uygulama state'i `App.tsx` içinde yönetilir:
- **tabs**: Sekme listesi ve özellikleri
- **activeTabId**: Hangi sekmenin aktif olduğu
- **splitView**: Split view mod durumu
- **sidebarOpen**: Sidebar açık/kapalı

### Event-Based Communication
WebView navigasyon için custom events kullanılır:
```typescript
window.dispatchEvent(new CustomEvent('browser-navigation', { 
  detail: { direction, tabId } 
}))
```

## Güvenlik Özellikleri

### Context Isolation
```typescript
contextIsolation: true      // Renderer ve preload ayrı context'te
nodeIntegration: false      // Node.js API'leri renderer'da kapalı
```

### WebView Isolation
```typescript
partition: 'persist:main'   // Her webview izole session
webpreferences: 'contextIsolation=yes'
```

### IPC Güvenliği
- Sadece whitelist'teki metodlar expose edilir
- Type-safe API kullanımı
- Validation ve sanitization

## Performance Optimizasyonları

### 1. Lazy Loading
- Sekmeler sadece aktif olduğunda render edilir
- WebView'lar on-demand oluşturulur

### 2. Framer Motion
- Layout animations ile smooth transitions
- GPU acceleration
- AnimatePresence ile efficient mount/unmount

### 3. Tailwind CSS
- Purged CSS (sadece kullanılan classlar)
- JIT compiler
- Minimal bundle size

### 4. Vite Build
- Fast HMR (Hot Module Replacement)
- Optimized bundling
- Code splitting

## Gelecek Geliştirmeler

### Kısa Vade
- [ ] Bookmark yönetimi
- [ ] History tracking
- [ ] Download manager
- [ ] Settings panel

### Orta Vade
- [ ] AI Asistan entegrasyonu
- [ ] Extension desteği
- [ ] Dev tools entegrasyonu
- [ ] Theme customization

### Uzun Vade
- [ ] Sync across devices
- [ ] Password manager
- [ ] Ad blocker
- [ ] Privacy mode enhancements

## Debugging İpuçları

### Main Process Debug
```bash
# Chrome DevTools ile debug
electron --inspect=5858 .
```

### Renderer Process Debug
```typescript
// main.ts içinde
mainWindow.webContents.openDevTools()
```

### WebView Debug
```typescript
// WebView'e sağ tıkla → Inspect Element
```

### IPC Communication Debug
```typescript
// Preload.ts içinde
console.log('IPC Call:', method, args)
```

## Testler (Planlı)

### Unit Tests
- Jest + React Testing Library
- Component testing
- Utility function testing

### Integration Tests
- Electron testing
- IPC communication testing
- E2E workflows

### Performance Tests
- Memory leak detection
- Render performance
- Bundle size monitoring

## Deployment

### Build Process
```bash
npm run build           # Compile TypeScript
vite build             # Build React app
electron-builder       # Package for platform
```

### Platform Targets
- **Windows**: NSIS installer (.exe)
- **macOS**: DMG image (.dmg)
- **Linux**: AppImage (.AppImage)

### Auto Update (Gelecek)
- Electron-updater integration
- GitHub Releases
- Delta updates

---

**Son Güncelleme**: Şubat 2026
**Versiyon**: 1.0.0
