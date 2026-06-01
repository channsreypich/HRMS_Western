<template>
  <MainLayout>
    <div class="payroll-container">

      <div class="page-header">
        <div>
          <h1 class="page-title"><i class="fas fa-money-bill-wave me-2 text-gradient"></i>Payroll</h1>
          <p class="page-sub">Manage employee salaries and payroll processing</p>
        </div>
        <div class="header-actions">
          <button class="btn-outline" @click="exportPayroll"><i class="fas fa-download"></i> Export</button>
          <button class="btn-primary" @click="processPayroll" :disabled="payrollStore.loading">
            <i class="fas fa-cog"></i> Process Payroll
          </button>
        </div>
      </div>

      <div class="summary-grid">
        <div class="sum-card" v-for="s in summaryCards" :key="s.label" :style="{ '--c': s.color }">
          <div class="sum-icon" :style="{ background: s.color + '20' }">
            <i :class="s.icon" :style="{ color: s.color }"></i>
          </div>
          <div class="sum-body">
            <div class="sum-value">{{ s.value }}</div>
            <div class="sum-label">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <div class="dark-card toolbar">
        <div class="search-wrap">
          <i class="fas fa-search si"></i>
          <input type="text" class="search-inp" placeholder="Search employee..." v-model="search" />
        </div>
        <select class="filter-sel" v-model="selectedMonth">
          <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
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

      <div class="dark-card">
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
          <table class="dark-table">
            <thead>
              <tr>
                <th>Employee</th><th>Department</th><th>Basic Salary</th>
                <th>Allowances</th><th>Gross Salary</th>
                <th>Deductions</th><th>Net Salary</th>
                <th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="payrollStore.loading">
                <td colspan="9" class="loading-row"><div class="pulse-loader"></div> Loading records...</td>
              </tr>
              <tr v-else-if="filtered.length === 0">
                <td colspan="9" class="empty-row">No payroll records found for this period.</td>
              </tr>
              <tr v-else v-for="rec in paginated" :key="rec.id" class="pay-row">
                <td>
                  <div class="emp-cell">
                    <div class="avatar-sm" :style="{ background: getAvatarGradient(rec.first_name) }">
                      {{ getInitials(rec.first_name, rec.last_name) }}
                    </div>
                    <div>
                      <div class="emp-name">{{ rec.first_name }} {{ rec.last_name }}</div>
                      <div class="emp-code">EMP-{{ String(rec.employee_id).padStart(3, '0') }}</div>
                    </div>
                  </div>
                </td>
                <td><span class="dept-chip">{{ rec.department_name || 'Marketing' }}</span></td>
                <td class="amount-cell">${{ formatNum(rec.base_salary) }}</td>
                <td class="amount-cell green">${{ formatNum(rec.allowances) }}</td>
                <td class="amount-cell bold">${{ formatNum(Number(rec.base_salary) + Number(rec.allowances)) }}</td>
                <td class="amount-cell red">-${{ formatNum(rec.deductions || 0) }}</td>
                <td class="amount-cell net">${{ formatNum(rec.net_salary) }}</td>
                <td>
                  <span class="status-badge" :class="'status-' + (rec.status || '').toLowerCase()" @click="toggleStatus(rec)" style="cursor: pointer;">
                    {{ rec.status === 'draft' ? 'Pending' : rec.status.toUpperCase() }}
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
          <div class="page-info">{{ (page-1)*perPage+1 }}–{{ Math.min(page*perPage, filtered.length) }} of {{ filtered.length }}</div>
          <div class="page-btns">
            <button class="page-btn" :disabled="page===1" @click="page--"><i class="fas fa-chevron-left"></i></button>
            <button v-for="p in totalPages" :key="p" class="page-btn" :class="{active:page===p}" @click="page=p">{{ p }}</button>
            <button class="page-btn" :disabled="page===totalPages" @click="page++"><i class="fas fa-chevron-right"></i></button>
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
const selectedMonth = ref('2026-04') 
const filterStatus = ref('')
const filterDept = ref('')
const page = ref(1)
const perPage = 10

const months = [
  { value: '2026-03', label: 'March 2026' },
  { value: '2026-04', label: 'April 2026' },
  { value: '2026-05', label: 'May 2026' },
]

const departments = computed(() => {
  const records = payrollStore.payrolls || []
  return [...new Set(records.map(r => r.department_name).filter(Boolean))]
})

const formatNum = (n) => new Intl.NumberFormat().format(Math.round(n || 0))
const getInitials = (first, last) => ((first?.charAt(0) || '') + (last?.charAt(0) || '')).toUpperCase()
const getAvatarGradient = (name) => {
  const g = ['linear-gradient(135deg,#6823ff,#13707f)','linear-gradient(135deg,#a47bff,#40c8da)','linear-gradient(135deg,#f87171,#a47bff)','linear-gradient(135deg,#fbbf24,#f87171)','linear-gradient(135deg,#34d399,#40c8da)']
  return g[(name?.charCodeAt(0) || 0) % g.length]
}

