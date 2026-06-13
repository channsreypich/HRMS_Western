<template>
  <MainLayout>
    <div class="settings-container">
      <!-- Page header (matches DepartmentList layout) -->
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <VsxIcon iconName="Setting2" :size="18" class="me-2 text-gradient" />Settings
          </h1>
          <p class="page-sub">Manage your account, security and preferences</p>
        </div>
        <router-link to="/profile" class="btn-outline">
          <VsxIcon iconName="User" :size="18" /> View Profile
        </router-link>
      </div>

      <div class="settings-layout">
        <!-- Vertical tab nav -->
        <aside class="settings-nav dark-card">
          <button
            v-for="tab in menuItems"
            :key="tab.id"
            class="nav-btn"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <VsxIcon :iconName="tab.icon" :size="18" />
            <span>{{ tab.name }}</span>
            <VsxIcon iconName="ArrowRight2" :size="18" class="nav-arrow" />
          </button>
        </aside>

        <!-- Tab panels -->
        <section class="settings-panel dark-card">
          <!-- ════════ ACCOUNT SETTINGS ════════ -->
          <div v-if="activeTab === 'profile'" class="tab-content">
            <header class="content-header">
              <h2>Account Settings</h2>
              <p>Update your personal information and profile picture.</p>
            </header>

            <form @submit.prevent="saveProfile">
              <div class="avatar-upload">
                <div class="avatar-preview">
                  <img v-if="profile.avatar" :src="profile.avatar" alt="avatar" />
                  <div v-else class="initials">{{ initials }}</div>
                </div>
                <div class="upload-controls">
                  <button type="button" class="btn-primary-outline" @click="triggerAvatarPick">
                    <VsxIcon iconName="DocumentUpload" :size="18" /> Upload New
                  </button>
                  <button
                    type="button"
                    class="btn-ghost-danger"
                    :disabled="!profile.avatar"
                    @click="removeAvatar"
                  >
                    Remove
                  </button>
                  <input
                    ref="avatarInput"
                    type="file"
                    accept="image/*"
                    hidden
                    @change="onAvatarChange"
                  />
                </div>
              </div>

              <div class="form-grid">
                <div class="form-field">
                  <label>First name</label>
                  <input type="text" v-model.trim="profile.first_name" placeholder="First name" />
                </div>
                <div class="form-field">
                  <label>Last name</label>
                  <input type="text" v-model.trim="profile.last_name" placeholder="Last name" />
                </div>
                <div class="form-field">
                  <label>Email address</label>
                  <div class="input-with-badge">
                    <input type="email" v-model.trim="profile.email" />
                    <span class="badge-verified">Verified</span>
                  </div>
                </div>
                <div class="form-field">
                  <label>Phone number</label>
                  <input type="tel" v-model.trim="profile.phone" placeholder="+855 ..." />
                </div>
                <div class="form-field full-width">
                  <label>Bio</label>
                  <textarea
                    v-model.trim="profile.bio"
                    rows="4"
                    placeholder="Briefly describe your role..."
                  ></textarea>
                </div>
              </div>

              <div class="form-actions">
                <button type="button" class="btn-outline" @click="resetProfile">Reset</button>
                <button type="submit" class="btn-primary">
                  <VsxIcon iconName="TickCircle" :size="18" /> Save Changes
                </button>
              </div>
            </form>
          </div>

          <!-- ════════ LOGIN & SECURITY ════════ -->
          <div v-else-if="activeTab === 'security'" class="tab-content">
            <header class="content-header">
              <h2>Login &amp; Security</h2>
              <p>Change your password and manage account protection.</p>
            </header>

            <form @submit.prevent="changePassword">
              <div class="form-grid">
                <div class="form-field full-width">
                  <label>Current password</label>
                  <input type="password" v-model="passwords.current" placeholder="••••••••" />
                </div>
                <div class="form-field">
                  <label>New password</label>
                  <input
                    type="password"
                    v-model="passwords.next"
                    placeholder="At least 8 characters"
                  />
                </div>
                <div class="form-field">
                  <label>Confirm new password</label>
                  <input
                    type="password"
                    v-model="passwords.confirm"
                    placeholder="Re-enter password"
                  />
                </div>
              </div>
              <div class="form-actions">
                <button type="submit" class="btn-primary">
                  <VsxIcon iconName="Key" :size="18" /> Update Password
                </button>
              </div>
            </form>

            <div class="divider"></div>

            <div class="toggle-row" v-for="opt in securityToggles" :key="opt.key">
              <div>
                <div class="toggle-title">{{ opt.title }}</div>
                <div class="toggle-desc">{{ opt.desc }}</div>
              </div>
              <label class="switch">
                <input type="checkbox" v-model="prefs.security[opt.key]" @change="savePrefs" />
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <!-- ════════ NOTIFICATIONS ════════ -->
          <div v-else-if="activeTab === 'notifications'" class="tab-content">
            <header class="content-header">
              <h2>Notification Settings</h2>
              <p>Choose what updates you want to receive.</p>
            </header>

            <div class="toggle-row" v-for="opt in notificationToggles" :key="opt.key">
              <div>
                <div class="toggle-title">{{ opt.title }}</div>
                <div class="toggle-desc">{{ opt.desc }}</div>
              </div>
              <label class="switch">
                <input type="checkbox" v-model="prefs.notifications[opt.key]" @change="savePrefs" />
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <!-- ════════ INTERFACE ════════ -->
          <div v-else-if="activeTab === 'interface'" class="tab-content">
            <header class="content-header">
              <h2>Interface</h2>
              <p>Personalise how the workspace looks and feels.</p>
            </header>

            <div class="form-field">
              <label>Accent color</label>
              <div class="color-presets">
                <span
                  v-for="c in accentColors"
                  :key="c"
                  class="color-dot"
                  :style="{
                    background: c,
                    outline: prefs.interface.accent === c ? '2px solid #0f172a' : 'none',
                  }"
                  @click="setAccent(c)"
                ></span>
              </div>
            </div>

            <div class="form-field" style="margin-top: 1.5rem">
              <label>Density</label>
              <div class="segment">
                <button
                  v-for="d in ['comfortable', 'compact']"
                  :key="d"
                  type="button"
                  class="segment-btn"
                  :class="{ active: prefs.interface.density === d }"
                  @click="setDensity(d)"
                >
                  {{ d }}
                </button>
              </div>
            </div>

            <div class="toggle-row" style="margin-top: 1.5rem">
              <div>
                <div class="toggle-title">Sidebar starts collapsed</div>
                <div class="toggle-desc">Begin each session with a slim sidebar.</div>
              </div>
              <label class="switch">
                <input
                  type="checkbox"
                  v-model="prefs.interface.collapsedSidebar"
                  @change="savePrefs"
                />
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <!-- ════════ ADDITIONAL ════════ -->
          <div v-else-if="activeTab === 'additional'" class="tab-content">
            <header class="content-header">
              <h2>Additional Settings</h2>
              <p>Language, region and account actions.</p>
            </header>

            <div class="form-grid">
              <div class="form-field">
                <label>Language</label>
                <select v-model="prefs.additional.language" @change="savePrefs">
                  <option value="en">English</option>
                  <option value="km">ភាសាខ្មែរ (Khmer)</option>
                  <option value="fr">Français</option>
                </select>
              </div>
              <div class="form-field">
                <label>Time zone</label>
                <select v-model="prefs.additional.timezone" @change="savePrefs">
                  <option value="Asia/Phnom_Penh">Asia / Phnom Penh (ICT)</option>
                  <option value="Asia/Ho_Chi_Minh">Asia / Ho Chi Minh (ICT)</option>
                  <option value="Asia/Singapore">Asia / Singapore</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>

            <div class="divider"></div>

            <div class="danger-zone">
              <div>
                <div class="toggle-title" style="color: #b91c1c">Sign out of all devices</div>
                <div class="toggle-desc">End every active session and return to login.</div>
              </div>
              <button class="btn-danger" @click="signOutEverywhere">
                <VsxIcon iconName="Logout" :size="18" /> Sign Out
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/components/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue3-toastify'
import { applyAccent, applyDensity } from '@/utils/theme'

