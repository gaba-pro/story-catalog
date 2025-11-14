// CSS imports
import '../styles/styles.css';

import App from './pages/app.js';
import { AccessibilityUtils } from './utils/accessibility.js';
import NavigationService from './services/navigation-service.js';

// Register Service Worker - PATH FIXED untuk base URL
if ('serviceWorker' in navigator) {
  console.log('Registering Service Worker...');
  
  // Gunakan base URL yang konsisten
  const swPath = '/story-catalog/sw.js';
  
  navigator.serviceWorker.register(swPath)
    .then((registration) => {
      console.log('✅ Service Worker registered successfully:', registration.scope);
      
      // Track SW state changes
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('New service worker installing:', newWorker?.state);
        
        newWorker?.addEventListener('statechange', () => {
          console.log('Service worker state changed to:', newWorker.state);
          if (newWorker.state === 'activated') {
            console.log('🎉 Service Worker activated and controlling the page!');
          }
        });
      });
      
      // Check if already controlling
      if (navigator.serviceWorker.controller) {
        console.log('✅ Service Worker is already controlling the page');
      }
    })
    .catch((error) => {
      console.error('❌ Service Worker registration failed:', error);
    });
}

// Initialize services
async function initializeServicesLazily() {
  try {
    if (typeof PushNotificationService !== 'undefined') {
      window.pushNotificationService = new PushNotificationService();
    }
    if (typeof IndexedDBService !== 'undefined') {
      window.indexedDBService = new IndexedDBService();
    }
  } catch (error) {
    console.warn('Some services could not be initialized:', error);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM Content Loaded - Starting app initialization');
  
  try {
    // Hide loading indicators
    const loadingIndicator = document.getElementById('loading-indicator');
    const initStatus = document.getElementById('initialization-status');
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    if (initStatus) initStatus.style.display = 'none';

    // Initialize core features
    AccessibilityUtils.init();
    AccessibilityUtils.setupSkipLinks();
    console.log('✓ Accessibility initialized');
    
    NavigationService.init();
    console.log('✓ Navigation service initialized');
    
    // Initialize services
    await initializeServicesLazily();
    console.log('✓ Services initialized');
    
    // Create and render app
    const app = new App({
      content: document.querySelector('#main-content'),
      drawerButton: document.querySelector('#drawer-button'),
      navigationDrawer: document.querySelector('#navigation-drawer'),
    });
    
    await app.renderPage();
    console.log('✓ App initialized and page rendered');

    // Hash change listener
    window.addEventListener('hashchange', async () => {
      await app.renderPage();
      AccessibilityUtils.announcePageChange(document.title.split(' - ')[0]);
      NavigationService.updateNavigation();
    });
    
    console.log('🎉 App successfully initialized');
    
  } catch (error) {
    console.error('❌ App initialization failed:', error);
    
    // Show error fallback
    const mainContent = document.querySelector('#main-content');
    if (mainContent) {
      mainContent.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <h1>⚠️ Gagal Memuat Aplikasi</h1>
          <p>Maaf, terjadi kesalahan saat memuat aplikasi.</p>
          <p><small>Error: ${error.message}</small></p>
          <button onclick="location.reload()" class="btn btn-primary">
            🔄 Muat Ulang Halaman
          </button>
        </div>
      `;
    }
  }
});

// Online/Offline detection
window.addEventListener('online', () => {
  console.log('App is online');
  showMessage('Koneksi internet tersedia', 'success');
});

window.addEventListener('offline', () => {
  console.log('App is offline');
  showMessage('Anda sedang offline', 'warning');
});

// Utility function untuk show message
function showMessage(message, type = 'info') {
  // Remove existing message
  const existingMsg = document.querySelector('.global-message');
  if (existingMsg) existingMsg.remove();
  
  const messageEl = document.createElement('div');
  messageEl.className = `global-message ${type} show`;
  messageEl.textContent = message;
  messageEl.setAttribute('role', 'alert');
  messageEl.setAttribute('aria-live', 'polite');
  
  document.body.appendChild(messageEl);
  
  setTimeout(() => {
    messageEl.remove();
  }, 4000);
}