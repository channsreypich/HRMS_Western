<template>
  <MainLayout>
    <div class="dashboard">
      <!-- Greeting -->
      <div class="greeting fade-in">
        <div>
          <h1 class="greeting-title">{{ greeting }}, {{ firstName }} 👋</h1>
          <p class="greeting-sub">Here's what's happening with your workforce today.</p>
        </div>
        <div class="greeting-actions">
          <router-link to="/employees/create" class="btn-soft">
            <VsxIcon iconName="UserAdd" :size="18" /> Add Employee
          </router-link>
          <router-link to="/payroll" class="btn-accent">
            <VsxIcon iconName="Wallet3" :size="18" /> Run Payroll
          </router-link>
        </div>
      </div>

      <!-- Stat cards -->
      <div class="stats-grid">
        <div
          v-for="(stat, i) in dashboardStats"
          :key="stat.title"
          class="stat-card fade-in"
          :style="{ animationDelay: `${i * 0.06}s` }"
        >
          <div class="stat-top">
            <div class="stat-icon" :style="{ background: stat.color + '18', color: stat.color }">
              <VsxIcon :iconName="stat.icon" :size="22" type="bold" />
            </div>
            <span class="trend" :class="stat.trend >= 0 ? 'up' : 'down'">
              <VsxIcon :iconName="stat.trend >= 0 ? 'TrendUp' : 'TrendDown'" :size="16" />
              {{ Math.abs(stat.trend) }}%
            </span>
          </div>
          <h3 class="stat-value">{{ formatNum(stat.value) }}</h3>
          <p class="stat-label">{{ stat.title }}</p>
          <svg class="sparkline" viewBox="0 0 100 28" preserveAspectRatio="none">
            <polyline
              :points="sparkPoints(stat)"
              fill="none"
              :stroke="stat.color"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>

      <!-- Main grid -->
      <div class="main-grid">
        <!-- LEFT -->
        <div class="col-main">
          <!-- Workforce trend (Total Employees + chart) -->
          <div class="ui-card fade-in">
            <div class="card-head">
              <div>
                <h3 class="card-title">Total Employees</h3>
                <div class="hero-stat">
                  <span class="hero-num">{{ formatNum(totalEmployees) }}</span>
                  <span class="hero-trend" :class="workforceTrend >= 0 ? 'up' : 'down'">
                    <VsxIcon :iconName="workforceTrend >= 0 ? 'ArrowUp' : 'ArrowDown'" :size="16" />
                    {{ Math.abs(workforceTrend) }}% vs last month
                  </span>
                </div>
              </div>
              <div class="legend"><span class="legend-dot"></span> Workforce growth</div>
            </div>
            <div class="chart-area">
              <Line :data="trendData" :options="trendOptions" />
            </div>
          </div>

          <!-- Recent Payroll Activity -->
          <div class="ui-card fade-in">
            <div class="card-head">
              <h3 class="card-title">
                <VsxIcon iconName="ReceiptText" :size="18" class="ttl-icon" /> Recent Payroll
                Activity
              </h3>
              <router-link to="/payroll" class="view-all">
                View all <VsxIcon iconName="ArrowRight2" :size="16" />
              </router-link>
            </div>
            <div class="table-wrap">
              <table class="mini-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Period</th>
                    <th class="ta-right">Net Pay</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in recentPayroll" :key="p.id">
                    <td>
                      <div class="cell-emp">
                        <div class="mini-avatar">{{ initials(payName(p)) }}</div>
                        <span class="emp-name">{{ payName(p) }}</span>
                      </div>
                    </td>
                    <td class="muted">{{ p.payment_month || '—' }}</td>
                    <td class="ta-right strong">{{ money(p.net_pay) }}</td>
                    <td>
                      <span class="pill" :class="payStatusClass(p.status)">{{
                        cap(p.status) || 'Pending'
                      }}</span>
                    </td>
                  </tr>
                  <tr v-if="!recentPayroll.length">
                    <td colspan="4" class="empty-row">No payroll records yet.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- RIGHT -->
        <div class="col-side">
          <!-- Department Distribution -->
          <div class="ui-card fade-in">
            <div class="card-head">
              <h3 class="card-title">
                <VsxIcon iconName="Buildings2" :size="18" class="ttl-icon" /> Department Distribution
              </h3>
            </div>
            <div v-if="deptLabels.length" class="doughnut-wrap">
              <Doughnut :data="deptData" :options="deptOptions" />
              <div class="doughnut-center">
                <span class="dc-num">{{ deptLabels.length }}</span>
                <span class="dc-label">Depts</span>
              </div>
            </div>
            <ul v-if="deptLabels.length" class="dept-legend">
              <li v-for="(label, i) in deptLabels" :key="label">
                <span
                  class="lg-dot"
                  :style="{ background: deptColors[i % deptColors.length] }"
                ></span>
                <span class="lg-name">{{ label }}</span>
                <span class="lg-val">{{ deptCounts[i] }}</span>
              </li>
            </ul>
            <p v-else class="empty-row">No department data.</p>
          </div>

          <!-- Pending Leave Requests -->
          <div class="ui-card fade-in">
            <div class="card-head">
              <h3 class="card-title">
                <VsxIcon iconName="CalendarTick" :size="18" class="ttl-icon" /> Pending Leave
                Requests
              </h3>
              <router-link to="/leave" class="view-all">
                All <VsxIcon iconName="ArrowRight2" :size="16" />
              </router-link>
            </div>
            <ul class="leave-list">
              <li v-for="l in pendingLeaves" :key="l.id" class="leave-item">
                <div class="mini-avatar amber">{{ initials(l.employee_name) }}</div>
                <div class="leave-meta">
                  <span class="leave-name">{{ l.employee_name || 'Employee' }}</span>
                  <span class="leave-type">{{ l.leave_type }} · {{ l.duration_days || 1 }}d</span>
                </div>
                <span class="leave-date">{{ shortDate(l.start_date) }}</span>
              </li>
              <li v-if="!pendingLeaves.length" class="empty-state">
                <VsxIcon iconName="TickCircle" :size="22" />
                <span>All caught up — no pending requests.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import MainLayout from '@/components/layouts/MainLayout.vue'
