<template>
  <MainLayout>
    <div class="employee-list-container">
      <div class="dark-card header-section fade-in">
        <div class="header-content">
          <div>
            <h1 class="page-title">
              <i class="fas fa-users me-2" style="color:#a47bff"></i>
              <span class="text-gradient">Employee Management</span>
            </h1>
            <p class="page-subtitle">Manage your workforce efficiently</p>
          </div>
          <div class="header-actions">
            <button class="btn-outline-purple" @click="exportEmployees">
              <i class="fas fa-download me-2"></i>Export
            </button>
            <router-link to="/employees/create" class="btn-primary">
              <i class="fas fa-plus-circle me-2"></i>Add Employee
            </router-link>
          </div>
        </div>
      </div>

      <div class="stats-grid">
        <div
          class="stat-card fade-in"
          v-for="(stat, index) in employeeStats"
          :key="stat.label"
          :style="{ animationDelay: `${index * 0.08}s` }"
        >
          <div class="stat-header">
            <div class="stat-icon-wrapper" :style="{ background: stat.color + '18' }">
              <i :class="stat.icon" :style="{ color: stat.color }"></i>
            </div>
            <span class="stat-trend" :class="stat.trend > 0 ? 'trend-up' : 'trend-down'">
              <i :class="stat.trend > 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
              {{ Math.abs(stat.trend) }}%
            </span>
          </div>
          <div class="stat-content">
            <h3 class="stat-value">{{ stat.value }}</h3>
            <p class="stat-label">{{ stat.label }}</p>
          </div>
        </div>
      </div>

      <div class="dark-card filters-section fade-in">
        <div class="filters-grid">
          <div class="search-box">
            <i class="fas fa-search search-icon"></i>
            <input
              type="text"
              class="dark-input"
              placeholder="Search by name, email, ID..."
              v-model="filters.search"
              @input="debouncedSearch"
            />
          </div>
          <select class="dark-select" v-model="filters.department">
            <option value="">All Departments</option>
            <option v-for="dept in departments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
          </select>
          <select class="dark-select" v-model="filters.position">
            <option value="">All Positions</option>
            <option v-for="pos in positions" :key="pos.id" :value="pos.id">{{ pos.title }}</option>
          </select>
          <select class="dark-select" v-model="filters.status">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <button class="btn-ghost" @click="resetFilters">
            <i class="fas fa-redo-alt me-2"></i>Reset
          </button>
        </div>
      </div>

      <div class="dark-card table-container fade-in">
        <div class="table-header">
          <div class="table-title">
            <h5>Employee Directory</h5>
            <span class="count-badge">{{ filteredEmployees.length }} employees</span>
          </div>
          <div class="table-actions">
            <button class="btn-icon" @click="refreshTable" title="Refresh">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="dark-table">
            <thead>
              <tr>
                <th @click="sortBy('id')" class="sortable">
                  ID <i :class="getSortIcon('id')"></i>
                </th>
                <th @click="sortBy('first_name')" class="sortable">
                  Employee <i :class="getSortIcon('first_name')"></i>
                </th>
                <th>Contact</th>
                <th @click="sortBy('department_name')" class="sortable">
                  Department <i :class="getSortIcon('department_name')"></i>
                </th>
                <th>Position</th>
                <th @click="sortBy('hire_date')" class="sortable">
                  Hire Date <i :class="getSortIcon('hire_date')"></i>
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="employeeStore.loading">
                <td colspan="8" class="text-center py-5">
                  <div class="spinner mx-auto"></div>
                  <p class="mt-3" style="color:rgba(255,255,255,0.3)">Loading employees...</p>
                </td>
              </tr>
              <tr v-else-if="paginatedEmployees.length === 0">
                <td colspan="8" class="empty-state">
                  <i class="fas fa-users fa-3x mb-3" style="color:rgba(255,255,255,0.1)"></i>
                  <p style="color:rgba(255,255,255,0.35)">No employees found</p>
                  <router-link to="/employees/create" class="btn-primary btn-sm mt-2">
                    Add Your First Employee
                  </router-link>
                </td>
              </tr>
              <tr
                v-else
                v-for="emp in paginatedEmployees"
                :key="emp.id"
                @click="viewEmployee(emp.id)"
                class="employee-row"
              >
                <td><span class="emp-id">EMP-{{ String(emp.id).padStart(3, '0') }}</span></td>
                <td>
                  <div class="employee-info">
                    <div class="employee-avatar" :style="{ background: getAvatarGradient(emp.first_name) }">
                      {{ getInitials(emp.first_name, emp.last_name) }}
                    </div>
                    <div>
                      <div class="emp-name">{{ emp.first_name }} {{ emp.last_name }}</div>
                      <div class="emp-email">{{ emp.email }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="contact-info">
                    <i class="fas fa-phone-alt me-1" style="color:rgba(255,255,255,0.2)"></i>
                    <span>{{ emp.phone || 'N/A' }}</span>
                  </div>
                </td>
                <td>
                  <span class="dept-badge" :style="{ background: getDeptColor(emp.department_name), color: getDeptText(emp.department_name) }">
                    {{ emp.department_name || '—' }}
                  </span>
                </td>
                <td style="color:rgba(255,255,255,0.55)">{{ emp.position_title || '—' }}</td>
                <td style="color:rgba(255,255,255,0.45); font-size:0.78rem">{{ formatDate(emp.hire_date) }}</td>
                <td>
                  <span class="badge-status" :class="getStatusClass(emp.status)">
                    {{ emp.status }}
                  </span>
                </td>
                <td @click.stop>
                  <div class="action-buttons">
                    <button class="btn-icon" @click="viewEmployee(emp.id)" title="View">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" @click="editEmployee(emp.id)" title="Edit">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon danger" @click="confirmDelete(emp)" title="Delete">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination-container" v-if="totalPages > 1">
          <div class="pagination-info">
            Showing {{ (currentPage - 1) * itemsPerPage + 1 }}–{{ Math.min(currentPage * itemsPerPage, filteredEmployees.length) }}
            of {{ filteredEmployees.length }} employees
          </div>
          <div class="pagination">
            <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button
              v-for="page in displayedPages"
              :key="page"
              class="page-btn"
              :class="{ active: currentPage === page }"
              @click="typeof page === 'number' && (currentPage = page)"
            >{{ page }}</button>
            <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showDeleteModal" @click="showDeleteModal = false">
      <div class="modal-box dark-card" @click.stop>
        <div class="modal-header">
          <h3>Confirm Delete</h3>
          <button class="close-btn" @click="showDeleteModal = false"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body text-center py-3">
          <div class="delete-icon-wrap mb-3">
            <i class="fas fa-exclamation-triangle" style="color:#f87171; font-size:2.5rem"></i>
          </div>
          <p class="delete-msg">
            Are you sure you want to delete 
            <strong style="color:rgba(255,255,255,0.9)">{{ employeeToDelete?.first_name }} {{ employeeToDelete?.last_name }}</strong>?
          </p>
          <p class="delete-warn">This action cannot be undone and will permanently remove this record.</p>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" @click="showDeleteModal = false">Cancel</button>
          <button class="btn-danger" @click="deleteEmployee">Delete</button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/components/layouts/MainLayout.vue'
import { useEmployeeStore } from '@/stores/employee'
import { useDepartmentStore } from '@/stores/department'
import { usePositionStore } from '@/stores/position'
import { toast } from 'vue3-toastify'
import debounce from 'lodash/debounce'

const router = useRouter()
const employeeStore = useEmployeeStore()
const departmentStore = useDepartmentStore()
const positionStore = usePositionStore()

const filters = reactive({ search: '', department: '', position: '', status: '' })
const currentPage = ref(1)
const itemsPerPage = 10
const showDeleteModal = ref(false)
const employeeToDelete = ref(null)
const sortField = ref('id') 
const sortDirection = ref('asc')

//គណនាស្ថិតិក្បាលទំព័រចេញពីគ្រាប់ទិន្នន័យពិតក្នុង Database
const employeeStats = computed(() => [
  { label: 'Total Employees', value: employeeStore.employees.length, icon: 'fas fa-users', color: '#a47bff', trend: 12 },
  { label: 'Active', value: employeeStore.employees.filter(e => e.status === 'active').length, icon: 'fas fa-check-circle', color: '#34d399', trend: 8 },
  { label: 'Inactive', value: employeeStore.employees.filter(e => e.status === 'inactive').length, icon: 'fas fa-minus-circle', color: '#fbbf24', trend: -2 },
  { label: 'Suspended', value: employeeStore.employees.filter(e => e.status === 'suspended').length, icon: 'fas fa-exclamation-circle', color: '#40c8da', trend: 5 },
])

const departments = computed(() => departmentStore.departments)
const positions = computed(() => positionStore.positions)

const filteredEmployees = computed(() => {
  let filtered = employeeStore.employees || []
  if (filters.search) {
    const s = filters.search.toLowerCase()
    filtered = filtered.filter(e =>
      e.first_name?.toLowerCase().includes(s) || e.last_name?.toLowerCase().includes(s) ||
      e.email?.toLowerCase().includes(s) || String(e.id).includes(s)
    )
  }
  if (filters.department) filtered = filtered.filter(e => e.department_id === parseInt(filters.department))
  if (filters.position) filtered = filtered.filter(e => e.position_id === parseInt(filters.position))
  if (filters.status) filtered = filtered.filter(e => e.status === filters.status)
  
  filtered.sort((a, b) => {
    let aVal = a[sortField.value], bVal = b[sortField.value]
    if (sortField.value === 'first_name') { aVal = `${a.first_name} ${a.last_name}`; bVal = `${b.first_name} ${b.last_name}` }
    if (sortField.value === 'department_name') { aVal = a.department_name || ''; bVal = b.department_name || '' }
    if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })
  return filtered
})

const paginatedEmployees = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredEmployees.value.slice(start, start + itemsPerPage)
})
const totalPages = computed(() => Math.ceil(filteredEmployees.value.length / itemsPerPage))
const displayedPages = computed(() => {
  const delta = 2, range = [], rangeWithDots = []
  let l
  for (let i = 1; i <= totalPages.value; i++) {
    if (i === 1 || i === totalPages.value || (i >= currentPage.value - delta && i <= currentPage.value + delta)) range.push(i)
  }
  range.forEach(i => {
    if (l) { if (i - l === 2) rangeWithDots.push(l + 1); else if (i - l !== 1) rangeWithDots.push('...') }
    rangeWithDots.push(i); l = i
  })
  return rangeWithDots
})

