<template>
  <MainLayout>
    <div class="report-detail">
      <div class="detail-head">
        <div>
          <button class="back-link" @click="router.push('/reports')">
            <VsxIcon iconName="ArrowLeft" :size="18" /> Back to Reports
          </button>
          <h1 class="page-title">{{ def?.title || 'Report' }}</h1>
          <p class="page-subtitle">Live data from the HRMS backend</p>
        </div>
        <button class="btn-primary" @click="load" :disabled="store.loading">
          <VsxIcon iconName="Refresh2" :size="18" /> Refresh
        </button>
      </div>

      <div v-if="store.loading" class="state-card">Loading report…</div>
      <div v-else-if="store.error" class="state-card error">{{ store.error }}</div>
      <div v-else-if="!store.rows.length" class="state-card">
        No data available for this report yet.
      </div>

      <template v-else>
        <div class="light-card chart-card">
          <div class="chart-body"><canvas ref="chartCanvas"></canvas></div>
        </div>

        <div class="light-card table-card">
          <table class="report-table">
            <thead>
              <tr>
                <th v-for="c in def.columns" :key="c.key">{{ c.label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in store.rows" :key="i">
                <td v-for="c in def.columns" :key="c.key">{{ formatCell(row[c.key]) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayout from '@/components/layouts/MainLayout.vue'
import { useReportStore, REPORT_DEFS } from '@/stores/report'
import Chart from 'chart.js/auto'

const route = useRoute()
const router = useRouter()
const store = useReportStore()
const chartCanvas = ref(null)
let chartInstance = null

const reportKey = computed(() => route.params.type)
const def = computed(() => REPORT_DEFS[reportKey.value])

const formatCell = (v) => {
  if (v == null) return '-'
  if (typeof v === 'number') return new Intl.NumberFormat().format(v)
  return v
}

async function load() {
  if (!def.value) return
  await store.fetchReport(reportKey.value)
  await nextTick()
  renderChart()
}

function renderChart() {
  if (!chartCanvas.value || !store.rows.length || !def.value) return
  if (chartInstance) chartInstance.destroy()

  const cols = def.value.columns
  const labelKey = cols[0].key
  const valueKey = (cols[1] || cols[0]).key
  const labels = store.rows.map((r) => r[labelKey])
  const data = store.rows.map((r) => Number(r[valueKey]) || 0)

  chartInstance = new Chart(chartCanvas.value.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: cols[1]?.label || cols[0].label,
          data,
          backgroundColor: ['#4f7cff', '#0284c7', '#d97706', '#dc2626', '#16a34a', '#4f7cff'],
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  })
}

onMounted(load)
watch(reportKey, load)
</script>

<style scoped>
.report-detail {
  padding: 2rem;
  max-width: 1100px;
  margin: 0 auto;
}
.detail-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}
.back-link {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0;
  margin-bottom: 0.5rem;
}
.page-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: #1a1a1a;
}
.page-subtitle {
  color: #64748b;
  font-size: 0.88rem;
}
.btn-primary {
  background: linear-gradient(135deg, var(--accent), #64748b);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 0.6rem 1.1rem;
  font-weight: 600;
  cursor: pointer;
}
.light-card {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}
.chart-body {
  height: 320px;
}
.report-table {
  width: 100%;
  border-collapse: collapse;
}
.report-table th,
.report-table td {
  text-align: left;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.9rem;
}
.report-table th {
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
}
.state-card {
  background: #fff;
  border-radius: 16px;
  padding: 3rem;
  text-align: center;
  color: #64748b;
}
.state-card.error {
  color: #dc2626;
}
</style>
