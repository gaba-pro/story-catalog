// CSS imports
import '../styles/styles.css';

// Import dari lokasi yang sesuai dengan struktur folder Anda
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

// Register Service Worker as soon as possible (PWA & Push Notification requirement)
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    console.log('🔧 Attempting to register Service Worker...');
    
    // Path service worker yang benar untuk struktur folder Anda
    const swPaths = [
      '/story-catalog/sw.js',        // Untuk production
      '/sw.js',                       // Untuk development
      './sw.js',                      // Relative path
      '../sw.js'                      // Relative path dari scripts/
    ];

    const registerSW = async (path) => {
      try {
        console.log(`📁 Trying to register Service Worker from: ${path}`);
        const registration = await navigator.serviceWorker.register(path, {
          scope: '/story-catalog/'
        });
        console.log('✅ Service Worker registered successfully from:', path);
        return registration;
      } catch (error) {
        console.warn(`❌ Failed to register from ${path}:`, error.message);
        return null;
      }
    };

    // Coba semua path secara berurutan
    const tryRegister = async () => {
      for (const path of swPaths) {
        const registration = await registerSW(path);
        if (registration) {
          return registration;
        }
      }
      // Fallback: Coba register tanpa path spesifik
      try {
        console.log('🔄 Trying fallback registration...');
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Fallback registration successful');
        return registration;
      } catch (fallbackError) {
        console.error('❌ All Service Worker registration attempts failed');
        throw fallbackError;
      }
    };

    tryRegister()
      .then((registration) => {
        console.log('🎉 Service Worker successfully registered:', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('🔄 New service worker found:', newWorker);
          
          newWorker.addEventListener('statechange', () => {
            console.log('📊 New service worker state:', newWorker.state);
            if (newWorker.state === 'activated') {
              console.log('✅ New Service Worker activated');
            }
          });
        });
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
        // Tetap lanjutkan tanpa service worker
        showMessage('Beberapa fitur PWA mungkin tidak tersedia', 'warning');
      });
  } else {
    console.warn('❌ Service Worker not supported in this browser');
  }
}

// Panggil registrasi service worker segera
registerServiceWorker();

// Initialize services lazily
async function initializeServicesLazily() {
  try {
    console.log('🔄 Initializing services...');

    // Initialize Push Notification Service FIRST
    if (typeof PushNotificationService !== 'undefined') {
      window.pushNotificationService = new PushNotificationService();
      
      // Tunggu service worker siap dulu
      console.log('⏳ Waiting for service worker to be ready...');
      await new Promise(resolve => {
        if (navigator.serviceWorker.controller) {
          resolve();
        } else {
          navigator.serviceWorker.ready.then(resolve);
        }
      });
      
      console.log('✅ Service Worker is ready, initializing push notifications...');
      
      try {
        const pushInitialized = await window.pushNotificationService.initialize();
        console.log('📱 Push Notification Service initialized:', pushInitialized);
        
        if (pushInitialized) {
          console.log('✅ Push Notification Service fully initialized');
        } else {
          console.warn('⚠️ Push Notification Service not supported or failed');
        }
      } catch (error) {
        console.warn('⚠️ Push Notification Service initialization failed:', error);
      }
      
      // Setup notification button regardless
      setupNotificationButton();
    } else {
      console.warn('⚠️ PushNotificationService not available');
      setupNotificationButton();
    }

    // Initialize other services setelah push notification
    if (typeof IndexedDBService !== 'undefined') {
      window.indexedDBService = new IndexedDBService();
      try {
        await window.indexedDBService.initialize();
        console.log('✅ IndexedDB Service initialized');
      } catch (error) {
        console.warn('⚠️ IndexedDB Service initialization failed:', error);
      }
    }

    if (typeof SyncService !== 'undefined') {
      window.syncService = new SyncService();
      try {
        await window.syncService.initialize();
        console.log('✅ Sync Service initialized');
      } catch (error) {
        console.warn('⚠️ Sync Service initialization failed:', error);
      }
    }

    console.log('✅ All services initialized');
  } catch (error) {
    console.warn('Some services could not be initialized:', error);
    setupNotificationButton();
  }
}