import { Line, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  CategoryScale,
  LinearScale,
  Filler,
} from 'chart.js'
import { useDashboardStore } from '@/stores/dashboard'
import { useEmployeeStore } from '@/stores/employee'
import { useLeaveStore } from '@/stores/leave'
import { usePayrollStore } from '@/stores/payroll'
import { useAuthStore } from '@/stores/auth'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  CategoryScale,
  LinearScale,
  Filler,
)

const dashboardStore = useDashboardStore()
const employeeStore = useEmployeeStore()
const leaveStore = useLeaveStore()
const payrollStore = usePayrollStore()
const auth = useAuthStore()

const dashboardStats = computed(() => dashboardStore.stats || [])

const cap = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '')
const firstName = computed(() => cap(auth.user?.first_name) || 'there')
const greeting = computed(() => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
})

const formatNum = (n) => new Intl.NumberFormat('en-US').format(Number(n) || 0)
const money = (n) =>
  '$' + new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(n) || 0)
const initials = (name) =>
  (name || '?')
    .split(' ')
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()
const shortDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'

/* ---- Total employees & workforce trend ---- */
const totalEmployees = computed(() => {
  const fromStat = dashboardStats.value.find((s) => /workforce|employ/i.test(s.title))?.value
  return Number(fromStat ?? employeeStore.employees?.length ?? 0)
})
const workforceTrend = computed(
  () => dashboardStats.value.find((s) => /workforce|employ/i.test(s.title))?.trend ?? 0,
)

// Derive a 7-month curve grounded in the real total + trend %, not random data.
const trendSeries = computed(() => {
  const end = totalEmployees.value || 0
  const t = (workforceTrend.value || 0) / 100
  const start = t !== -1 ? Math.round(end / (1 + t)) || Math.max(0, end - 6) : end
  const pts = []
  for (let i = 0; i < 7; i++) {
    pts.push(Math.round(start + ((end - start) * i) / 6))
  }
  return pts
})

