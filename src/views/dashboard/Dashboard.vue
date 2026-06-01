<template>
  <MainLayout>
    <div class="dashboard-container">
      <div class="dark-card header-section fade-in">
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
      <div class="stats-grid">
        <div
          v-for="(stat, index) in dashboardStats"
          :key="stat.title"
          class="stat-card fade-in"
          :style="{ animationDelay: `${index * 0.08}s` }"
        >
          <div class="stat-header">
            <div class="stat-icon-wrapper" :style="{ background: stat.color + '18' }">
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
      <div class="overview-grid fade-in" style="animation-delay: 0.32s; margin-top: 1.25rem">
        <div class="dark-card panel-card">
          <div class="panel-header">
            <h3 style="font-size: 0.95rem; color: rgba(255, 255, 255, 0.85)">
              <i class="fas fa-bolt me-2" style="color: #fbbf24"></i>Quick Management Actions
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
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(104, 35, 255, 0.15);
                border-radius: 12px;
                display: flex;
                align-items: center;
                gap: 12px;
                color: rgba(255, 255, 255, 0.85);
                font-weight: 600;
                font-size: 0.85rem;
              "
            >
              <i class="fas fa-users" style="color: #a47bff; font-size: 1.2rem"></i> Staff Directory
            </router-link>
            <router-link
              to="/leave"
              style="
                text-decoration: none;
                padding: 1rem;
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(104, 35, 255, 0.15);
                border-radius: 12px;
                display: flex;
                align-items: center;
                gap: 12px;
                color: rgba(255, 255, 255, 0.85);
                font-weight: 600;
                font-size: 0.85rem;
              "
            >
              <i class="fas fa-calendar-check" style="color: #fbbf24; font-size: 1.2rem"></i> Review
              Leaves
            </router-link>
            <router-link
              to="/payroll"
              style="
                text-decoration: none;
                padding: 1rem;
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(104, 35, 255, 0.15);
                border-radius: 12px;
                display: flex;
                align-items: center;
                gap: 12px;
                color: rgba(255, 255, 255, 0.85);
                font-weight: 600;
                font-size: 0.85rem;
              "
            >
              <i class="fas fa-money-check-alt" style="color: #34d399; font-size: 1.2rem"></i> Run
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
import { useEmployeeStore } from '@/stores/employee'
import { useLeaveStore } from '@/stores/leave'
import { useAttendanceStore } from '@/stores/attendance'

const employeeStore = useEmployeeStore()
const leaveStore = useLeaveStore()
const attendanceStore = useAttendanceStore()

const dashboardStats = computed(() => {
  const totalEmployees = employeeStore.employees?.length || 0
  const activeEmployees = employeeStore.employees?.filter((e) => e.status === 'active')?.length || 0
  const pendingLeaves = leaveStore.leaves?.filter((l) => l.status === 'pending')?.length || 0
  const todayAttendance =
    attendanceStore.attendanceRecords?.filter((r) => {
      const todayStr = new Date().toISOString().split('T')[0]
      return r.date?.split('T')[0] === todayStr && r.status === 'Present'
    })?.length || 0

  return [
    {
      title: 'Total Workforce',
      value: totalEmployees,
      icon: 'fas fa-users',
      color: '#6823ff',
      trend: 12,
    },
    {
      title: 'Active Staff',
      value: activeEmployees,
      icon: 'fas fa-check-circle',
      color: '#34d399',
      trend: 8,
    },
    {
      title: 'Pending Leaves',
      value: pendingLeaves,
      icon: 'fas fa-calendar-alt',
      color: '#fbbf24',
      trend: -4,
    },
    {
      title: 'Present Today',
      value: todayAttendance,
      icon: 'fas fa-clock',
      color: '#40c8da',
      trend: 15,
    },
  ]
})

onMounted(async () => {
  await employeeStore.fetchEmployees()
  try {
    await leaveStore.fetchAllLeaves()
    await attendanceStore.fetchAllAttendance()
  } catch (err) {
    console.log('Optional dashboard metrics skipped.')
  }
})
</script>