const debouncedSearch = debounce(() => { currentPage.value = 1 }, 300)
const sortBy = (field) => {
  if (sortField.value === field) sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  else { sortField.value = field; sortDirection.value = 'asc' }
  currentPage.value = 1
}
const getSortIcon = (field) => {
  if (sortField.value !== field) return 'fas fa-sort'
  return sortDirection.value === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'
}
const getInitials = (first, last) => ((first?.charAt(0) || '') + (last?.charAt(0) || '')).toUpperCase()
const getAvatarGradient = (name) => {
  const gradients = ['linear-gradient(135deg,#6823ff,#13707f)','linear-gradient(135deg,#a47bff,#40c8da)','linear-gradient(135deg,#f87171,#a47bff)','linear-gradient(135deg,#fbbf24,#f87171)','linear-gradient(135deg,#34d399,#40c8da)']
  return gradients[(name?.charCodeAt(0) || 0) % gradients.length]
}
const getDeptColor = (dept) => {
  const map = { IT:'rgba(164,123,255,0.12)', HR:'rgba(52,211,153,0.12)', Finance:'rgba(251,191,36,0.12)', Marketing:'rgba(248,113,113,0.12)', Operations:'rgba(64,200,218,0.12)' }
  return map[dept] || 'rgba(104,35,255,0.08)'
}
const getDeptText = (dept) => {
  const map = { IT:'#a47bff', HR:'#34d399', Finance:'#fbbf24', Marketing:'#f87171', Operations:'#40c8da' }
  return map[dept] || '#6823ff'
}
const getStatusClass = (status) => ({ active: 'badge-active', inactive: 'badge-inactive', suspended: 'badge-terminated' })[status] || 'badge-inactive'
const formatDate = (date) => { if (!date) return '—'; return new Date(date).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) }
const viewEmployee = (id) => router.push(`/employees/${id}`)
const editEmployee = (id) => router.push(`/employees/${id}/edit`)
const confirmDelete = (emp) => { employeeToDelete.value = emp; showDeleteModal.value = true }