const trendData = computed(() => ({
  labels: ['', '', '', '', '', '', 'Now'],
  datasets: [
    {
      data: trendSeries.value,
      borderColor: '#4f7cff',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: '#4f7cff',
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2,
      backgroundColor: (ctx) => {
        const { ctx: c, chartArea } = ctx.chart
        if (!chartArea) return 'rgba(79,124,255,0.12)'
        const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        g.addColorStop(0, 'rgba(79,124,255,0.28)')
        g.addColorStop(1, 'rgba(79,124,255,0)')
        return g
      },
    },
  ],
}))
const trendOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { enabled: true } },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
    y: { display: false, beginAtZero: true },
  },
}

const sparkPoints = (stat) => {
  const end = Number(stat.value) || 0
  const t = (stat.trend || 0) / 100
  const start = t !== -1 ? end / (1 + t) : end
  const vals = Array.from({ length: 7 }, (_, i) => start + ((end - start) * i) / 6)
  const max = Math.max(...vals, 1)
  const min = Math.min(...vals, 0)
  const range = max - min || 1
  return vals.map((v, i) => `${(i / 6) * 100},${26 - ((v - min) / range) * 24}`).join(' ')
}

/* ---- Department distribution ---- */
const deptColors = [
  '#4f7cff',
  '#6f97ff',
  '#22c55e',
  '#f59e0b',
  '#a855f7',
  '#06b6d4',
  '#ef4444',
  '#64748b',
]
const deptDist = computed(() => {
  const map = {}
  for (const e of employeeStore.employees || []) {
    const d = e.department_name || e.department || 'Unassigned'
    map[d] = (map[d] || 0) + 1
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1])
})
const deptLabels = computed(() => deptDist.value.map((d) => d[0]))
const deptCounts = computed(() => deptDist.value.map((d) => d[1]))
const deptData = computed(() => ({
  labels: deptLabels.value,
  datasets: [
    {
      data: deptCounts.value,
      backgroundColor: deptColors,
      borderWidth: 0,
      hoverOffset: 6,
    },
  ],
}))
const deptOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '72%',
  plugins: { legend: { display: false }, tooltip: { enabled: true } },
}

/* ---- Pending leaves ---- */
const pendingLeaves = computed(() =>
  (leaveStore.leaves || []).filter((l) => String(l.status).toLowerCase() === 'pending').slice(0, 5),
)

/* ---- Recent payroll ---- */
const payName = (p) => p.employee_name || p.employeeName || p.full_name || p.name || 'Employee'
const recentPayroll = computed(() =>
  [...(payrollStore.payrolls || [])]
    .sort((a, b) => new Date(b.payment_date || 0) - new Date(a.payment_date || 0))
    .slice(0, 5),
)
const payStatusClass = (s) => {
  const v = String(s).toLowerCase()
  if (v === 'paid' || v === 'completed') return 'pill-success'
  if (v === 'pending' || v === 'processing') return 'pill-warning'
  if (v === 'failed' || v === 'cancelled') return 'pill-danger'
  return 'pill-muted'
}

onMounted(() => {
  dashboardStore.fetchDashboardStats()
  if (!employeeStore.employees?.length) employeeStore.fetchEmployees?.()
  if (!leaveStore.leaves?.length) leaveStore.fetchAllLeaves?.()
  if (!payrollStore.payrolls?.length) payrollStore.fetchAllPayrolls?.()
})
</script>

<style scoped>
.dashboard {
  max-width: 1500px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Greeting */
.greeting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.greeting-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--slate-900);
  letter-spacing: -0.02em;
  margin: 0;
}
.greeting-sub {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 4px 0 0;
}
.greeting-actions {
  display: flex;
  gap: 0.65rem;
}
.btn-soft,
.btn-accent {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0.62rem 1.1rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.18s ease;
}
.btn-soft {
  background: #fff;
  color: var(--slate-700);
  border: 1px solid var(--border);
}
.btn-soft:hover {
  border-color: var(--accent);
  color: var(--accent-strong);
}
.btn-accent {
  background: var(--accent);
  color: #fff;
  box-shadow: var(--shadow-accent);
}
.btn-accent:hover {
  background: var(--accent-strong);
  transform: translateY(-1px);
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1.1rem;
}
.stat-card {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-sm);
  padding: 1.3rem 1.4rem 0.5rem;
  overflow: hidden;
  transition:
    box-shadow 0.25s ease,
    transform 0.25s ease;
}
.stat-card:hover {
  box-shadow: var(--shadow);
  transform: translateY(-3px);
}
.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.9rem;
}
.stat-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.trend {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.74rem;
  font-weight: 700;
  padding: 4px 9px;
  border-radius: 999px;
}
.trend.up {
  color: #047857;
  background: var(--success-soft);
}
.trend.down {
  color: #b91c1c;
  background: var(--danger-soft);
}
.stat-value {
  font-size: 1.95rem;
  font-weight: 800;
  color: var(--slate-900);
  line-height: 1;
  margin: 0;
  letter-spacing: -0.02em;
}
.stat-label {
  font-size: 0.82rem;
  color: var(--text-muted);
  font-weight: 600;
  margin: 6px 0 0;
}
.sparkline {
  width: 100%;
  height: 30px;
  margin-top: 0.5rem;
  display: block;
}

