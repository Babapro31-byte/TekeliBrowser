# TekeliBrowser — AI Agent Quick Reference

> **Purpose**: This file is a single-source-of-truth reference for AI agents. Reading only this file should be sufficient to understand the entire project and work on any part of it without reading other files first.

---

## 1. Project Overview

| Field | Value |
|---|---|
| **Name** | TekeliBrowser (also called "Orbit Browser" in UI) |
| **Version** | 3.0.1 (package.json) |
| **Type** | Electron + React + TypeScript desktop web browser |
| **License** | MIT |
| **App ID** | `com.tekeli.browser` |

### Key Features
- Full-featured desktop browser built on Electron's `<webview>` tag
- Glassmorphism + Neon dark-mode UI (Tailwind CSS + Framer Motion)
- Multi-tab management with incognito support
- Split-view (two tabs side-by-side)
- Omnibox (URL + search combined, with history/bookmark suggestions)
- Ad/tracker blocking via `@ghostery/adblocker-electron`
- YouTube ad blocking via injected scripts
- Bookmarks & browsing history (SQLite via `sql.js`)
- Session save/restore (persists tabs across restarts, including YouTube resume time)
- Download manager
- Permission prompts (camera, microphone, notifications, etc.)
- Privacy settings (cookie policy, HTTPS-only, DoH, fingerprint defender)
- Auto-updater via `electron-updater` + GitHub Releases
- Keyboard shortcuts (Ctrl+T, Ctrl+W, Ctrl+L, Ctrl+Tab, etc.)
- Customizable themes (neon, light, dark, ocean, forest, sunset, etc.)
- Sidebar with bookmarks, history, downloads navigation
- Bookmarks bar
- Recently-closed tab restore (Ctrl+Shift+T)
- **Settings Panel with collapsible sections** (theme, layout, privacy, background)

---

## 2. Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Desktop runtime | Electron | ^28.2.0 | Window, IPC, native APIs |
| UI framework | React | ^18.2.0 | Renderer process UI |
| Language | TypeScript | ^5.3.3 | Type safety everywhere |
| Build tool | Vite | ^5.0.11 | Dev server + bundler |
| Vite plugin | vite-plugin-electron | ^0.28.2 | Electron integration with Vite |
| Styling | Tailwind CSS | ^3.4.1 | Utility-first CSS |
| Animations | Framer Motion | ^11.0.0 | Layout animations, transitions |
| Icons | lucide-react | ^0.575.0 | SVG icon set |
| Database | sql.js | ^1.13.0 | SQLite in-process (WASM) |
| Ad blocking | @ghostery/adblocker-electron | ^2.14.1 | Network-level ad/tracker blocking |
| Auto-update | electron-updater | ^6.7.3 | GitHub Releases auto-update |
| Packaging | electron-builder | ^24.9.1 | NSIS/DMG/AppImage installers |
| HTTP (main) | cross-fetch | ^4.1.0 | Fetch polyfill for main process |

### Build Outputs
- `dist/` — Vite-built React app (renderer)
- `dist-electron/` — Compiled Electron main/preload files
- `release/` — electron-builder packaged installers

---

## 3. Project Structure (File Map)

