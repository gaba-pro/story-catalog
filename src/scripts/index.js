// CSS imports
import '../styles/styles.css';

import App from './pages/app.js';
import { AccessibilityUtils } from './utils/accessibility.js';
import NavigationService from './services/navigation-service.js';
import PushNotificationService from './services/push-notification-service.js';
import IndexedDBService from './services/indexeddb-service.js';
import SyncService from './services/sync-service.js';

// Global service instances  
window.pushNotificationService = null;
window.indexedDBService = null;
window.syncService = null;

// Initialize services lazily
async function initializeServicesLazily() {
  try {
    // Only initialize if modules are available
    if (typeof PushNotificationService !== 'undefined') {
      window.pushNotificationService = new PushNotificationService();
    }
    if (typeof IndexedDBService !== 'undefined') {
      window.indexedDBService = new IndexedDBService();
    }
    if (typeof SyncService !== 'undefined') {
      window.syncService = new SyncService();
    }
  } catch (error) {
    console.warn('Some services could not be initialized:', error);
  }
}

// Register Service Worker as soon as possible (PWA & Push Notification requirement)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM Content Loaded - Starting app initialization');
  
  try {
    // Initialize accessibility features
    AccessibilityUtils.init();
    AccessibilityUtils.setupSkipLinks();
    console.log('✓ Accessibility initialized');
    
    // Initialize navigation service for dynamic menu
    NavigationService.init();
    console.log('✓ Navigation service initialized');
    
    // Initialize services
    await initializeServicesLazily();
    console.log('✓ Services initialized');
    
    // Initialize PWA services (optional)
    try {
      await initializePWAServices();
      console.log('✓ PWA services initialized');
    } catch (error) {
      console.warn('⚠️ PWA services initialization skipped:', error.message);
    }
    
    const app = new App({
      content: document.querySelector('#main-content'),
      drawerButton: document.querySelector('#drawer-button'),
      navigationDrawer: document.querySelector('#navigation-drawer'),
    });
    
    console.log('✓ App instance created');
    
    await app.renderPage();
    console.log('✓ Initial page rendered');

    window.addEventListener('hashchange', async () => {
      console.log('Hash changed to:', window.location.hash);
      await app.renderPage();
      
      // Announce page changes for screen readers
      const pageTitle = document.title.split(' - ')[0];
      AccessibilityUtils.announcePageChange(pageTitle);
      
      // Update navigation after page change
      NavigationService.updateNavigation();
    });
    
    // Handle authentication state changes
    document.addEventListener('authStateChange', () => {
      NavigationService.updateNavigation();
    });
    
    // Handle custom events for accessibility
    document.addEventListener('highlightMarker', (event) => {
      // This would be handled by the map service
      console.log('Highlight marker requested for story:', event.detail);
    });
    
    console.log('🎉 App successfully initialized');
    
  } catch (error) {
    console.error('❌ App initialization failed:', error);
    
    // Fallback content
    const mainContent = document.querySelector('#main-content');
    if (mainContent) {
      mainContent.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <h1>⚠️ Initialization Error</h1>
          <p>Sorry, the application failed to initialize.</p>
          <p>Error: ${error.message}</p>
          <button onclick="location.reload()" style="padding: 0.5rem 1rem; margin-top: 1rem;">
            🔄 Reload Page
          </button>
        </div>
      `;
    }
  }
});

// Initialize PWA services
async function initializePWAServices() {
  if (!window.indexedDBService || !window.syncService || !window.pushNotificationService) {
    console.log('Services not available, skipping PWA initialization');
    return;
  }
  
  try {
    console.log('Initializing PWA services...');
    
    // Initialize IndexedDB
    try {
      await window.indexedDBService.initialize();
      console.log('✓ IndexedDB initialized');
    } catch (error) {
      console.warn('⚠️ IndexedDB initialization failed:', error);
    }
    
    // Initialize Sync Service  
    try {
      await window.syncService.initialize();
      console.log('✓ Sync Service initialized');
    } catch (error) {
      console.warn('⚠️ Sync Service initialization failed:', error);
    }
    
    // Initialize Push Notifications
    try {
      const pushSupported = await window.pushNotificationService.initialize();
      if (pushSupported) {
        console.log('✓ Push Notifications initialized');
      } else {
        console.warn('⚠️ Push Notifications not supported');
      }
    } catch (error) {
      console.warn('⚠️ Push Notifications initialization failed:', error);
    }
    
    // Setup PWA install prompt
    setupPWAInstallPrompt();
    
    // Setup sync listeners  
    setupSyncListeners();
    
    console.log('PWA services setup completed');
    
  } catch (error) {
    console.error('Critical error in PWA services initialization:', error);
    // Don't throw - let app continue without PWA features
  }
}

// Setup PWA install prompt
function setupPWAInstallPrompt() {
  let deferredPrompt;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA install prompt available');
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton(deferredPrompt);
  });
  
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    hideInstallButton();
    showMessage('Aplikasi berhasil diinstall!', 'success');
  });
}

// Show install button
function showInstallButton(deferredPrompt) {
  // Create install button if not exists
  let installButton = document.getElementById('pwa-install-btn');
  if (!installButton) {
    installButton = document.createElement('button');
    installButton.id = 'pwa-install-btn';
    installButton.className = 'pwa-install-btn';
    installButton.innerHTML = '📱 Install App';
    installButton.setAttribute('aria-label', 'Install aplikasi ke perangkat');
    document.body.appendChild(installButton);
  }
  
  installButton.style.display = 'block';
  
  installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      deferredPrompt = null;
      hideInstallButton();
    }
  });
}

// Hide install button
function hideInstallButton() {
  const installButton = document.getElementById('pwa-install-btn');
  if (installButton) {
    installButton.style.display = 'none';
  }
}

// Setup sync event listeners
function setupSyncListeners() {
  window.syncService.addSyncListener((event, data) => {
    switch (event) {
      case 'online':
        showMessage('Koneksi kembali! Sinkronisasi data...', 'info');
        break;
      case 'offline':
        showMessage('Tidak ada koneksi. Mode offline aktif.', 'warning');
        break;
      case 'sync-complete':
        if (data.syncedCount > 0) {
          showMessage(`${data.syncedCount} data berhasil disinkronisasi`, 'success');
        }
        break;
      case 'sync-error':
        showMessage('Gagal melakukan sinkronisasi data', 'error');
        break;
    }
  });
}

// Show message to user
function showMessage(message, type = 'info', duration = 5000) {
  // Create or update message element
  let messageEl = document.getElementById('global-message');
  if (!messageEl) {
    messageEl = document.createElement('div');
    messageEl.id = 'global-message';
    messageEl.className = 'global-message';
    messageEl.setAttribute('role', 'alert');
    messageEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(messageEl);
  }

  messageEl.textContent = message;
  messageEl.className = `global-message ${type} show`;

  // Auto hide after duration
  setTimeout(() => {
    messageEl.classList.remove('show');
  }, duration);
}
