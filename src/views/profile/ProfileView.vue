<template>
  <MainLayout>
    <div class="profile-container">
      <!-- Page header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <VsxIcon iconName="User" :size="18" class="me-2 text-gradient" />My Profile
          </h1>
          <p class="page-sub">View and manage your personal information</p>
        </div>
        <div class="header-actions">
          <router-link to="/settings" class="btn-outline">
            <VsxIcon iconName="Setting2" :size="18" /> Settings
          </router-link>
          <button class="btn-primary" @click="openEdit">
            <VsxIcon iconName="Edit2" :size="18" /> Edit Profile
          </button>
        </div>
      </div>

      <!-- Profile banner card -->
      <div class="banner-card dark-card">
        <div class="banner-cover"></div>
        <div class="banner-body">
          <div class="banner-avatar">
            <img v-if="user.avatar" :src="user.avatar" alt="avatar" />
            <div v-else class="initials">{{ initials }}</div>
            <button class="avatar-edit" title="Change picture" @click="triggerAvatarPick">
              <VsxIcon iconName="Camera" :size="18" />
            </button>
            <input ref="avatarInput" type="file" accept="image/*" hidden @change="onAvatarChange" />
          </div>
          <div class="banner-info">
            <h2 class="banner-name">{{ fullName }}</h2>
            <p class="banner-meta">
              <span class="role-pill" :class="roleClass">
                <VsxIcon iconName="SecurityUser" :size="14" /> {{ roleLabel }}
              </span>
              <span class="dot">•</span>
              <VsxIcon iconName="Sms" :size="18" /> {{ user.email || '—' }}
            </p>
          </div>
          <div class="banner-stats">
            <div class="stat" v-for="s in stats" :key="s.label">
              <div class="stat-num">{{ s.value }}</div>
              <div class="stat-lbl">{{ s.label }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="profile-grid">
        <!-- Personal info -->
        <div class="info-card dark-card">
          <div class="card-head">
            <h3><VsxIcon iconName="Personalcard" :size="18" /> Personal Information</h3>
            <button class="btn-icon" title="Edit" @click="openEdit">
              <VsxIcon iconName="Edit2" :size="18" />
            </button>
          </div>
          <div class="info-list">
            <div class="info-row" v-for="row in infoRows" :key="row.label">
              <span class="info-label"
                ><VsxIcon :iconName="row.icon" :size="16" /> {{ row.label }}</span
              >
              <span class="info-value">{{ row.value || '—' }}</span>
            </div>
          </div>
          <div class="bio-block" v-if="user.bio">
            <span class="info-label"><VsxIcon iconName="QuoteUp" :size="18" /> About</span>
            <p>{{ user.bio }}</p>
          </div>
        </div>

        <!-- Side column -->
        <div class="side-col">
          <!-- Security quick actions -->
          <div class="info-card dark-card">
            <div class="card-head">
              <h3><VsxIcon iconName="Security" :size="18" /> Security</h3>
            </div>
            <button class="action-link" @click="goSecurity">
              <span><VsxIcon iconName="Key" :size="18" /> Change password</span>
              <VsxIcon iconName="ArrowRight2" :size="18" />
            </button>
            <button class="action-link" @click="goSecurity">
              <span><VsxIcon iconName="Mobile" :size="18" /> Two-factor auth</span>
              <VsxIcon iconName="ArrowRight2" :size="18" />
            </button>
            <button class="action-link danger" @click="confirmLogout = true">
              <span><VsxIcon iconName="Logout" :size="18" /> Log out</span>
              <VsxIcon iconName="ArrowRight2" :size="18" />
            </button>
          </div>

          <!-- Recent activity -->
          <div class="info-card dark-card">
            <div class="card-head">
              <h3><VsxIcon iconName="Clock" :size="18" /> Recent Activity</h3>
            </div>
            <ul class="activity-list">
              <li v-for="(a, i) in activity" :key="i">
                <span class="act-dot" :style="{ background: a.color }"></span>
                <div>
                  <div class="act-text">{{ a.text }}</div>
                  <div class="act-time">{{ a.time }}</div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit profile modal -->
    <div class="modal-overlay" v-if="showEdit" @click.self="showEdit = false">
      <div class="modal-box">
        <div class="modal-head">
          <h3>Edit Profile</h3>
          <button class="close-btn" @click="showEdit = false">
            <VsxIcon iconName="CloseCircle" :size="18" />
          </button>
        </div>
        <form @submit.prevent="saveEdit" class="modal-form">
          <div class="form-row">
            <div class="form-field">
              <label>First name *</label>
              <input type="text" v-model.trim="form.first_name" placeholder="First name" required />
            </div>
            <div class="form-field">
              <label>Last name</label>
              <input type="text" v-model.trim="form.last_name" placeholder="Last name" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Email *</label>
              <input
                type="email"
                v-model.trim="form.email"
                placeholder="you@company.com"
                required
              />
            </div>
            <div class="form-field">
              <label>Phone</label>
              <input type="tel" v-model.trim="form.phone" placeholder="+855 ..." />
            </div>
          </div>
          <div class="form-row single">
            <div class="form-field">
              <label>Location</label>
              <input type="text" v-model.trim="form.location" placeholder="City, Country" />
            </div>
          </div>
          <div class="form-row single">
            <div class="form-field">
              <label>Bio</label>
              <textarea
                v-model.trim="form.bio"
                rows="3"
                placeholder="Tell us about yourself..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-outline" @click="showEdit = false">Cancel</button>
            <button type="submit" class="btn-primary">
              <VsxIcon iconName="TickCircle" :size="18" /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Logout confirm -->
    <div class="modal-overlay" v-if="confirmLogout" @click.self="confirmLogout = false">
      <div class="modal-box modal-sm">
        <div class="modal-head">
          <h3>Log out</h3>
          <button class="close-btn" @click="confirmLogout = false">
            <VsxIcon iconName="CloseCircle" :size="18" />
          </button>
        </div>
        <div class="confirm-body">
          <div class="confirm-icon"><VsxIcon iconName="Logout" :size="18" /></div>
          <p>Are you sure you want to log out of your account?</p>
        </div>
        <div class="modal-footer">
          <button class="btn-outline" @click="confirmLogout = false">Cancel</button>
          <button class="btn-danger" @click="doLogout">
            <VsxIcon iconName="Logout" :size="18" /> Log Out
          </button>
        </div>
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

const auth = useAuthStore()
const router = useRouter()

const user = computed(() => auth.user || {})

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')
const fullName = computed(
  () => `${cap(user.value.first_name || '')} ${cap(user.value.last_name || '')}`.trim() || 'User',
)
const initials = computed(
  () =>
    `${user.value.first_name?.charAt(0) || ''}${user.value.last_name?.charAt(0) || ''}`.toUpperCase() ||
    'U',
)
// Source the role from the auth store (JWT-derived, with stored fallback) so it
// reflects Admin / HR / Employee reliably even if the user object omits it.
const roleLabel = computed(() => auth.role || user.value.role || 'Employee')
const roleClass = computed(() =>
  roleLabel.value === 'Admin' ? 'role-admin' : roleLabel.value === 'HR' ? 'role-hr' : 'role-emp',
)

const stats = [
  { label: 'Days Present', value: 142 },
  { label: 'Leave Taken', value: 6 },
  { label: 'Pending', value: 1 },
]

const infoRows = computed(() => [
  { icon: 'User', label: 'Full name', value: fullName.value },
  { icon: 'Sms', label: 'Email', value: user.value.email },
  { icon: 'Call', label: 'Phone', value: user.value.phone },
  { icon: 'Location', label: 'Location', value: user.value.location },
  { icon: 'SecurityUser', label: 'Role', value: roleLabel.value },
])

const activity = [
  { text: 'Signed in to the dashboard', time: 'Today, 08:02 AM', color: '#10b981' },
  { text: 'Updated profile information', time: 'Yesterday, 04:18 PM', color: '#4f7cff' },
  { text: 'Submitted a leave request', time: '2 days ago', color: '#f59e0b' },
  { text: 'Password last changed', time: '3 weeks ago', color: '#0284c7' },
]

// ─── Avatar upload ─────────────────────────────────────────────
const avatarInput = ref(null)
const triggerAvatarPick = () => avatarInput.value?.click()
const onAvatarChange = (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) return toast.error('Please choose an image file')
  if (file.size > 2 * 1024 * 1024) return toast.error('Image must be under 2MB')
  const reader = new FileReader()
  reader.onload = () => {
    auth.updateProfile({ avatar: reader.result })
    toast.success('Profile picture updated')
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

// ─── Edit modal ────────────────────────────────────────────────
const showEdit = ref(false)
const form = reactive({})
const openEdit = () => {
  Object.assign(form, {
    first_name: user.value.first_name || '',
    last_name: user.value.last_name || '',
    email: user.value.email || '',
    phone: user.value.phone || '',
    location: user.value.location || '',
    bio: user.value.bio || '',
  })
  showEdit.value = true
}
const saveEdit = () => {
  if (!form.first_name) return toast.error('First name is required')
  if (!/^\S+@\S+\.\S+$/.test(form.email)) return toast.error('Enter a valid email address')
  auth.updateProfile({ ...form })
  showEdit.value = false
  toast.success('Profile updated successfully')
}

// ─── Security / logout ─────────────────────────────────────────
const goSecurity = () => router.push('/settings')
const confirmLogout = ref(false)
const doLogout = async () => {
  await auth.logout()
  toast.success('Logged out')
  router.push('/login')
}
</script>

<style scoped>
.profile-container {
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
  flex-wrap: wrap;
  gap: 1rem;
}
.header-actions {
  display: flex;
  gap: 0.75rem;
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

.dark-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.03);
}

/* Banner */
.banner-card {
  overflow: hidden;
}
.banner-cover {
  height: 120px;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 50%, #0284c7 100%);
}
.banner-body {
  display: flex;
  align-items: flex-end;
  gap: 1.5rem;
  padding: 0 2rem 1.5rem;
  margin-top: -42px;
  flex-wrap: wrap;
}
.banner-avatar {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: 4px solid #fff;
  overflow: visible;
  flex-shrink: 0;
}
.banner-avatar img,
.banner-avatar .initials {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}
.banner-avatar .initials {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  color: #fff;
  font-size: 2rem;
  font-weight: 700;
}
.avatar-edit {
  position: absolute;
  right: 0;
  bottom: 4px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  border: 2px solid #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  transition: transform 0.15s;
}
.avatar-edit:hover {
  transform: scale(1.1);
}
.banner-info {
  flex: 1;
  padding-bottom: 4px;
  min-width: 200px;
}
.banner-name {
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 0.4rem;
}
.banner-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
  flex-wrap: wrap;
}
.banner-meta .dot {
  color: #cbd5e1;
}
.role-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 700;
}
.role-admin {
  background: #fef3c7;
  color: #b45309;
}
.role-hr {
  background: rgba(var(--accent-rgb), 0.12);
  color: var(--accent);
}
.role-emp {
  background: #e0f2fe;
  color: #0369a1;
}
.banner-stats {
  display: flex;
  gap: 2rem;
  padding-bottom: 4px;
}
.stat {
  text-align: center;
}
.stat-num {
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
}
.stat-lbl {
  font-size: 0.72rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin-top: 2px;
}

