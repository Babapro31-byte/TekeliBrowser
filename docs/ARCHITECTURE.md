# Mimari

```
BrowserWindow (frameless, titleBarOverlay)
 ├─ window.webContents = CHROME UI  (tekeli://chrome)   sekme şeridi + araç çubuğu + çubuklar
 ├─ WebContentsView × N = SEKMELER  (persist:web | private-<id>)
 └─ WebContentsView     = OVERLAY   (tekeli://overlay)  sekmelerin üstünde açılan popup'lar
```

Ana süreç tek doğruluk kaynağıdır. Renderer'lar `window.tekeli` köprüsünden (allowlist'li IPC) konuşur.

## Klasörler

| Yol | İş |
|---|---|
| `electron/main.ts` | Açılış, tek örnek kilidi, kapanış temizliği |
| `electron/app/window.ts` | Pencere, eylemler (`runAction`), overlay, oturum kaydı |
| `electron/app/tabs.ts` | `TabManager`: sekme yaşam döngüsü, gezinti korumaları, bağlam menüsü |
| `electron/app/protocol.ts` | `tekeli://` (oturum başına handler, CSP) |
| `electron/app/ipc.ts` | Chrome/iç sayfa IPC yüzeyi |
| `electron/app/settingsStore.ts` | Ayar deposu (şema `shared/settings.ts`) |
| `electron/app/downloads.ts`, `updater.ts`, `sessions.ts`, `shortcuts.ts` | İndirmeler, güncelleme, oturum sertleştirme, kısayol tablosu |
| `electron/privacy/` | `pipeline` (tek webRequest hattı), `adblock`, `rules` (saf kurallar), `permissions`, `certs`, `clearData`, `passwordPrompt` |
| `electron/core/` | `ipc` (`handle`/`listen`, sender doğrulama), `logger` |
| `electron/db.ts`, `electron/data/store.ts` | `node:sqlite`; geçmiş, yer imi, omnibox |
| `electron/preload/` | `app.cjs` (tekeli:// köprüsü), `privacy.cjs` (web çerçeveleri: GPC, parmak izi, form yakalama) |
| `shared/` | Ayar şeması, URL kuralları, i18n (hem main hem renderer) |
| `src/chrome`, `src/pages`, `src/overlay` | React arayüzü (Vite çoklu giriş) |
| `design-system/TOKENS.md` | Figma'dan token'lar |

## Güvenlik sınırları

- Tüm penceler `sandbox`, `contextIsolation`, `nodeIntegration:false`; `webviewTag` kapalı.
- `window.tekeli` yalnızca `tekeli:` origin'inde var; web sayfaları köprü görmez. Web içeriği `tekeli://` adresine gidemez (`will-navigate`/`will-frame-navigate` korumaları).
- IPC `isTrustedSender`: yalnızca üst çerçeve ve uygulama origin'i; çift kanal kaydı hata verir.
- Sertifika hatası otomatik kabul edilmez; izinler tam origin'e göre; şifreler `safeStorage` ile.

## İstek hattı sırası (`electron/privacy/pipeline.ts`)

1. Ana çerçeve: HTTPS yükseltme → izleme parametresi temizleme.
2. Alt kaynaklar: reklam/izleyici motoru (site istisnası hariç).
3. Giden başlıklar: `Sec-GPC`, üçüncü taraf `Cookie` ayıklama.
4. Gelen başlıklar: `Set-Cookie` ilkesi (büyük/küçük harf duyarsız).