/* Main grid */
.main-grid {
  display: grid;
  grid-template-columns: 1.7fr 1fr;
  gap: 1.25rem;
  align-items: start;
}
.col-main,
.col-side {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.1rem;
  gap: 1rem;
}
.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.98rem;
  font-weight: 700;
  color: var(--slate-900);
  margin: 0;
}
.ttl-icon {
  color: var(--accent);
}
.view-all {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--accent);
  text-decoration: none;
  white-space: nowrap;
}
.view-all:hover {
  color: var(--accent-strong);
}

.hero-stat {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  margin-top: 0.35rem;
  flex-wrap: wrap;
}
.hero-num {
  font-size: 2rem;
  font-weight: 800;
  color: var(--slate-900);
  letter-spacing: -0.02em;
}
.hero-trend {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.76rem;
  font-weight: 700;
}
.hero-trend.up {
  color: #047857;
}
.hero-trend.down {
  color: #b91c1c;
}
.legend {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.74rem;
  font-weight: 600;
  color: var(--text-muted);
}
.legend-dot {
  width: 9px;
  height: 9px;
  border-radius: 3px;
  background: var(--accent);
}
.chart-area {
  height: 230px;
}

/* Mini table */
.table-wrap {
  overflow-x: auto;
}
.mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.mini-table th {
  text-align: left;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-faint);
  padding: 0 0.6rem 0.7rem;
  border-bottom: 1px solid var(--slate-100);
}
.mini-table td {
  padding: 0.7rem 0.6rem;
  border-bottom: 1px solid var(--slate-100);
  color: var(--slate-700);
}
.mini-table tbody tr:last-child td {
  border-bottom: none;
}
.ta-right {
  text-align: right;
}
.strong {
  font-weight: 700;
  color: var(--slate-900);
}
.muted {
  color: var(--text-muted);
}
.cell-emp {
  display: flex;
  align-items: center;
  gap: 9px;
}
.emp-name {
  font-weight: 600;
  color: var(--slate-800);
}
.mini-avatar {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.mini-avatar.amber {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}
.empty-row {
  text-align: center;
  color: var(--text-faint);
  padding: 1.5rem 0;
  font-size: 0.85rem;
}

/* Doughnut */
.doughnut-wrap {
  position: relative;
  height: 180px;
  margin: 0.4rem 0 1rem;
}
.doughnut-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.dc-num {
  font-size: 1.7rem;
  font-weight: 800;
  color: var(--slate-900);
  line-height: 1;
}
.dc-label {
  font-size: 0.72rem;
  color: var(--text-faint);
  font-weight: 600;
}
.dept-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.dept-legend li {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 0.82rem;
}
.lg-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}
.lg-name {
  flex: 1;
  color: var(--slate-600);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lg-val {
  font-weight: 700;
  color: var(--slate-900);
}

/* Leave list */
.leave-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.leave-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.5rem;
  border-radius: 12px;
  transition: background 0.16s ease;
}
.leave-item:hover {
  background: var(--slate-50);
}
.leave-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.leave-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--slate-800);
}
.leave-type {
  font-size: 0.74rem;
  color: var(--text-muted);
}
.leave-date {
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--accent-strong);
  background: var(--accent-soft);
  padding: 3px 9px;
  border-radius: 8px;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 1.6rem 0;
  color: var(--success);
  font-size: 0.83rem;
  text-align: center;
}

@media (max-width: 1050px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
}
</style>