```
TekeliBrowser/
├── electron/                    ← Main process (Node.js / Electron)
│   ├── main.ts                  ← Entry point: window creation, IPC handlers, session setup
│   ├── preload.cjs              ← Context bridge: exposes window.electron API to renderer
│   ├── webviewPreload.cjs       ← Injected into every <webview>: YouTube ad blocking, media tracking
│   ├── db.ts                    ← SQLite database init/flush (sql.js)
│   ├── historyManager.ts        ← Browsing history CRUD
│   ├── bookmarksManager.ts      ← Bookmarks CRUD
│   ├── omniboxManager.ts        ← Omnibox suggestions (history + bookmarks combined)
│   ├── sessionManager.ts        ← Tab session save/restore (JSON file)
│   ├── incognitoManager.ts      ← Incognito partition creation/cleanup
│   ├── permissionManager.ts     ← Per-site permission storage (allow/block)
│   ├── settingsManager.ts       ← Persistent settings (cookie policy, search engine, DoH, etc.)
│   ├── adBlocker.ts             ← EasyList-based ad blocker (filter lists)
│   ├── youtubeAdBlocker.ts      ← YouTube-specific ad blocking script generator
│   ├── filterManager.ts         ← Filter list management (download, parse, apply)
│   ├── autoUpdater.ts           ← electron-updater wrapper
│   ├── passwordManager.ts       ← Password manager (not yet wired to UI)
│   ├── perfManager.ts           ← Performance monitoring utilities
│   ├── advancedFeatures.ts      ← Stub for future advanced features
│   └── ipcValidation.ts         ← isValidSender() — validates IPC event origin
│
├── src/                         ← Renderer process (React + TypeScript)
│   ├── main.tsx                 ← React entry point (ReactDOM.createRoot)
│   ├── App.tsx                  ← Root component: all state, tab logic, layout
│   ├── index.css                ← Global CSS (Tailwind base + custom animations)
│   ├── vite-env.d.ts            ← Vite type declarations
│   │
│   ├── components/
│   │   ├── Titlebar.tsx         ← Frameless window title bar (drag region, min/max/close)
│   │   ├── TabBar.tsx           ← Tab strip (horizontal or vertical layout)
│   │   ├── AddressBar.tsx       ← Omnibox + nav buttons + shield/privacy popup
│   │   ├── WebViewContainer.tsx ← <webview> wrapper + skeleton loading + internal pages router
│   │   ├── NewTabPage.tsx       ← Custom new tab page (tekeli://newtab)
│   │   ├── DownloadsPage.tsx    ← Downloads manager UI (tekeli://downloads)
│   │   ├── SettingsPanel.tsx    ← Full settings UI (theme, privacy, tab layout, etc.)
│   │   ├── HistoryPanel.tsx     ← Browsing history panel (search, delete, clear)
│   │   ├── BookmarksPanel.tsx   ← Bookmarks panel (add, remove, search)
│   │   ├── BookmarksBar.tsx     ← Persistent bookmarks bar below address bar
│   │   ├── Sidebar.tsx          ← Left sidebar (bookmarks, history, downloads, spaces)
│   │   ├── PermissionPrompt.tsx ← Permission request dialog (camera, mic, etc.)
│   │   ├── PrivacySettings.tsx  ← Privacy settings panel (cookie policy, permissions)
│   │   ├── UpdateNotification.tsx ← Auto-update banner/dialog
│   │   ├── RecentlyClosedMenu.tsx ← Recently closed tabs dropdown
│   │   └── SessionRestorePrompt.tsx ← Prompt to restore previous session
│   │
│   ├── utils/
│   │   ├── omnibox.ts           ← resolveOmniboxInput(): URL vs search query detection
│   │   └── themes.ts            ← Theme definitions (colors, CSS classes per theme)
│   │
│   └── types/
│       └── electron.d.ts        ← TypeScript types for window.electron API + data models
│
├── public/
│   ├── favicon.svg              ← Browser favicon
│   ├── logo.svg                 ← TekeliBrowser logo (used in Titlebar)
│   └── orbit-demo.html          ← Static demo page
│
├── scripts/
│   ├── perf.js                  ← Lighthouse performance audit script
│   └── privacy.js               ← Privacy audit script
│
├── index.html                   ← Vite HTML entry point
├── package.json                 ← Dependencies, scripts, electron-builder config
├── vite.config.ts               ← Vite + vite-plugin-electron configuration
├── tsconfig.json                ← TypeScript config (renderer)
├── tsconfig.node.json           ← TypeScript config (main process / Node)
├── tailwind.config.js           ← Tailwind theme extensions (custom colors, animations, z-index values)
├── postcss.config.js            ← PostCSS (autoprefixer)
└── .eslintrc.json               ← ESLint rules
```

---

## 4. Architecture & Data Flow

### Process Model