/* Grid */
.profile-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 1.5rem;
  align-items: start;
}
.side-col {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.info-card {
  padding: 1.5rem;
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}
.card-head h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}
.card-head h3 :deep(svg) {
  color: var(--accent);
}

.info-list {
  display: flex;
  flex-direction: column;
}
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.7rem 0;
  border-bottom: 1px solid #f1f5f9;
}
.info-row:last-child {
  border-bottom: none;
}
.info-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.83rem;
  color: #64748b;
  font-weight: 500;
}
.info-label :deep(svg) {
  flex-shrink: 0;
  color: #94a3b8;
}
.info-value {
  font-size: 0.88rem;
  font-weight: 600;
  color: #0f172a;
  text-align: right;
}
.bio-block {
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px dashed #e2e8f0;
}
.bio-block p {
  margin: 0.5rem 0 0;
  font-size: 0.88rem;
  color: #475569;
  line-height: 1.6;
}

/* Action links */
.action-link {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 0.5rem;
  background: none;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  color: #334155;
  font-size: 0.88rem;
  font-weight: 600;
  transition: all 0.18s;
}
.action-link span {
  display: flex;
  align-items: center;
  gap: 10px;
}
.action-link span :deep(svg) {
  flex-shrink: 0;
  color: #94a3b8;
}
.action-link :deep(svg:last-child) {
  color: #cbd5e1;
}
.action-link:last-child {
  border-bottom: none;
}
.action-link:hover {
  color: var(--accent);
}
.action-link:hover span :deep(svg) {
  color: var(--accent);
}
.action-link.danger {
  color: #dc2626;
}
.action-link.danger span :deep(svg) {
  color: #f87171;
}
.action-link.danger:hover {
  color: #b91c1c;
}

