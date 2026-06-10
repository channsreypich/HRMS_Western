<template>
  <div class="login-page">
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>
    <div class="bg-orb orb-3"></div>

    <div class="login-wrapper">
      <div class="login-brand">
        <div class="brand-icon">
          <i class="fas fa-building"></i>
        </div>
        <span class="brand-name">HRM System</span>
      </div>

      <div class="login-card">
        <div class="card-inner">
          <h1 class="card-title">Welcome back</h1>
          <p class="card-subtitle">Sign in to your HRM dashboard</p>

          <div v-if="errorMsg" class="error-alert">
            <i class="fas fa-exclamation-circle"></i> {{ errorMsg }}
          </div>

          <form @submit.prevent="handleLogin" class="login-form">
            <div class="field-group">
              <label for="email" class="field-label">Email address</label>
              <div class="field-wrapper">
                <i class="fas fa-envelope field-icon"></i>
                <input
                  id="email"
                  type="email"
                  class="field-input"
                  placeholder="admin@company.com"
                  v-model="form.email"
                  required
                  autocomplete="email"
                />
              </div>
            </div>

            <div class="field-group">
              <div class="label-row">
                <label for="password" class="field-label">Password</label>
                <a href="#" class="forgot-link">Forgot password?</a>
              </div>
              <div class="field-wrapper">
                <i class="fas fa-lock field-icon"></i>
                <input
                  id="password"
                  :type="showPassword ? 'text' : 'password'"
                  class="field-input"
                  placeholder="Enter your password"
                  v-model="form.password"
                  required
                  autocomplete="current-password"
                />
                <button type="button" class="toggle-pwd" @click="showPassword = !showPassword">
                  <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </div>
            </div>

            <div class="remember-row">
              <label class="checkbox-label">
                <input type="checkbox" v-model="rememberMe" />
                <span class="checkbox-custom"></span>
                Remember me
              </label>
            </div>

            <button type="submit" class="submit-btn" :disabled="loading">
              <span v-if="loading" class="btn-spinner"></span>
              <span v-else><i class="fas fa-sign-in-alt me-2"></i></span>
              {{ loading ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>

          <div class="divider"><span>Quick demo access</span></div>
        </div>
      </div>

      <p class="footer-text">© 2026 HRM System · Built for WU Semester 2</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue3-toastify'

const auth = useAuthStore()
const router = useRouter()

const showPassword = ref(false)
const rememberMe = ref(false)
const loading = ref(false)
const errorMsg = ref('')

const form = reactive({ email: '', password: '' })

const handleLogin = async () => {
  loading.value = true
  errorMsg.value = ''

  try {
    const result = await auth.login(form)

    if (result?.success) {
      toast.success('Welcome back to HRM System!')

      // Use replace so the user cannot click "back" to return to the login page
      // Accesses the 'homeRoute' computed property from your updated authStore
      router.replace(auth.homeRoute)
    } else {
      errorMsg.value = auth.error || 'Invalid email or password.'
      toast.error(errorMsg.value)
    }
  } catch (err) {
    errorMsg.value = 'An unexpected error occurred.'
    toast.error(errorMsg.value)
  } finally {
    loading.value = false
  }
}
</script>
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

.login-page {
  min-height: 100vh;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', sans-serif;
  position: relative;
  overflow: hidden;
  padding: 1rem;
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.12;
  animation: floatOrb 8s ease-in-out infinite;
}
.orb-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, #6823ff, transparent);
  top: -150px;
  left: -150px;
  animation-delay: 0s;
}
.orb-2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, #40c8da, transparent);
  bottom: -100px;
  right: -100px;
  animation-delay: 3s;
}
.orb-3 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, #a47bff, transparent);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: 1.5s;
}

@keyframes floatOrb {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-30px) scale(1.05);
  }
}
.orb-3 {
  animation: floatOrb3 8s ease-in-out infinite 1.5s;
}
@keyframes floatOrb3 {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    transform: translate(-50%, -55%) scale(1.05);
  }
}

.login-wrapper {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  position: relative;
  z-index: 1;
}

/* Brand */
.login-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.brand-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #6823ff, #13707f);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: white;
  box-shadow: 0 8px 24px rgba(104, 35, 255, 0.25);
}
.brand-name {
  font-size: 1.2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #531cbd, #11606d);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-card {
  width: 100%;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 24px;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.05),
    0 10px 10px -5px rgba(0, 0, 0, 0.02);
  overflow: hidden;
}
.card-inner {
  padding: 2.25rem;
}

.card-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 0.4rem;
}
.card-subtitle {
  font-size: 0.88rem;
  color: #64748b;
  margin-bottom: 1.75rem;
}

.error-alert {
  background: rgba(220, 38, 38, 0.06);
  border: 1px solid rgba(220, 38, 38, 0.15);
  border-radius: 10px;
  padding: 0.75rem 1rem;
  color: #dc2626;
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.forgot-link {
  font-size: 0.78rem;
  color: #6823ff;
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s;
}
.forgot-link:hover {
  text-decoration: underline;
}

.field-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.field-icon {
  position: absolute;
  left: 14px;
  color: #94a3b8;
  font-size: 0.85rem;
  pointer-events: none;
}

.field-input {
  width: 100%;
  padding: 0.75rem 0.9rem 0.75rem 2.6rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 11px;
  color: #1a1a1a;
  font-size: 0.88rem;
  font-family: 'Inter', sans-serif;
  outline: none;
  transition: all 0.2s;
}
.field-input:focus {
  background: #ffffff;
  border-color: #6823ff;
  box-shadow: 0 0 0 3px rgba(104, 35, 255, 0.1);
}
.field-input::placeholder {
  color: #94a3b8;
}
.toggle-pwd {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.88rem;
  padding: 4px;
  transition: color 0.2s;
}
.toggle-pwd:hover {
  color: #475569;
}

.remember-row {
  margin-top: 0.25rem;
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.82rem;
  color: #64748b;
  cursor: pointer;
  user-select: none;
}
.checkbox-label input[type='checkbox'] {
  display: none;
}
.checkbox-custom {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.checkbox-label input[type='checkbox']:checked + .checkbox-custom {
  background: linear-gradient(135deg, #6823ff, #4f0fdb);
  border-color: #6823ff;
}
.checkbox-label input[type='checkbox']:checked + .checkbox-custom::after {
  content: '✓';
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0.85rem;
  background: linear-gradient(135deg, #6823ff, #4f0fdb);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 0.3px;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(104, 35, 255, 0.2);
  margin-top: 0.4rem;
  font-family: 'Inter', sans-serif;
}
.submit-btn:hover:not(:disabled) {
  opacity: 0.95;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(104, 35, 255, 0.3);
}
.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}
.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 1.5rem 0 1rem;
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e2e8f0;
}
.divider span {
  font-size: 0.75rem;
  color: #94a3b8;
  white-space: nowrap;
}

.footer-text {
  font-size: 0.73rem;
  color: #94a3b8;
  text-align: center;
}
</style>