```
┌─────────────────────────────────────────────────────────────┐
│                      TekeliBrowser                           │
│                                                              │
│  ┌──────────────────────┐   IPC    ┌────────────────────┐  │
│  │   Main Process        │◄────────►│  Renderer Process  │  │
│  │   electron/main.ts    │          │  src/App.tsx        │  │
│  │                       │          │  (React + Vite)     │  │
│  │  - BrowserWindow      │          │                    │  │
│  │  - ipcMain handlers   │          │  - Tab state       │  │
│  │  - Session/DB/AdBlock │          │  - UI components   │  │
│  └──────────────────────┘          └────────────────────┘  │
│           │                                  │               │
│           ▼                                  ▼               │
│  ┌──────────────────────┐          ┌────────────────────┐  │
│  │  electron/preload.cjs │          │  <webview> tags    │  │
│  │  (Context Bridge)     │          │  partition:        │  │
│  │  window.electron = {} │          │  persist:webview   │  │
│  └──────────────────────┘          └────────────────────┘  │
│                                              │               │
│                                              ▼               │
│                                   ┌────────────────────┐   │
│                                   │ webviewPreload.cjs  │   │
│                                   │ (injected per tab)  │   │
│                                   └────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### How the Preload Bridge Works
- [`electron/preload.cjs`](electron/preload.cjs) uses `contextBridge.exposeInMainWorld('electron', {...})` to expose a safe API as `window.electron` in the renderer.
- All calls go through `ipcRenderer.invoke()` (async, returns Promise) or `ipcRenderer.send()` (fire-and-forget).
- The main process handles these in [`electron/main.ts`](electron/main.ts) via `ipcMain.handle()` / `ipcMain.on()`.
- [`electron/ipcValidation.ts`](electron/ipcValidation.ts) provides `isValidSender()` to verify IPC events come from the main window.

### Tab Data Flow

```
User clicks "+" → addTabFn() in App.tsx
  → setTabs([...prev, newTab])
  → React re-renders TabBar + WebViewContainer
  → WebViewContainer creates <webview src={tab.url}>
  → webview fires dom-ready → isReadyRef = true
  → webview fires page-title-updated → onTitleUpdate() → updateTabTitle()
  → webview fires did-navigate → onNavigate() → updateTabUrl()
  → did-finish-load → window.electron.addHistory(url, title)
```

### Navigation Flow

```
User types in AddressBar → resolveOmniboxInput(input)
  → if URL: returns as-is
  → if search query: returns "https://duckduckgo.com/?q=..." (or Google)
  → onNavigate(url) → updateTabUrl(activeTabId, url) in App.tsx
  → setTabs: tab.url = newUrl
  → WebViewContainer re-renders with new src
  → URL change effect: setIsLoading(true), setLoadProgress(10)  ← FIX applied
  → webview navigates → did-stop-loading → setIsLoading(false)  ← FIX applied
```

### Back/Forward/Reload Flow

```
User clicks Back button → navigateTab('back') in App.tsx
  → window.dispatchEvent(new CustomEvent('browser-navigation', { detail: { direction: 'back', tabId } }))
  → WebViewContainer listens for 'browser-navigation' event
  → wv.goBack() / wv.goForward() / wv.reload()
```

### Session Save/Restore

```
App mount → window.electron.restoreSession()
  → sessionManager reads JSON file from userData
  → applyRestoredSession(session) → setTabs(), setActiveTabId()

Every 30s + beforeunload → window.electron.saveSession(tabs, activeTabId)
  → sessionManager writes JSON to userData/session.json
  → YouTube resume times are embedded in URLs (?t=Ns)
```

### Internal URL Routing

Special `tekeli://` URLs are handled entirely in React (no webview):

| URL | Component |
|---|---|
| `tekeli://newtab` | [`NewTabPage`](src/components/NewTabPage.tsx) |
| `tekeli://downloads` | [`DownloadsPage`](src/components/DownloadsPage.tsx) |
| `tekeli://ayarlar` | [`SettingsPanel`](src/components/SettingsPanel.tsx) |