const auth = useAuthStore()
const router = useRouter()
const activeTab = ref('profile')

const menuItems = [
  { id: 'profile', name: 'Account Settings', icon: 'ProfileCircle' },
  { id: 'security', name: 'Login & Security', icon: 'Security' },
  { id: 'notifications', name: 'Notifications', icon: 'Notification' },
  { id: 'interface', name: 'Interface', icon: 'Colorfilter' },
  { id: 'additional', name: 'Additional', icon: 'Setting4' },
]

// ─── Profile form ──────────────────────────────────────────────
const makeProfile = () => ({
  first_name: auth.user?.first_name || '',
  last_name: auth.user?.last_name || '',
  email: auth.user?.email || '',
  phone: auth.user?.phone || '',
  bio: auth.user?.bio || '',
  avatar: auth.user?.avatar || '',
})
const profile = reactive(makeProfile())

const initials = computed(
  () =>
    `${profile.first_name?.charAt(0) || ''}${profile.last_name?.charAt(0) || ''}`.toUpperCase() ||
    'U',
)

const avatarInput = ref(null)
const triggerAvatarPick = () => avatarInput.value?.click()

const onAvatarChange = (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) return toast.error('Please choose an image file')
  if (file.size > 2 * 1024 * 1024) return toast.error('Image must be under 2MB')
  const reader = new FileReader()
  reader.onload = () => {
    profile.avatar = reader.result
    toast.info('Picture ready — click Save Changes to apply')
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

const removeAvatar = () => {
  profile.avatar = ''
  toast.info('Picture removed — click Save Changes to apply')
}

const resetProfile = () => {
  Object.assign(profile, makeProfile())
  toast.info('Changes discarded')
}

const saveProfile = () => {
  if (!profile.first_name) return toast.error('First name is required')
  if (!/^\S+@\S+\.\S+$/.test(profile.email)) return toast.error('Enter a valid email address')
  auth.updateProfile({ ...profile })
  toast.success('Profile updated successfully')
}

// ─── Password ──────────────────────────────────────────────────
const passwords = reactive({ current: '', next: '', confirm: '' })
const changePassword = () => {
  if (!passwords.current) return toast.error('Enter your current password')
  if (passwords.next.length < 8) return toast.error('New password must be at least 8 characters')
  if (passwords.next !== passwords.confirm) return toast.error('Passwords do not match')
  passwords.current = passwords.next = passwords.confirm = ''
  toast.success('Password updated successfully')
}

const securityToggles = [
  { key: 'twoFactor', title: 'Two-factor authentication', desc: 'Require a code at every login.' },
  { key: 'loginAlerts', title: 'Login alerts', desc: 'Email me about new device sign-ins.' },
]
const notificationToggles = [
  { key: 'leaveRequests', title: 'Leave requests', desc: 'When an employee requests leave.' },
  { key: 'payrollReady', title: 'Payroll ready', desc: 'When a payroll run is generated.' },
  { key: 'attendance', title: 'Attendance alerts', desc: 'Late check-ins and absences.' },
  { key: 'weeklySummary', title: 'Weekly summary email', desc: 'A digest every Monday morning.' },
]
const accentColors = ['#4f7cff', '#0284c7', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

// ─── Preferences persistence ───────────────────────────────────
const PREF_KEY = 'hrm_settings'
const defaultPrefs = {
  security: { twoFactor: false, loginAlerts: true },
  notifications: {
    leaveRequests: true,
    payrollReady: true,
    attendance: false,
    weeklySummary: true,
  },
  interface: { accent: '#4f7cff', density: 'comfortable', collapsedSidebar: false },
  additional: { language: 'en', timezone: 'Asia/Phnom_Penh' },
}
const loadPrefs = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(PREF_KEY))
    return saved ? { ...defaultPrefs, ...saved } : { ...defaultPrefs }
  } catch {
    return { ...defaultPrefs }
  }
}
const prefs = reactive(loadPrefs())

