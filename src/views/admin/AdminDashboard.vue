<template>
  <MainLayout>
    <div class="dashboard-container">
      <div class="light-card header-section fade-in">
        <h1 class="page-title">
          <i class="fas fa-crown me-2" style="color: #6823ff"></i>
          <span class="text-gradient">Super Admin Control Console</span>
        </h1>
        <p class="page-subtitle text-muted">
          Overview of core system security, HR operator status, and operational logs.
        </p>
      </div>

      <div class="metrics-grid mt-4 fade-in">
        <div class="metric-card clickable-card" @click="$router.push('/manage-hr')">
          <div class="metric-content">
            <div class="metric-info">
              <span class="metric-label">HR Operators</span>

              <h3 class="metric-value text-dark">{{ hrCount }} Users</h3>
              <span class="metric-subtext text-purple"
                >Manage HR Accounts <i class="fas fa-arrow-right ms-1"></i
              ></span>
            </div>
            <div class="metric-icon-box bg-purple-light">
              <i class="fas fa-user-shield" style="color: #6823ff"></i>
            </div>
          </div>
        </div>
      </div>

      <div class="light-card mt-4 fade-in">
        <h4 class="section-title mb-4">
          <i class="fas fa-bolt me-2 text-warning-dark"></i> Quick Management Actions
        </h4>
        <div class="action-grid">
          <div class="action-item" @click="$router.push('/manage-hr')">
            <i class="fas fa-user-plus fa-lg mb-2" style="color: #6823ff"></i>
            <h5>Register HR Account</h5>
            <p class="text-muted">Create new logins for system operators</p>
          </div>
          <div class="action-item" @click="$router.push('/manage-hr')">
            <i class="fas fa-user-slash fa-lg mb-2 text-warning-dark"></i>
            <h5>Deactivate System Access</h5>
            <p class="text-muted">Instantly block or revoke access permissions</p>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import MainLayout from '@/components/layouts/MainLayout.vue'

const hrCount = ref(0)

const fetchHRStatistics = async () => {
  try {
    const res = await api.get('/api/auth/users-list')
    if (res.data.success) {
      const totalHR = res.data.data.filter((user) => user.role === 'HR')
      hrCount.value = totalHR.length
    }
  } catch (err) {
    console.error('Failed to fetch statistics:', err)
  }
}

onMounted(() => {
  fetchHRStatistics()
})
</script>

<style scoped>
.dashboard-container {
  padding: 0.5rem;
  color: #1a1a1a;
}
.text-gradient {
  background: linear-gradient(135deg, #531cbd 0%, #11606d 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.page-subtitle {
  font-size: 0.88rem;
  margin-top: 6px;
  color: #64748b !important;
}
.text-warning-dark {
  color: #b45309 !important;
}

.light-card {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.02),
    0 2px 4px -1px rgba(0, 0, 0, 0.02);
  border-radius: 16px;
  padding: 1.5rem;
}
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
}
.metric-card {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.01);
  border-radius: 14px;
  padding: 1.25rem;
}
.clickable-card {
  cursor: pointer;
  transition: 0.2s ease;
}
.clickable-card:hover {
  transform: translateY(-3px);
  border-color: rgba(104, 35, 255, 0.3);
  background: rgba(104, 35, 255, 0.02);
  box-shadow: 0 10px 15px -3px rgba(104, 35, 255, 0.05);
}

.metric-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.metric-label {
  font-size: 0.78rem;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}
.metric-value {
  font-size: 1.6rem;
  font-weight: 700;
  margin-top: 4px;
  margin-bottom: 2px;
}
.metric-subtext {
  font-size: 0.75rem;
  color: #64748b;
}
.text-purple {
  color: #6823ff !important;
  font-weight: 500;
}

.metric-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}
.bg-purple-light {
  background: rgba(104, 35, 255, 0.06);
}

.section-title {
  color: #1a1a1a;
  font-size: 1.05rem;
  font-weight: 600;
}
.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.25rem;
}
.action-item {
  background: rgba(0, 0, 0, 0.01);
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 12px;
  padding: 1.25rem;
  cursor: pointer;
  transition: 0.2s;
}
.action-item:hover {
  background: rgba(104, 35, 255, 0.03);
  border-color: rgba(104, 35, 255, 0.15);
  transform: scale(1.02);
}
.action-item h5 {
  color: #1a1a1a;
  margin-top: 6px;
  font-size: 0.9rem;
  font-weight: 600;
}
.action-item p {
  font-size: 0.78rem;
  margin-bottom: 0;
  color: #64748b !important;
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