---

## 5. Key IPC Channels

All channels are defined in [`electron/preload.cjs`](electron/preload.cjs) (renderer side) and handled in [`electron/main.ts`](electron/main.ts) (main side).

### Window Controls (`ipcRenderer.send` — fire-and-forget)
| Channel | Action |
|---|---|
| `window-minimize` | Minimize window |
| `window-maximize` | Toggle maximize/restore |
| `window-close` | Close window |

### Tab Management (`ipcRenderer.invoke` — async)
| Channel | Args | Returns |
|---|---|---|
| `tab-create` | `url` | `{ success, url }` |
| `tab-navigate` | `tabId, url` | `{ success, tabId, url }` |
| `tab-close` | `tabId` | `{ success, tabId }` |

### Session Management
| Channel | Args | Returns |
|---|---|---|
| `save-session` | `tabs[], activeTabId` | `{ success }` |
| `restore-session` | — | `SessionData \| null` |
| `tab-closed` | `{ title, url }` | `{ success }` |
| `get-recently-closed` | — | `ClosedTab[]` |
| `create-incognito-partition` | — | `{ partition }` |
| `clear-incognito-session` | `partition` | `{ success }` |

### History
| Channel | Args | Returns |
|---|---|---|
| `add-history` | `url, title` | `{ success }` |
| `get-history` | `HistoryQuery?` | `HistoryEntry[]` |
| `clear-history` | `startDate?, endDate?` | `{ success }` |
| `delete-history-entry` | `url` | `{ success }` |

### Bookmarks
| Channel | Args | Returns |
|---|---|---|
| `add-bookmark` | `url, title` | `{ success }` |
| `remove-bookmark` | `url` | `{ success }` |
| `is-bookmarked` | `url` | `{ bookmarked }` |
| `get-bookmarks` | `BookmarksQuery?` | `BookmarkEntry[]` |

### Omnibox
| Channel | Args | Returns |
|---|---|---|
| `get-omnibox-suggestions` | `search, limit?` | `OmniboxSuggestion[]` |

### Privacy / Ad Blocking
| Channel | Args | Returns |
|---|---|---|
| `get-adblock-stats` | — | `AdBlockStats` |
| `get-tracker-blocked-count` | — | `{ count }` |
| `set-tracker-blocking` | `enabled` | `{ success }` |
| `get-tracker-blocking` | — | `{ enabled }` |
| `set-cookie-policy` | `'all' \| 'block-third-party' \| 'block-all'` | `{ success }` |
| `get-cookie-policy` | — | `{ policy }` |
| `set-search-engine` | `'duckduckgo' \| 'google'` | `{ success }` |
| `get-search-engine` | — | `{ engine }` |

### Permissions
| Channel | Args | Returns |
|---|---|---|
| `permission-response` | `{ requestId, allow, remember, site, permission }` | `{ success }` |
| `get-all-permissions` | — | `Record<site, Record<permission, 'allow'\|'block'>>` |
| `clear-site-permission` | `site?, permission?` | `{ success }` |

### Downloads
| Channel | Args | Returns |
|---|---|---|
| `download-start` | `url` | `{ success, id?, error? }` |
| `download-list` | — | `DownloadRecord[]` |

### Auto-Updater
| Channel | Args | Returns |
|---|---|---|
| `check-for-updates` | — | `{ success, updateInfo?, error? }` |
| `download-update` | — | `{ success, error? }` |
| `install-update` | — | `{ success, error? }` |
| `get-update-state` | — | `UpdateState` |
| `cancel-update-download` | — | `{ success, error? }` |

### Push Events (main → renderer via `ipcRenderer.on`)
| Event | Payload | Purpose |
|---|---|---|
| `tracker-blocked` | `{ count }` | Real-time tracker block count |
| `permission-request` | `{ requestId, permission, site, requestingUrl }` | Show permission dialog |
| `open-url-in-new-tab` | `url` | Popup redirect → new tab |
| `keyboard-shortcut` | `{ action }` | Keyboard shortcut from webview |
| `download-updated` | `DownloadRecord` | Download progress update |
| `update-checking` | — | Updater started checking |
| `update-available` | `UpdateInfo` | Update found |
| `update-not-available` | `{ version }` | No update |
| `update-download-progress` | `UpdateProgress` | Download progress |
| `update-downloaded` | `UpdateInfo` | Ready to install |
| `update-error` | `{ message }` | Updater error |

