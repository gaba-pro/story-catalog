// Push Notification Service
class PushNotificationService {
  constructor() {
    // VAPID public key from Dicoding Story API
  // VAPID public key sesuai dokumentasi Story API
  this.vapidPublicKey = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';
    this.isSubscribed = false;
    this.registration = null;
    this.subscription = null;
  }

  // Initialize push notifications
  async initialize() {
    try {
      // Check if service worker is supported
      if (!('serviceWorker' in navigator)) {
        console.warn('Service worker not supported');
        return false;
      }

      // Check if push messaging is supported
      if (!('PushManager' in window)) {
        console.warn('Push messaging not supported');
        return false;
      }

      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', this.registration);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Check current subscription status
      await this.checkSubscription();

      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  // Check current subscription status
  async checkSubscription() {
    try {
      if (!this.registration) return;

      this.subscription = await this.registration.pushManager.getSubscription();
      this.isSubscribed = !!this.subscription;

      console.log('Current subscription status:', this.isSubscribed);
      
      // Update UI
      this.updateUI();
      
      return this.isSubscribed;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  }

  // Subscribe to push notifications
  async subscribe() {
    try {
      // Request notification permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Convert VAPID key
      const applicationServerKey = this.urlB64ToUint8Array(this.vapidPublicKey);

      // Subscribe to push manager
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

      console.log('Push subscription successful:', this.subscription);

      // Send subscription to server (if needed for your API)
      await this.sendSubscriptionToServer(this.subscription);

      this.isSubscribed = true;
      this.updateUI();

      // Show success message
      this.showMessage('Push notifications berhasil diaktifkan!', 'success');

      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      this.showMessage('Gagal mengaktifkan push notifications: ' + error.message, 'error');
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe() {
    try {
      if (!this.subscription) {
        console.log('No subscription to unsubscribe');
        return true;
      }

      const successful = await this.subscription.unsubscribe();
      
      if (successful) {
        console.log('Successfully unsubscribed from push notifications');
        this.subscription = null;
        this.isSubscribed = false;
        this.updateUI();
        this.showMessage('Push notifications berhasil dinonaktifkan!', 'info');
      }

      return successful;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      this.showMessage('Gagal menonaktifkan push notifications: ' + error.message, 'error');
      return false;
    }
  }

  // Toggle subscription
  async toggleSubscription() {
    if (this.isSubscribed) {
      await this.unsubscribe();
    } else {
      await this.subscribe();
    }
  }

  // Request notification permission
  async requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission;
    }
    return 'denied';
  }

  // Send subscription to server (API integration sesuai instruksi)
  async sendSubscriptionToServer(subscription) {
    try {
      // Format sesuai dokumentasi Story API
      const body = {
        endpoint: subscription.endpoint,
        keys: subscription.keys || (subscription.toJSON ? subscription.toJSON().keys : undefined)
      };
      const response = await fetch('https://story-api.dicoding.dev/v1/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error('Gagal mendaftarkan endpoint notifikasi ke server');
      }
      console.log('Subscription sent to server');
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  // Convert VAPID key format
  urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  // Update UI based on subscription status
  updateUI() {
    const toggleButton = document.getElementById('push-toggle-btn');
    const statusText = document.getElementById('push-status');

    if (toggleButton) {
      toggleButton.textContent = this.isSubscribed 
        ? '🔔 Nonaktifkan Notifikasi' 
        : '🔕 Aktifkan Notifikasi';
      toggleButton.classList.toggle('active', this.isSubscribed);
    }

    if (statusText) {
      statusText.textContent = this.isSubscribed 
        ? 'Push notifications aktif' 
        : 'Push notifications tidak aktif';
      statusText.className = this.isSubscribed ? 'status-active' : 'status-inactive';
    }
  }

  // Show message to user
  showMessage(message, type = 'info') {
    // Create or update message element
    let messageEl = document.getElementById('push-message');
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.id = 'push-message';
      messageEl.className = 'push-message';
      document.body.appendChild(messageEl);
    }

    messageEl.textContent = message;
    messageEl.className = `push-message ${type}`;
    messageEl.style.display = 'block';

    // Auto hide after 5 seconds
    setTimeout(() => {
      messageEl.style.display = 'none';
    }, 5000);
  }

  // Test push notification (for development)
  async testNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Test Story Catalog', {
        body: 'Ini adalah test push notification!',
        icon: '/favicon.png',
        tag: 'test-notification'
      });
    }
  }

  // Simulate receiving a push notification when a new story is added
  simulateNewStoryNotification(storyData) {
    if (!this.isSubscribed) return;

    // In a real app, this would come from the server
    // For demo purposes, we'll show a local notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Cerita Baru Ditambahkan!', {
        body: `"${storyData.name}" - ${storyData.description.substring(0, 50)}...`,
        icon: storyData.photoUrl || '/favicon.png',
        tag: 'new-story',
        data: {
          url: '/#/stories',
          storyId: storyData.id
        }
      });
    }
  }
}

// Export for use in other modules
export default PushNotificationService;