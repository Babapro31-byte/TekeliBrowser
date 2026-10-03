# TekeliBrowser v4 — Design Tokens & Screen Spec

Source of truth for v4 UI. Mirrors the Figma file "TekeliBrowser v4"
(https://www.figma.com/design/EHSi2brLqdjgA2HkybsGKf). Use this file to rebuild
the design in Penpot or to write CSS variables. Style: clean, Chrome/Arc-like,
single indigo accent, 3 themes (Dark default, Light, OLED). Font: Inter (bundle locally, no CDN).
Icons: lucide only. UI language: Turkish + English (i18n).

## Color tokens (CSS: `--color-<group>-<name>`, e.g. `--color-bg-app`)

| Token | Dark | Light | OLED |
|---|---|---|---|
| bg/app | #0F0F12 | #F4F4F6 | #000000 |
| bg/chrome (tab strip) | #16161A | #E6E6EB | #070708 |
| bg/toolbar | #1E1E23 | #FFFFFF | #0E0E10 |
| bg/surface (cards) | #1E1E23 | #FFFFFF | #0E0E10 |
| bg/raised (menus) | #26262C | #FFFFFF | #161619 |
| bg/hover | #2C2C33 | #EDEDF1 | #1C1C20 |
| bg/pressed | #34343C | #E1E1E7 | #25252A |
| bg/input | #131317 | #F1F1F4 | #050506 |
| text/primary | #F4F4F5 | #18181B | #F4F4F5 |
| text/secondary | #B6B6C0 | #52525B | #B2B2BA |
| text/muted | #8C8C98 | #6B6B76 | #8C8C98 |
| text/on-accent | #0F0F12 | #FFFFFF | #000000 |
| text/link | #A5B4FC | #4338CA | #A5B4FC |
| border/subtle | #2A2A31 | #E4E4E9 | #1F1F24 |
| border/default | #3A3A43 | #D0D0D8 | #2E2E35 |
| border/strong | #55555F | #A8A8B3 | #4A4A54 |
| accent/default | #818CF8 | #4F46E5 | #818CF8 |
| accent/hover | #A5B4FC | #4338CA | #A5B4FC |
| accent/subtle | #25264D | #E6E7FD | #17183A |
| status/success | #4ADE80 | #15803D | #4ADE80 |
| status/success-subtle | #12301E | #DCFCE7 | #0B2415 |
| status/warning | #FBBF24 | #B45309 | #FBBF24 |
| status/warning-subtle | #3A2D0C | #FEF3C7 | #2A2008 |
| status/danger | #F87171 | #DC2626 | #F87171 |
| status/danger-subtle | #3D1818 | #FEE2E2 | #2C1010 |
| focus/ring | #A5B4FC | #4F46E5 | #A5B4FC |

Accent choices in Settings > Appearance (dark values): indigo #818CF8 (default),
emerald #34D399, amber #FBBF24, rose #FB7185, neutral #C6C6CF. Light theme must
use darker equivalents so text/UI contrast stays >= 4.5:1.

## Layout tokens

- space: 2xs=2, xs=4, sm=8, md=12, lg=16, xl=24, 2xl=32, 3xl=48
- radius: sm=6, md=8, lg=12, xl=16, full=999
- size: control-sm=28, control-md=32, control-lg=40, tabstrip=40, toolbar=44

## Text styles (Inter)

| Style | Weight | Size/Line |
|---|---|---|
| caption | Regular | 11/16 |
| small | Regular | 12/16 |
| small-strong | Medium | 12/16 |
| body | Regular | 13/20 |
| body-strong | Medium | 13/20 |
| title | Semi Bold | 16/24 |
| heading | Semi Bold | 22/28 |
| display | Semi Bold | 32/40 |

## Effects

- shadow/tab: 0 1 2 rgba(0,0,0,.25)
- shadow/popover: 0 8 24 rgba(0,0,0,.35)
- shadow/dialog: 0 16 48 rgba(0,0,0,.45)

## Components

- **IconButton** 32x32, radius md, icon 18. States: Default (icon text/secondary), Hover (bg/hover, text/primary), Active (bg/pressed), Disabled (opacity .4).
- **Button** height 32, padding-x 12, radius md, label body-strong, hugs content. Variants Primary (accent bg, on-accent text), Secondary (bg/raised + border/default), Ghost, Danger (danger-subtle bg + danger border/text). States Default/Hover/Disabled.
- **Toggle** 40x22 track, radius full, knob 16. On: accent track; Off: bg/pressed track + border/default.
- **Select** h32, radius md, bg/input, border/default, chevron-down icon.
- **Segmented** bg/input track, radius md, items h28 radius sm, active bg/pressed.
- **Card** bg/surface, border/subtle, radius lg, rows separated by 1px border/subtle, row padding 12/16, gap 24.
- **Tab** h34, radius 8 8 0 0, width 200, active = bg/toolbar (merges with toolbar), favicon 16, close icon 14.
- **Omnibox** h32, radius full, bg/input, border/subtle (accent when focused), lock/warning icon left, shield badge (blocked count, success-subtle) + star right.

## Window chrome (1280x800 reference)

TabStrip 40px (bg/chrome, tabs bottom-aligned, window controls 46x40 at the right,
drag region) + Toolbar 44px (back, forward[disabled], reload, home, omnibox,
download, menu) + content. Chrome total ~84px.

## Screens built in Figma (Dark theme only)

1. **Yeni Sekme** — centered brand (shield mark + "Tekeli"), 600px search pill with Ctrl L hint, 6 quick tiles, protection stats card (reklam/izleyici/HTTPS yükseltme, last 7 days).
2. **Ayarlar** pages — centered shell 232px nav + 720px main. Nav: Genel, Gizlilik ve güvenlik, Görünüm, Şifreler, Güncelleme, Kısayollar, Hakkında (active = accent-subtle bg + accent text).
   - Gizlilik: ad/tracker blocker toggle, filter lists, YouTube ads, site exceptions; HTTPS-only, DoH select; third-party cookies select, fingerprint segmented (Kapalı/Standart/Sıkı), GPC, clear-on-exit; clear browsing data, site permissions.
   - Görünüm: 3 theme preview cards (Koyu/Açık/OLED), accent swatches, language, default zoom, bookmarks bar, reduce motion.
   - Güncelleme: states current / downloading with progress / ready (Yeniden başlat + Sonra); auto-download toggle, channel select.
   - Şifreler: info banner (DPAPI), search + import/export, list rows (favicon letter, origin, username, eye/copy/trash).
3. **Geçmiş** (grouped by day, search, trash per row), **İndirmeler** (active with progress + pause/cancel, done with "Klasörde göster", failed with "Tekrar dene").
4. **HTTPS yok** (warning tone) and **Sertifika hatası** (danger tone) interstitials: 560px card, 56px tone icon, heading, body, detail pill, primary "Geri dön" + secondary continue.

## Still to design (not in Figma yet)

Light and OLED copies of every screen; overlays: shield panel (per-site blocker toggle,
blocked count, HTTPS status), permission prompt, clear-browsing-data dialog, update
toast, find bar (Ctrl+F), private window variant, Genel/Kısayollar/Hakkında settings pages.
