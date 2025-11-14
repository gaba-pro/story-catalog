import { BasePage } from '../../utils/base-classes.js';

export default class AboutPage extends BasePage {
  constructor() {
    super();
    this.title = 'Tentang - Story Catalog';
  }

  async render() {
    return `
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">ℹ️ Tentang Story Catalog</h1>
          <p class="page-description">Platform berbagi cerita digital dengan peta interaktif</p>
        </div>

        <!-- Project Overview -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">🎯 Tentang Proyek</h2>
          </div>
          <div class="project-overview">
            <p>
              <strong>Story Catalog</strong> adalah aplikasi web modern yang memungkinkan pengguna untuk berbagi 
              dan menjelajahi cerita dari berbagai lokasi di seluruh dunia melalui peta digital yang interaktif.
            </p>
            <p>
              Aplikasi ini dikembangkan sebagai submission untuk kelas <em>Menjadi Front-End Web Developer Expert</em> 
              dengan menerapkan berbagai teknologi web terkini dan standar aksesibilitas.
            </p>
          </div>
        </div>

        <!-- Technical Features -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">⚡ Fitur Teknologi</h2>
          </div>
          <div class="features-list">
            <div class="feature-item">
              <h3>🔄 Single Page Application (SPA)</h3>
              <p>Arsitektur SPA dengan hash routing dan view transitions untuk navigasi yang smooth dan responsif.</p>
            </div>

            <div class="feature-item">
              <h3>🗺️ Peta Digital Interaktif</h3>
              <p>Integrasi Leaflet.js dengan multiple tile layers (OpenStreetMap, Satellite, Terrain) dan marker interaktif.</p>
            </div>

            <div class="feature-item">
              <h3>📷 Akses Hardware Media</h3>
              <p>Implementasi getUserMedia API untuk mengakses kamera perangkat dan mengambil foto secara langsung.</p>
            </div>

            <div class="feature-item">
              <h3>🎨 View Transitions API</h3>
              <p>Custom transisi halaman yang halus menggunakan View Transitions API untuk pengalaman pengguna yang modern.</p>
            </div>

            <div class="feature-item">
              <h3>♿ Aksesibilitas WCAG</h3>
              <p>Implementasi lengkap standar Web Content Accessibility Guidelines (WCAG) termasuk keyboard navigation dan screen reader support.</p>
            </div>

            <div class="feature-item">
              <h3>📱 Responsive Design</h3>
              <p>Desain yang responsif dan optimal untuk berbagai ukuran layar dari mobile hingga desktop.</p>
            </div>
          </div>
        </div>

        <!-- Architecture -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">🏗️ Arsitektur Aplikasi</h2>
          </div>
          <div class="architecture-info">
            <div class="arch-item">
              <h3>MVP (Model-View-Presenter)</h3>
              <p>Implementasi pola arsitektur MVP untuk pemisahan yang jelas antara logika bisnis dan tampilan.</p>
            </div>

            <div class="arch-item">
              <h3>Service Layer</h3>
              <p>Layer service untuk mengelola komunikasi API, peta digital, dan akses hardware secara terpisah.</p>
            </div>

            <div class="arch-item">
              <h3>Modular Structure</h3>
              <p>Struktur kode yang modular dan maintainable dengan separation of concerns yang baik.</p>
            </div>
          </div>
        </div>

        <!-- API Integration -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">🔌 Integrasi API</h2>
          </div>
          <div class="api-info">
            <div class="api-endpoint">
              <h3>📚 Story API</h3>
              <p><code>https://story-api.dicoding.dev/v1</code></p>
              <ul>
                <li>GET /stories - Mengambil daftar cerita</li>
                <li>GET /stories?location=1 - Mengambil cerita dengan lokasi</li>
                <li>POST /stories - Menambah cerita baru</li>
                <li>POST /register - Registrasi pengguna</li>
                <li>POST /login - Login pengguna</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Compliance & Standards -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">✅ Kepatuhan & Standar</h2>
          </div>
          <div class="compliance-grid">
            <div class="compliance-item">
              <div class="compliance-icon">♿</div>
              <h3>WCAG 2.1 AA</h3>
              <p>Web Content Accessibility Guidelines</p>
            </div>

            <div class="compliance-item">
              <div class="compliance-icon">📱</div>
              <h3>Responsive Web Design</h3>
              <p>Mobile-first & Cross-platform</p>
            </div>

            <div class="compliance-item">
              <div class="compliance-icon">⚡</div>
              <h3>Modern Web Standards</h3>
              <p>ES6+, Web APIs, Progressive Enhancement</p>
            </div>

            <div class="compliance-item">
              <div class="compliance-icon">🔒</div>
              <h3>Security Best Practices</h3>
              <p>Input validation, HTTPS, CSP</p>
            </div>
          </div>
        </div>

        <!-- Developer Info -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">👨‍💻 Informasi Pengembang</h2>
          </div>
          <div class="developer-info">
            <p><strong>Proyek:</strong> Story Catalog - Aplikasi Katalog Cerita Digital</p>
            <p><strong>Kelas:</strong> Menjadi Front-End Web Developer Expert</p>
            <p><strong>Platform:</strong> Dicoding Indonesia</p>
            <p><strong>Teknologi:</strong> Vanilla JavaScript, Leaflet.js, Web APIs, CSS3, HTML5</p>
            <p><strong>Tahun:</strong> 2024</p>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="about-actions">
          <a href="#/stories" class="btn btn-primary">📚 Jelajahi Cerita</a>
          <a href="#/add-story" class="btn btn-secondary">➕ Tambah Cerita</a>
          <a href="#/" class="btn btn-outline">🏠 Kembali ke Beranda</a>
        </div>
      </div>
    `;
  }

  async afterRender() {
    await super.afterRender();
    this.setupAnimations();
  }

  setupAnimations() {
    // Intersection Observer for fade-in animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    // Observe cards
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
      observer.observe(card);
    });
  }
}