//គណនាស្ថិតិរួម Dynamic ពីប្រឡាយទិន្នន័យរត់មកពី Store
const summaryCards = computed(() => {
  const records = payrollStore.payrolls || []
  
  const totalPayroll = records.reduce((s, r) => s + parseFloat(r.net_salary || 0), 0)
  const totalBasic = records.reduce((s, r) => s + parseFloat(r.base_salary || 0), 0)
  const avgBasic = records.length ? Math.round(totalBasic / records.length) : 0
  
  const paidCount = records.filter(r => String(r.status).toLowerCase() === 'paid').length
  const pendingCount = records.filter(r => String(r.status).toLowerCase() === 'draft').length

  return [
    { label: 'Total Payroll Expense', value: '$' + formatNum(totalPayroll), icon: 'fas fa-money-bill-wave', color: '#6823ff' },
    { label: 'Avg Basic Salary', value: '$' + formatNum(avgBasic), icon: 'fas fa-chart-bar', color: '#40c8da' },
    { label: 'Paid Enrolled', value: paidCount + ' employees', icon: 'fas fa-check-circle', color: '#34d399' },
    { label: 'Pending Process', value: pendingCount + ' employees', icon: 'fas fa-hourglass-half', color: '#fbbf24' },
  ]
})

// មុខងារចម្រោះទិន្នន័យ (Fixed Filter Mapping)
const filtered = computed(() => {
  const records = payrollStore.payrolls || []
  return records.filter(r => {
    const q = search.value.toLowerCase()
    const fullName = `${r.first_name || ''} ${r.last_name || ''}`.toLowerCase()
    const matchSearch = !search.value || fullName.includes(q) || String(r.employee_id).includes(q)
    
//ដំណោះស្រាយ៖ ផ្ទៀងផ្ទាត់ផ្ទាល់ទៅលើ Column `payment_month` ចំៗតែម្តង
    const matchMonth = !selectedMonth.value || r.payment_month === selectedMonth.value
    
    const matchStatus = !filterStatus.value || String(r.status).toLowerCase() === filterStatus.value.toLowerCase()
    const matchDept = !filterDept.value || r.department_name === filterDept.value
    return matchSearch && matchMonth && matchStatus && matchDept
  })
})

const totalNet = computed(() => filtered.value.reduce((s, r) => s + parseFloat(r.net_salary || 0), 0))
const totalPages = computed(() => Math.ceil(filtered.value.length / perPage))
const paginated = computed(() => filtered.value.slice((page.value-1)*perPage, page.value*perPage))

const viewPayslip = (id) => router.push(`/payroll/${id}/payslip`)
const exportPayroll = () => toast.info('Export features activated via client layout')

