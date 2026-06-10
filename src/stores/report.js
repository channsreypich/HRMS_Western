import { defineStore } from 'pinia'
import { ref } from 'vue'
import api, { unwrap } from '@/services/api'

// Maps a frontend report key to its backend endpoint + display metadata.
export const REPORT_DEFS = {
  headcount: {
    title: 'Headcount Report',
    endpoint: '/api/reports/headcount',
    // Aggregation query aliases are returned verbatim as Map keys (not snake_cased)
    columns: [
      { key: 'departmentName', label: 'Department' },
      { key: 'employeeCount', label: 'Employees' },
    ],
  },
  attendance: {
    title: 'Attendance Report',
    endpoint: '/api/reports/attendance',
    params: () => ({ month: new Date().toISOString().slice(0, 7) }),
    columns: [
      { key: 'month', label: 'Month' },
      { key: 'totalWorkingDays', label: 'Working Days' },
      { key: 'averagePresentCount', label: 'Avg Present' },
    ],
  },
  leave: {
    title: 'Leave Report',
    endpoint: '/api/reports/leave',
    columns: [
      { key: 'status', label: 'Status' },
      { key: 'count', label: 'Requests' },
    ],
  },
  payroll: {
    title: 'Payroll Report',
    endpoint: '/api/reports/payroll-expenditure',
    columns: [
      { key: 'month', label: 'Month' },
      { key: 'total_expenditure', label: 'Total Expenditure ($)' },
    ],
  },
  turnover: {
    title: 'Turnover Report',
    endpoint: '/api/reports/turnover',
    columns: [
      { key: 'month', label: 'Month' },
      { key: 'hires', label: 'New Hires' },
    ],
  },
  performance: {
    title: 'Performance Report',
    endpoint: '/api/reports/performance',
    columns: [
      { key: 'status', label: 'Attendance Status' },
      { key: 'count', label: 'Count' },
      { key: 'percentage', label: 'Percentage (%)' },
    ],
  },
}

export const useReportStore = defineStore('report', () => {
  const rows = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchReport(key) {
    const def = REPORT_DEFS[key]
    if (!def) {
      error.value = `Unknown report: ${key}`
      rows.value = []
      return []
    }
    loading.value = true
    error.value = null
    try {
      const params = def.params ? def.params() : undefined
      const response = await api.get(def.endpoint, { params })
      const data = unwrap(response)
      rows.value = Array.isArray(data) ? data : []
      return rows.value
    } catch (err) {
      error.value = err.response?.data?.message || `Failed to load ${def.title}`
      rows.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  // Convenience helpers used by the dashboard charts
  async function fetchHeadcount() {
    return fetchReport('headcount')
  }
  async function fetchPayrollExpenditure() {
    return fetchReport('payroll')
  }

  return { rows, loading, error, fetchReport, fetchHeadcount, fetchPayrollExpenditure }
})
