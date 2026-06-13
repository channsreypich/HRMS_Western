<template>
  <MainLayout>
    <div class="reports-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <VsxIcon iconName="Chart2" :size="18" class="me-2 text-gradient" />Reports
          </h1>
          <p class="page-sub">Analyze your organization's performance and data</p>
        </div>
        <div class="header-date"><VsxIcon iconName="Calendar" :size="18" /> {{ currentDate }}</div>
      </div>

      <div class="quick-stats">
        <div class="qs-card" v-for="s in quickStats" :key="s.label">
          <div class="qs-icon" :style="{ background: s.color + '12', color: s.color }">
            <VsxIcon :iconName="s.icon" :size="22" />
          </div>
          <div class="qs-info">
            <div class="qs-value">{{ s.value }}</div>
            <div class="qs-label">{{ s.label }}</div>
          </div>
          <div class="qs-trend" :class="s.trend > 0 ? 'up' : 'down'">
            <VsxIcon :iconName="s.trend > 0 ? 'ArrowUp' : 'ArrowDown'" :size="16" />
            {{ Math.abs(s.trend) }}%
          </div>
        </div>
      </div>

      <div class="report-grid">
        <div
          class="report-card"
          v-for="report in reportCards"
          :key="report.title"
          @click="goToReport(report)"
        >
          <div class="report-icon-wrap" :style="{ background: report.color + '12' }">
            <VsxIcon :iconName="report.icon" :size="20" :style="{ color: report.color }" />
          </div>
          <div class="report-body">
            <h3 class="report-title">{{ report.title }}</h3>
            <p class="report-desc">{{ report.description }}</p>
            <div class="report-meta">
              <span class="meta-chip"
                ><VsxIcon iconName="Chart2" :size="18" /> {{ report.charts }} charts</span
              >
              <span class="meta-chip"
                ><VsxIcon iconName="RowVertical" :size="18" /> {{ report.metrics }} metrics</span
              >
            </div>
          </div>
          <div class="report-arrow">
            <VsxIcon iconName="ArrowRight" :size="18" />
          </div>
        </div>
      </div>

      <div class="charts-row">
        <div class="light-card chart-card">
          <div class="chart-header">
            <h5 class="chart-title">Headcount by Department</h5>
            <span class="chart-badge">Live</span>
          </div>
          <div class="chart-body">
            <canvas id="deptChart"></canvas>
          </div>
        </div>
        <div class="light-card chart-card">
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
import { useReportStore } from '@/stores/report'

const router = useRouter()
const reportStore = useReportStore()
const currentDate = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const quickStats = [
  { label: 'Total Employees', value: '156', icon: 'Profile2User', color: '#4f7cff', trend: 12 },
  { label: 'Attendance Rate', value: '94.2%', icon: 'Clock', color: '#16a34a', trend: 2.1 },
  {
    label: 'Leave Utilization',
    value: '38%',
    icon: 'Calendar',
    color: '#d97706',
    trend: -5,
  },
  {
    label: 'Monthly Payroll',
    value: '$71.4K',
    icon: 'DollarCircle',
    color: '#0284c7',
    trend: 8,
  },
]

const reportCards = [
  {
    title: 'Headcount Report',
    description: 'Analyze workforce distribution by department, position, and employment type',
    icon: 'Profile2User',
    color: '#4f7cff',
    charts: 4,
    metrics: 12,
    route: '/reports/headcount',
  },
  {
    title: 'Attendance Report',
    description: 'Track attendance rates, late arrivals, absenteeism, and trends over time',
    icon: 'Clock',
    color: '#16a34a',
    charts: 3,
    metrics: 8,
    route: '/reports/attendance',
  },
  {
    title: 'Leave Report',
    description: 'Monitor leave balances, utilization rates, and leave type breakdown',
    icon: 'Calendar',
    color: '#d97706',
    charts: 2,
    metrics: 6,
    route: '/reports/leave',
  },
  {
    title: 'Payroll Report',
    description: 'Comprehensive payroll analysis including salary ranges, costs by department',
    icon: 'Moneys',
    color: '#4f7cff',
    charts: 5,
    metrics: 14,
    route: '/reports/payroll',
  },
  {
    title: 'Turnover Report',
    description: 'Track employee turnover rates, retention trends, and exit analysis',
    icon: 'Login',
    color: '#dc2626',
    charts: 3,
    metrics: 7,
    route: '/reports/turnover',
  },
  {
    title: 'Performance Report',
    description: 'Review employee performance metrics, KPI achievements, and reviews',
    icon: 'Star1',
    color: '#b45309',
    charts: 4,
    metrics: 10,
    route: '/reports/performance',
  },
]

