<template>
  <MainLayout>
    <div class="payroll-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <i class="fas fa-money-bill-wave me-2 text-gradient"></i>Payroll
          </h1>
          <p class="page-sub">Manage employee salaries and payroll processing</p>
        </div>
        <div class="header-actions">
          <button class="btn-outline" @click="exportPayroll">
            <i class="fas fa-download"></i> Export
          </button>
          <button class="btn-primary" @click="processPayroll" :disabled="payrollStore.loading">
            <i class="fas fa-cog"></i> Process Payroll
          </button>
        </div>
      </div>

      <div class="summary-grid">
        <div class="sum-card" v-for="s in summaryCards" :key="s.label" :style="{ '--c': s.color }">
          <div class="sum-icon" :style="{ background: s.color + '12' }">
            <i :class="s.icon" :style="{ color: s.color }"></i>
          </div>
          <div class="sum-body">
            <div class="sum-value">{{ s.value }}</div>
            <div class="sum-label">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <div class="light-card toolbar">
        <div class="search-wrap">
          <i class="fas fa-search si"></i>
          <input type="text" class="search-inp" placeholder="Search employee..." v-model="search" />
        </div>
        <select class="filter-sel" v-model="selectedMonth">
          <option value="">All Months</option>
          <option v-for="m in monthOptions" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
        <select class="filter-sel" v-model="filterStatus">
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="draft">Pending (Draft)</option>
          <option value="unpaid">Unpaid</option>
        </select>
        <select class="filter-sel" v-model="filterDept">
          <option value="">All Departments</option>
          <option v-for="d in departments" :key="d" :value="d">{{ d }}</option>
        </select>
      </div>

      <div class="light-card">
        <div class="table-head-row">
          <div>
            <span class="tbl-title">Payroll Records</span>
            <span class="count-badge ms-2">{{ filtered.length }} records</span>
          </div>
          <div class="total-row-label">
            Total Net: <strong class="total-amount">${{ formatNum(totalNet) }}</strong>
          </div>
        </div>
        <div class="table-responsive">
          <table class="light-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Basic Salary</th>
                <th>Allowances</th>
                <th>Gross Salary</th>
                <th>Deductions</th>
                <th>Net Salary</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="payrollStore.loading">
                <td colspan="9" class="loading-row">
                  <div class="pulse-loader"></div>
                  Loading records...
                </td>
              </tr>
              <tr v-else-if="filtered.length === 0">
                <td colspan="9" class="empty-row">No payroll records found for this period.</td>
              </tr>
              <tr v-else v-for="rec in paginated" :key="rec.id" class="pay-row">
                <td>
                  <div class="emp-cell">
                    <div
                      class="avatar-sm"
                      :style="{ background: getAvatarGradient(rec.first_name) }"
                    >
                      {{ getInitials(rec.first_name, rec.last_name) }}
                    </div>
                    <div>
                      <div class="emp-name">{{ rec.first_name }} {{ rec.last_name }}</div>
                      <div class="emp-code">{{ rec.employee_code || '—' }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="dept-chip">{{ rec.department_name || 'Marketing' }}</span>
                </td>
                <td class="amount-cell">${{ formatNum(rec.base_salary) }}</td>
                <td class="amount-cell green">${{ formatNum(rec.allowances) }}</td>
                <td class="amount-cell bold">
                  ${{ formatNum(Number(rec.base_salary) + Number(rec.allowances)) }}
                </td>
                <td class="amount-cell red">-${{ formatNum(rec.deductions || 0) }}</td>
                <td class="amount-cell net">${{ formatNum(rec.net_salary) }}</td>
                <td>
                  <span
                    class="status-badge"
                    :class="(rec.status || '').toLowerCase() === 'paid' ? 'status-paid' : 'status-pending'"
                    @click="toggleStatus(rec)"
                    style="cursor: pointer"
                  >
                    {{ rec.status === 'draft' ? 'Pending' : (rec.status || '').toUpperCase() }}
                  </span>
                </td>
                <td>
                  <div class="action-btns">
                    <button class="btn-icon" @click="viewPayslip(rec.id)" title="View Payslip">
                      <i class="fas fa-file-invoice"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination-wrap" v-if="totalPages > 1">
          <div class="page-info">
            {{ (page - 1) * perPage + 1 }}–{{ Math.min(page * perPage, filtered.length) }} of
            {{ filtered.length }}
          </div>
          <div class="page-btns">
            <button class="page-btn" :disabled="page === 1" @click="page--">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button
              v-for="p in totalPages"
              :key="p"
              class="page-btn"
              :class="{ active: page === p }"
              @click="page = p"
            >
              {{ p }}
            </button>
            <button class="page-btn" :disabled="page === totalPages" @click="page++">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/components/layouts/MainLayout.vue'
import { usePayrollStore } from '@/stores/payroll'
import { toast } from 'vue3-toastify'

const payrollStore = usePayrollStore()
const router = useRouter()

const search = ref('')
const selectedMonth = ref('') // '' = All Months, so seeded/generated records are always visible
const filterStatus = ref('')
const filterDept = ref('')
const page = ref(1)
const perPage = 10

// Build month choices from the actual records, always including the current month for generation
const monthOptions = computed(() => {
  const set = new Set((payrollStore.payrolls || []).map((r) => r.payment_month).filter(Boolean))
  set.add(new Date().toISOString().slice(0, 7))
  return [...set]
    .sort()
    .reverse()
    .map((value) => ({
      value,
      label: new Date(value + '-01').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      }),
    }))
})