// Setup notification button - ALWAYS CALL THIS
function setupNotificationButton() {
  console.log('🔧 Setting up notification button...');
  
  // Create notification button if not exists
  let notificationButton = document.getElementById('notification-toggle-btn');
  if (!notificationButton) {
    console.log('🆕 Creating new notification button');
    notificationButton = document.createElement('button');
    notificationButton.id = 'notification-toggle-btn';
    notificationButton.className = 'pwa-button notification-btn';
    notificationButton.innerHTML = '🔕 Notifikasi';
    notificationButton.setAttribute('aria-label', 'Toggle push notifications');
    notificationButton.setAttribute('title', 'Aktifkan/Nonaktifkan notifikasi');
    
    // Insert before install button if exists, otherwise append to body
    const installButton = document.getElementById('pwa-install-btn');
    if (installButton) {
      console.log('📌 Inserting notification button before install button');
      document.body.insertBefore(notificationButton, installButton);
    } else {
      console.log('📌 Appending notification button to body');
      document.body.appendChild(notificationButton);
    }
  } else {
    console.log('✅ Notification button already exists');
  }

  // Force enable the button
  notificationButton.disabled = false;
  console.log('🔓 Button disabled status:', notificationButton.disabled);

  // Update button state based on subscription status
  updateNotificationButton();

  // Add click event
  notificationButton.addEventListener('click', async () => {
    console.log('🖱️ Notification button clicked');
    
    if (!window.pushNotificationService) {
      console.log('❌ Push notification service not available');
      showMessage('Layanan notifikasi tidak tersedia', 'error');
      return;
    }

    try {
      console.log('⏳ Starting subscription toggle...');
      notificationButton.disabled = true;
      notificationButton.innerHTML = '⏳...';
      
      await window.pushNotificationService.toggleSubscription();
      
      console.log('✅ Subscription toggle completed');
      
    } catch (error) {
      console.error('❌ Error toggling notification:', error);
      showMessage('Gagal mengubah pengaturan notifikasi: ' + error.message, 'error');
    } finally {
      console.log('🔓 Re-enabling button');
      notificationButton.disabled = false;
      updateNotificationButton();
    }
  });

  console.log('✅ Notification button setup completed');
}

// Update notification button appearance
function updateNotificationButton() {
  console.log('🎨 Updating notification button appearance');
  
  const notificationButton = document.getElementById('notification-toggle-btn');
  if (!notificationButton) {
    console.log('❌ Notification button not found for update');
    return;
  }

  // Check if push service is available
  if (!window.pushNotificationService) {
    console.log('⚠️ Push service not available, setting button to info state');
    notificationButton.innerHTML = '📱 Notifikasi';
    notificationButton.classList.remove('active');
    notificationButton.setAttribute('aria-label', 'Notifikasi tidak tersedia');
    notificationButton.setAttribute('title', 'Layanan notifikasi tidak tersedia');
    notificationButton.disabled = false; // Tetap enabled untuk feedback
    return;
  }

  const isSubscribed = window.pushNotificationService.isSubscribed;
  console.log('📊 Current subscription status:', isSubscribed);
  
  notificationButton.innerHTML = isSubscribed ? '🔔 Notifikasi' : '🔕 Notifikasi';
  notificationButton.classList.toggle('active', isSubscribed);
  notificationButton.setAttribute('aria-label', 
    isSubscribed ? 'Nonaktifkan notifikasi' : 'Aktifkan notifikasi'
  );
  notificationButton.setAttribute('title',
    isSubscribed ? 'Notifikasi aktif - Klik untuk menonaktifkan' : 'Notifikasi tidak aktif - Klik untuk mengaktifkan'
  );
  
  // PASTIKAN TOMBOL SELALU ENABLED
  notificationButton.disabled = false;
  
  console.log('✅ Button updated - disabled:', notificationButton.disabled);
}

// ... (sisanya tetap sama)

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

// ... (fungsi setupPWAInstallPrompt, showInstallButton, dll tetap sama)

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
  console.log('Setting up install button...');
  
  // Create install button if not exists
  let installButton = document.getElementById('pwa-install-btn');
  if (!installButton) {
    console.log('Creating new install button');
    installButton = document.createElement('button');
    installButton.id = 'pwa-install-btn';
    installButton.className = 'pwa-button install-btn';
    installButton.innerHTML = '📱 Install App';
    installButton.setAttribute('aria-label', 'Install aplikasi ke perangkat');
    document.body.appendChild(installButton);
  } else {
    console.log('Install button already exists');
  }
  
  installButton.style.display = 'block';
  console.log('Install button displayed');
  
  installButton.addEventListener('click', async () => {
    console.log('Install button clicked');
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
    console.log('Install button hidden');
  }
}

// Setup sync event listeners
function setupSyncListeners() {
  if (window.syncService) {
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
}

// Show message to user
function showMessage(message, type = 'info', duration = 5000) {
  console.log(`Showing message: ${message} (${type})`);
  
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

// Initialize PWA features after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded - setting up PWA features');
  setupPWAInstallPrompt();
  setupSyncListeners();
});

// Force setup notification button after a delay as fallback
setTimeout(() => {
  console.log('Fallback: Checking if notification button exists...');
  const notificationButton = document.getElementById('notification-toggle-btn');
  if (!notificationButton) {
    console.log('Fallback: Notification button still not found, creating it...');
    setupNotificationButton();
  }
}, 2000);