## [2.1.0] - 2026-02-08

### Profesyonel Performans & Gizlilik Paketi

#### Performans
- HTTP/3 + QUIC + Early-Hints desteği (First-Byte %20-30 hızlanma)
- Predictive Prefetch Engine – viewport yakını linklerin ML tabanlı prefetch’i
- Adaptive Resource Policy – native lazy-loading, LCP 1.5 s altı
- GPU Raster & Zero-Copy build flag’leri – WebGL/Canvas FPS %25-35 artış
- Vendor chunk split – ilk yük hızlanması

#### Gizlilik
- DNS-over-HTTPS (DoH) – Cloudflare/Quad9/Google seçenekleri, plaintext DNS yok
- HTTPS-Only Mode – http→https otomatik, downgrade’te interstitial
- Stateless Partition + Network-State Isolation – sekme başına ayrı partition, 3. parti çerezler default kapalı
- Advanced Fingerprint Defender – Canvas/WebGL/Audio randomize, Client-Hints minimum
- Secure User-Agent – sabit Chrome 122 UA, spoofing opsiyonu

#### Şifre Yöneticisi
- AES-256-GCM + master-password ile şifre kasası
- Have-I-Been-Pwned breach-monitor
- Güvenli autofill (sadece top-level + user-gesture)

#### Diğer
- Single-instance lock – ikinci başlatma var olan pencereyi öne getirir
- Persistent log – `userData/tekeli.log` debug kolaylığı
- Omnibox auto-suggest, yer imi toggle, kısayollar tamamlandı