import { BasePage, BasePresenter } from '../../utils/base-classes.js';
import ApiService from '../../services/api-service.js';

class RegisterPresenter extends BasePresenter {
  async handleRegister(formData) {
    try {
      this.showLoading();
      const userData = {
        name: formData.get('name')?.trim(),
        email: formData.get('email')?.trim().toLowerCase(),
        password: formData.get('password')
      };
      
      console.log('Form data being sent:', userData);
      
      // Additional validation
      if (!userData.name || userData.name.length < 2) {
        this.hideLoading();
        this.showError('Nama harus minimal 2 karakter');
        return;
      }
      
      if (!userData.email || !userData.email.includes('@')) {
        this.hideLoading();
        this.showError('Email tidak valid');
        return;
      }
      
      if (!userData.password || userData.password.length < 8) {
        this.hideLoading();
        this.showError('Password harus minimal 8 karakter');
        return;
      }
      
      const result = await ApiService.register(userData);
      this.hideLoading();
      
      console.log('Registration result:', result);
      
      if (result.error === false) {
        this.showSuccess('Registrasi berhasil! Silakan login dengan akun Anda.');
        setTimeout(() => {
          window.location.hash = '#/login';
        }, 2000);
      } else {
        this.showError(result.message || 'Registrasi gagal');
      }
    } catch (error) {
      this.hideLoading();
      console.error('Registration error:', error);
      this.showError('Terjadi kesalahan: ' + error.message);
    }
  }
}

class RegisterPage extends BasePage {
  constructor() {
    super();
    this.title = 'Daftar - Story Catalog';
    this.presenter = new RegisterPresenter(this);
  }

  async render() {
    return `
      <div class="container">
        <div class="card" style="max-width: 400px; margin: 0 auto;">
          <div class="card-header">
            <h1 class="card-title">Buat Akun Baru</h1>
            <p class="text-light">Daftar untuk mulai berbagi cerita Anda</p>
          </div>
          
          <form id="register-form" novalidate>
            <div class="form-group">
              <label for="name" class="form-label">Nama Lengkap</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                class="form-input" 
                required 
                aria-describedby="name-error"
                autocomplete="name"
              >
              <div id="name-error" class="form-error" aria-live="polite"></div>
            </div>
            
            <div class="form-group">
              <label for="email" class="form-label">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                class="form-input" 
                required 
                aria-describedby="email-error"
                autocomplete="email"
              >
              <div id="email-error" class="form-error" aria-live="polite"></div>
            </div>
            
            <div class="form-group">
              <label for="password" class="form-label">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                class="form-input" 
                required 
                aria-describedby="password-error password-help"
                autocomplete="new-password"
                minlength="8"
              >
              <div id="password-help" class="form-help">Minimal 8 karakter</div>
              <div id="password-error" class="form-error" aria-live="polite"></div>
            </div>
            
            <div class="form-group">
              <label for="confirm-password" class="form-label">Konfirmasi Password</label>
              <input 
                type="password" 
                id="confirm-password" 
                name="confirm-password" 
                class="form-input" 
                required 
                aria-describedby="confirm-password-error"
                autocomplete="new-password"
              >
              <div id="confirm-password-error" class="form-error" aria-live="polite"></div>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              Daftar
            </button>
          </form>
          
          <div style="text-align: center; margin-top: 20px;">
            <p>Sudah punya akun? <a href="#/login">Masuk di sini</a></p>
          </div>
        </div>
      </div>
    `;
  }

  async afterRender() {
    await super.afterRender();
    
    const form = document.getElementById('register-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    // Form validation
    const validateName = () => {
      const name = nameInput.value.trim();
      const nameError = document.getElementById('name-error');
      
      if (!name) {
        nameError.textContent = 'Nama harus diisi';
        return false;
      } else if (name.length < 2) {
        nameError.textContent = 'Nama minimal 2 karakter';
        return false;
      } else {
        nameError.textContent = '';
        return true;
      }
    };
    
    const validateEmail = () => {
      const email = emailInput.value.trim();
      const emailError = document.getElementById('email-error');
      
      if (!email) {
        emailError.textContent = 'Email harus diisi';
        return false;
      } else if (!email.includes('@')) {
        emailError.textContent = 'Format email tidak valid';
        return false;
      } else {
        emailError.textContent = '';
        return true;
      }
    };
    
    const validatePassword = () => {
      const password = passwordInput.value;
      const passwordError = document.getElementById('password-error');
      
      if (!password) {
        passwordError.textContent = 'Password harus diisi';
        return false;
      } else if (password.length < 8) {
        passwordError.textContent = 'Password minimal 8 karakter';
        return false;
      } else {
        passwordError.textContent = '';
        return true;
      }
    };
    
    const validateConfirmPassword = () => {
      const password = passwordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      const confirmPasswordError = document.getElementById('confirm-password-error');
      
      if (!confirmPassword) {
        confirmPasswordError.textContent = 'Konfirmasi password harus diisi';
        return false;
      } else if (password !== confirmPassword) {
        confirmPasswordError.textContent = 'Password tidak sama';
        return false;
      } else {
        confirmPasswordError.textContent = '';
        return true;
      }
    };
    
    nameInput.addEventListener('blur', validateName);
    emailInput.addEventListener('blur', validateEmail);
    passwordInput.addEventListener('blur', validatePassword);
    confirmPasswordInput.addEventListener('blur', validateConfirmPassword);
    
    // Real-time validation for password confirmation
    confirmPasswordInput.addEventListener('input', validateConfirmPassword);
    
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      
      const isNameValid = validateName();
      const isEmailValid = validateEmail();
      const isPasswordValid = validatePassword();
      const isConfirmPasswordValid = validateConfirmPassword();
      
      if (isNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid) {
        const formData = new FormData(form);
        this.presenter.handleRegister(formData);
      }
    });
  }
}

export default RegisterPage;