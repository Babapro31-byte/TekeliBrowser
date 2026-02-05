# Katkıda Bulunma Rehberi 🤝

TekeliBrowser projesine katkıda bulunmak istediğiniz için teşekkürler! Bu rehber, projeye nasıl katkı sağlayabileceğinizi açıklar.

## İçindekiler

1. [Başlamadan Önce](#başlamadan-önce)
2. [Geliştirme Ortamı](#geliştirme-ortamı)
3. [Kod Standartları](#kod-standartları)
4. [Pull Request Süreci](#pull-request-süreci)
5. [Hata Bildirimi](#hata-bildirimi)
6. [Özellik Önerileri](#özellik-önerileri)

## Başlamadan Önce

### Davranış Kuralları

- Saygılı ve yapıcı olun
- Farklı görüşlere açık olun
- Yardımlaşmaya istekli olun
- İngilizce veya Türkçe kullanabilirsiniz

### Ne Tür Katkılar Kabul Edilir?

- 🐛 Hata düzeltmeleri
- ✨ Yeni özellikler
- 📝 Dokümantasyon iyileştirmeleri
- 🎨 UI/UX geliştirmeleri
- ⚡ Performans optimizasyonları
- 🧪 Test ekleme
- 🌍 Çeviri/Lokalizasyon

## Geliştirme Ortamı

### Gereksinimler

```bash
Node.js >= 18.0.0
npm >= 9.0.0
Git
```

### Kurulum

1. Repository'yi fork edin
2. Fork'u klonlayın:
```bash
git clone https://github.com/YOUR_USERNAME/TekeliBrowser.git
cd TekeliBrowser
```

3. Bağımlılıkları yükleyin:
```bash
npm install
```

4. Geliştirme sunucusunu başlatın:
```bash
npm run electron:dev
```

### Branch Stratejisi

- `main` - Stabil, production-ready kod
- `develop` - Geliştirme branch'i
- `feature/*` - Yeni özellikler
- `fix/*` - Hata düzeltmeleri
- `docs/*` - Dokümantasyon

**Örnek:**
```bash
git checkout -b feature/bookmark-manager
git checkout -b fix/tab-close-bug
git checkout -b docs/update-readme
```

## Kod Standartları

### TypeScript/React

```typescript
// ✅ İyi
interface TabProps {
  id: string;
  title: string;
  url: string;
}

const Tab: React.FC<TabProps> = ({ id, title, url }) => {
  return <div>{title}</div>;
};

// ❌ Kötü
const Tab = (props: any) => {
  return <div>{props.title}</div>;
};
```

### Naming Conventions

- **Components**: PascalCase (`TabBar.tsx`)
- **Functions**: camelCase (`updateTabUrl()`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_TABS`)
- **Interfaces**: PascalCase with `I` prefix optional (`TabProps`)

### Dosya Organizasyonu

```
src/
├── components/          # React bileşenleri
│   ├── TabBar.tsx
│   └── AddressBar.tsx
├── hooks/              # Custom hooks
├── utils/              # Yardımcı fonksiyonlar
├── types/              # TypeScript type definitions
└── styles/             # Global styles
```

### Styling

Tailwind CSS kullanın:

```tsx
// ✅ İyi
<div className="glass rounded-lg p-4 hover:neon-glow">
  Content
</div>

// ❌ Kötü (inline styles)
<div style={{ background: 'rgba(26, 26, 46, 0.6)' }}>
  Content
</div>
```

### Commit Messages

Semantic commit messages kullanın:

```bash
feat: Add bookmark manager
fix: Resolve tab close memory leak
docs: Update installation guide
style: Improve button hover effects
refactor: Simplify state management
test: Add tab navigation tests
chore: Update dependencies
```

**Format:**
```
<type>: <subject>

<body> (optional)

<footer> (optional)
```

**Types:**
- `feat` - Yeni özellik
- `fix` - Hata düzeltme
- `docs` - Dokümantasyon
- `style` - Görsel değişiklik
- `refactor` - Kod düzenleme
- `test` - Test ekleme
- `chore` - Bakım işleri

## Pull Request Süreci

### 1. Issue Oluşturun (İsteğe Bağlı)

Büyük değişiklikler için önce issue açın ve tartışın.

### 2. Fork ve Branch

```bash
git checkout develop
git checkout -b feature/your-feature-name
```

### 3. Geliştirme

- Kod yazın
- Test edin
- Commit edin

```bash
git add .
git commit -m "feat: add bookmark manager"
```

### 4. Push

```bash
git push origin feature/your-feature-name
```

### 5. Pull Request Oluşturun

GitHub'da PR açın:

**PR Template:**
```markdown
## Değişiklik Açıklaması
[Neyi değiştirdiniz?]

## Motivasyon ve Bağlam
[Neden bu değişiklik gerekli?]

## Test Edildi mi?
- [ ] Windows
- [ ] macOS
- [ ] Linux

## Ekran Görüntüleri
[Varsa ekleyin]

## Checklist
- [ ] Kod standartlarına uygun
- [ ] Dokümantasyon güncellendi
- [ ] Testler yazıldı/güncellendi
- [ ] Commit mesajları semantic
```

### 6. Review Süreci

- Maintainer'lar PR'ı inceler
- Değişiklik talepleri gelebilir
- Onay sonrası merge edilir

## Hata Bildirimi

### Hata Raporu Şablonu

```markdown
**Hata Açıklaması**
[Açık ve net hata açıklaması]

**Yeniden Üretme Adımları**
1. '...' sayfasına git
2. '....' butonuna tıkla
3. Aşağı kaydır
4. Hatayı gör

**Beklenen Davranış**
[Ne olmasını bekliyordunuz?]

**Ekran Görüntüleri**
[Varsa ekleyin]

**Ortam:**
- OS: [Windows/macOS/Linux]
- TekeliBrowser Versiyon: [1.0.0]
- Node.js Versiyon: [18.0.0]

**Ek Bağlam**
[Diğer bilgiler]
```

### Hata Önceliklendirme

- 🔴 **Critical**: Uygulama çöküyor
- 🟠 **High**: Önemli özellik çalışmıyor
- 🟡 **Medium**: Minor özellik sorunu
- 🟢 **Low**: Kozmetik sorun

## Özellik Önerileri

### Özellik İsteği Şablonu

```markdown
**Özellik İsteği**
[Özelliğin kısa açıklaması]

**Problem**
[Bu özellik hangi problemi çözüyor?]

**Önerilen Çözüm**
[Özelliğin nasıl çalışmasını istiyorsunuz?]

**Alternatifler**
[Düşündüğünüz başka çözümler?]

**Kullanım Senaryosu**
[Bu özelliği kim ve nasıl kullanır?]

**Öncelik**
- [ ] Düşük
- [ ] Orta
- [ ] Yüksek
```

## Dokümantasyon

### Dokümantasyon Güncellemeleri

Kod değişiklikleriyle birlikte ilgili dokümantasyonu güncelleyin:

- `README.md` - Genel bilgi
- `ARCHITECTURE.md` - Mimari değişiklikler
- `FEATURES.md` - Yeni özellikler
- `INSTALLATION.md` - Kurulum değişiklikleri

### JSDoc Kullanımı

```typescript
/**
 * Yeni sekme oluşturur ve state'e ekler
 * @param url - Sekmenin başlangıç URL'i
 * @returns Oluşturulan sekme nesnesi
 */
const createTab = (url: string): Tab => {
  return {
    id: Date.now().toString(),
    title: 'Yeni Sekme',
    url,
    isLoading: false
  };
};
```

## Test Yazma

### Component Tests

```typescript
import { render, screen } from '@testing-library/react';
import TabBar from './TabBar';

test('renders tab bar with tabs', () => {
  const tabs = [
    { id: '1', title: 'Test', url: 'https://test.com', isLoading: false }
  ];
  render(<TabBar tabs={tabs} activeTabId="1" />);
  expect(screen.getByText('Test')).toBeInTheDocument();
});
```

### Integration Tests

```typescript
test('tab navigation works correctly', async () => {
  // Test implementation
});
```

## Performans

### Performans Kuralları

- Gereksiz re-render'ları önleyin
- `useMemo` ve `useCallback` kullanın
- Lazy loading uygulayın
- Bundle size'ı kontrol edin

```typescript
// ✅ İyi
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);

// ❌ Kötü
const value = computeExpensiveValue(a, b); // Her render'da çalışır
```

## Güvenlik

### Güvenlik Kontrolleri

- Kullanıcı girdilerini sanitize edin
- XSS açıklarına dikkat edin
- Sensitive data'yı log'lamayın
- Dependencies'i güncel tutun

```typescript
// ✅ İyi
const sanitizedUrl = sanitizeUrl(userInput);

// ❌ Kötü
webview.loadURL(userInput); // Direkt kullanım tehlikeli
```

## Yardım Alma

### İletişim Kanalları

- 💬 GitHub Discussions
- 🐛 GitHub Issues
- 📧 Email: [tekeli-browser@example.com]
- 🐦 Twitter: [@TekeliBrowser]

### Sık Sorulan Sorular

**S: İlk katkımı nasıl yapabilirim?**
A: "good first issue" etiketli issue'lara bakın.

**S: PR'm ne kadar sürede incelenir?**
A: Genellikle 3-5 iş günü içinde.

**S: Özellik fikrim reddedildi, ne yapmalıyım?**
A: Geri bildirimleri değerlendirin ve alternatif öneriler sunun.

---

## Teşekkürler! 🙏

Her türlü katkınız değerlidir. Birlikte harika bir tarayıcı oluşturalım!

**Happy Coding!** ✨
