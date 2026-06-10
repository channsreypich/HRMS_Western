<template>
  <MainLayout>
    <div class="dashboard-container">
      <!-- ⬜ Header section card converted to high-contrast white profile -->
      <div class="light-card header-section fade-in">
        <div class="header-content">
          <div>
            <h1 class="page-title">
              <i class="fas fa-chart-pie me-2" style="color: #6823ff"></i>
              <span class="text-gradient">HRM Analytics Dashboard</span>
            </h1>
            <p class="page-subtitle">
              Welcome back! Here's what's happening with your workforce today.
            </p>
          </div>
        </div>
      </div>

      <!-- ⬜ Numeric stat cards updated to clean light layout definitions -->
      <div class="stats-grid">
        <div
          v-for="(stat, index) in dashboardStats"
          :key="stat.title"
          class="stat-card fade-in"
          :style="{ animationDelay: `${index * 0.08}s` }"
        >
          <div class="stat-header">
            <div class="stat-icon-wrapper" :style="{ background: stat.color + '12' }">
              <i :class="stat.icon" :style="{ color: stat.color }"></i>
            </div>
            <span class="stat-trend" :class="stat.trend >= 0 ? 'trend-up' : 'trend-down'">
              <i :class="stat.trend >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
              {{ Math.abs(stat.trend) }}%
            </span>
          </div>
          <div class="stat-content">
            <h3 class="stat-value">{{ stat.value }}</h3>
            <p class="stat-label">{{ stat.title }}</p>
          </div>
          <div class="stat-footer">
            <span class="stat-compare">vs last month</span>
          </div>
        </div>
      </div>

      <!-- ⚙️ Management shortcuts layout refined for light backdrops -->
      <div class="overview-grid fade-in" style="animation-delay: 0.32s; margin-top: 1.25rem">
        <div class="light-card panel-card">
          <div class="panel-header">
            <h3 style="font-size: 0.95rem; color: #0f172a; font-weight: 700; margin: 0">
              <i class="fas fa-bolt me-2" style="color: #d97706"></i>Quick Management Actions
            </h3>
          </div>
          <div
            class="actions-group"
            style="
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 1rem;
              margin-top: 1.25rem;
            "
          >
            <router-link
              to="/employees"
              style="
                text-decoration: none;
                padding: 1rem;
                background: #f8fafc;
                border: 1px solid rgba(104, 35, 255, 0.12);
                border-radius: 12px;
                display: flex;
                align-items: center;
                gap: 12px;
                color: #334155;
                font-weight: 600;
                font-size: 0.85rem;
                transition: all 0.2s;
              "
              class="action-item-link"
            >
              <i class="fas fa-users" style="color: #6823ff; font-size: 1.2rem"></i> Staff Directory
            </router-link>
            <router-link
              to="/leave"
              style="
                text-decoration: none;
                padding: 1rem;
                background: #f8fafc;
                border: 1px solid rgba(104, 35, 255, 0.12);
                border-radius: 12px;
                display: flex;
                align-items: center;
                gap: 12px;
                color: #334155;
                font-weight: 600;
                font-size: 0.85rem;
                transition: all 0.2s;
              "
              class="action-item-link"
            >
              <i class="fas fa-calendar-check" style="color: #b45309; font-size: 1.2rem"></i> Review
              Leaves
            </router-link>
            <router-link
              to="/payroll"
              style="
                text-decoration: none;
                padding: 1rem;
                background: #f8fafc;
                border: 1px solid rgba(104, 35, 255, 0.12);
                border-radius: 12px;
                display: flex;
                align-items: center;
                gap: 12px;
                color: #334155;
                font-weight: 600;
                font-size: 0.85rem;
                transition: all 0.2s;
              "
              class="action-item-link"
            >
              <i class="fas fa-money-check-alt" style="color: #059669; font-size: 1.2rem"></i> Run
              Payroll
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import MainLayout from '@/components/layouts/MainLayout.vue'
import { useDashboardStore } from '@/stores/dashboard'

const dashboardStore = useDashboardStore()

// Cards come straight from the backend /api/dashboard/metrics endpoint so the
// counts (and trends) always reflect the real database, not client-side guesses.
const dashboardStats = computed(() => dashboardStore.stats || [])

