import { BasePage, BasePresenter } from '../../utils/base-classes.js';
import ApiService from '../../services/api-service.js';
import MapService from '../../services/map-service.js';
import CameraService from '../../services/camera-service.js';

class AddStoryPresenter extends BasePresenter {
  constructor(view) {
    super(view);
    this.mapService = null;
    this.cameraService = null;
    this.selectedLocation = null;
    this.selectedImage = null;
  }

  async init() {
    // Check authentication
    if (!ApiService.isAuthenticated()) {
      this.showError('Anda harus login terlebih dahulu');
      setTimeout(() => {
        window.location.hash = '#/login';
      }, 1500);
      return;
    }

    await this.initMap();
    this.initCamera();
    this.setupEventListeners();
  }

  async initMap() {
  try {
    // Reset existing map instance if any
    if (this.mapService) {
      this.mapService.reset();
    }

    this.mapService = new MapService('location-map');
    await this.mapService.initMap();

    // Set up click handler for location selection
    this.mapService.onClick((lat, lon) => {
      this.selectLocation(lat, lon);
    });

    console.log('Map initialized successfully');
  } catch (error) {
    console.error('Failed to initialize map:', error);
    this.showError('Gagal memuat peta');
  }
}

  initCamera() {
    this.cameraService = new CameraService();
  }