const processPayroll = async () => {
  const res = await payrollStore.generateMonthlyPayroll({ payment_month: selectedMonth.value })
  if (res?.success) {
    toast.success('Monthly payroll sheets generated successfully!')
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
.payroll-container { padding: 1.5rem; max-width: 1600px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.25rem; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; }
.page-title { font-size: 1.6rem; font-weight: 700; color: rgba(255,255,255,0.92); margin: 0 0 0.3rem; }
.page-sub { font-size: 0.83rem; color: rgba(255,255,255,0.35); margin: 0; }
.text-gradient { background: linear-gradient(135deg, #a47bff, #40c8da); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.header-actions { display: flex; gap: 0.75rem; align-items: center; }
.btn-primary { display: inline-flex; align-items: center; gap: 7px; padding: 0.6rem 1.2rem; background: linear-gradient(135deg, #6823ff, #4f0fdb); border: none; border-radius: 10px; color: white; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(104,35,255,0.35); }
.btn-primary:hover:not(:disabled) { opacity: 0.9; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-outline { display: inline-flex; align-items: center; gap: 7px; padding: 0.55rem 1rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 9px; color: rgba(255,255,255,0.6); font-size: 0.83rem; cursor: pointer; transition: all 0.2s; }
.btn-outline:hover { background: rgba(255,255,255,0.1); }

.summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
.sum-card { background: #0d0d1a; border: 1px solid rgba(104,35,255,0.13); border-radius: 16px; padding: 1.1rem 1.25rem; display: flex; align-items: center; gap: 1rem; transition: all 0.25s; }
.sum-card:hover { border-color: var(--c); transform: translateY(-2px); }
.sum-icon { width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
.sum-value { font-size: 1.25rem; font-weight: 800; color: rgba(255,255,255,0.9); line-height: 1.2; }
.sum-label { font-size: 0.72rem; color: rgba(255,255,255,0.35); margin-top: 2px; }

.dark-card { background: #0d0d1a; border: 1px solid rgba(104,35,255,0.13); border-radius: 18px; padding: 1.5rem; }
.toolbar { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; padding: 1rem 1.25rem; }
.search-wrap { position: relative; flex: 1; min-width: 200px; }
.si { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.3); font-size: 0.82rem; }
.search-inp { width: 100%; padding: 0.6rem 1rem 0.6rem 2.2rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 9px; color: white; font-size: 0.83rem; outline: none; }
.search-inp:focus { border-color: rgba(104,35,255,0.5); }
.search-inp::placeholder { color: rgba(255,255,255,0.25); }
.filter-sel { padding: 0.6rem 0.9rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 9px; color: rgba(255,255,255,0.7); font-size: 0.82rem; outline: none; cursor: pointer; }
.filter-sel option { background: #1a1a2e; }

.table-head-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.tbl-title { font-size: 0.9rem; font-weight: 700; color: rgba(255,255,255,0.8); }
.count-badge { background: rgba(104,35,255,0.15); color: #a47bff; padding: 2px 9px; border-radius: 12px; font-size: 0.72rem; font-weight: 700; }
.ms-2 { margin-left: 0.5rem; }
.total-row-label { font-size: 0.83rem; color: rgba(255,255,255,0.4); }
.total-amount { color: #a47bff; font-size: 1rem; }

.table-responsive { overflow-x: auto; }
.dark-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
.dark-table th { padding: 0.65rem 0.85rem; text-align: left; font-size: 0.67rem; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: rgba(255,255,255,0.25); border-bottom: 1px solid rgba(255,255,255,0.06); }
.dark-table td { padding: 0.75rem 0.85rem; border-bottom: 1px solid rgba(255,255,255,0.04); color: rgba(255,255,255,0.6); vertical-align: middle; }
.dark-table tbody tr:hover td { background: rgba(104,35,255,0.05); }
.dark-table tbody tr:last-child td { border-bottom: none; }

.emp-cell { display: flex; align-items: center; gap: 9px; }
.avatar-sm { width: 32px; height: 32px; background: linear-gradient(135deg, #6823ff, #13707f); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 700; color: white; flex-shrink: 0; }
.emp-name { font-size: 0.83rem; font-weight: 600; color: rgba(255,255,255,0.85); white-space: nowrap; }
.emp-code { font-size: 0.68rem; color: rgba(255,255,255,0.3); font-family: monospace; }
.dept-chip { padding: 2px 8px; background: rgba(64,200,218,0.1); color: #40c8da; border-radius: 6px; font-size: 0.72rem; font-weight: 600; white-space: nowrap; }
.amount-cell { font-family: 'Courier New', monospace; font-size: 0.82rem; font-weight: 600; color: rgba(255,255,255,0.7); white-space: nowrap; }
.amount-cell.green { color: #34d399; }
.amount-cell.red { color: #f87171; }
.amount-cell.bold { color: rgba(255,255,255,0.85); font-weight: 700; }
.amount-cell.net { color: #a47bff; font-size: 0.9rem; font-weight: 800; }

.status-badge { padding: 3px 9px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; text-transform: capitalize; }
.status-paid { background: rgba(52,211,153,0.12); color: #34d399; }
.status-pending { background: rgba(251,191,36,0.12); color: #fbbf24; }

.action-btns { display: flex; gap: 5px; }
.btn-icon { width: 30px; height: 30px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; color: rgba(255,255,255,0.4); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; transition: all 0.2s; }
.btn-icon:hover { background: rgba(104,35,255,0.2); color: #c5a3ff; border-color: rgba(104,35,255,0.4); }

.loading-row, .empty-row { text-align: center; padding: 3rem; color: rgba(255,255,255,0.3); }
.pulse-loader { width: 32px; height: 32px; border: 3px solid rgba(104,35,255,0.3); border-top-color: #a47bff; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 0.5rem; }

.pagination-wrap { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.06); }
.page-info { font-size: 0.78rem; color: rgba(255,255,255,0.35); }
.page-btns { display: flex; gap: 4px; }
.page-btn { width: 32px; height: 32px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 7px; color: rgba(255,255,255,0.5); cursor: pointer; font-size: 0.78rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.page-btn:hover:not(:disabled) { background: rgba(104,35,255,0.2); color: #a47bff; }
.page-btn.active { background: rgba(104,35,255,0.3); color: #c5a3ff; border-color: rgba(104,35,255,0.4); }
.page-btn:disabled { opacity: 0.3; cursor: not-allowed; }

@keyframes spin { to { transform: rotate(360deg); } }
</style>