---

## 6. Component Hierarchy

```
App.tsx  (root state: tabs, activeTabId, splitView, themes, panels)
│
├── UpdateNotification          ← auto-update banner (fixed overlay)
├── Titlebar                    ← frameless window drag + min/max/close
│
└── [flex row: sidebar + main]
    ├── Sidebar                 ← left panel (bookmarks, history, downloads, spaces)
    │
└── [flex col: tabs + content]
        ├── TabBar              ← horizontal OR vertical tab strip
        ├── PermissionPrompt    ← permission dialog overlay
        ├── AddressBar          ← omnibox + nav buttons (fixed positioned, viewport-centered, below tab bar)
        ├── BookmarksBar        ← bookmarks bar row
        │
        └── [split view container]
            ├── WebViewContainer (primary tab)
            │   ├── NewTabPage          ← if url === 'tekeli://newtab'
            │   ├── DownloadsPage       ← if url === 'tekeli://downloads'
            │   ├── SettingsPanel       ← if url === 'tekeli://ayarlar'
            │   └── <webview>           ← all other URLs
            │
            └── WebViewContainer (secondary tab, split view only)
                └── <webview>
```

### Panels (rendered as overlays/modals in App.tsx)
- [`HistoryPanel`](src/components/HistoryPanel.tsx) — controlled by `historyOpen` state
- [`BookmarksPanel`](src/components/BookmarksPanel.tsx) — controlled by `bookmarksOpen` state
- [`PrivacySettings`](src/components/PrivacySettings.tsx) — controlled by `privacySettingsOpen` state
- [`SessionRestorePrompt`](src/components/SessionRestorePrompt.tsx) — shown on startup if unclean shutdown

---

## 7. State Management

All state lives in [`src/App.tsx`](src/App.tsx) as React `useState`. No external state library.

### Core State
```typescript
tabs: Tab[]                    // All open tabs
activeTabId: string            // Currently visible tab
splitView: boolean             // Split-view mode active
secondaryTabId: string | null  // Tab shown in right panel (split view)
```

### Tab Interface
```typescript
interface Tab {
  id: string;
  title: string;
  url: string;
  isLoading: boolean;
  isIncognito?: boolean;
  partition?: string;  // e.g. 'incognito-1234567890'
}
```

### UI State
```typescript
historyOpen: boolean
bookmarksOpen: boolean
privacySettingsOpen: boolean
sidebarOpen: boolean
sessionRestored: boolean
themeColor: ThemeColor          // 'indigo' | 'blue' | 'purple' | ...
activeThemeId: ThemeId          // 'neon' | 'light' | 'dark' | 'ocean' | ...
privacyLevel: PrivacyLevel      // 'strict' | 'balanced' | 'off'
tabLayout: 'horizontal' | 'vertical'
activeSpace: 'personal' | 'work'
```

### Refs (for stable callbacks)
```typescript
tabsRef: MutableRefObject<Tab[]>          // Avoids stale closure in intervals
activeTabIdRef: MutableRefObject<string>  // Avoids stale closure in event handlers
mediaStateRef: MutableRefObject<Record<string, { url, seconds }>>  // YouTube resume
addressBarInputRef: RefObject<HTMLInputElement>  // Focus address bar programmatically
```

---

## 8. Recent Changes & Known Issues

### Search Suggestions Fix (Applied — [`src/components/AddressBar.tsx`](src/components/AddressBar.tsx))

**Issue**: Search suggestions would freeze or not appear when typing in the address bar.

**Root Cause**: 
1. The blur timeout (120ms) was too short, closing suggestions before click events could register
2. No tracking of mouse hover state over suggestions dropdown
3. Race conditions in suggestion fetching could cause stale state updates