const departments = computed(() => {
  const records = payrollStore.payrolls || []
  return [...new Set(records.map((r) => r.department_name).filter(Boolean))]
})

const formatNum = (n) => new Intl.NumberFormat().format(Math.round(n || 0))
const getInitials = (first, last) =>
  ((first?.charAt(0) || '') + (last?.charAt(0) || '')).toUpperCase()
const getAvatarGradient = (name) => {
  const g = [
    'linear-gradient(135deg, #6823ff, #4f0fdb)',
    'linear-gradient(135deg, #0284c7, #0369a1)',
    'linear-gradient(135deg, #e11d48, #be123c)',
    'linear-gradient(135deg, #d97706, #b45309)',
    'linear-gradient(135deg, #16a34a, #15803d)',
  ]
  return g[(name?.charCodeAt(0) || 0) % g.length]
}

const summaryCards = computed(() => {
  const records = payrollStore.payrolls || []

  const totalPayroll = records.reduce((s, r) => s + parseFloat(r.net_salary || 0), 0)
  const totalBasic = records.reduce((s, r) => s + parseFloat(r.base_salary || 0), 0)
  const avgBasic = records.length ? Math.round(totalBasic / records.length) : 0

  const paidCount = records.filter((r) => String(r.status).toLowerCase() === 'paid').length
  const pendingCount = records.filter((r) => String(r.status).toLowerCase() === 'draft').length

  return [
    {
      label: 'Total Payroll Expense',
      value: '$' + formatNum(totalPayroll),
      icon: 'fas fa-money-bill-wave',
      color: '#6823ff',
    },
    {
      label: 'Avg Basic Salary',
      value: '$' + formatNum(avgBasic),
      icon: 'fas fa-chart-bar',
      color: '#0284c7',
    },
    {
      label: 'Paid Enrolled',
      value: paidCount + ' employees',
      icon: 'fas fa-check-circle',
      color: '#16a34a',
    },
    {
      label: 'Pending Process',
      value: pendingCount + ' employees',
      icon: 'fas fa-hourglass-half',
      color: '#d97706',
    },
  ]
})

const filtered = computed(() => {
  const records = payrollStore.payrolls || []
  return records.filter((r) => {
    const q = search.value.toLowerCase()
    const fullName = `${r.first_name || ''} ${r.last_name || ''}`.toLowerCase()
    const matchSearch = !search.value || fullName.includes(q) || String(r.employee_id).includes(q)
    const matchMonth = !selectedMonth.value || r.payment_month === selectedMonth.value
    const matchStatus =
      !filterStatus.value || String(r.status).toLowerCase() === filterStatus.value.toLowerCase()
    const matchDept = !filterDept.value || r.department_name === filterDept.value
    return matchSearch && matchMonth && matchStatus && matchDept
  })
})

const totalNet = computed(() =>
  filtered.value.reduce((s, r) => s + parseFloat(r.net_salary || 0), 0),
)
const totalPages = computed(() => Math.ceil(filtered.value.length / perPage))
const paginated = computed(() =>
  filtered.value.slice((page.value - 1) * perPage, page.value * perPage),
)

const viewPayslip = (id) => router.push(`/payroll/${id}/payslip`)
const exportPayroll = () => toast.info('Export features activated via client layout')

const processPayroll = async () => {
  // Generate for the selected month, or the current month when "All Months" is active
  const month = selectedMonth.value || new Date().toISOString().slice(0, 7)
  const res = await payrollStore.generateMonthlyPayroll({ payment_month: month })
  if (res?.success) {
    toast.success(res.message || 'Monthly payroll sheets generated successfully!')
    selectedMonth.value = month // jump the filter to the generated month so the rows are visible
  } else {
    toast.error(payrollStore.error || 'Processing failed')
  }
}

const toggleStatus = async (rec) => {
  const newStatus = String(rec.status).toLowerCase() === 'draft' ? 'paid' : 'draft'
  const res = await payrollStore.updatePayrollStatus(rec.id, { status: newStatus })
  if (res?.success) {
    toast.success(`Payroll status updated successfully!`)
  }
}