const goToReport = (report) => {
  // report.route looks like "/reports/headcount" -> navigate to the detail page for that key
  router.push(report.route)
}

onMounted(async () => {
  // Pull live data; fall back to placeholders if the backend returns nothing
  const [headcount, payroll] = await Promise.all([
    reportStore.fetchHeadcount(),
    reportStore.fetchPayrollExpenditure(),
  ])

  const deptLabels = headcount.length
    ? headcount.map((r) => r.departmentName)
    : ['Engineering', 'HR', 'Finance', 'Marketing', 'Operations', 'Sales']
  const deptData = headcount.length
    ? headcount.map((r) => Number(r.employeeCount) || 0)
    : [24, 8, 12, 15, 20, 18]

  const payLabels = payroll.length
    ? payroll.map((r) => r.month)
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May']
  const payData = payroll.length
    ? payroll.map((r) => Number(r.total_expenditure) || 0)
    : [65000, 67200, 68400, 70100, 71400]

  const ctx1 = document.getElementById('deptChart')?.getContext('2d')
  if (ctx1) {
    new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: deptLabels,
        datasets: [
          {
            label: 'Employees',
            data: deptData,
            backgroundColor: ['#4f7cff', '#0284c7', '#d97706', '#dc2626', '#16a34a', '#4f7cff'],
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9' },
            ticks: { color: '#64748b', font: { size: 11, weight: '500' } },
          },
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { size: 11, weight: '500' } },
          },
        },
      },
    })
  }
  const ctx2 = document.getElementById('payrollChart')?.getContext('2d')
  if (ctx2) {
    new Chart(ctx2, {
      type: 'line',
      data: {
        labels: payLabels,
        datasets: [
          {
            label: 'Net Payroll ($)',
            data: payData,
            borderColor: '#4f7cff',
            backgroundColor: 'rgba(79, 124, 255,0.05)',
            tension: 0.35,
            fill: true,
            borderWidth: 2.5,
            pointBackgroundColor: '#4f7cff',
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: '#f1f5f9' },
            ticks: {
              color: '#64748b',
              font: { size: 11, weight: '500' },
              callback: (v) => '$' + (v / 1000).toFixed(0) + 'K',
            },
          },
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { size: 11, weight: '500' } },
          },
        },
      },
    })
  }
})
</script>

<style scoped>
/* Base View Layout */
.reports-container {
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background-color: #f8fafc;
  min-height: 100vh;
  font-family:
    'Plus Jakarta Sans',
    system-ui,
    -apple-system,
    sans-serif;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
.header-date {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

/* Analytical Highlights Grid */
.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
}
.qs-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.02);
  transition: all 0.2s;
}
.qs-card:hover {
  border-color: #cbd5e1;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.05);
}
.qs-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}
.qs-info {
  flex: 1;
}
.qs-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
}
.qs-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
  margin-top: 5px;
}
.qs-trend {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 3px;
}
.qs-trend.up {
  color: #16a34a;
  background: #dcfce7;
}
.qs-trend.down {
  color: #dc2626;
  background: #fee2e2;
}

/* Functional Directory Grid */
.report-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.25rem;
}
.report-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1.15rem;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.02);
  transition: all 0.2s;
}
.report-card:hover {
  border-color: #cbd5e1;
  transform: translateY(-3px);
  box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.05);
}
.report-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  flex-shrink: 0;
}
.report-body {
  flex: 1;
}
.report-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.4rem;
}
.report-desc {
  font-size: 0.825rem;
  color: #64748b;
  margin: 0 0 1rem;
  line-height: 1.5;
  font-weight: 400;
}
.report-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.meta-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: #f1f5f9;
  border-radius: 8px;
  font-size: 0.75rem;
  color: #475569;
  font-weight: 600;
}
.report-arrow {
  color: #cbd5e1;
  font-size: 0.95rem;
  padding-top: 0.25rem;
  transition: all 0.2s;
  flex-shrink: 0;
}
.report-card:hover .report-arrow {
  color: var(--accent);
  transform: translateX(4px);
}

/* Chart Visualization Modules */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}
.light-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.75rem;
  box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.02);
}
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.chart-title {
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}
.chart-badge {
  padding: 3px 10px;
  background: #dcfce7;
  color: #16a34a;
  border-radius: 20px;
  font-size: 0.725rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.chart-body {
  height: 260px;
  position: relative;
}

@media (max-width: 960px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
}
</style>
