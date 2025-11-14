import { BasePage } from '../../utils/base-classes.js';
import ApiService from '../../services/api-service.js';

export default class HomePage extends BasePage {
  constructor() {
    super();
    this.title = 'Beranda - Story Catalog';
  }

  async render() {
    const isAuthenticated = ApiService.isAuthenticated();
    
    return `
      <div class="container">
        <!-- Hero Section -->
        <section class="hero-section" role="banner">
          <div class="hero-content">
            <h1 class="hero-title">
              📚 Selamat Datang di Story Catalog
            </h1>
            <p class="hero-description">
              Jelajahi dan bagikan cerita menarik dari berbagai lokasi di seluruh dunia. 
              Temukan pengalaman baru melalui peta interaktif dan koleksi cerita yang menginspirasi.
            </p>
            <div class="hero-actions">
              ${isAuthenticated ? 
                '<a href="#/stories" class="btn btn-primary">🗺️ Jelajahi Cerita</a>' :
                '<a href="#/register" class="btn btn-primary">📝 Mulai Berbagi Cerita</a>'
              }
              <a href="#/stories" class="btn btn-outline">📚 Lihat Katalog</a>
            </div>
          </div>
        </section>

        <!-- Features Section -->
        <section class="features-section" role="region" aria-labelledby="features-title">
          <h2 id="features-title" class="section-title">✨ Fitur Unggulan</h2>
          
          <div class="features-grid">
            <article class="feature-card">
              <div class="feature-icon">🗺️</div>
              <h3 class="feature-title">Peta Interaktif</h3>
              <p class="feature-description">
                Jelajahi cerita berdasarkan lokasi dengan peta digital yang interaktif. 
                Klik marker untuk melihat detail cerita dari berbagai tempat.
              </p>
            </article>

            <article class="feature-card">
              <div class="feature-icon">📱</div>
              <h3 class="feature-title">Responsif & Aksesibel</h3>
              <p class="feature-description">
                Nikmati pengalaman yang optimal di semua perangkat dengan desain 
                responsif dan fitur aksesibilitas yang lengkap.
              </p>
            </article>

            <article class="feature-card">
              <div class="feature-icon">📷</div>
              <h3 class="feature-title">Upload dengan Kamera</h3>
              <p class="feature-description">
                Ambil foto langsung dari kamera atau pilih dari galeri untuk 
                melengkapi cerita Anda dengan visual yang menarik.
              </p>
            </article>

            <article class="feature-card">
              <div class="feature-icon">🎨</div>
              <h3 class="feature-title">Transisi Halus</h3>
              <p class="feature-description">
                Rasakan navigasi yang smooth dengan transisi halaman yang elegan 
                menggunakan View Transitions API.
              </p>
            </article>

            <article class="feature-card">
              <div class="feature-icon">🔍</div>
              <h3 class="feature-title">Filter & Pencarian</h3>
              <p class="feature-description">
                Temukan cerita yang Anda cari dengan mudah menggunakan filter 
                berdasarkan lokasi, waktu, dan kategori lainnya.
              </p>
            </article>

            <article class="feature-card">
              <div class="feature-icon">🌐</div>
              <h3 class="feature-title">Multiple Map Layers</h3>
              <p class="feature-description">
                Pilih tampilan peta sesuai kebutuhan: satelit, terrain, atau 
                standar untuk perspektif yang berbeda.
              </p>
            </article>
          </div>
        </section>

        <!-- Stats Section -->
        <section class="stats-section" role="region" aria-labelledby="stats-title">
          <h2 id="stats-title" class="section-title">📊 Statistik Platform</h2>
          
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number" id="story-count">0</div>
              <div class="stat-label">Cerita Terpublikasi</div>
            </div>
            <div class="stat-item">
              <div class="stat-number" id="location-count">0</div>
              <div class="stat-label">Lokasi Berbeda</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">100%</div>
              <div class="stat-label">Aksesibilitas</div>
            </div>
          </div>
        </section>

        <!-- CTA Section -->
        <section class="cta-section" role="region" aria-labelledby="cta-title">
          <div class="cta-content">
            <h2 id="cta-title">🚀 Siap Memulai?</h2>
            <p>Bergabunglah dengan komunitas pencerita dan bagikan pengalaman Anda</p>
            <div class="cta-actions">
              ${!isAuthenticated ? `
                <a href="#/register" class="btn btn-primary">Daftar Sekarang</a>
                <a href="#/login" class="btn btn-outline">Sudah Punya Akun?</a>
              ` : `
                <a href="#/add-story" class="btn btn-primary">Tambah Cerita Baru</a>
                <a href="#/stories" class="btn btn-outline">Lihat Semua Cerita</a>
              `}
            </div>
          </div>
        </section>
      </div>
    `;
  }

  async afterRender() {
    await super.afterRender();
    await this.loadStats();
    this.setupAnimations();
  }

  async loadStats() {
    try {
      // Load statistics without authentication requirement
      const response = await fetch('https://story-api.dicoding.dev/v1/stories?size=100');
      const data = await response.json();
      
      if (data.error === false && data.listStory) {
        const stories = data.listStory;
        const storyCount = stories.length;
        const uniqueLocations = new Set(
          stories
            .filter(story => story.lat && story.lon)
            .map(story => `${story.lat.toFixed(2)},${story.lon.toFixed(2)}`)
        ).size;

        this.animateCounter('story-count', storyCount);
        this.animateCounter('location-count', uniqueLocations);
      }
    } catch (error) {
      console.warn('Failed to load stats:', error);
      // Set fallback values
      document.getElementById('story-count').textContent = '50+';
      document.getElementById('location-count').textContent = '25+';
    }
  }

  animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;

    let currentValue = 0;
    const increment = Math.ceil(targetValue / 30); // Animate over ~30 frames
    
    const timer = setInterval(() => {
      currentValue += increment;
      if (currentValue >= targetValue) {
        currentValue = targetValue;
        clearInterval(timer);
      }
      element.textContent = currentValue.toLocaleString();
    }, 50);
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

    // Observe feature cards and sections
    const animateElements = document.querySelectorAll('.feature-card, .stat-item, .cta-content');
    animateElements.forEach((element, index) => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      element.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
      observer.observe(element);
    });
  }
}