**Fix**:
1. Increased onBlur timeout from 120ms to 250ms
2. Added `isMouseOverSuggestions` state to track when cursor is over suggestions
3. Added onMouseEnter/onMouseLeave handlers to suggestions dropdown
4. Added `mounted` flag in useEffect to prevent stale state updates after unmount
5. Added additional checks after async operations to prevent race conditions

### Settings Panel Collapsible Sections (Applied — [`src/components/SettingsPanel.tsx`](src/components/SettingsPanel.tsx))

**Change**: All four sections in Settings Panel now have expand/collapse toggle functionality:
- **Tema Seçimi** (Theme Selection)
- **Sekme Düzeni** (Tab Layout)
- **Gizlilik** (Privacy)
- **Arka Plan** (Background)

Each section has a clickable header with a rotating chevron icon and smooth expand/collapse animations using Framer Motion.

### Privacy Dashboard Removal (Applied — [`src/components/Sidebar.tsx`](src/components/Sidebar.tsx))

**Change**: Removed the Privacy Dashboard section from the Sidebar. The Privacy settings are still accessible through Settings Panel.

### Search/Loading Freeze Fix (Applied — [`src/components/WebViewContainer.tsx`](src/components/WebViewContainer.tsx))

**Root Cause 1**: The loading state was only reset by `did-finish-load`, which fires only for the main frame's initial load and can be missed during redirect chains.

**Fix**: Added `did-stop-loading` event handler (`onDidStopLoading`) which fires when ALL loading (including redirects and subframes) has stopped. This reliably ends the loading skeleton.

**Root Cause 2**: When the URL changed, the `isReadyRef` was reset to `false` in the effect cleanup, but the `did-start-loading` event could fire before React re-attached the listener, leaving the skeleton stuck.

**Fix**: Added a separate `useEffect` that watches `tab.url` and immediately sets `isLoading(true)` + `loadProgress(10)` whenever the URL changes (before the webview events fire).

**Root Cause 2 (related)**: Back/forward/reload were gated on `isReadyRef.current`, which could be `false` after a URL change reset.

**Fix**: Removed the `isReadyRef` guard from the navigation handler — the webview may be ready even if the ref was reset.

### UI Symmetry Fix (Applied — [`src/App.tsx`](src/App.tsx), [`tailwind.config.js`](tailwind.config.js), modal components)

**Issue**: AddressBar was positioned absolutely within the content area while modals were positioned fixed on the viewport, causing visual misalignment.

**Fix**:
1. **AddressBar Positioning**: Changed from `absolute top-4 left-1/2 -translate-x-1/2 z-50` to `fixed top-[72px] left-1/2 -translate-x-1/2 z-70` for viewport-centered alignment
2. **Z-index Hierarchy**: Established clear layering system:
   - `z-70`: AddressBar (fixed viewport)
   - `z-60`: High-priority modals (PrivacySettings, UpdateNotification)
   - `z-50`: Medium-priority modals (BookmarksPanel, Auth modal)
   - `z-40`: Low-priority modals (HistoryPanel, BookmarksBar)
   - `z-30`: TabBar
   - `z-20`: Sidebar
   - `z-10`: Content area
3. **Updated Components**:
   - `Sidebar.tsx`: Auth modal backdrop z-40 → z-50, modal z-50 → z-60
   - `BookmarksPanel.tsx`: Panel z-50 → z-60
   - `PrivacySettings.tsx`: Backdrop z-40 → z-50, panel z-50 → z-60
   - `UpdateNotification.tsx`: Notification z-50 → z-60
4. **Result**: AddressBar now centers on viewport, positioned consistently below tab bar, layered above all modals

