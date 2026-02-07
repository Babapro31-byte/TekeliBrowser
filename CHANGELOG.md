# Changelog

All notable changes to TekeliBrowser will be documented in this file.

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