const deleteEmployee = async () => {
  if (!employeeToDelete.value) return
  const result = await employeeStore.deleteEmployee(employeeToDelete.value.id)
  if (result?.success) { 
    toast.success('Employee record deleted successfully')
    showDeleteModal.value = false
    employeeToDelete.value = null 
  } else { 
    toast.error(employeeStore.error || 'Failed to delete employee') 
  }
}

const resetFilters = () => { filters.search = ''; filters.department = ''; filters.position = ''; filters.status = ''; currentPage.value = 1 }
const exportEmployees = () => toast.info('Export feature coming soon!')
const refreshTable = async () => { await employeeStore.fetchEmployees(); toast.success('Employee list refreshed') }

watch([() => filters.search, () => filters.department, () => filters.position, () => filters.status], () => { currentPage.value = 1 })

onMounted(async () => { 
  await employeeStore.fetchEmployees()
  await departmentStore.fetchDepartments()
  await positionStore.fetchPositions()
})
</script>

<style scoped>
/* ── Base ── */
.employee-list-container {
  padding: 1.5rem;
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ── Dark card ── */
.dark-card {
  background: #0d0d1a;
  border: 1px solid rgba(104, 35, 255, 0.13);
  border-radius: 18px;
  padding: 1.5rem;
  transition: border-color 0.25s;
}
.dark-card:hover { border-color: rgba(104, 35, 255, 0.22); }

/* ── Header ── */
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: rgba(255,255,255,0.92);
  margin-bottom: 0.35rem;
}
.text-gradient {
  background: linear-gradient(135deg, #a47bff, #40c8da);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.page-subtitle { font-size: 0.85rem; color: rgba(255,255,255,0.35); }
.header-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }

/* ── Buttons ── */
.btn-primary {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #6823ff, #4f0fdb);
  border: none; border-radius: 10px;
  color: white; font-size: 0.85rem; font-weight: 600; cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
  box-shadow: 0 4px 20px rgba(104,35,255,0.35);
  text-decoration: none;
}
.btn-primary:hover { opacity: 0.9; }
.btn-primary:active { transform: scale(0.97); }
.btn-primary.btn-sm { padding: 0.45rem 0.9rem; font-size: 0.78rem; }

.btn-outline-purple {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 0.6rem 1.2rem;
  background: rgba(104,35,255,0.1);
  border: 1px solid rgba(104,35,255,0.3);
  border-radius: 10px; color: #a47bff;
  font-size: 0.85rem; font-weight: 600; cursor: pointer;
  transition: all 0.2s; text-decoration: none;
}
.btn-outline-purple:hover { background: rgba(104,35,255,0.2); border-color: rgba(104,35,255,0.5); }

.btn-ghost {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 0.6rem 1.1rem;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px; color: rgba(255,255,255,0.5);
  font-size: 0.83rem; cursor: pointer; transition: all 0.2s;
}
.btn-ghost:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.8); }