### Known Issues / Notes
- `electron/passwordManager.ts` exists but is not yet wired to the UI.
- `electron/advancedFeatures.ts` is a stub (`initializeAdvancedFeatures` does nothing yet).
- DoH (DNS-over-HTTPS) is logged but not actually applied — Electron 28 does not expose the DoH API.
- Fingerprint defender script is prepared but injected via `webviewPreload.cjs` rather than a session preload (Electron 28 limitation).
- `electron/perfManager.ts` and `scripts/perf.js` provide Lighthouse-based performance auditing but are not part of the main app flow.
- **UI Symmetry Enhancement**: Smooth resize transitions for AddressBar responsive behavior still pending implementation

---

## 9. Development Commands

```bash
# Install dependencies
npm install

# Run in development mode (Vite dev server + Electron)
npm run electron:dev
# Equivalent to: npm run dev (just runs vite, which triggers vite-plugin-electron)

# Build for production (TypeScript compile + Vite build + electron-builder)
npm run build

# Build installer only (skip tsc)
npm run electron:build

# Preview production build
npm run preview

# Run Lighthouse performance audit
npm run perf

# Run privacy audit
npm run privacy
```

### Dev Server Details
- Vite dev server runs on port **5173** (default)
- `vite-plugin-electron` compiles `electron/main.ts` and `electron/preload.cjs` automatically
- Electron reads `VITE_DEV_SERVER_URL` env var to load from dev server vs built files
- Hot reload works for renderer; main process changes require restart

### Build Targets
| Platform | Format | Output |
|---|---|---|
| Windows | NSIS installer | `release/*.exe` |
| macOS | DMG | `release/*.dmg` |
| Linux | AppImage | `release/*.AppImage` |

---

## 10. Important Patterns & Conventions

### Adding a New IPC Handler

**Step 1** — Add to [`electron/preload.cjs`](electron/preload.cjs):
```javascript
myNewFeature: (arg1, arg2) => ipcRenderer.invoke('my-new-feature', arg1, arg2),
```

**Step 2** — Add to [`src/types/electron.d.ts`](src/types/electron.d.ts) in `IElectronAPI`:
```typescript
myNewFeature: (arg1: string, arg2: number) => Promise<{ success: boolean }>;
```

**Step 3** — Add handler in [`electron/main.ts`](electron/main.ts) inside `setupIpcHandlers()`:
```typescript
ipcMain.handle('my-new-feature', async (event, arg1: string, arg2: number) => {
  if (!isValidSender(event)) throw new Error('Invalid sender');
  // ... implementation
  return { success: true };
});
```

**Step 4** — Use in renderer:
```typescript
const result = await window.electron.myNewFeature('hello', 42);
```

### Adding a New Component

1. Create `src/components/MyComponent.tsx`
2. Accept `activeTheme?: ThemeDef` prop for theme-aware styling
3. Use Tailwind utility classes; reference `activeTheme.border`, `activeTheme.accent`, etc.
4. Use `framer-motion` for animations (`motion.div`, `AnimatePresence`)
5. Import and render in [`src/App.tsx`](src/App.tsx)

### Adding a New Internal Page (tekeli:// URL)

1. Create component in `src/components/`
2. Add URL constant in [`src/App.tsx`](src/App.tsx): `const MY_URL = 'tekeli://mypage'`
3. Add routing in [`src/components/WebViewContainer.tsx`](src/components/WebViewContainer.tsx):
   ```typescript
   const isMyPage = tab.url === MY_URL;
   // In render:
   if (isMyPage) return <MyPage />;
   ```
4. Add to the `useEffect` dependency array and loading state exclusion

### Theme System

Themes are defined in [`src/utils/themes.ts`](src/utils/themes.ts). Each theme is a `ThemeDef` object:
```typescript
interface ThemeDef {
  window: string;    // Background class for main window
  sidebar: string;   // Sidebar background
  tab: string;       // Tab background
  activeTab: string; // Active tab background
  border: string;    // Border color class
  accent: string;    // Accent color class
  text: string;      // Primary text class
  // ... more fields
}
```

`themeColor` (e.g. `'indigo'`) controls the accent color palette.  
`activeThemeId` (e.g. `'neon'`, `'light'`) controls the overall visual style.