<style scoped>
.dashboard-container { padding: 1.5rem; max-width: 1600px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.25rem; }
.dark-card, .welcome-card { background: #0d0d1a; border: 1px solid rgba(104, 35, 255, 0.13); border-radius: 18px; padding: 1.5rem; transition: border-color 0.25s; }
.dark-card:hover { border-color: rgba(104, 35, 255, 0.28); }
.welcome-content { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
.welcome-title { font-size: 1.6rem; font-weight: 700; color: rgba(255, 255, 255, 0.92); margin-bottom: 0.35rem; }
.text-gradient { background: linear-gradient(135deg, #a47bff, #40c8da); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.welcome-subtitle { font-size: 0.85rem; color: rgba(255, 255, 255, 0.35); }
.btn-primary { display: inline-flex; align-items: center; gap: 7px; padding: 0.6rem 1.2rem; background: linear-gradient(135deg, #6823ff, #4f0fdb); border: none; border-radius: 10px; color: white; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s, transform 0.1s; box-shadow: 0 4px 20px rgba(104, 35, 255, 0.35); }
.btn-primary:hover { opacity: 0.9; }
.btn-primary:active { transform: scale(0.97); }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
.stat-card { background: #0d0d1a; border: 1px solid rgba(104, 35, 255, 0.13); border-radius: 16px; padding: 1.25rem; transition: border-color 0.25s, transform 0.2s; animation: fadeIn 0.5s ease both; }
.stat-card:hover { border-color: rgba(104, 35, 255, 0.35); transform: translateY(-3px); }
.stat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.9rem; }
.stat-icon-wrapper { width: 44px; height: 44px; border-radius: 13px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
.stat-trend { font-size: 0.72rem; font-weight: 700; padding: 3px 9px; border-radius: 20px; display: flex; align-items: center; gap: 3px; }
.trend-up { color: #34d399; background: rgba(16, 185, 129, 0.12); }
.trend-down { color: #f87171; background: rgba(239, 68, 68, 0.12); }
.stat-value { font-size: 1.9rem; font-weight: 800; color: rgba(255,255,255,0.92); line-height: 1; }
.stat-label { font-size: 0.78rem; color: rgba(255,255,255,0.38); margin-top: 5px; }
.stat-footer { margin-top: 0.65rem; }
.stat-compare { font-size: 0.68rem; color: rgba(255,255,255,0.2); }
.charts-row { display: grid; grid-template-columns: 2fr 1fr; gap: 1.25rem; }
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
.chart-title { font-size: 0.9rem; font-weight: 700; color: rgba(255,255,255,0.8); margin: 0; }
.chart-select { padding: 0.4rem 0.9rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: rgba(255,255,255,0.6); font-size: 0.78rem; outline: none; cursor: pointer; transition: border-color 0.2s; }
.chart-select:focus { border-color: rgba(104,35,255,0.5); }
.chart-body { height: 280px; position: relative; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.1rem; }
.section-title { font-size: 0.9rem; font-weight: 700; color: rgba(255,255,255,0.8); margin: 0; }
.view-all-link { color: #a47bff; text-decoration: none; font-size: 0.78rem; font-weight: 600; display: flex; align-items: center; gap: 5px; transition: gap 0.2s; }
.view-all-link:hover { gap: 8px; }
.activities-list { display: flex; flex-direction: column; gap: 4px; }
.activity-item { display: flex; align-items: center; gap: 0.9rem; padding: 0.65rem 0.75rem; border-radius: 11px; transition: background 0.2s; }
.activity-item:hover { background: rgba(104,35,255,0.07); }
.activity-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0; }
.activity-icon.employee { background: rgba(104,35,255,0.15); color: #a47bff; }
.activity-icon.leave { background: rgba(245,158,11,0.12); color: #fbbf24; }
.activity-icon.attendance { background: rgba(16,185,129,0.12); color: #34d399; }
.activity-icon.department { background: rgba(64,200,218,0.12); color: #40c8da; }
.activity-content { flex: 1; }
.activity-text { margin: 0; color: rgba(255,255,255,0.6); font-size: 0.83rem; }
.activity-user { font-weight: 700; color: rgba(255,255,255,0.88); }
.activity-time { margin: 3px 0 0; font-size: 0.7rem; color: rgba(255, 255, 255, 0.25); }
.table-responsive { overflow-x: auto; }
.dark-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.dark-table th { padding: 0.6rem 0.85rem; text-align: left; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: rgba(255,255,255,0.25); border-bottom: 1px solid rgba(255,255,255,0.06); }
.dark-table td { padding: 0.75rem 0.85rem; border-bottom: 1px solid rgba(255,255,255,0.04); color: rgba(255,255,255,0.6); vertical-align: middle; }
.dark-table tbody tr:last-child td { border-bottom: none; }
.dark-table tbody tr { cursor: pointer; transition: background 0.15s; }
.dark-table tbody tr:hover td { background: rgba(104,35,255,0.06); }
.employee-info { display: flex; align-items: center; gap: 10px; }
.employee-avatar { width: 32px; height: 32px; background: linear-gradient(135deg, #6823ff, rgba(15, 52, 126, 0))};
</style>