/* Activity */
.activity-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.activity-list li {
  display: flex;
  gap: 12px;
  padding: 0.6rem 0;
}
.act-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
}
.act-text {
  font-size: 0.85rem;
  color: #0f172a;
  font-weight: 500;
}
.act-time {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 2px;
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
.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}
.btn-danger:hover {
  opacity: 0.95;
}
.btn-icon {
  width: 32px;
  height: 32px;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #475569;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}
.btn-icon:hover {
  background: #f1f5f9;
  color: var(--accent);
  border-color: #94a3b8;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}
.modal-box {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  width: 100%;
  max-width: 560px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: modalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-sm {
  max-width: 420px;
}
.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}
.modal-head h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}
.close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 4px;
}
.close-btn:hover {
  color: #475569;
}
.modal-form {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.form-row.single {
  grid-template-columns: 1fr;
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
.form-field textarea {
  padding: 0.65rem 0.9rem;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #0f172a;
  font-size: 0.9rem;
  outline: none;
  font-family: inherit;
  transition: all 0.2s ease;
}
.form-field input:focus,
.form-field textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.1);
}
.modal-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}
.confirm-body {
  padding: 2rem 1.5rem 1.5rem;
  text-align: center;
}
.confirm-icon {
  width: 56px;
  height: 56px;
  background: #fef2f2;
  border: 1px solid #fee2e2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: #ef4444;
  font-size: 1.3rem;
}
.confirm-body p {
  color: #334155;
  font-size: 0.95rem;
  margin: 0;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 860px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
  .banner-stats {
    width: 100%;
    justify-content: space-around;
    gap: 1rem;
  }
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