### Coding Conventions
- **TypeScript strict mode** — always type function parameters and return values
- **No external state library** — all state in `App.tsx` via `useState`/`useRef`
- **IPC validation** — always call `isValidSender(event)` in every `ipcMain.handle`
- **Incognito isolation** — incognito tabs use a unique `partition` string; never save to history/session
- **Internal URLs** — use `tekeli://` scheme for browser-internal pages; check with `url.startsWith('tekeli://')`
- **Webview events** — always clean up event listeners in `useEffect` return function
- **Memoization** — `WebViewContainer` is wrapped in `React.memo` with a custom comparator to prevent re-renders on unrelated state changes
- **Logging** — use `console.log('[TekeliBrowser] ...')` in main process; logs are also written to `userData/tekeli.log`

---

## 11. Security Model

| Setting | Value | Reason |
|---|---|---|
| `contextIsolation` | `true` | Renderer cannot access Node.js APIs directly |
| `nodeIntegration` | `false` | No Node.js in renderer |
| `webviewTag` | `true` | Required for browser tabs |
| `webSecurity` | `true` | Enforce same-origin policy |
| `allowRunningInsecureContent` | `false` | Block mixed content |
| Webview partition | `persist:webview` | Isolated session from main window |
| Webview preload | `webviewPreload.cjs` | Injected scripts only, no Node access |
| Navigation guard | `will-navigate` blocks `javascript:`, `data:`, `file:` | Prevent injection |
| Popup handling | `setWindowOpenHandler` returns `{ action: 'deny' }` | Popups open as new tabs instead |
| IPC validation | `isValidSender()` on every handler | Prevents spoofed IPC from webviews |

---

## 12. File Relationships Quick Reference

| If you want to... | Look at... |
|---|---|
| Change window creation / startup | [`electron/main.ts`](electron/main.ts) → `createWindow()` |
| Add/modify IPC handler | [`electron/main.ts`](electron/main.ts) → `setupIpcHandlers()` + [`electron/preload.cjs`](electron/preload.cjs) + [`src/types/electron.d.ts`](src/types/electron.d.ts) |
| Change tab behavior | [`src/App.tsx`](src/App.tsx) → `addTabFn`, `closeTabFn`, `updateTabUrl` |
| Change webview loading/events | [`src/components/WebViewContainer.tsx`](src/components/WebViewContainer.tsx) |
| Change address bar / omnibox | [`src/components/AddressBar.tsx`](src/components/AddressBar.tsx) + [`src/utils/omnibox.ts`](src/utils/omnibox.ts) |
| Change new tab page | [`src/components/NewTabPage.tsx`](src/components/NewTabPage.tsx) |
| Change themes/colors | [`src/utils/themes.ts`](src/utils/themes.ts) + [`tailwind.config.js`](tailwind.config.js) |
| Change history storage | [`electron/historyManager.ts`](electron/historyManager.ts) + [`electron/db.ts`](electron/db.ts) |
| Change bookmarks storage | [`electron/bookmarksManager.ts`](electron/bookmarksManager.ts) + [`electron/db.ts`](electron/db.ts) |
| Change ad blocking | [`electron/adBlocker.ts`](electron/adBlocker.ts) + [`electron/filterManager.ts`](electron/filterManager.ts) |
| Change YouTube ad blocking | [`electron/youtubeAdBlocker.ts`](electron/youtubeAdBlocker.ts) + [`electron/webviewPreload.cjs`](electron/webviewPreload.cjs) |
| Change privacy settings | [`electron/settingsManager.ts`](electron/settingsManager.ts) + [`src/components/SettingsPanel.tsx`](src/components/SettingsPanel.tsx) |
| Change session save/restore | [`electron/sessionManager.ts`](electron/sessionManager.ts) |
| Change auto-updater | [`electron/autoUpdater.ts`](electron/autoUpdater.ts) + [`src/components/UpdateNotification.tsx`](src/components/UpdateNotification.tsx) |
| Change build/packaging | [`package.json`](package.json) → `build` section + [`vite.config.ts`](vite.config.ts) |
