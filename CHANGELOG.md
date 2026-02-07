# Changelog

All notable changes to TekeliBrowser will be documented in this file.

## [2.0.2] - 2026-02-07

### Hotfix

- Fixes startup crash after auto-update when `sql-wasm.wasm` cannot be found/loaded
- Adds extra fallback search paths for the SQLite WASM binary and copies it into `dist-electron/`

## [2.0.1] - 2026-02-07

### Omnibox / Bookmarks / History

- Default search engine setting (DuckDuckGo / Google) + improved URL vs search detection
- Omnibox suggestions from history + bookmarks
- Bookmark toggle (⭐) and bookmarks bar backed by persistent DB

### Persistence

- Migrates old `history.json` into a persistent SQLite database (`tekeli.db`)

### Ad Blocking

- Adds remote hosts + EasyList-based dynamic blocking (cached under userData)

### Session Restore

- Fixes clean shutdown detection and prompts restore after an unclean exit

## [2.0.0] - 2025-02-07

### Privacy & Security Hardening

Major update focused on privacy, security, and user control.

#### Security

- **Sandbox**: Main window sandbox enabled (`sandbox: true`)
- **Navigation guards**: Block `javascript:`, `data:`, `file:` URLs; redirect popups to new tabs
- **IPC validation**: All IPC handlers verify sender origin (`isValidSender`)
- **CSP**: Content Security Policy for main window (app shell only)
- **Dev-only warnings**: `ELECTRON_DISABLE_SECURITY_WARNINGS` only when `!app.isPackaged`
- **Webview validation**: `will-attach-webview` enforces `nodeIntegration: false`, `contextIsolation: true`

#### Incognito / Private Browsing

- **Incognito tabs**: Ephemeral session partitions; cookies/cache isolated and cleared on tab close
- **UI**: Incognito tab indicator (purple icon), "Gizli Sekme Aç" button, Ctrl+Shift+N shortcut
- **Ad blocker & preload**: Incognito tabs use same ad blocking and webview setup as normal tabs

#### Tracker Blocking

- **EasyPrivacy-style domains**: Block Facebook pixel, Google Analytics, and 100+ tracker domains
- **URL param stripping**: Remove `fbclid`, `gclid`, `utm_*`, etc. from main-frame navigations
- **Toggle**: Enable/disable via Privacy Settings; persisted in `settings.json`

#### Site Permissions

- **Per-site decisions**: Camera, microphone, geolocation, notifications stored per site
- **Permission prompt**: Floating bar with Allow/Block and "Remember for this site"
- **Storage**: `userData/permissions.json`

#### Cookie Control

- **3rd-party cookies**: Policy options: all, block-third-party, block-all
- **Implementation**: `webRequest.onBeforeSendHeaders` strips Cookie header when needed
- **Storage**: `userData/settings.json`

#### Privacy Settings UI

- **Panel**: Slide-out from shield popup (address bar)
- **Toggles**: Tracker blocking, cookie policy (all / block 3rd-party / block all)
- **Site permissions**: List with clear/reset

#### Other

- **Session restore**: Excludes incognito tabs
- **History**: Not recorded for incognito tabs
- **Popup redirect**: `window.open` from pages opens URL in new tab instead of popup

### Changed

- Permission handler: Site-based decisions instead of blanket allow for media
- Cookie policy: User-configurable 3rd-party cookie behavior
