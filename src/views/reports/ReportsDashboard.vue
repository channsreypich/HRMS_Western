<template>
  <MainLayout>
    <div class="reports-container">
      <div class="page-header">
        <div>
          <h1 class="page-title"><i class="fas fa-chart-bar me-2 text-gradient"></i>Reports</h1>
          <p class="page-sub">Analyze your organization's performance and data</p>
        </div>
        <div class="header-date">
          <i class="fas fa-calendar-alt"></i> {{ currentDate }}
        </div>
      </div>

      <!-- Quick stats -->
      <div class="quick-stats">
        <div class="qs-card" v-for="s in quickStats" :key="s.label">
          <div class="qs-icon" :style="{ background: s.color + '20', color: s.color }">
            <i :class="s.icon"></i>
          </div>
          <div class="qs-info">
            <div class="qs-value">{{ s.value }}</div>
            <div class="qs-label">{{ s.label }}</div>
          </div>
          <div class="qs-trend" :class="s.trend > 0 ? 'up' : 'down'">
            <i :class="s.trend > 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
            {{ Math.abs(s.trend) }}%
          </div>
        </div>
      </div>

      <!-- Report Cards -->
      <div class="report-grid">
        <div class="report-card" v-for="report in reportCards" :key="report.title" @click="goToReport(report)">
          <div class="report-icon-wrap" :style="{ background: report.color + '18' }">
            <i :class="report.icon" :style="{ color: report.color }"></i>
          </div>
          <div class="report-body">
            <h3 class="report-title">{{ report.title }}</h3>
            <p class="report-desc">{{ report.description }}</p>
            <div class="report-meta">
              <span class="meta-chip"><i class="fas fa-chart-bar"></i> {{ report.charts }} charts</span>
              <span class="meta-chip"><i class="fas fa-table"></i> {{ report.metrics }} metrics</span>
            </div>
          </div>
          <div class="report-arrow">
            <i class="fas fa-arrow-right"></i>
          </div>
        </div>
      </div>

      <!-- Charts row -->
      <div class="charts-row">
        <div class="dark-card chart-card">
          <div class="chart-header">
            <h5 class="chart-title">Headcount by Department</h5>
            <span class="chart-badge">Live</span>
          </div>
          <div class="chart-body">
            <canvas id="deptChart"></canvas>
          </div>
        </div>
        <div class="dark-card chart-card">
          <div class="chart-header">
            <h5 class="chart-title">Monthly Payroll Trend</h5>
          </div>
          <div class="chart-body">
            <canvas id="payrollChart"></canvas>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/components/layouts/MainLayout.vue'
import Chart from 'chart.js/auto'

const router = useRouter()
const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

const quickStats = [
  { label: 'Total Employees', value: '156', icon: 'fas fa-users', color: '#6823ff', trend: 12 },
  { label: 'Attendance Rate', value: '94.2%', icon: 'fas fa-clock', color: '#34d399', trend: 2.1 },
  { label: 'Leave Utilization', value: '38%', icon: 'fas fa-calendar-alt', color: '#fbbf24', trend: -5 },
  { label: 'Monthly Payroll', value: '$71.4K', icon: 'fas fa-dollar-sign', color: '#40c8da', trend: 8 },
]

const reportCards = [
  { title: 'Headcount Report', description: 'Analyze workforce distribution by department, position, and employment type', icon: 'fas fa-users', color: '#6823ff', charts: 4, metrics: 12, route: '/reports/headcount' },
  { title: 'Attendance Report', description: 'Track attendance rates, late arrivals, absenteeism, and trends over time', icon: 'fas fa-clock', color: '#34d399', charts: 3, metrics: 8, route: '/reports/attendance' },
  { title: 'Leave Report', description: 'Monitor leave balances, utilization rates, and leave type breakdown', icon: 'fas fa-calendar-alt', color: '#fbbf24', charts: 2, metrics: 6, route: '/reports/leave' },
  { title: 'Payroll Report', description: 'Comprehensive payroll analysis including salary ranges, costs by department', icon: 'fas fa-money-bill-wave', color: '#a78bfa', charts: 5, metrics: 14, route: '/reports/payroll' },
  { title: 'Turnover Report', description: 'Track employee turnover rates, retention trends, and exit analysis', icon: 'fas fa-door-open', color: '#f87171', charts: 3, metrics: 7, route: '/reports/turnover' },
  { title: 'Performance Report', description: 'Review employee performance metrics, KPI achievements, and reviews', icon: 'fas fa-star', color: '#fbbf24', charts: 4, metrics: 10, route: '/reports/performance' },
]

