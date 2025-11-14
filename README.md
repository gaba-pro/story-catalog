# Story Catalog PWA 📚

Aplikasi katalog cerita digital berbasis Progressive Web App (PWA) dengan peta interaktif untuk berbagi dan menjelajahi cerita dari berbagai lokasi.

## 🚀 Demo

**Live Demo:** [https://[username].github.io/story-catalog-pwa/](https://[username].github.io/story-catalog-pwa/)

## ✨ Fitur Utama

### 📱 Progressive Web App (PWA)
- **Installable**: Dapat diinstall ke home screen perangkat
- **Offline Support**: Aplikasi tetap dapat digunakan tanpa koneksi internet
- **App Shell**: Interface dasar dapat dimuat dengan cepat
- **Responsive Design**: Optimal di desktop, tablet, dan mobile

### 🔔 Push Notifications
- **Dynamic Notifications**: Notifikasi dengan konten yang disesuaikan
- **Toggle Subscription**: Kontrol untuk mengaktifkan/menonaktifkan notifikasi
- **Action Navigation**: Notifikasi dengan tombol aksi untuk navigasi langsung
- **Background Processing**: Notifikasi dapat diterima meski aplikasi tidak terbuka

### 🗺️ Peta Interaktif
- **Leaflet Maps**: Peta interaktif dengan berbagai layer
- **Story Markers**: Penanda lokasi cerita di peta
- **Click to Select**: Pilih lokasi dengan klik di peta
- **Geolocation**: Gunakan lokasi saat ini

### 💾 IndexedDB Integration
- **Offline Storage**: Penyimpanan data lokal untuk akses offline
- **CRUD Operations**: Create, Read, Update, Delete cerita favorit
- **Search & Filter**: Pencarian dan filter berdasarkan berbagai kriteria
- **Sorting**: Pengurutan berdasarkan nama, tanggal, dll
- **Background Sync**: Sinkronisasi otomatis data offline ke server

### 🔄 Background Sync
- **Offline Mode**: Cerita dapat dibuat saat offline
- **Auto Sync**: Sinkronisasi otomatis saat koneksi kembali
- **Sync Status**: Indikator status sinkronisasi
- **Error Handling**: Penanganan error dengan retry mechanism

### ❤️ Favorites System
- **Add to Favorites**: Tambahkan cerita ke daftar favorit
- **Offline Favorites**: Favorit tersimpan lokal di IndexedDB
- **Export Feature**: Export daftar favorit ke JSON
- **Advanced Filtering**: Filter favorit berdasarkan tanggal, lokasi, dll

## 🛠️ Teknologi

- **Frontend Framework**: Vanilla JavaScript (ES6+)
- **Build Tool**: Vite
- **CSS**: Modern CSS dengan CSS Variables
- **Maps**: Leaflet.js
- **HTTP Client**: Axios
- **Storage**: IndexedDB API
- **PWA**: Service Worker, Web App Manifest
- **Push**: Web Push API dengan VAPID

## 🏗️ Arsitektur

```
src/
├── index.html              # Entry point
├── manifest.json           # Web App Manifest
├── sw.js                   # Service Worker
├── scripts/
│   ├── index.js            # Main app initialization
│   ├── pages/              # Page components
│   │   ├── home/
│   │   ├── stories/
│   │   ├── add-story/
│   │   ├── favorites/      # ✨ NEW: Favorites page
│   │   └── auth/
│   ├── services/           # Business logic
│   │   ├── api-service.js
│   │   ├── push-notification-service.js  # ✨ NEW
│   │   ├── indexeddb-service.js          # ✨ NEW
│   │   ├── sync-service.js               # ✨ NEW
│   │   ├── map-service.js
│   │   └── camera-service.js
│   ├── routes/             # Routing
│   └── utils/              # Utilities
└── styles/
    └── styles.css          # Enhanced with PWA styles
```

## 🚀 Instalasi & Development

### Prerequisites
- Node.js (v18 atau lebih baru)
- npm atau yarn

### Setup
```bash
# Clone repository
git clone [repository-url]
cd story-catalog-pwa

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables
Tidak ada environment variables yang diperlukan. Aplikasi menggunakan:
- Dicoding Story API: `https://story-api.dicoding.dev/v1`
- OpenStreetMap untuk tiles peta

## 📱 PWA Features Implementation

### 1. Web App Manifest
```json
{
  "name": "Story Catalog - Aplikasi Katalog Cerita Digital",
  "short_name": "Story Catalog",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#2196F3",
  "background_color": "#ffffff",
  "icons": [...],
  "screenshots": [...],
  "shortcuts": [...]
}
```

### 2. Service Worker
- **Caching Strategy**: Cache-first untuk static assets, network-first untuk API
- **Offline Fallback**: Fallback ke cache saat offline
- **Background Sync**: Queue untuk data yang perlu disinkronisasi

### 3. Push Notifications
- **VAPID Keys**: Menggunakan VAPID public key dari Dicoding API
- **Permission Handling**: Request permission dengan UX yang baik
- **Rich Notifications**: Notifikasi dengan gambar, actions, dan data

### 4. IndexedDB
- **Object Stores**: Stories, Favorites, OfflineStories, SyncQueue
- **Indexes**: Optimized queries dengan index
- **Transactions**: Atomic operations untuk data consistency

## 🔧 API Integration

Aplikasi terintegrasi dengan [Dicoding Story API](https://story-api.dicoding.dev/v1):

### Endpoints
- `POST /register` - Registrasi user
- `POST /login` - Login user
- `GET /stories` - Ambil daftar cerita
- `GET /stories?location=1` - Cerita dengan lokasi
- `POST /stories` - Tambah cerita baru

### Authentication
- JWT Token disimpan di localStorage
- Auto-logout saat token expired
- Refresh token otomatis (jika didukung API)

## 📊 Performance & Best Practices

### Performance
- **Lazy Loading**: Gambar dimuat saat dibutuhkan
- **Code Splitting**: JavaScript chunks terpisah
- **Asset Optimization**: Kompresi dan minifikasi
- **Caching**: Aggressive caching untuk static assets

### Accessibility
- **ARIA Labels**: Proper labeling untuk screen readers
- **Keyboard Navigation**: Semua fungsi dapat diakses via keyboard
- **Focus Management**: Focus handling yang tepat
- **Color Contrast**: Kontras warna yang memenuhi WCAG

### Security
- **Content Security Policy**: CSP headers untuk keamanan
- **HTTPS Only**: Service worker hanya bekerja di HTTPS
- **Input Validation**: Validasi client dan server side
- **Sanitization**: HTML sanitization untuk user input

## 🧪 Testing

### Manual Testing Checklist
- [ ] Installable di berbagai browser
- [ ] Offline functionality bekerja
- [ ] Push notifications diterima
- [ ] IndexedDB CRUD operations
- [ ] Background sync saat online kembali
- [ ] Responsive di berbagai ukuran layar

### PWA Audit
Gunakan Chrome DevTools Lighthouse untuk audit PWA:
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+
- PWA: 100

## 🚀 Deployment

### GitHub Pages (Automated)
1. Push ke branch `main`
2. GitHub Actions akan otomatis build dan deploy
3. Akses di `https://[username].github.io/story-catalog-pwa/`

### Manual Deployment
```bash
# Build project
npm run build

# Deploy dist folder ke hosting platform pilihan
# (Netlify, Vercel, Firebase Hosting, dll)
```

### Hosting Requirements
- HTTPS (wajib untuk PWA)
- Support untuk SPA routing
- Gzip compression (recommended)

## 📈 Analytics & Monitoring

Untuk monitoring production:
- **Core Web Vitals**: LCP, FID, CLS
- **PWA Metrics**: Install rate, engagement
- **Error Tracking**: Service worker errors
- **Usage Analytics**: Feature usage patterns

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

Project ini menggunakan MIT License - lihat file `LICENSE` untuk detail.

## 🙏 Credits

- **API**: [Dicoding Story API](https://story-api.dicoding.dev)
- **Maps**: [OpenStreetMap](https://openstreetmap.org) & [Leaflet](https://leafletjs.com)
- **Icons**: Emoji dan custom SVG
- **Framework**: Vanilla JavaScript dengan modern web standards

## 📞 Support

Jika ada pertanyaan atau issues:
1. Buka issue di GitHub repository
2. Sertakan screenshot dan langkah reproduksi
3. Mention browser dan device yang digunakan

---

**Happy Coding! 🎉**

> *Aplikasi ini dibuat sebagai bagian dari submission Dicoding untuk kelas Front-End Web Developer Expert.*