onMounted(() => {
  payrollStore.fetchAllPayrolls()
})
</script>

<style scoped>
/* Main Canvas Layer */
.payroll-container {
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background-color: #f8fafc;
  min-height: 100vh;
  font-family:
    'Inter',
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
  background: linear-gradient(135deg, #6823ff, #0284c7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.header-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

/* Global System Buttons */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0.65rem 1.25rem;
  background: linear-gradient(135deg, #6823ff, #4f0fdb);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(104, 35, 255, 0.25);
}
.btn-primary:hover:not(:disabled) {
  box-shadow: 0 6px 18px rgba(104, 35, 255, 0.35);
  transform: translateY(-1px);
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0.6rem 1.2rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #334155;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.btn-outline:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #0f172a;
}

/* Financial Performance Widgets Matrix */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
}
.sum-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}
.sum-card:hover {
  border-color: var(--c);
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.05);
}
.sum-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}
.sum-value {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
}
.sum-label {
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 2px;
  font-weight: 500;
}

/* Control Toolbars and Card Blocks */
.light-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow:
    0 4px 6px -1px rgba(15, 23, 42, 0.02),
    0 2px 4px -1px rgba(15, 23, 42, 0.01);
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-wrap: wrap;
  padding: 1.25rem;
}
.search-wrap {
  position: relative;
  flex: 1;
  min-width: 240px;
}
.si {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 0.9rem;
}
.search-inp {
  width: 100%;
  padding: 0.6rem 1rem 0.6rem 2.4rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #0f172a;
  font-size: 0.875rem;
  outline: none;
  transition: all 0.2s;
}
.search-inp::placeholder {
  color: #94a3b8;
}
.search-inp:focus {
  border-color: #6823ff;
  box-shadow: 0 0 0 3px rgba(104, 35, 255, 0.1);
}
.filter-sel {
  padding: 0.6rem 1.5rem 0.6rem 0.9rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #334155;
  font-size: 0.875rem;
  font-weight: 500;
  outline: none;
  cursor: pointer;
  transition: all 0.2s;
}
.filter-sel:focus {
  border-color: #6823ff;
}

/* Registry Header Indicators */
.table-head-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}
.tbl-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}
.count-badge {
  background: #eeebff;
  color: #6823ff;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  border: 1px solid rgba(104, 35, 255, 0.1);
}
.total-row-label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}
.total-amount {
  color: #6823ff;
  font-size: 1.15rem;
  font-weight: 800;
}

/* Responsive Enterprise Table Sheet */
.table-responsive {
  overflow-x: auto;
}
.light-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.light-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.725rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}
.light-table td {
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: middle;
}
.light-table tbody tr:hover td {
  background: #f8fafc;
}
.light-table tbody tr:last-child td {
  border-bottom: none;
}

/* Employee & Financial Cells Layout */
.emp-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}
.avatar-sm {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.775rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}
.emp-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
}
.emp-code {
  font-size: 0.75rem;
  color: #64748b;
  font-family: monospace;
  font-weight: 500;
  margin-top: 1px;
}
.dept-chip {
  padding: 3px 10px;
  background: #e0f2fe;
  color: #0369a1;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.amount-cell {
  font-family: 'SF Mono', SFMono-Regular, Consolas, monospace;
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  white-space: nowrap;
}
.amount-cell.green {
  color: #16a34a;
}
.amount-cell.red {
  color: #dc2626;
}
.amount-cell.bold {
  color: #0f172a;
  font-weight: 700;
}
.amount-cell.net {
  color: #6823ff;
  font-size: 0.95rem;
  font-weight: 800;
}

/* Status Indicators Matrix */
.status-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: capitalize;
  display: inline-block;
  text-align: center;
}
.status-paid {
  background: #dcfce7;
  color: #16a34a;
}
.status-pending {
  background: #fef3c7;
  color: #d97706;
}

/* Action Trigger Trays */
.action-btns {
  display: flex;
  gap: 6px;
}
.btn-icon {
  width: 32px;
  height: 32px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  transition: all 0.2s;
}
.btn-icon:hover {
  background: #eeebff;
  color: #6823ff;
  border-color: rgba(104, 35, 255, 0.25);
}

/* Loader States */
.loading-row,
.empty-row {
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
  font-weight: 500;
}
.pulse-loader {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #6823ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 0.75rem;
}

/* Dynamic Layout Pagination Control */
.pagination-wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}
.page-info {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
}
.page-btns {
  display: flex;
  gap: 6px;
}
.page-btn {
  width: 34px;
  height: 34px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #475569;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.page-btn:hover:not(:disabled) {
  background: #f1f5f9;
  color: #0f172a;
  border-color: #94a3b8;
}
.page-btn.active {
  background: #eeebff;
  color: #6823ff;
  border-color: rgba(104, 35, 255, 0.25);
  font-weight: 700;
}
.page-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
