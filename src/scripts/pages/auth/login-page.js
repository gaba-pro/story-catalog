import { BasePage, BasePresenter } from '../../utils/base-classes.js';
import ApiService from '../../services/api-service.js';

class LoginPresenter extends BasePresenter {
  async handleLogin(formData) {
    try {
      this.showLoading();
      const credentials = {
        email: formData.get('email'),
        password: formData.get('password')
      };
      
      const result = await ApiService.login(credentials);
      this.hideLoading();
      
      if (result.error === false) {
        this.showSuccess('Login berhasil! Mengalihkan ke halaman cerita...');
        
        // Dispatch auth state change event
        document.dispatchEvent(new CustomEvent('authStateChange'));
        
        setTimeout(() => {
          window.location.hash = '#/stories';
        }, 1500);
      } else {
        this.showError(result.message || 'Login gagal');
      }
    } catch (error) {
      this.hideLoading();
      this.showError('Terjadi kesalahan: ' + error.message);
    }
  }
}

class LoginPage extends BasePage {
  constructor() {
    super();
    this.title = 'Masuk - Story Catalog';
    this.presenter = new LoginPresenter(this);
  }

  async render() {
    return `
      <div class="container">
        <div class="card" style="max-width: 400px; margin: 0 auto;">
          <div class="card-header">
            <h1 class="card-title">Masuk ke Akun Anda</h1>
            <p class="text-light">Silakan masuk untuk mengakses aplikasi Story Catalog</p>
          </div>
          
          <form id="login-form" novalidate>
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
                aria-describedby="password-error"
                autocomplete="current-password"
                minlength="8"
              >
              <div id="password-error" class="form-error" aria-live="polite"></div>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              Masuk
            </button>
          </form>
          
          <div style="text-align: center; margin-top: 20px;">
            <p>Belum punya akun? <a href="#/register">Daftar di sini</a></p>
          </div>
        </div>
      </div>
    `;
  }

  async afterRender() {
    await super.afterRender();
    
    const form = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    // Form validation
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
    
    emailInput.addEventListener('blur', validateEmail);
    passwordInput.addEventListener('blur', validatePassword);
    
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      
      const isEmailValid = validateEmail();
      const isPasswordValid = validatePassword();
      
      if (isEmailValid && isPasswordValid) {
        const formData = new FormData(form);
        this.presenter.handleLogin(formData);
      }
    });
  }
}

export default LoginPage;