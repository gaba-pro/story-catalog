import { BasePage, BasePresenter } from '../../utils/base-classes.js';
import ApiService from '../../services/api-service.js';
import MapService from '../../services/map-service.js';

class StoriesPresenter extends BasePresenter {
  constructor(view) {
    super(view);
    this.stories = [];
    this.mapService = null;
    this.currentFilter = 'all';
  }

  async init() {
    await this.loadStories();
    await this.initMap();
    this.setupEventListeners();
  }

  async loadStories() {
    try {
      this.showLoading();
      
      // Use sync service to get stories (online/offline aware)
      let stories = [];
      if (window.syncService) {
        stories = await window.syncService.getStories(false);
      } else {
        // Fallback to direct API call
        const response = await ApiService.getStoriesWithLocation();
        if (response.error === false) {
          stories = response.listStory || [];
        }
      }
      
      this.stories = stories;
      this.view.displayStories(this.stories);
      this.hideLoading();
      
    } catch (error) {
      this.hideLoading();
      
      // Try to load from IndexedDB if API fails
      if (window.indexedDBService) {
        try {
          const cachedStories = await window.indexedDBService.getAllStories();
          this.stories = cachedStories;
          this.view.displayStories(this.stories);
          this.showSuccess('Data dimuat dari cache offline');
        } catch (cacheError) {
          this.showError('Gagal memuat cerita: ' + error.message);
        }
      } else {
        this.showError('Terjadi kesalahan: ' + error.message);
      }
    }
  }

  async initMap() {
    const mapContainer = document.getElementById('stories-map');
    if (mapContainer && this.stories.length > 0) {
      this.mapService = new MapService('stories-map');
      await this.mapService.initMap();
      
      // Add markers for all stories
      this.stories.forEach(story => {
        if (story.lat && story.lon) {
          this.mapService.addStoryMarker(story);
        }
      });

      // Set up map event listeners
      this.mapService.onMarkerClick((story) => {
        this.highlightStoryCard(story.id);
        this.view.scrollToStory(story.id);
      });
    }
  }

  setupEventListeners() {
    // Filter functionality
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filter = e.target.dataset.filter;
        this.applyFilter(filter);
        
        // Update active filter button
        filterButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
      });
    });

    // Story card hover events and click events
    const storyCards = document.querySelectorAll('.story-card');
    storyCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        const storyId = card.dataset.storyId;
        if (this.mapService) {
          this.mapService.highlightMarker(storyId);
        }
      });

      card.addEventListener('mouseleave', () => {
        if (this.mapService) {
          this.mapService.clearHighlight();
        }
      });
      
      // Click to view story details (future feature)
      card.addEventListener('click', () => {
        const storyId = card.dataset.storyId;
        this.viewStoryDetails(storyId);
      });
    });

    // Favorite buttons
    const favoriteButtons = document.querySelectorAll('.favorite-btn');
    favoriteButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation(); // Prevent card click
        const storyId = e.target.dataset.storyId;
        await this.toggleFavorite(storyId, e.target);
      });
    });

    // Refresh button
    const refreshBtn = document.getElementById('refresh-stories');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.refreshStories();
      });
    }
  }

  async toggleFavorite(storyId, button) {
    if (!window.indexedDBService) {
      this.showError('IndexedDB service not available');
      return;
    }

    try {
      const story = this.stories.find(s => s.id === storyId);
      if (!story) return;

      const isFavorite = await window.indexedDBService.isFavorite(storyId);
      
      if (isFavorite) {
        await window.indexedDBService.removeFromFavorites(storyId);
        button.innerHTML = '🤍';
        button.setAttribute('aria-label', 'Tambahkan ke favorit');
        button.classList.remove('favorite-active');
        this.showSuccess('Dihapus dari favorit');
      } else {
        await window.indexedDBService.addToFavorites(storyId, story);
        button.innerHTML = '❤️';
        button.setAttribute('aria-label', 'Hapus dari favorit');
        button.classList.add('favorite-active');
        this.showSuccess('Ditambahkan ke favorit');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      this.showError('Gagal mengubah status favorit');
    }
  }

  async refreshStories() {
    if (window.syncService) {
      try {
        // Force refresh from API
        await window.syncService.getStories(true);
        await this.loadStories();
        await this.initMap();
        this.showSuccess('Data berhasil di-refresh');
      } catch (error) {
        this.showError('Gagal me-refresh data: ' + error.message);
      }
    } else {
      await this.loadStories();
      await this.initMap();
    }
  }

  viewStoryDetails(storyId) {
    // Future implementation for story detail view
    console.log('View story details:', storyId);
  }

  applyFilter(filter) {
    this.currentFilter = filter;
    let filteredStories = this.stories;

    if (filter === 'with-location') {
      filteredStories = this.stories.filter(story => story.lat && story.lon);
    } else if (filter === 'recent') {
      filteredStories = this.stories
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);
    }

    this.view.displayStories(filteredStories);
    
    if (this.mapService) {
      this.mapService.clearMarkers();
      filteredStories.forEach(story => {
        if (story.lat && story.lon) {
          this.mapService.addStoryMarker(story);
        }
      });
    }
  }

  highlightStoryCard(storyId) {
    // Remove previous highlights
    document.querySelectorAll('.story-card.highlighted').forEach(card => {
      card.classList.remove('highlighted');
    });

    // Highlight selected card
    const card = document.querySelector(`[data-story-id="${storyId}"]`);
    if (card) {
      card.classList.add('highlighted');
    }
  }
}

