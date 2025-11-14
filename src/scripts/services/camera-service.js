class CameraService {
  constructor() {
    this.stream = null;
    this.video = null;
    this.canvas = null;
    this.modal = null;
  }

  async takePhoto() {
    return new Promise((resolve, reject) => {
      this.createCameraModal()
        .then(() => {
          this.setupCameraHandlers(resolve, reject);
        })
        .catch(reject);
    });
  }

  async createCameraModal() {
    // Remove existing modal if any
    const existingModal = document.getElementById('camera-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal HTML
    const modalHTML = `
      <div id="camera-modal" class="camera-modal" role="dialog" aria-modal="true" aria-labelledby="camera-title">
        <div class="camera-modal-content">
          <div class="camera-header">
            <h3 id="camera-title">📷 Ambil Foto</h3>
            <button id="close-camera" class="close-btn" aria-label="Tutup kamera">&times;</button>
          </div>
          
          <div class="camera-body">
            <div id="camera-container" class="camera-container">
              <video id="camera-video" autoplay playsinline aria-label="Preview kamera"></video>
              <canvas id="camera-canvas" style="display: none;"></canvas>
              
              <div class="camera-overlay">
                <div class="camera-frame"></div>
              </div>
            </div>
            
            <div id="photo-preview" class="photo-preview" style="display: none;">
              <img id="captured-photo" src="" alt="Foto yang diambil">
            </div>
          </div>
          
          <div class="camera-controls">
            <button id="capture-btn" class="btn btn-primary">
              📸 Ambil Foto
            </button>
            <button id="retake-btn" class="btn btn-secondary" style="display: none;">
              🔄 Ambil Ulang
            </button>
            <button id="use-photo-btn" class="btn btn-success" style="display: none;">
              ✅ Gunakan Foto
            </button>
            <button id="cancel-camera" class="btn btn-outline">
              ❌ Batal
            </button>
          </div>
          
          <div id="camera-error" class="camera-error" style="display: none;"></div>
        </div>
      </div>
    `;

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('camera-modal');
    this.video = document.getElementById('camera-video');
    this.canvas = document.getElementById('camera-canvas');

    // Show modal
    document.body.style.overflow = 'hidden';
    this.modal.style.display = 'flex';
    
    // Focus management
    const closeBtn = document.getElementById('close-camera');
    closeBtn.focus();

    await this.initCamera();
  }

  async initCamera() {
    try {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Kamera tidak didukung oleh browser Anda');
      }

      // Request camera access
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Use back camera if available
        },
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      
      // Setup canvas size when video loads
      this.video.addEventListener('loadedmetadata', () => {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
      });

      // Hide error message if exists
      const errorElement = document.getElementById('camera-error');
      if (errorElement) {
        errorElement.style.display = 'none';
      }

    } catch (error) {
      console.error('Camera initialization failed:', error);
      this.showCameraError(this.getCameraErrorMessage(error));
      throw error;
    }
  }

  setupCameraHandlers(resolve, reject) {
    const captureBtn = document.getElementById('capture-btn');
    const retakeBtn = document.getElementById('retake-btn');
    const usePhotoBtn = document.getElementById('use-photo-btn');
    const cancelBtn = document.getElementById('cancel-camera');
    const closeBtn = document.getElementById('close-camera');

    let capturedBlob = null;

    // Capture photo
    captureBtn.addEventListener('click', () => {
      try {
        const context = this.canvas.getContext('2d');
        context.drawImage(this.video, 0, 0);
        
        // Convert canvas to blob
        this.canvas.toBlob((blob) => {
          if (blob) {
            capturedBlob = blob;
            this.showPhotoPreview();
            
            // Update button states
            captureBtn.style.display = 'none';
            retakeBtn.style.display = 'inline-flex';
            usePhotoBtn.style.display = 'inline-flex';
          }
        }, 'image/jpeg', 0.8);
        
      } catch (error) {
        console.error('Failed to capture photo:', error);
        this.showCameraError('Gagal mengambil foto');
      }
    });

    // Retake photo
    retakeBtn.addEventListener('click', () => {
      this.hidePhotoPreview();
      capturedBlob = null;
      
      // Reset button states
      captureBtn.style.display = 'inline-flex';
      retakeBtn.style.display = 'none';
      usePhotoBtn.style.display = 'none';
    });

    // Use photo
    usePhotoBtn.addEventListener('click', () => {
      if (capturedBlob) {
        const file = new File([capturedBlob], `camera-photo-${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });
        this.closeCamera();
        resolve(file);
      }
    });

    // Cancel/Close handlers
    const closeCamera = () => {
      this.closeCamera();
      reject(new Error('Pengambilan foto dibatalkan'));
    };

    cancelBtn.addEventListener('click', closeCamera);
    closeBtn.addEventListener('click', closeCamera);

    // Close on Escape key
    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        closeCamera();
      }
    };

    document.addEventListener('keydown', handleKeydown);

    // Clean up event listener when modal is removed
    this.modal.addEventListener('remove', () => {
      document.removeEventListener('keydown', handleKeydown);
    });

    // Close on backdrop click
    this.modal.addEventListener('click', (event) => {
      if (event.target === this.modal) {
        closeCamera();
      }
    });
  }

  showPhotoPreview() {
    const videoContainer = document.getElementById('camera-container');
    const photoPreview = document.getElementById('photo-preview');
    const capturedPhoto = document.getElementById('captured-photo');
    
    // Convert canvas to data URL for preview
    const dataURL = this.canvas.toDataURL('image/jpeg', 0.8);
    capturedPhoto.src = dataURL;
    
    videoContainer.style.display = 'none';
    photoPreview.style.display = 'block';
  }

  hidePhotoPreview() {
    const videoContainer = document.getElementById('camera-container');
    const photoPreview = document.getElementById('photo-preview');
    
    videoContainer.style.display = 'block';
    photoPreview.style.display = 'none';
  }

  showCameraError(message) {
    const errorElement = document.getElementById('camera-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }

    // Disable capture button
    const captureBtn = document.getElementById('capture-btn');
    if (captureBtn) {
      captureBtn.disabled = true;
      captureBtn.textContent = 'Kamera Tidak Tersedia';
    }
  }

  getCameraErrorMessage(error) {
    if (error.name === 'NotAllowedError') {
      return 'Akses kamera ditolak. Silakan izinkan akses kamera dan coba lagi.';
    } else if (error.name === 'NotFoundError') {
      return 'Kamera tidak ditemukan pada perangkat Anda.';
    } else if (error.name === 'NotSupportedError') {
      return 'Kamera tidak didukung oleh browser Anda.';
    } else if (error.name === 'NotReadableError') {
      return 'Kamera sedang digunakan oleh aplikasi lain.';
    } else {
      return error.message || 'Terjadi kesalahan saat mengakses kamera.';
    }
  }

  closeCamera() {
    // Stop camera stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
      });
      this.stream = null;
    }

    // Remove modal
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }

    // Restore body scroll
    document.body.style.overflow = '';
    
    // Clean up references
    this.video = null;
    this.canvas = null;
  }

  // Static method to check camera support
  static isSupported() {
    return !!(
      navigator.mediaDevices && 
      navigator.mediaDevices.getUserMedia
    );
  }

  // Static method to check permissions
  static async checkPermissions() {
    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'camera' });
        return permission.state;
      }
      return 'unknown';
    } catch (error) {
      console.warn('Could not check camera permissions:', error);
      return 'unknown';
    }
  }
}

export default CameraService;