.btn-danger {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 0.6rem 1.2rem;
  background: rgba(239,68,68,0.15);
  border: 1px solid rgba(239,68,68,0.3);
  border-radius: 10px; color: #f87171;
  font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.btn-danger:hover { background: rgba(239,68,68,0.25); border-color: rgba(239,68,68,0.5); }

.btn-icon {
  width: 32px; height: 32px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 9px; color: rgba(255,255,255,0.4);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 0.8rem; transition: all 0.2s;
}
.btn-icon:hover { background: rgba(104,35,255,0.2); color: #c5a3ff; border-color: rgba(104,35,255,0.4); }
.btn-icon.danger:hover { background: rgba(239,68,68,0.15); color: #f87171; border-color: rgba(239,68,68,0.3); }

/* ── Stats ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 1rem;
}
.stat-card {
  background: #0d0d1a;
  border: 1px solid rgba(104,35,255,0.13);
  border-radius: 16px; padding: 1.25rem;
  transition: border-color 0.25s, transform 0.2s;
  animation: fadeIn 0.5s ease both;
}
.stat-card:hover { border-color: rgba(104,35,255,0.35); transform: translateY(-3px); }
.stat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.9rem; }
.stat-icon-wrapper {
  width: 44px; height: 44px; border-radius: 13px;
  display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
}
.stat-trend {
  font-size: 0.72rem; font-weight: 700;
  padding: 3px 9px; border-radius: 20px;
  display: flex; align-items: center; gap: 3px;
}
.trend-up { color: #34d399; background: rgba(16,185,129,0.12); }
.trend-down { color: #f87171; background: rgba(239,68,68,0.12); }
.stat-value { font-size: 1.9rem; font-weight: 800; color: rgba(255,255,255,0.92); line-height: 1; }
.stat-label { font-size: 0.78rem; color: rgba(255,255,255,0.38); margin-top: 5px; }

/* ── Filters ── */
.filters-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr auto;
  gap: 0.85rem; align-items: center;
}
.search-box { position: relative; }
.search-icon {
  position: absolute; left: 1rem; top: 50%; transform: translateY(-50%);
  color: rgba(255,255,255,0.25); font-size: 0.85rem;
}
.dark-input, .dark-select {
  width: 100%;
  padding: 0.6rem 1rem;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px; color: rgba(255,255,255,0.7);
  font-size: 0.83rem; outline: none; transition: border-color 0.2s;
}
.dark-input { padding-left: 2.5rem; }
.dark-input:focus, .dark-select:focus { border-color: rgba(104,35,255,0.5); }
.dark-input::placeholder { color: rgba(255,255,255,0.2); }
.dark-select option { background: #0d0d1a; }

/* ── Table ── */
.table-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 1.1rem;
}
.table-title { display: flex; align-items: center; gap: 0.75rem; }
.table-title h5 { margin: 0; font-size: 0.9rem; font-weight: 700; color: rgba(255,255,255,0.8); }
.count-badge {
  background: rgba(104,35,255,0.12); color: #a47bff;
  padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700;
}
.table-responsive { overflow-x: auto; }
.dark-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.dark-table th {
  padding: 0.6rem 0.85rem; text-align: left;
  font-size: 0.68rem; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;
  color: rgba(255,255,255,0.25); border-bottom: 1px solid rgba(255,255,255,0.06);
}
.dark-table td {
  padding: 0.75rem 0.85rem;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.6); vertical-align: middle;
}
.dark-table tbody tr:last-child td { border-bottom: none; }
.employee-row { cursor: pointer; transition: background 0.15s; }
.employee-row:hover td { background: rgba(104,35,255,0.06); }
.sortable { cursor: pointer; user-select: none; }
.sortable i { margin-left: 5px; opacity: 0.4; }
.sortable:hover i { opacity: 0.9; }

.emp-id { font-family: 'Courier New', monospace; font-weight: 700; font-size: 0.73rem; color: rgba(255,255,255,0.45); }
.employee-info { display: flex; align-items: center; gap: 10px; }
.employee-avatar {
  width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: 700; font-size: 0.72rem;
}
.emp-name { font-size: 0.83rem; font-weight: 600; color: rgba(255,255,255,0.88); }
.emp-email { font-size: 0.7rem; color: rgba(255,255,255,0.3); margin-top: 1px; }
.contact-info { font-size: 0.78rem; color: rgba(255,255,255,0.45); display: flex; align-items: center; gap: 4px; }

.dept-badge {
  padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700;
}
.badge-status {
  padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; text-transform: capitalize;
}
.badge-active { background: rgba(16,185,129,0.12); color: #34d399; }
.badge-inactive { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); }
.badge-terminated { background: rgba(239,68,68,0.12); color: #f87171; }

.action-buttons { display: flex; gap: 5px; }

.empty-state { text-align: center; padding: 3rem 1rem; }

/* ── Pagination ── */
.pagination-container {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 1.25rem; padding-top: 1.25rem;
  border-top: 1px solid rgba(255,255,255,0.05);
  flex-wrap: wrap; gap: 0.75rem;
}
.pagination-info { font-size: 0.75rem; color: rgba(255,255,255,0.25); }
.pagination { display: flex; gap: 5px; }
.page-btn {
  min-width: 32px; height: 32px; padding: 0 6px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 8px; color: rgba(255,255,255,0.4);
  cursor: pointer; font-size: 0.78rem; transition: all 0.2s;
}
.page-btn:hover:not(:disabled) { background: rgba(104,35,255,0.2); color: #a47bff; border-color: rgba(104,35,255,0.4); }
.page-btn.active { background: linear-gradient(135deg,#6823ff,#4f0fdb); color: white; border-color: transparent; }
.page-btn:disabled { opacity: 0.3; cursor: not-allowed; }

/* ── Modal ── */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-box {
  width: 420px; max-width: calc(100vw - 2rem);
  padding: 0; overflow: hidden;
}
.modal-header {
  padding: 1.25rem 1.5rem;
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.modal-header h3 { margin: 0; font-size: 1rem; font-weight: 700; color: rgba(255,255,255,0.88); }
.modal-body { padding: 2rem 1.5rem; text-align: center; }
.delete-icon-wrap { margin-bottom: 1rem; }
.delete-msg { color: rgba(255,255,255,0.6); font-size: 0.88rem; margin-bottom: 0.35rem; }
.delete-warn { font-size: 0.75rem; color: rgba(255,255,255,0.25); }
.modal-footer {
  padding: 1.25rem 1.5rem; display: flex; gap: 0.75rem; justify-content: flex-end;
  border-top: 1px solid rgba(255,255,255,0.06);
}

/* ── Animations ── */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.fade-in { animation: fadeIn 0.45s ease both; }

/* ── Responsive ── */
@media (max-width: 1024px) { .filters-grid { grid-template-columns: repeat(2,1fr); } }
@media (max-width: 768px) {
  .employee-list-container { padding: 1rem; }
  .header-content { flex-direction: column; text-align: center; }
  .filters-grid { grid-template-columns: 1fr; }
  .pagination-container { flex-direction: column; align-items: flex-start; }
}
@media (max-width: 576px) {
  .stats-grid { grid-template-columns: 1fr 1fr; }
}
</style>