class StoriesPage extends BasePage {
  constructor() {
    super();
    this.title = 'Cerita - Story Catalog';
    this.presenter = new StoriesPresenter(this);
  }

  async render() {
    return `
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">📚 Katalog Cerita</h1>
          <p class="page-description">Jelajahi cerita menarik dari berbagai lokasi</p>
        </div>

        <!-- Filter Controls -->
        <div class="filter-controls" role="tablist" aria-label="Filter cerita">
          <button class="filter-btn btn btn-outline active" data-filter="all" role="tab" aria-selected="true">
            Semua Cerita
          </button>
          <button class="filter-btn btn btn-outline" data-filter="with-location" role="tab" aria-selected="false">
            Ada Lokasi
          </button>
          <button class="filter-btn btn btn-outline" data-filter="recent" role="tab" aria-selected="false">
            Terbaru
          </button>
        </div>

        <!-- Map Section -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">🗺️ Peta Cerita</h2>
            <p>Klik marker untuk melihat detail cerita</p>
          </div>
          <div id="stories-map" class="map-container" role="application" aria-label="Peta lokasi cerita"></div>
        </div>

        <!-- Stories Grid -->
        <div class="stories-section">
          <h2 class="section-title">Daftar Cerita</h2>
          <div id="stories-grid" class="story-grid" role="region" aria-label="Daftar cerita">
            <!-- Stories will be populated here -->
          </div>
        </div>

        <!-- Empty state -->
        <div id="empty-state" class="empty-state" style="display: none;">
          <div class="empty-state-content">
            <div class="empty-icon">📚</div>
            <h3>Belum ada cerita</h3>
            <p>Belum ada cerita yang tersedia saat ini.</p>
            <a href="#/add-story" class="btn btn-primary">Tambah Cerita Pertama</a>
          </div>
        </div>
      </div>
    `;
  }

  async afterRender() {
    await super.afterRender();
  }

  async displayStories(stories) {
    const storiesGrid = document.getElementById('stories-grid');
    const emptyState = document.getElementById('empty-state');
    
    if (stories.length === 0) {
      storiesGrid.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    storiesGrid.style.display = 'grid';
    emptyState.style.display = 'none';

    // Check favorite status for each story
    const storyCards = await Promise.all(stories.map(async (story) => {
      let isFavorite = false;
      if (window.indexedDBService) {
        try {
          isFavorite = await window.indexedDBService.isFavorite(story.id);
        } catch (error) {
          console.warn('Error checking favorite status:', error);
        }
      }
      
      const isOffline = story.isOffline || false;
      const syncPending = story.syncPending || false;
      
      return `
        <article class="story-card ${isOffline ? 'offline-story' : ''}" data-story-id="${story.id}" tabindex="0" role="article">
          <div class="story-image-container">
            <img 
              src="${story.photoUrl || (isOffline ? story.photo : '/placeholder-image.jpg')}" 
              alt="${story.description || 'Foto cerita'}"
              class="story-image"
              loading="lazy"
            >
            <div class="story-actions">
              <button 
                class="favorite-btn ${isFavorite ? 'favorite-active' : ''}" 
                data-story-id="${story.id}"
                aria-label="${isFavorite ? 'Hapus dari favorit' : 'Tambahkan ke favorit'}"
              >
                ${isFavorite ? '❤️' : '🤍'}
              </button>
            </div>
            ${syncPending ? '<div class="sync-indicator">🔄 Pending Sync</div>' : ''}
          </div>
          <div class="story-content">
            <h3 class="story-title">${story.name || 'Cerita Tanpa Judul'}</h3>
            <p class="story-description">${story.description || 'Tidak ada deskripsi'}</p>
            <div class="story-meta">
              <span class="story-author">📝 ${story.name}</span>
              <span class="story-date">📅 ${new Date(story.createdAt).toLocaleDateString('id-ID')}</span>
              ${isOffline ? '<span class="offline-badge">📱 Offline</span>' : ''}
            </div>
            ${story.lat && story.lon ? `
              <div class="story-location">
                📍 Lat: ${story.lat.toFixed(4)}, Lon: ${story.lon.toFixed(4)}
              </div>
            ` : ''}
          </div>
        </article>
      `;
    }));

    storiesGrid.innerHTML = storyCards.join('');

    // Re-setup event listeners for new cards
    this.presenter.setupEventListeners();
  }

  scrollToStory(storyId) {
    const card = document.querySelector(`[data-story-id="${storyId}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.focus();
    }
  }
}

export default StoriesPage;