// Favorites Page - utilizing IndexedDB
import { BasePage } from '../../utils/base-classes.js';

class FavoritesPage extends BasePage {
  constructor() {
    super();
    this.favorites = [];
    this.filteredFavorites = [];
    this.currentSort = 'addedAt';
    this.sortOrder = 'desc';
    this.searchQuery = '';
  }

  async render() {
    return `
      <div class="favorites-page">
        <div class="page-header">
          <h1>📚 Cerita Favorit</h1>
          <p>Kelola dan jelajahi cerita favorit Anda</p>
        </div>

        <div class="favorites-controls">
          <div class="search-section">
            <label for="search-favorites" class="sr-only">Cari dalam favorit</label>
            <input 
              type="search" 
              id="search-favorites" 
              placeholder="Cari cerita favorit..."
              class="search-input"
              aria-describedby="search-help"
            />
            <span id="search-help" class="sr-only">Ketik untuk mencari cerita berdasarkan judul atau deskripsi</span>
          </div>

          <div class="filter-section">
            <label for="sort-favorites">Urutkan berdasarkan:</label>
            <select id="sort-favorites" class="sort-select">
              <option value="addedAt-desc">Terbaru ditambahkan</option>
              <option value="addedAt-asc">Terlama ditambahkan</option>
              <option value="name-asc">Nama A-Z</option>
              <option value="name-desc">Nama Z-A</option>
              <option value="createdAt-desc">Tanggal cerita terbaru</option>
              <option value="createdAt-asc">Tanggal cerita terlama</option>
            </select>
          </div>

          <div class="action-buttons">
            <button id="refresh-favorites" class="btn btn-secondary" aria-label="Muat ulang daftar favorit">
              🔄 Refresh
            </button>
            <button id="clear-favorites" class="btn btn-danger" aria-label="Hapus semua favorit">
              🗑️ Hapus Semua
            </button>
            <button id="export-favorites" class="btn btn-info" aria-label="Export favorit ke JSON">
              💾 Export
            </button>
          </div>
        </div>

        <div class="sync-status-card">
          <div class="sync-info">
            <span id="sync-status" class="sync-status">Checking...</span>
            <button id="force-sync" class="btn btn-sm btn-primary" style="display: none;">
              🔄 Sync Now
            </button>
          </div>
          <div class="offline-indicator" id="offline-indicator" style="display: none;">
            📱 Mode Offline - Beberapa fitur terbatas
          </div>
        </div>

        <div class="favorites-stats">
          <div class="stats-grid">
            <div class="stat-card">
              <h3 id="total-favorites">0</h3>
              <p>Total Favorit</p>
            </div>
            <div class="stat-card">
              <h3 id="this-month">0</h3>
              <p>Bulan Ini</p>
            </div>
            <div class="stat-card">
              <h3 id="storage-used">0 KB</h3>
              <p>Penyimpanan</p>
            </div>
          </div>
        </div>

        <div class="favorites-grid" id="favorites-grid" role="region" aria-label="Daftar cerita favorit">
          <div class="loading-message">Memuat favorit...</div>
        </div>

        <div class="empty-state" id="empty-state" style="display: none;">
          <div class="empty-icon">📚</div>
          <h2>Belum ada cerita favorit</h2>
          <p>Tambahkan cerita ke favorit dengan mengklik ikon ❤️ pada halaman cerita</p>
          <a href="#/stories" class="btn btn-primary">Jelajahi Cerita</a>
        </div>

        <!-- Push Notification Controls -->
        <div class="push-notification-section">
          <h2>🔔 Notifikasi</h2>
          <div class="notification-controls">
            <div class="notification-status">
              <span id="push-status" class="status-inactive">Push notifications tidak aktif</span>
            </div>
            <button id="push-toggle-btn" class="btn btn-secondary">
              🔕 Aktifkan Notifikasi
            </button>
            <button id="test-notification" class="btn btn-info">
              🧪 Test Notifikasi
            </button>
          </div>
        </div>
      </div>
    `;
  }

  async afterRender() {
    await this.loadFavorites();
    this.setupEventListeners();
    this.updateSyncStatus();
    this.updateStats();
  }

  setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('search-favorites');
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.filterAndDisplayFavorites();
    });

    // Sort functionality
    const sortSelect = document.getElementById('sort-favorites');
    sortSelect?.addEventListener('change', (e) => {
      const [sortBy, order] = e.target.value.split('-');
      this.currentSort = sortBy;
      this.sortOrder = order;
      this.filterAndDisplayFavorites();
    });

    // Control buttons
    document.getElementById('refresh-favorites')?.addEventListener('click', () => {
      this.loadFavorites();
    });

    document.getElementById('clear-favorites')?.addEventListener('click', () => {
      this.clearAllFavorites();
    });

    document.getElementById('export-favorites')?.addEventListener('click', () => {
      this.exportFavorites();
    });

    document.getElementById('force-sync')?.addEventListener('click', () => {
      this.forceSync();
    });

    // Push notification controls
    document.getElementById('push-toggle-btn')?.addEventListener('click', () => {
      window.pushNotificationService?.toggleSubscription();
    });

    document.getElementById('test-notification')?.addEventListener('click', () => {
      window.pushNotificationService?.testNotification();
    });

    // Online/offline status
    window.addEventListener('online', () => this.updateSyncStatus());
    window.addEventListener('offline', () => this.updateSyncStatus());
  }

  async loadFavorites() {
    try {
      this.showLoading(true);
      
      if (!window.indexedDBService) {
        throw new Error('IndexedDB service not available');
      }

      this.favorites = await window.indexedDBService.getFavorites();
      console.log('Loaded favorites:', this.favorites.length);
      
      this.filterAndDisplayFavorites();
      this.updateStats();
      
    } catch (error) {
      console.error('Error loading favorites:', error);
      this.showError('Gagal memuat favorit: ' + error.message);
    } finally {
      this.showLoading(false);
    }
  }

  filterAndDisplayFavorites() {
    // Apply search filter
    this.filteredFavorites = this.favorites.filter(favorite => {
      if (!this.searchQuery) return true;
      
      const story = favorite.storyData;
      return (
        story.name?.toLowerCase().includes(this.searchQuery) ||
        story.description?.toLowerCase().includes(this.searchQuery)
      );
    });

    // Apply sorting
    this.filteredFavorites.sort((a, b) => {
      let valueA, valueB;
      
      if (this.currentSort === 'addedAt') {
        valueA = new Date(a.addedAt);
        valueB = new Date(b.addedAt);
      } else if (this.currentSort === 'createdAt') {
        valueA = new Date(a.storyData.createdAt);
        valueB = new Date(b.storyData.createdAt);
      } else if (this.currentSort === 'name') {
        valueA = a.storyData.name?.toLowerCase() || '';
        valueB = b.storyData.name?.toLowerCase() || '';
      }

      if (this.sortOrder === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    this.displayFavorites();
  }

  displayFavorites() {
    const favoritesGrid = document.getElementById('favorites-grid');
    const emptyState = document.getElementById('empty-state');
    
    if (!favoritesGrid) return;

    if (this.filteredFavorites.length === 0) {
      favoritesGrid.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';
    favoritesGrid.style.display = 'grid';

    favoritesGrid.innerHTML = this.filteredFavorites.map(favorite => 
      this.renderFavoriteCard(favorite)
    ).join('');

    // Add event listeners to cards
    this.setupFavoriteCardListeners();
  }

  renderFavoriteCard(favorite) {
    const story = favorite.storyData;
    const addedDate = new Date(favorite.addedAt).toLocaleDateString('id-ID');
    const storyDate = new Date(story.createdAt).toLocaleDateString('id-ID');
    
    return `
      <article class="favorite-card" data-story-id="${story.id}">
        <div class="favorite-image">
          ${story.photoUrl 
            ? `<img src="${story.photoUrl}" alt="Foto cerita ${story.name}" loading="lazy" />` 
            : '<div class="placeholder-image">📷</div>'
          }
        </div>
        
        <div class="favorite-content">
          <h3 class="favorite-title">${this.escapeHtml(story.name || 'Cerita tanpa judul')}</h3>
          <p class="favorite-description">
            ${this.escapeHtml(this.truncateText(story.description || '', 100))}
          </p>
          
          <div class="favorite-meta">
            <span class="story-date">📅 ${storyDate}</span>
            <span class="added-date">❤️ ${addedDate}</span>
            ${story.lat && story.lon ? '<span class="has-location">📍 Lokasi</span>' : ''}
          </div>
        </div>
        
        <div class="favorite-actions">
          <button class="btn btn-sm btn-primary view-story" data-story-id="${story.id}">
            👁️ Lihat
          </button>
          ${story.lat && story.lon 
            ? `<button class="btn btn-sm btn-info view-map" data-lat="${story.lat}" data-lon="${story.lon}">
                 🗺️ Peta
               </button>` 
            : ''
          }
          <button class="btn btn-sm btn-danger remove-favorite" data-story-id="${story.id}">
            🗑️ Hapus
          </button>
        </div>
      </article>
    `;
  }

  setupFavoriteCardListeners() {
    // View story buttons
    document.querySelectorAll('.view-story').forEach(button => {
      button.addEventListener('click', (e) => {
        const storyId = e.target.getAttribute('data-story-id');
        window.location.hash = `#/stories/${storyId}`;
      });
    });

    // View map buttons
    document.querySelectorAll('.view-map').forEach(button => {
      button.addEventListener('click', (e) => {
        const lat = e.target.getAttribute('data-lat');
        const lon = e.target.getAttribute('data-lon');
        window.location.hash = `#/stories?lat=${lat}&lon=${lon}`;
      });
    });

    // Remove favorite buttons
    document.querySelectorAll('.remove-favorite').forEach(button => {
      button.addEventListener('click', async (e) => {
        const storyId = e.target.getAttribute('data-story-id');
        await this.removeFavorite(storyId);
      });
    });
  }

  async removeFavorite(storyId) {
    if (!confirm('Apakah Anda yakin ingin menghapus cerita ini dari favorit?')) {
      return;
    }

    try {
      await window.indexedDBService.removeFromFavorites(storyId);
      this.showMessage('Cerita dihapus dari favorit', 'success');
      await this.loadFavorites(); // Reload favorites
    } catch (error) {
      console.error('Error removing favorite:', error);
      this.showMessage('Gagal menghapus favorit: ' + error.message, 'error');
    }
  }

  async clearAllFavorites() {
    if (!confirm('Apakah Anda yakin ingin menghapus SEMUA cerita favorit? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }

    try {
      // Clear favorites by removing each one
      for (const favorite of this.favorites) {
        await window.indexedDBService.removeFromFavorites(favorite.storyId);
      }
      
      this.showMessage('Semua favorit berhasil dihapus', 'success');
      await this.loadFavorites(); // Reload favorites
    } catch (error) {
      console.error('Error clearing favorites:', error);
      this.showMessage('Gagal menghapus semua favorit: ' + error.message, 'error');
    }
  }

  async exportFavorites() {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        totalFavorites: this.favorites.length,
        favorites: this.favorites
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `story-catalog-favorites-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showMessage('Favorit berhasil diekspor', 'success');
    } catch (error) {
      console.error('Error exporting favorites:', error);
      this.showMessage('Gagal mengekspor favorit: ' + error.message, 'error');
    }
  }

  async forceSync() {
    try {
      this.showMessage('Memulai sinkronisasi...', 'info');
      await window.syncService?.forcSync();
      this.showMessage('Sinkronisasi selesai', 'success');
      this.updateSyncStatus();
    } catch (error) {
      console.error('Error during force sync:', error);
      this.showMessage('Gagal melakukan sinkronisasi: ' + error.message, 'error');
    }
  }

  updateSyncStatus() {
    const syncStatus = document.getElementById('sync-status');
    const offlineIndicator = document.getElementById('offline-indicator');
    const forceSyncBtn = document.getElementById('force-sync');

    if (!syncStatus) return;

    const isOnline = navigator.onLine;
    
    if (isOnline) {
      syncStatus.textContent = '🟢 Online';
      syncStatus.className = 'sync-status online';
      offlineIndicator.style.display = 'none';
      
      // Show sync button if there might be pending changes
      window.syncService?.hasPendingChanges().then(hasPending => {
        if (forceSyncBtn) {
          forceSyncBtn.style.display = hasPending ? 'inline-block' : 'none';
        }
      });
    } else {
      syncStatus.textContent = '🔴 Offline';
      syncStatus.className = 'sync-status offline';
      offlineIndicator.style.display = 'block';
      if (forceSyncBtn) {
        forceSyncBtn.style.display = 'none';
      }
    }
  }

  async updateStats() {
    try {
      const totalElement = document.getElementById('total-favorites');
      const thisMonthElement = document.getElementById('this-month');
      const storageElement = document.getElementById('storage-used');

      if (totalElement) {
        totalElement.textContent = this.favorites.length;
      }

      // Calculate this month's additions
      const thisMonth = new Date();
      const startOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
      const thisMonthCount = this.favorites.filter(f => 
        new Date(f.addedAt) >= startOfMonth
      ).length;

      if (thisMonthElement) {
        thisMonthElement.textContent = thisMonthCount;
      }

      // Get storage stats
      if (window.indexedDBService) {
        const stats = await window.indexedDBService.getDBStats();
        if (storageElement) {
          storageElement.textContent = `${stats.totalSize} KB`;
        }
      }

    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }

  showLoading(show) {
    const favoritesGrid = document.getElementById('favorites-grid');
    if (!favoritesGrid) return;

    if (show) {
      favoritesGrid.innerHTML = '<div class="loading-message">Memuat favorit...</div>';
    }
  }

  showError(message) {
    const favoritesGrid = document.getElementById('favorites-grid');
    if (!favoritesGrid) return;

    favoritesGrid.innerHTML = `
      <div class="error-message">
        <p>❌ ${message}</p>
        <button onclick="location.reload()" class="btn btn-primary">Muat Ulang</button>
      </div>
    `;
  }

  showMessage(message, type = 'info') {
    // Use global message function if available
    if (typeof window.showMessage === 'function') {
      window.showMessage(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

export default FavoritesPage;