const goToReport = (report) => {
  if (report.route === '/reports/headcount') router.push(report.route)
  else router.push({ name: 'reports' }) // others show "coming soon" since only headcount is built
}

onMounted(() => {
  const ctx1 = document.getElementById('deptChart')?.getContext('2d')
  if (ctx1) {
    new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: ['Engineering', 'HR', 'Finance', 'Marketing', 'Operations', 'Sales'],
        datasets: [{
          label: 'Employees',
          data: [24, 8, 12, 15, 20, 18],
          backgroundColor: ['#6823ff', '#40c8da', '#fbbf24', '#f87171', '#34d399', '#a78bfa'],
          borderRadius: 8, borderSkipped: false,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 11 } } },
          x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 10 } } }
        }
      }
    })
  }
  const ctx2 = document.getElementById('payrollChart')?.getContext('2d')
  if (ctx2) {
    new Chart(ctx2, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [{
          label: 'Net Payroll ($)',
          data: [65000, 67200, 68400, 70100, 71400],
          borderColor: '#a47bff', backgroundColor: 'rgba(164,123,255,0.08)',
          tension: 0.4, fill: true, borderWidth: 2, pointBackgroundColor: '#a47bff', pointRadius: 5,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: false, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 11 }, callback: v => '$' + (v/1000).toFixed(0) + 'K' } },
          x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 11 } } }
        }
      }
    })
  }
})
</script>

<style scoped>
.reports-container { padding: 1.5rem; max-width: 1600px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.25rem; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; }
.page-title { font-size: 1.6rem; font-weight: 700; color: rgba(255,255,255,0.92); margin: 0 0 0.3rem; }
.page-sub { font-size: 0.83rem; color: rgba(255,255,255,0.35); margin: 0; }
.text-gradient { background: linear-gradient(135deg, #a47bff, #40c8da); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.header-date { font-size: 0.78rem; color: rgba(255,255,255,0.35); display: flex; align-items: center; gap: 7px; }

.quick-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
.qs-card { background: #0d0d1a; border: 1px solid rgba(104,35,255,0.13); border-radius: 16px; padding: 1.1rem 1.25rem; display: flex; align-items: center; gap: 0.9rem; transition: all 0.25s; }
.qs-card:hover { border-color: rgba(104,35,255,0.3); transform: translateY(-2px); }
.qs-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.15rem; flex-shrink: 0; }
.qs-info { flex: 1; }
.qs-value { font-size: 1.4rem; font-weight: 800; color: rgba(255,255,255,0.9); line-height: 1; }
.qs-label { font-size: 0.72rem; color: rgba(255,255,255,0.35); margin-top: 3px; }
.qs-trend { font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 20px; display: flex; align-items: center; gap: 3px; }
.qs-trend.up { color: #34d399; background: rgba(52,211,153,0.12); }
.qs-trend.down { color: #f87171; background: rgba(248,113,113,0.12); }

.report-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; }
.report-card {
  background: #0d0d1a; border: 1px solid rgba(104,35,255,0.13);
  border-radius: 16px; padding: 1.25rem;
  display: flex; align-items: flex-start; gap: 1rem;
  cursor: pointer; transition: all 0.25s;
}
.report-card:hover { border-color: rgba(104,35,255,0.4); transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.3); }
.report-icon-wrap { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0; }
.report-body { flex: 1; }
.report-title { font-size: 0.92rem; font-weight: 700; color: rgba(255,255,255,0.88); margin: 0 0 0.35rem; }
.report-desc { font-size: 0.77rem; color: rgba(255,255,255,0.38); margin: 0 0 0.75rem; line-height: 1.5; }
.report-meta { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.meta-chip { display: flex; align-items: center; gap: 4px; padding: 2px 8px; background: rgba(255,255,255,0.05); border-radius: 6px; font-size: 0.7rem; color: rgba(255,255,255,0.4); }
.report-arrow { color: rgba(255,255,255,0.2); font-size: 0.9rem; padding-top: 0.2rem; transition: all 0.2s; flex-shrink: 0; }
.report-card:hover .report-arrow { color: #a47bff; transform: translateX(4px); }

.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
.dark-card { background: #0d0d1a; border: 1px solid rgba(104,35,255,0.13); border-radius: 18px; padding: 1.5rem; }
.chart-card {}
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
.chart-title { font-size: 0.9rem; font-weight: 700; color: rgba(255,255,255,0.8); margin: 0; }
.chart-badge { padding: 2px 8px; background: rgba(52,211,153,0.15); color: #34d399; border-radius: 10px; font-size: 0.68rem; font-weight: 700; }
.chart-body { height: 250px; position: relative; }

@media (max-width: 900px) { .charts-row { grid-template-columns: 1fr; } }
</style>