onMounted(() => {
  dashboardStore.fetchDashboardStats()
})
</script>

<style scoped>
.dashboard-container {
  padding: 1.5rem;
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* 🎨 Main cards configured with a sharp clean white backdrop */
.light-card {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.02),
    0 2px 4px -1px rgba(0, 0, 0, 0.01);
  border-radius: 18px;
  padding: 1.5rem;
  transition: border-color 0.25s;
}
.light-card:hover {
  border-color: rgba(104, 35, 255, 0.2);
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.welcome-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.35rem;
}
.text-gradient {
  background: linear-gradient(135deg, #531cbd, #11606d);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.page-subtitle {
  font-size: 0.88rem;
  color: #64748b;
  margin-top: 4px;
  margin-bottom: 0;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #6823ff, #4f0fdb);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    opacity 0.2s,
    transform 0.1s;
  box-shadow: 0 4px 14px rgba(104, 35, 255, 0.2);
}
.btn-primary:hover {
  opacity: 0.95;
}
.btn-primary:active {
  transform: scale(0.97);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

/* ⬜ Analytics summary data tracking components */
.stat-card {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.02),
    0 2px 4px -1px rgba(0, 0, 0, 0.01);
  border-radius: 16px;
  padding: 1.25rem;
  transition:
    border-color 0.25s,
    transform 0.2s;
  animation: fadeIn 0.5s ease both;
}
.stat-card:hover {
  border-color: rgba(104, 35, 255, 0.25);
  transform: translateY(-3px);
}
.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.9rem;
}
.stat-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}
.stat-trend {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 3px;
}

.trend-up {
  color: #059669;
  background: rgba(16, 185, 129, 0.1);
}
.trend-down {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.1);
}
.stat-value {
  font-size: 1.9rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
}
.stat-label {
  font-size: 0.78rem;
  color: #64748b;
  margin-top: 5px;
  margin-bottom: 0;
  font-weight: 500;
}
.stat-footer {
  margin-top: 0.65rem;
}
.stat-compare {
  font-size: 0.68rem;
  color: #94a3b8;
}

/* 🔗 Interactive link hover animations */
.action-item-link:hover {
  background: #ffffff !important;
  border-color: #6823ff !important;
  box-shadow: 0 4px 12px rgba(104, 35, 255, 0.08);
  color: #0f172a !important;
  transform: translateY(-1px);
}

.charts-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.25rem;
}
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}
.chart-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #334155;
  margin: 0;
}
.chart-select {
  padding: 0.4rem 0.9rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #475569;
  font-size: 0.78rem;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
}
.chart-select:focus {
  border-color: #6823ff;
}
.chart-body {
  height: 280px;
  position: relative;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.1rem;
}
.section-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #334155;
  margin: 0;
}
.view-all-link {
  color: #6823ff;
  text-decoration: none;
  font-size: 0.78rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: gap 0.2s;
}
.view-all-link:hover {
  gap: 8px;
  text-decoration: underline;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.activity-item {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.65rem 0.75rem;
  border-radius: 11px;
  transition: background 0.2s;
}
.activity-item:hover {
  background: rgba(104, 35, 255, 0.05);
}
.activity-content {
  flex: 1;
}
.activity-text {
  margin: 0;
  color: #475569;
  font-size: 0.83rem;
}
.activity-user {
  font-weight: 700;
  color: #0f172a;
}
.activity-time {
  margin: 3px 0 0;
  font-size: 0.7rem;
  color: #94a3b8;
}

.table-responsive {
  overflow-x: auto;
}
.dark-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}
.dark-table th {
  padding: 0.6rem 0.85rem;
  text-align: left;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
}
.dark-table td {
  padding: 0.75rem 0.85rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: middle;
}
.dark-table tbody tr:last-child td {
  border-bottom: none;
}
.dark-table tbody tr {
  cursor: pointer;
  transition: background 0.15s;
}
.dark-table tbody tr:hover td {
  background: rgba(104, 35, 255, 0.04);
}
.employee-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.fade-in {
  animation: fadeIn 0.3s ease-out both;
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
