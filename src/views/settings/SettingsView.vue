<template>
  <div class="settings-wrapper">
    <div class="settings-tabs">
      <button
        v-for="tab in menuItems"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.name }}
      </button>
    </div>

    <main class="settings-card">
      <div v-if="activeTab === 'profile'" class="tab-content">
        <header class="content-header">
          <h2>Account Settings</h2>
          <p>Update your personal information and profile picture.</p>
        </header>

        <form @submit.prevent="updateProfile">
          <div class="profile-section">
            <label class="section-label">Your Profile Picture</label>
            <div class="avatar-upload">
              <div class="avatar-preview">
                <img v-if="auth.user?.avatar" :src="auth.user.avatar" alt="avatar" />
                <div v-else class="initials">{{ getUserInitials() }}</div>
              </div>
              <div class="upload-controls">
                <button type="button" class="btn-primary-outline">Upload New</button>
                <button type="button" class="btn-ghost-danger">Remove Profile Picture</button>
              </div>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Full name</label>
              <input type="text" v-model="formData.fullName" placeholder="Full Name" />
            </div>
            <div class="form-group">
              <label>Email address</label>
              <div class="input-with-badge">
                <input type="email" v-model="formData.email" />
                <span class="badge-verified">Verified</span>
              </div>
            </div>
            <div class="form-group">
              <label>Username</label>
              <input type="text" v-model="formData.username" />
            </div>
            <div class="form-group">
              <label>Phone number</label>
              <div class="input-with-badge">
                <input type="tel" v-model="formData.phone" />
                <span class="badge-verified">Verified</span>
              </div>
            </div>
            <div class="form-group full-width">
              <label>Bio</label>
              <textarea
                v-model="formData.bio"
                rows="4"
                placeholder="Briefly describe your role..."
              ></textarea>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary">Update Profile</button>
          </div>
        </form>
      </div>

      <div v-else class="placeholder-content">
        <h3>{{ getActiveTabName() }}</h3>
        <p>This section is currently under active development.</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue3-toastify'

const auth = useAuthStore()
const activeTab = ref('profile')

const menuItems = [
  { id: 'profile', name: 'Account Settings' },
  { id: 'security', name: 'Login & Security' },
  { id: 'notifications', name: 'Notification Settings' },
  { id: 'interface', name: 'Interface' },
  { id: 'additional', name: 'Additional Settings' },
]

const formData = reactive({
  fullName: `${auth.user?.first_name || ''} ${auth.user?.last_name || ''}`,
  email: auth.user?.email || '',
  username: auth.user?.username || '',
  phone: '',
  bio: '',
})

const getUserInitials = () => auth.user?.first_name?.charAt(0).toUpperCase() || 'U'
const getActiveTabName = () => menuItems.find((i) => i.id === activeTab.value)?.name
const updateProfile = () => toast.success('Profile updated successfully')
</script>

<style scoped>
.settings-wrapper {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

/* Tabs */
.settings-tabs {
  display: flex;
  gap: 30px;
  margin-bottom: 30px;
  border-bottom: 1px solid #e5e7eb;
}
.tab-btn {
  background: none;
  border: none;
  padding: 10px 0;
  cursor: pointer;
  color: #6b7280;
  font-weight: 500;
  border-bottom: 2px solid transparent;
}
.tab-btn.active {
  color: #6823ff;
  border-bottom-color: #6823ff;
}

/* Card & Forms */
.settings-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 40px;
  border: 1px solid #f3f4f6;
}
.section-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 15px;
}
.avatar-upload {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 40px;
}
.avatar-preview {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  overflow: hidden;
  background: #6823ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
}
.btn-primary-outline {
  background: #f5f3ff;
  color: #6823ff;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.btn-ghost-danger {
  background: none;
  border: none;
  color: #6b7280;
  margin-left: 10px;
  cursor: pointer;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
}
.full-width {
  grid-column: span 2;
}
.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 8px;
}
.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}
.input-with-badge {
  position: relative;
}
.badge-verified {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #10b981;
  font-size: 0.75rem;
  font-weight: 600;
  background: #ecfdf5;
  padding: 2px 8px;
  border-radius: 4px;
}

.form-actions {
  margin-top: 30px;
}
.btn-primary {
  background: #6823ff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
</style>