// Reflect saved preferences in the live UI as soon as the page opens.
applyAccent(prefs.interface.accent)
applyDensity(prefs.interface.density)

const savePrefs = () => {
  localStorage.setItem(PREF_KEY, JSON.stringify(prefs))
  toast.success('Preferences saved')
}
const setAccent = (c) => {
  prefs.interface.accent = c
  applyAccent(c) // apply instantly across the whole app
  savePrefs()
}
const setDensity = (d) => {
  prefs.interface.density = d
  applyDensity(d)
  savePrefs()
}

const signOutEverywhere = async () => {
  await auth.logout()
  toast.success('Signed out of all devices')
  router.push('/login')
}
</script>

<style scoped>
.settings-container {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  font-family:
    'Plus Jakarta Sans',
    system-ui,
    -apple-system,
    sans-serif;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 0.25rem 0;
}
.page-sub {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
}
.text-gradient {
  background: linear-gradient(135deg, var(--accent), #0284c7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Two column layout */
.settings-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 1.5rem;
  align-items: start;
}
.dark-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.03);
}
.settings-nav {
  padding: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: sticky;
  top: 80px;
}
.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.85rem;
  background: none;
  border: none;
  border-radius: 10px;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  transition: all 0.18s;
}
.nav-btn i:first-child {
  width: 18px;
  text-align: center;
}
.nav-btn .nav-arrow {
  margin-left: auto;
  font-size: 0.7rem;
  opacity: 0;
  transition: opacity 0.18s;
}
.nav-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}
.nav-btn.active {
  background: rgba(var(--accent-rgb), 0.1);
  color: var(--accent);
}
.nav-btn.active .nav-arrow {
  opacity: 1;
}