  selectLocation(lat, lon) {
    this.selectedLocation = { lat, lon };
    
    // Add temporary marker
    this.mapService.addTemporaryMarker(lat, lon);
    
    // Update form fields
    document.getElementById('latitude').value = lat.toFixed(6);
    document.getElementById('longitude').value = lon.toFixed(6);
    
    // Update location info
    this.view.updateLocationInfo(lat, lon);
    
    this.showSuccess(`Lokasi dipilih: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
  }

  setupEventListeners() {
    // Image upload handling
    const imageInput = document.getElementById('image');
    const imagePreview = document.getElementById('image-preview');
    
    imageInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        this.handleImageSelect(file);
      }
    });

    // Camera button
    const cameraBtn = document.getElementById('camera-btn');
    cameraBtn.addEventListener('click', () => {
      this.openCamera();
    });

    // Use current location button
    const currentLocationBtn = document.getElementById('current-location-btn');
    currentLocationBtn.addEventListener('click', () => {
      this.getCurrentLocation();
    });

    // Form submission
    const form = document.getElementById('add-story-form');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.handleSubmit(new FormData(form));
    });
  }

  handleImageSelect(file) {
    // Validate file
    if (!file.type.startsWith('image/')) {
      this.showError('File harus berupa gambar');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      this.showError('Ukuran file maksimal 5MB');
      return;
    }

    this.selectedImage = file;
    this.view.updateImagePreview(file);
  }

  async openCamera() {
    try {
      const photoFile = await this.cameraService.takePhoto();
      if (photoFile) {
        this.selectedImage = photoFile;
        this.view.updateImagePreview(photoFile);
        this.showSuccess('Foto berhasil diambil!');
      }
    } catch (error) {
      this.showError('Gagal mengakses kamera: ' + error.message);
    }
  }

  getCurrentLocation() {
    if (!navigator.geolocation) {
      this.showError('Geolocation tidak didukung browser Anda');
      return;
    }

    this.showLoading();
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.hideLoading();
        const { latitude, longitude } = position.coords;
        this.selectLocation(latitude, longitude);
        this.mapService.setView(latitude, longitude, 15);
      },
      (error) => {
        this.hideLoading();
        let message = 'Gagal mendapatkan lokasi';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Akses lokasi ditolak. Silakan pilih lokasi manual di peta.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Informasi lokasi tidak tersedia';
            break;
          case error.TIMEOUT:
            message = 'Request lokasi timeout';
            break;
        }
        
        this.showError(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }

  async handleSubmit(formData) {
    try {
      // Validation
      if (!this.selectedImage) {
        this.showError('Silakan pilih atau ambil foto terlebih dahulu');
        return;
      }

      if (!this.selectedLocation) {
        this.showError('Silakan pilih lokasi di peta');
        return;
      }

      const description = formData.get('description');
      if (!description || description.trim().length < 10) {
        this.showError('Deskripsi minimal 10 karakter');
        return;
      }

      this.showLoading();

      // Prepare story data
      const storyData = {
        description: description.trim(),
        photo: this.selectedImage,
        lat: this.selectedLocation.lat,
        lon: this.selectedLocation.lon,
        name: description.trim().split(' ').slice(0, 5).join(' '), // Use first words as title
      };

      // Check if online or offline
      const isOnline = navigator.onLine;

      if (isOnline) {
        try {
          // Try to submit online first
          const apiFormData = new FormData();
          apiFormData.append('description', storyData.description);
          apiFormData.append('photo', storyData.photo);
          apiFormData.append('lat', storyData.lat);
          apiFormData.append('lon', storyData.lon);

          const result = await ApiService.addStory(apiFormData);
          
          if (result.error === false) {
            this.hideLoading();
            this.showSuccess('Cerita berhasil ditambahkan!');
            
            // Trigger push notification simulation - WITH PROPER ERROR HANDLING
            this.showLocalNotification(storyData);
            
            setTimeout(() => {
              window.location.hash = '#/stories';
            }, 2000);
            return;
          } else {
            throw new Error(result.message || 'Failed to submit story online');
          }
        } catch (onlineError) {
          console.warn('Online submission failed, falling back to offline mode:', onlineError);
          // Fall through to offline mode
        }
      }

      // Offline mode or online submission failed
      await this.handleOfflineSubmission(storyData);

    } catch (error) {
      this.hideLoading();
      this.showError('Terjadi kesalahan: ' + error.message);
    }
  }

  // Handle offline submission
  async handleOfflineSubmission(storyData) {
    try {
      if (window.syncService && typeof window.syncService.addStoryOffline === 'function') {
        await window.syncService.addStoryOffline(storyData);
        this.hideLoading();
        this.showSuccess('Cerita disimpan offline! Akan disinkronisasi saat koneksi kembali.');
        
        // Show local notification for offline save
        this.showLocalNotification({
          ...storyData,
          name: storyData.name + ' (Offline)'
        });
        
        setTimeout(() => {
          window.location.hash = '#/stories';
        }, 2000);
      } else {
        throw new Error('Service offline tidak tersedia');
      }
    } catch (offlineError) {
      this.hideLoading();
      this.showError('Gagal menyimpan cerita: ' + offlineError.message);
    }
  }

  // Show local notification with proper error handling
  showLocalNotification(storyData) {
    try {
      console.log('📢 Attempting to show local notification...');
      
      // Check if push notification service is available and has the method
      if (window.pushNotificationService) {
        // Check if the method exists
        if (typeof window.pushNotificationService.simulateNewStoryNotification === 'function') {
          window.pushNotificationService.simulateNewStoryNotification(storyData);
          return;
        } 
        // Check for alternative method name
        else if (typeof window.pushNotificationService.showLocalNotification === 'function') {
          window.pushNotificationService.showLocalNotification(
            'Cerita Baru Ditambahkan',
            storyData.description,
            { id: storyData.id || Date.now().toString() }
          );
          return;
        }
      }
      
      // Fallback: Direct browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('📖 Cerita Baru Ditambahkan', {
          body: storyData.description.substring(0, 100) + '...',
          icon: '/images/icon-192x192.svg',
          tag: 'new-story'
        });
        
        notification.onclick = () => {
          window.focus();
          window.location.hash = '#/stories';
          notification.close();
        };
        
        console.log('✅ Local notification shown successfully');
      } else {
        console.log('ℹ️ Notification not available or permission not granted');
      }
      
    } catch (notificationError) {
      console.warn('⚠️ Failed to show local notification:', notificationError);
      // Don't fail the whole process if notification fails
    }
  }
}

class AddStoryPage extends BasePage {
  constructor() {
    super();
    this.title = 'Tambah Cerita - Story Catalog';
    this.presenter = new AddStoryPresenter(this);
  }

  async render() {
    return `
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">➕ Tambah Cerita Baru</h1>
          <p class="page-description">Bagikan pengalaman dan cerita menarik Anda</p>
        </div>

        <div class="add-story-container">
          <form id="add-story-form" class="story-form" novalidate>
            
            <!-- Image Upload Section -->
            <div class="card">
              <div class="card-header">
                <h2 class="card-title">📷 Pilih Foto</h2>
                <p>Upload foto atau ambil langsung dengan kamera</p>
              </div>
              
              <div class="image-upload-section">
                <div class="upload-options">
                  <label for="image" class="upload-btn btn btn-outline">
                    📁 Pilih dari Galeri
                    <input 
                      type="file" 
                      id="image" 
                      name="image" 
                      accept="image/*" 
                      hidden 
                      required
                      aria-describedby="image-help"
                    >
                  </label>
                  
                  <button type="button" id="camera-btn" class="btn btn-secondary">
                    📷 Ambil Foto
                  </button>
                </div>
                
                <div id="image-help" class="form-help">
                  Format: JPG, PNG, GIF. Maksimal 5MB
                </div>
                
                <div id="image-preview" class="image-preview" style="display: none;">
                  <img id="preview-img" src="" alt="Preview foto yang dipilih">
                  <div class="preview-info">
                    <span id="preview-name"></span>
                    <span id="preview-size"></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Story Details Section -->
            <div class="card">
              <div class="card-header">
                <h2 class="card-title">📝 Detail Cerita</h2>
              </div>
              
              <div class="form-group">
                <label for="description" class="form-label">Deskripsi Cerita</label>
                <textarea 
                  id="description" 
                  name="description" 
                  class="form-textarea" 
                  required 
                  aria-describedby="description-help description-error"
                  placeholder="Ceritakan pengalaman menarik Anda..."
                  minlength="10"
                  maxlength="1000"
                ></textarea>
                <div id="description-help" class="form-help">
                  Minimal 10 karakter, maksimal 1000 karakter
                </div>
                <div id="description-error" class="form-error" aria-live="polite"></div>
              </div>
            </div>

            <!-- Location Selection Section -->
            <div class="card">
              <div class="card-header">
                <h2 class="card-title">📍 Pilih Lokasi</h2>
                <p>Klik pada peta untuk memilih lokasi cerita Anda</p>
              </div>
              
              <div class="location-controls">
                <button type="button" id="current-location-btn" class="btn btn-outline">
                  🎯 Gunakan Lokasi Saat Ini
                </button>
              </div>
              
              <div id="location-map" class="map-container" role="application" aria-label="Peta untuk memilih lokasi cerita"></div>
              
              <div class="location-info">
                <div class="location-fields">
                  <div class="form-group">
                    <label for="latitude" class="form-label">Latitude</label>
                    <input 
                      type="number" 
                      id="latitude" 
                      name="latitude" 
                      class="form-input" 
                      step="any" 
                      readonly
                      aria-describedby="latitude-help"
                    >
                    <div id="latitude-help" class="form-help">Dipilih otomatis dari peta</div>
                  </div>
                  
                  <div class="form-group">
                    <label for="longitude" class="form-label">Longitude</label>
                    <input 
                      type="number" 
                      id="longitude" 
                      name="longitude" 
                      class="form-input" 
                      step="any" 
                      readonly
                      aria-describedby="longitude-help"
                    >
                    <div id="longitude-help" class="form-help">Dipilih otomatis dari peta</div>
                  </div>
                </div>
                
                <div id="location-display" class="location-display">
                  <span class="location-status">Klik pada peta untuk memilih lokasi</span>
                </div>
              </div>
            </div>

            <!-- Submit Section -->
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">
                ✅ Publikasikan Cerita
              </button>
              <a href="#/stories" class="btn btn-outline">
                ❌ Batal
              </a>
            </div>
            
          </form>
        </div>
      </div>
    `;
  }

  async afterRender() {
    await super.afterRender();
    await this.presenter.init();
  }

  updateImagePreview(file) {
    const preview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const previewName = document.getElementById('preview-name');
    const previewSize = document.getElementById('preview-size');

    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      previewName.textContent = file.name;
      previewSize.textContent = this.formatFileSize(file.size);
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  updateLocationInfo(lat, lon) {
    const locationDisplay = document.getElementById('location-display');
    locationDisplay.innerHTML = `
      <span class="location-status success">
        ✅ Lokasi dipilih: ${lat.toFixed(4)}, ${lon.toFixed(4)}
      </span>
    `;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default AddStoryPage;