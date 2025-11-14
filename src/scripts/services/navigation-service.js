import ApiService from './api-service.js';

class NavigationService {
  constructor() {
    this.navigationElement = null;
    this.authStatusCallbacks = [];
  }

  init() {
    this.navigationElement = document.getElementById('nav-list');
    this.updateNavigation();
    
    // Listen for auth changes
    window.addEventListener('authStatusChanged', () => {
      this.updateNavigation();
    });
    
    // Listen for storage changes (for logout from other tabs)
    window.addEventListener('storage', (event) => {
      if (event.key === 'token') {
        this.updateNavigation();
      }
    });
  }

  updateNavigation() {
    if (!this.navigationElement) return;

    const isAuthenticated = ApiService.isAuthenticated();
    
    if (isAuthenticated) {
      this.renderAuthenticatedNav();
    } else {
      this.renderGuestNav();
    }

    // Trigger auth status callbacks
    this.authStatusCallbacks.forEach(callback => callback(isAuthenticated));
  }

  renderGuestNav() {
    this.navigationElement.innerHTML = `
      <li role="none"><a href="#/" role="menuitem" tabindex="0">🏠 Beranda</a></li>
      <li role="none"><a href="#/stories" role="menuitem" tabindex="0">📚 Cerita</a></li>
      <li role="none"><a href="#/login" role="menuitem" tabindex="0">🔐 Masuk</a></li>
      <li role="none"><a href="#/register" role="menuitem" tabindex="0">📝 Daftar</a></li>
      <li role="none"><a href="#/about" role="menuitem" tabindex="0">ℹ️ Tentang</a></li>
    `;
  }

  renderAuthenticatedNav() {
    this.navigationElement.innerHTML = `
      <li role="none"><a href="#/" role="menuitem" tabindex="0">🏠 Beranda</a></li>
      <li role="none"><a href="#/stories" role="menuitem" tabindex="0">📚 Cerita</a></li>
      <li role="none"><a href="#/add-story" role="menuitem" tabindex="0">➕ Tambah Cerita</a></li>
      <li role="none">
        <button id="logout-btn" class="nav-logout-btn" role="menuitem" tabindex="0" aria-label="Logout dari aplikasi">
          🚪 Logout
        </button>
      </li>
      <li role="none"><a href="#/about" role="menuitem" tabindex="0">ℹ️ Tentang</a></li>
    `;

    // Add logout event listener
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', this.handleLogout.bind(this));
      logoutBtn.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this.handleLogout();
        }
      });
    }
  }

  handleLogout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
      ApiService.logout();
      this.updateNavigation();
    }
  }

  onAuthStatusChange(callback) {
    this.authStatusCallbacks.push(callback);
  }

  // Trigger auth status change event
  static triggerAuthChange() {
    window.dispatchEvent(new CustomEvent('authStatusChanged'));
  }
}

export default new NavigationService();