/* Panel */
.settings-panel {
  padding: 2rem 2.25rem;
}
.content-header {
  margin-bottom: 1.75rem;
}
.content-header h2 {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 0.25rem;
}
.content-header p {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

/* Avatar */
.avatar-upload {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 2rem;
}
.avatar-preview {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.4rem;
  flex-shrink: 0;
}
.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.upload-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Forms */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}
.full-width {
  grid-column: span 2;
}
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-field label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
}
.form-field input,
.form-field textarea,
.form-field select {
  width: 100%;
  padding: 0.7rem 0.9rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #0f172a;
  font-size: 0.9rem;
  outline: none;
  font-family: inherit;
  transition: all 0.2s ease;
}
.form-field input:focus,
.form-field textarea:focus,
.form-field select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.12);
}
.input-with-badge {
  position: relative;
}
.badge-verified {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #059669;
  font-size: 0.72rem;
  font-weight: 700;
  background: #ecfdf5;
  padding: 3px 9px;
  border-radius: 6px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.75rem;
}

/* Buttons */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0.65rem 1.25rem;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(var(--accent-rgb), 0.25);
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(var(--accent-rgb), 0.35);
}
.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0.6rem 1.2rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #334155;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
}
.btn-outline:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #0f172a;
}
.btn-primary-outline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f5f3ff;
  color: var(--accent);
  border: 1px solid rgba(var(--accent-rgb), 0.2);
  padding: 0.6rem 1.1rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-primary-outline:hover {
  background: #ede9fe;
}
.btn-ghost-danger {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.6rem 0.5rem;
  transition: color 0.2s;
}
.btn-ghost-danger:hover:not(:disabled) {
  color: #ef4444;
}
.btn-ghost-danger:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}
.btn-danger:hover {
  opacity: 0.95;
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.3);
}

.divider {
  height: 1px;
  background: #e2e8f0;
  margin: 1.75rem 0;
}

/* Toggle rows */
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid #f1f5f9;
}
.toggle-row:last-child {
  border-bottom: none;
}
.toggle-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #0f172a;
}
.toggle-desc {
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 2px;
}

/* Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  inset: 0;
  background: #cbd5e1;
  border-radius: 24px;
  cursor: pointer;
  transition: 0.25s;
}
.slider::before {
  content: '';
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background: #fff;
  border-radius: 50%;
  transition: 0.25s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
.switch input:checked + .slider {
  background: var(--accent);
}
.switch input:checked + .slider::before {
  transform: translateX(20px);
}

/* Color picker */
.color-presets {
  display: flex;
  gap: 10px;
}
.color-dot {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  cursor: pointer;
  outline-offset: 2px;
  transition: transform 0.15s;
}
.color-dot:hover {
  transform: scale(1.12);
}

/* Segment */
.segment {
  display: inline-flex;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 10px;
  gap: 4px;
}
.segment-btn {
  padding: 0.5rem 1.1rem;
  border: none;
  background: none;
  border-radius: 7px;
  font-size: 0.83rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  text-transform: capitalize;
  transition: all 0.15s;
}
.segment-btn.active {
  background: #fff;
  color: var(--accent);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.danger-zone {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: #fef2f2;
  border: 1px solid #fee2e2;
  border-radius: 12px;
  padding: 1rem 1.25rem;
}

@media (max-width: 860px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }
  .settings-nav {
    position: static;
    flex-direction: row;
    overflow-x: auto;
  }
  .nav-btn .nav-arrow {
    display: none;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
  .full-width {
    grid-column: span 1;
  }
  .settings-panel {
    padding: 1.5rem;
  }
}
</style>
