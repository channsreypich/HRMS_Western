<template>
  <MainLayout>
    <div class="employee-list-container">
      <!-- ⬜ Header section card converted to high-contrast white profile -->
      <div class="light-card header-section fade-in">
        <div class="header-content">
          <div>
            <h1 class="page-title">
              <VsxIcon iconName="Profile2User" :size="18" class="me-2" style="color: var(--accent)" />
              <span class="text-gradient">Employee Management</span>
            </h1>
            <p class="page-subtitle">Manage your workforce efficiently</p>
          </div>
          <div class="header-actions">
            <button class="btn-outline-purple" @click="exportEmployees">
              <VsxIcon iconName="DocumentDownload" :size="18" class="me-2" />Export
            </button>
            <router-link to="/employees/create" class="btn-primary">
              <VsxIcon iconName="AddCircle" :size="18" class="me-2" />Add Employee
            </router-link>
          </div>
        </div>
      </div>

      <!-- ⬜ Stats metrics grid mapping to bright color spaces -->
      <div class="stats-grid">
        <div
          class="stat-card fade-in"
          v-for="(stat, index) in employeeStats"
          :key="stat.label"
          :style="{ animationDelay: `${index * 0.08}s` }"
        >
          <div class="stat-header">
            <div class="stat-icon-wrapper" :style="{ background: stat.color + '18' }">
              <VsxIcon :iconName="stat.icon" :size="22" :style="{ color: stat.color }" />
            </div>
            <span class="stat-trend" :class="stat.trend > 0 ? 'trend-up' : 'trend-down'">
              <VsxIcon :iconName="stat.trend > 0 ? 'ArrowUp' : 'ArrowDown'" :size="16" />
              {{ Math.abs(stat.trend) }}%
            </span>
          </div>
          <div class="stat-content">
            <h3 class="stat-value">{{ stat.value }}</h3>
            <p class="stat-label">{{ stat.label }}</p>
          </div>
        </div>
      </div>

      <!-- ⬜ Search & Directory filter controls aligned into light UI schema -->
      <div class="light-card filters-section fade-in">
        <div class="filters-grid">
          <div class="search-box">
            <VsxIcon iconName="SearchNormal1" :size="18" class="search-icon" />
            <input
              type="text"
              class="light-input"
              placeholder="Search by name, email, ID..."
              v-model="filters.search"
              @input="debouncedSearch"
            />
          </div>
          <select class="light-select" v-model="filters.department">
            <option value="">All Departments</option>
            <option v-for="dept in departments" :key="dept.id" :value="dept.id">
              {{ dept.name }}
            </option>
          </select>
          <select class="light-select" v-model="filters.position">
            <option value="">All Positions</option>
            <option v-for="pos in positions" :key="pos.id" :value="pos.id">{{ pos.title }}</option>
          </select>
          <select class="light-select" v-model="filters.status">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <button class="btn-ghost" @click="resetFilters">
            <VsxIcon iconName="Refresh2" :size="18" class="me-2" />Reset
          </button>
        </div>
      </div>

      <!-- ⬜ Core employee directory table worksheet section -->
      <div class="light-card table-container fade-in">
        <div class="table-header">
          <div class="table-title">
            <h5>Employee Directory</h5>
            <span class="count-badge">{{ filteredEmployees.length }} employees</span>
          </div>
          <div class="table-actions">
            <div class="view-toggle">
              <button
                class="view-btn"
                :class="{ active: viewMode === 'list' }"
                @click="viewMode = 'list'"
                title="List view"
              >
                <VsxIcon iconName="RowVertical" :size="17" /> List
              </button>
              <button
                class="view-btn"
                :class="{ active: viewMode === 'card' }"
                @click="viewMode = 'card'"
                title="ID card view"
              >
                <VsxIcon iconName="Cards" :size="17" /> Cards
              </button>
            </div>
            <button class="btn-icon" @click="refreshTable" title="Refresh">
              <VsxIcon iconName="Refresh2" :size="18" />
            </button>
          </div>
        </div>

        <!-- ░░ CARD / ID-BADGE VIEW ░░ -->
        <div v-if="viewMode === 'card'" class="id-card-grid">
          <div v-if="employeeStore.loading" class="card-loading">
            <div class="spinner mx-auto"></div>
          </div>
          <div v-else-if="paginatedEmployees.length === 0" class="empty-state w-100">
            <VsxIcon iconName="Profile2User" :size="44" class="mb-3" style="color: #cbd5e1" />
            <p style="color: #64748b">No employees found</p>
          </div>
          <div v-for="emp in paginatedEmployees" :key="emp.id" class="id-card">
            <div class="id-card-band">
              <span class="id-lanyard"></span>
              <div class="id-org">
                <span class="id-org-logo"><VsxIcon iconName="Buildings2" :size="15" type="bold" /></span>
                <span class="id-org-name">HRM SYSTEM</span>
              </div>
              <button class="id-print-btn" @click.stop="printIdCard(emp)" title="Print ID card">
                <VsxIcon iconName="Printer" :size="16" />
              </button>
            </div>

            <div class="id-photo" :style="empPhoto(emp) ? {} : { background: getAvatarGradient(emp.first_name) }">
              <img v-if="empPhoto(emp)" :src="empPhoto(emp)" alt="" />
              <span v-else>{{ getInitials(emp.first_name, emp.last_name) }}</span>
            </div>

            <h3 class="id-name">{{ emp.first_name }} {{ emp.last_name }}</h3>
            <p class="id-position">{{ emp.position_title || 'Employee' }}</p>
            <span class="id-status" :class="getStatusClass(emp.status)">
              <span class="id-status-dot"></span>{{ emp.status }}
            </span>

            <div class="id-meta">
              <div class="id-row">
                <span class="id-k">Employee ID</span>
                <span class="id-v mono">{{ emp.employee_code || emp.code || 'EMP-' + emp.id }}</span>
              </div>
              <div class="id-row">
                <span class="id-k">Department</span>
                <span class="id-v">{{ emp.department_name || '—' }}</span>
              </div>
              <div class="id-row">
                <span class="id-k">Joined</span>
                <span class="id-v">{{ formatDate(emp.hire_date) }}</span>
              </div>
            </div>

            <div class="id-footer">
              <div class="id-barcode"></div>
              <span class="id-sign">{{ emp.email || 'Authorized ID' }}</span>
            </div>

            <div class="id-actions">
              <button class="id-mini" @click.stop="viewEmployee(emp.id)">
                <VsxIcon iconName="Eye" :size="15" /> View
              </button>
              <button class="id-mini primary" @click.stop="printIdCard(emp)">
                <VsxIcon iconName="Printer" :size="15" /> Print
              </button>
            </div>
          </div>
        </div>

        <div v-else class="table-responsive">
          <table class="light-table">
            <thead>
              <tr>
                <th>#</th>
                <th @click="sortBy('first_name')" class="sortable">
                  Employee <VsxIcon :iconName="getSortIcon('first_name')" :size="16" />
                </th>
                <th>Contact</th>
                <th @click="sortBy('department_name')" class="sortable">
                  Department <VsxIcon :iconName="getSortIcon('department_name')" :size="16" />
                </th>
                <th>Position</th>
                <th @click="sortBy('hire_date')" class="sortable">
                  Hire Date <VsxIcon :iconName="getSortIcon('hire_date')" :size="16" />
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="employeeStore.loading">
                <td colspan="8" class="text-center py-5">
                  <div class="spinner mx-auto"></div>
                  <p class="mt-3" style="color: #64748b">Loading employees...</p>
                </td>
              </tr>
              <tr v-else-if="paginatedEmployees.length === 0">
                <td colspan="8" class="empty-state">
                  <VsxIcon iconName="Profile2User" :size="44" class="mb-3" style="color: #cbd5e1" />
                  <p style="color: #64748b">No employees found</p>
                  <router-link to="/employees/create" class="btn-primary btn-sm mt-2">
                    Add Your First Employee
                  </router-link>
                </td>
              </tr>
              <tr
                v-else
                v-for="(emp, index) in paginatedEmployees"
                :key="emp.id"
                @click="viewEmployee(emp.id)"
                class="employee-row"
              >
                <td>
                  <span class="emp-id">{{ (currentPage - 1) * itemsPerPage + index + 1 }}</span>
                </td>
                <td>
                  <div class="employee-info">
                    <div
                      class="employee-avatar"
                      :style="{ background: getAvatarGradient(emp.first_name) }"
                    >
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
                    <VsxIcon iconName="Call" :size="18" class="me-1" style="color: #94a3b8" />
                    <span>{{ emp.phone || 'N/A' }}</span>
                  </div>
                </td>
                <td>
                  <span
                    class="dept-badge"
                    :style="{
                      background: getDeptColor(emp.department_name),
                      color: getDeptText(emp.department_name),
                    }"
                  >
                    {{ emp.department_name || '—' }}
                  </span>
                </td>
                <td style="color: #475569">{{ emp.position_title || '—' }}</td>
                <td style="color: #64748b; font-size: 0.78rem">{{ formatDate(emp.hire_date) }}</td>
                <td>
                  <span class="badge-status" :class="getStatusClass(emp.status)">
                    {{ emp.status }}
                  </span>
                </td>
                <td @click.stop>
                  <div class="action-buttons">
                    <button class="btn-icon" @click="viewEmployee(emp.id)" title="View">
                      <VsxIcon iconName="Eye" :size="18" />
                    </button>
                    <button class="btn-icon" @click="editEmployee(emp.id)" title="Edit">
                      <VsxIcon iconName="Edit2" :size="18" />
                    </button>
                    <button class="btn-icon danger" @click="confirmDelete(emp)" title="Delete">
                      <VsxIcon iconName="Trash" :size="18" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination-container" v-if="totalPages > 1">
          <div class="pagination-info">
            Showing {{ (currentPage - 1) * itemsPerPage + 1 }}–{{
              Math.min(currentPage * itemsPerPage, filteredEmployees.length)
            }}
            of {{ filteredEmployees.length }} employees
          </div>
          <div class="pagination">
            <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">
              <VsxIcon iconName="ArrowLeft2" :size="18" />
            </button>
            <button
              v-for="page in displayedPages"
              :key="page"
              class="page-btn"
              :class="{ active: currentPage === page }"
              @click="typeof page === 'number' && (currentPage = page)"
            >
              {{ page }}
            </button>
            <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">
              <VsxIcon iconName="ArrowRight2" :size="18" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ⬜ Modal confirmation overlay converted to light theme dimensions -->
    <div class="modal-overlay" v-if="showDeleteModal" @click="showDeleteModal = false">
      <div class="modal-box light-card" @click.stop>
        <div class="modal-header">
          <h3>Confirm Delete</h3>
          <button class="close-btn" @click="showDeleteModal = false">
            <VsxIcon iconName="CloseCircle" :size="18" />
          </button>
        </div>
        <div class="modal-body text-center py-3">
          <div class="delete-icon-wrap mb-3">
            <VsxIcon iconName="Warning2" :size="40" style="color: #ef4444" />
          </div>
          <p class="delete-msg">
            Are you sure you want to delete
            <strong style="color: #0f172a"
              >{{ employeeToDelete?.first_name }} {{ employeeToDelete?.last_name }}</strong
            >?
          </p>
          <p class="delete-warn">
            This action cannot be undone and will permanently remove this record.
          </p>
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
const viewMode = ref('list')
const currentPage = ref(1)
const itemsPerPage = 10
const showDeleteModal = ref(false)
const employeeToDelete = ref(null)
const sortField = ref('id')
const sortDirection = ref('asc')

const employeeStats = computed(() => [
  {
    label: 'Total Employees',
    value: employeeStore.employees.length,
    icon: 'Profile2User',
    color: '#4f7cff',
    trend: 12,
  },
  {
    label: 'Active',
    value: employeeStore.employees.filter((e) => e.status === 'active').length,
    icon: 'TickCircle',
    color: '#10b981',
    trend: 8,
  },
  {
    label: 'Inactive',
    value: employeeStore.employees.filter((e) => e.status === 'inactive').length,
    icon: 'MinusCirlce',
    color: '#f59e0b',
    trend: -2,
  },
  {
    label: 'Suspended',
    value: employeeStore.employees.filter((e) => e.status === 'suspended').length,
    icon: 'InfoCircle',
    color: '#06b6d4',
    trend: 5,
  },
])

const departments = computed(() => departmentStore.departments)
const positions = computed(() => positionStore.positions)

const filteredEmployees = computed(() => {
  let filtered = employeeStore.employees || []
  if (filters.search) {
    const s = filters.search.toLowerCase()
    filtered = filtered.filter(
      (e) =>
        e.first_name?.toLowerCase().includes(s) ||
        e.last_name?.toLowerCase().includes(s) ||
        e.email?.toLowerCase().includes(s) ||
        String(e.id).includes(s),
    )
  }
  if (filters.department)
    filtered = filtered.filter((e) => e.department_id === parseInt(filters.department))
  if (filters.position)
    filtered = filtered.filter((e) => e.position_id === parseInt(filters.position))
  if (filters.status) filtered = filtered.filter((e) => e.status === filters.status)

  filtered.sort((a, b) => {
    let aVal = a[sortField.value],
      bVal = b[sortField.value]
    if (sortField.value === 'first_name') {
      aVal = `${a.first_name} ${a.last_name}`
      bVal = `${b.first_name} ${b.last_name}`
    }
    if (sortField.value === 'department_name') {
      aVal = a.department_name || ''
      bVal = b.department_name || ''
    }
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
  const delta = 2,
    range = [],
    rangeWithDots = []
  let l
  for (let i = 1; i <= totalPages.value; i++) {
    if (
      i === 1 ||
      i === totalPages.value ||
      (i >= currentPage.value - delta && i <= currentPage.value + delta)
    )
      range.push(i)
  }
  range.forEach((i) => {
    if (l) {
      if (i - l === 2) rangeWithDots.push(l + 1)
      else if (i - l !== 1) rangeWithDots.push('...')
    }
    rangeWithDots.push(i)
    l = i
  })
  return rangeWithDots
})

const debouncedSearch = debounce(() => {
  currentPage.value = 1
}, 300)
const sortBy = (field) => {
  if (sortField.value === field)
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
  currentPage.value = 1
}
const getSortIcon = (field) => {
  if (sortField.value !== field) return 'Sort'
  return sortDirection.value === 'asc' ? 'ArrowUp2' : 'ArrowDown2'
}
const getInitials = (first, last) =>
  ((first?.charAt(0) || '') + (last?.charAt(0) || '')).toUpperCase()
// Best available portrait for the ID card: a real photo if the record has one,
// otherwise the card falls back to a clean initials avatar.
const empPhoto = (emp) =>
  emp?.photo_url || emp?.avatar || emp?.image_url || emp?.image || emp?.selfie_url || ''
const getAvatarGradient = (name) => {
  const gradients = [
    'linear-gradient(135deg,#4f7cff,#64748b)',
    'linear-gradient(135deg,#a47bff,#40c8da)',
    'linear-gradient(135deg,#f87171,#a47bff)',
    'linear-gradient(135deg,#fbbf24,#f87171)',
    'linear-gradient(135deg,#34d399,#40c8da)',
  ]
  return gradients[(name?.charCodeAt(0) || 0) % gradients.length]
}
const getDeptColor = (dept) => {
  const map = {
    IT: 'rgba(79, 124, 255,0.08)',
    HR: 'rgba(16,185,129,0.08)',
    Finance: 'rgba(245,158,11,0.08)',
    Marketing: 'rgba(239,68,68,0.08)',
    Operations: 'rgba(6,182,212,0.08)',
  }
  return map[dept] || 'rgba(79, 124, 255,0.05)'
}
const getDeptText = (dept) => {
  const map = {
    IT: '#4f7cff',
    HR: '#10b981',
    Finance: '#b45309',
    Marketing: '#dc2626',
    Operations: '#0891b2',
  }
  return map[dept] || '#475569'
}
const getStatusClass = (status) =>
  ({ active: 'badge-active', inactive: 'badge-inactive', suspended: 'badge-terminated' })[status] ||
  'badge-inactive'
const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
const viewEmployee = (id) => router.push(`/employees/${id}`)
const editEmployee = (id) => router.push(`/employees/${id}/edit`)
const confirmDelete = (emp) => {
  employeeToDelete.value = emp
  showDeleteModal.value = true
}

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

const resetFilters = () => {
  filters.search = ''
  filters.department = ''
  filters.position = ''
  filters.status = ''
  currentPage.value = 1
}
const exportEmployees = () => toast.info('Export feature coming soon!')

// Print a single employee ID card in an isolated window so it prints cleanly.
const printIdCard = (emp) => {
  const code = emp.employee_code || emp.code || 'EMP-' + emp.id
  const initials = getInitials(emp.first_name, emp.last_name)
  const grad = getAvatarGradient(emp.first_name)
  // Resolve the live theme accent so the print matches the on-screen card.
  const css = getComputedStyle(document.documentElement)
  const accent = css.getPropertyValue('--accent').trim() || '#4f7cff'
  const accentStrong = css.getPropertyValue('--accent-strong').trim() || '#3b62d4'
  const src = empPhoto(emp)
  const photo = src
    ? `<img src="${src}" style="width:100%;height:100%;object-fit:cover"/>`
    : `<span>${initials}</span>`
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>ID Card · ${emp.first_name} ${emp.last_name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;font-family:'Plus Jakarta Sans',sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#eef2f7;padding:24px}
    .card{width:330px;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 24px 60px rgba(15,23,42,.2);position:relative;padding-bottom:22px}
    .band{position:relative;height:84px;background:radial-gradient(120% 140% at 80% -20%,rgba(255,255,255,.28),transparent 60%),linear-gradient(120deg,${accent},${accentStrong});display:flex;align-items:flex-start;justify-content:space-between;padding:16px 18px}
    .lanyard{position:absolute;top:10px;left:50%;transform:translateX(-50%);width:50px;height:7px;border-radius:999px;background:rgba(255,255,255,.55)}
    .org{display:flex;align-items:center;gap:8px;color:#fff;font-weight:800;font-size:.76rem;letter-spacing:.12em}
    .org .lg{width:26px;height:26px;border-radius:8px;background:rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;font-size:.9rem}
    .photo{width:108px;height:108px;border-radius:22px;margin:-54px auto 0;border:4px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:1.9rem;overflow:hidden;background:${grad};box-shadow:0 10px 22px -10px rgba(15,23,42,.35)}
    .name{text-align:center;font-size:1.25rem;font-weight:800;color:#0f172a;margin-top:14px}
    .pos{text-align:center;font-size:.84rem;color:#64748b;font-weight:600;margin-top:3px}
    .status{display:flex;align-items:center;gap:5px;width:fit-content;margin:10px auto 0;padding:4px 13px;border-radius:20px;font-size:.66rem;font-weight:700;text-transform:capitalize;background:${accent}1a;color:${accentStrong}}
    .status i{width:6px;height:6px;border-radius:50%;background:currentColor;display:inline-block}
    .meta{margin:18px 24px 0;border-top:1px dashed #e2e8f0;padding-top:16px;display:flex;flex-direction:column;gap:10px}
    .row{display:flex;justify-content:space-between;font-size:.8rem}
    .k{color:#94a3b8;font-weight:600}.v{color:#0f172a;font-weight:700}
    .mono{font-family:'Courier New',monospace}
    .bc{height:36px;margin:18px 24px 0;background:repeating-linear-gradient(90deg,#0f172a 0 2px,#fff 2px 4px,#0f172a 4px 5px,#fff 5px 8px,#0f172a 8px 11px,#fff 11px 12px);border-radius:5px}
    .sign{text-align:center;font-size:.62rem;color:#94a3b8;margin-top:7px;letter-spacing:.03em}
    @media print{body{background:#fff;padding:0}.card{box-shadow:none}}
  </style></head><body onload="setTimeout(function(){window.print()},250)">
    <div class="card">
      <div class="band">
        <span class="lanyard"></span>
        <div class="org"><span class="lg">🏢</span> HRM SYSTEM</div>
      </div>
      <div class="photo">${photo}</div>
      <div class="name">${emp.first_name} ${emp.last_name}</div>
      <div class="pos">${emp.position_title || 'Employee'}</div>
      <div class="status"><i></i>${emp.status || 'active'}</div>
      <div class="meta">
        <div class="row"><span class="k">Employee ID</span><span class="v mono">${code}</span></div>
        <div class="row"><span class="k">Department</span><span class="v">${emp.department_name || '—'}</span></div>
        <div class="row"><span class="k">Email</span><span class="v">${emp.email || '—'}</span></div>
        <div class="row"><span class="k">Joined</span><span class="v">${formatDate(emp.hire_date)}</span></div>
      </div>
      <div class="bc"></div>
      <div class="sign">Authorized Signature</div>
    </div>
  </body></html>`
  const w = window.open('', '_blank', 'width=440,height=680')
  if (!w) return toast.error('Allow pop-ups to print the ID card')
  w.document.write(html)
  w.document.close()
}
const refreshTable = async () => {
  await employeeStore.fetchEmployees()
  toast.success('Employee list refreshed')
}

watch(
  [() => filters.search, () => filters.department, () => filters.position, () => filters.status],
  () => {
    currentPage.value = 1
  },
)

onMounted(async () => {
  await employeeStore.fetchEmployees()
  await departmentStore.fetchDepartments()
  await positionStore.fetchPositions()
})
</script>

<style scoped>
/* ── Base Container System ── */
.employee-list-container {
  padding: 1.5rem;
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ── Modern Crisp White Cards ── */
.light-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.03),
    0 2px 4px -1px rgba(0, 0, 0, 0.01);
  border-radius: 18px;
  padding: 1.5rem;
  transition: border-color 0.25s;
}

/* ── Top Header Section ── */
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
  color: #0f172a;
  margin-bottom: 0.35rem;
}
.text-gradient {
  background: linear-gradient(135deg, var(--accent), #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.page-subtitle {
  font-size: 0.85rem;
  color: #64748b;
}
.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* ── Primary UI Buttons ── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    opacity 0.2s,
    transform 0.1s;
  box-shadow: 0 4px 14px rgba(var(--accent-rgb), 0.2);
  text-decoration: none;
}
.btn-primary:hover {
  opacity: 0.95;
}
.btn-primary:active {
  transform: scale(0.97);
}
.btn-primary.btn-sm {
  padding: 0.45rem 0.9rem;
  font-size: 0.78rem;
}

.btn-outline-purple {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0.6rem 1.2rem;
  background: rgba(var(--accent-rgb), 0.06);
  border: 1px solid rgba(var(--accent-rgb), 0.25);
  border-radius: 10px;
  color: var(--accent);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}
.btn-outline-purple:hover {
  background: rgba(var(--accent-rgb), 0.12);
  border-color: var(--accent);
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.6rem 1.1rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #475569;
  font-size: 0.83rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-ghost:hover {
  background: #f8fafc;
  color: #0f172a;
  border-color: #94a3b8;
}

.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.6rem 1.2rem;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 10px;
  color: #dc2626;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-danger:hover {
  background: #fecaca;
  border-color: #f87171;
}

.btn-icon {
  width: 32px;
  height: 32px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 9px;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  transition: all 0.2s;
}
.btn-icon:hover {
  background: rgba(var(--accent-rgb), 0.08);
  color: var(--accent);
  border-color: rgba(var(--accent-rgb), 0.2);
}
.btn-icon.danger:hover {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fca5a5;
}

/* ── Interactive Counter Cards ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 1rem;
}
.stat-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem;
  transition:
    border-color 0.25s,
    transform 0.2s;
  animation: fadeIn 0.5s ease both;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
}
.stat-card:hover {
  border-color: #cbd5e1;
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
  background: #d1fae5;
}
.trend-down {
  color: #dc2626;
  background: #fee2e2;
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
  font-weight: 600;
}

/* ── Standardized Filters Layout ── */
.filters-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr auto;
  gap: 0.85rem;
  align-items: center;
}
.search-box {
  position: relative;
}
.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 0.85rem;
}

.light-input,
.light-select {
  width: 100%;
  padding: 0.6rem 1rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #334155;
  font-size: 0.83rem;
  outline: none;
  transition: all 0.2s;
}
.light-input {
  padding-left: 2.5rem;
}
.light-input:focus,
.light-select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.1);
}
.light-input::placeholder {
  color: #94a3b8;
}
.light-select option {
  background: #ffffff;
  color: #334155;
}

/* ── Employee Matrix Table ── */
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.1rem;
}
.table-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.table-title h5 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
}
.count-badge {
  background: rgba(var(--accent-rgb), 0.08);
  color: var(--accent);
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 700;
}
.table-responsive {
  overflow-x: auto;
}

.light-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}
.light-table th {
  padding: 0.6rem 0.85rem;
  text-align: left;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #64748b;
  border-bottom: 2px solid #f1f5f9;
}
.light-table td {
  padding: 0.75rem 0.85rem;
  border-bottom: 1px solid #f1f5f9;
  color: #475569;
  vertical-align: middle;
}
.light-table tbody tr:last-child td {
  border-bottom: none;
}

.employee-row {
  cursor: pointer;
  transition: background 0.15s;
}
.employee-row:hover td {
  background: rgba(var(--accent-rgb), 0.04);
}
.sortable {
  cursor: pointer;
  user-select: none;
}
.sortable :deep(svg) {
  margin-left: 5px;
  opacity: 0.5;
}
.sortable:hover :deep(svg) {
  opacity: 1;
  color: var(--accent);
}

.emp-id {
  font-family: 'Courier New', monospace;
  font-weight: 700;
  font-size: 0.75rem;
  color: #64748b;
}
.employee-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.employee-avatar {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 0.72rem;
}
.emp-name {
  font-size: 0.83rem;
  font-weight: 600;
  color: #0f172a;
}
.emp-email {
  font-size: 0.72rem;
  color: #64748b;
  margin-top: 1px;
}
.contact-info {
  font-size: 0.78rem;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ── Organizational Badges ── */
.dept-badge {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 700;
}
.badge-status {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: capitalize;
}
.badge-active {
  background: #d1fae5;
  color: #065f46;
}
.badge-inactive {
  background: #f1f5f9;
  color: #475569;
}
.badge-terminated {
  background: #fee2e2;
  color: #991b1b;
}

.action-buttons {
  display: flex;
  gap: 5px;
}
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

/* ── Pagination Elements ── */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.pagination-info {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}
.pagination {
  display: flex;
  gap: 5px;
}
.page-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #475569;
  cursor: pointer;
  font-size: 0.78rem;
  transition: all 0.2s;
}
.page-btn:hover:not(:disabled) {
  background: rgba(var(--accent-rgb), 0.08);
  color: var(--accent);
  border-color: rgba(var(--accent-rgb), 0.2);
}
.page-btn.active {
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  color: white;
  border-color: transparent;
}
.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── Modal Dialog Viewports ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-box {
  width: 420px;
  max-width: calc(100vw - 2rem);
  padding: 0;
  overflow: hidden;
}
.modal-header {
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
}
.modal-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}
.modal-body {
  padding: 2rem 1.5rem;
  text-align: center;
}
.delete-icon-wrap {
  margin-bottom: 1rem;
}
.delete-msg {
  color: #334155;
  font-size: 0.88rem;
  margin-bottom: 0.35rem;
}
.delete-warn {
  font-size: 0.75rem;
  color: #64748b;
}
.modal-footer {
  padding: 1.25rem 1.5rem;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  border-top: 1px solid #f1f5f9;
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 1rem;
  transition: color 0.2s;
}
.close-btn:hover {
  color: #475569;
}

/* ── Struct Animations ── */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.fade-in {
  animation: fadeIn 0.45s ease both;
}

/* ── View toggle ── */
.view-toggle {
  display: inline-flex;
  background: #f1f5f9;
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
}
.view-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0.4rem 0.8rem;
  border: none;
  background: none;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
  transition: all 0.18s;
}
.view-btn.active {
  background: #fff;
  color: var(--accent, var(--accent));
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
}
.table-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

/* ── ID card grid ── */
.id-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.25rem;
}
.card-loading {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  padding: 3rem;
}
.id-card {
  position: relative;
  background: #fff;
  border: 1px solid #e8edf5;
  border-radius: 22px;
  padding: 0 0 1.25rem;
  overflow: hidden;
  box-shadow: 0 6px 22px -10px rgba(15, 23, 42, 0.16);
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease;
}
.id-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 22px 44px -16px rgba(15, 23, 42, 0.26);
}
.id-card-band {
  position: relative;
  height: 78px;
  background:
    radial-gradient(120% 140% at 80% -20%, rgba(255, 255, 255, 0.28), transparent 60%),
    linear-gradient(120deg, var(--accent), var(--accent-strong));
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 14px 16px;
}
.id-lanyard {
  position: absolute;
  top: 9px;
  left: 50%;
  transform: translateX(-50%);
  width: 46px;
  height: 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.55);
}
.id-org {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #fff;
}
.id-org-logo {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
}
.id-org-name {
  font-weight: 800;
  font-size: 0.74rem;
  letter-spacing: 0.12em;
}
.id-print-btn {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  border: none;
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.18s;
}
.id-print-btn:hover {
  background: rgba(255, 255, 255, 0.42);
}
.id-photo {
  width: 96px;
  height: 96px;
  border-radius: 20px;
  margin: -48px auto 0;
  border: 4px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 800;
  font-size: 1.7rem;
  overflow: hidden;
  position: relative;
  box-shadow: 0 8px 18px -8px rgba(15, 23, 42, 0.3);
}
.id-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.id-name {
  text-align: center;
  font-size: 1.12rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0.75rem 1rem 0;
  letter-spacing: -0.01em;
}
.id-position {
  text-align: center;
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
  margin: 3px 0 0;
}
.id-status {
  display: flex;
  align-items: center;
  gap: 5px;
  width: fit-content;
  margin: 0.6rem auto 0;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: capitalize;
}
.id-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.id-meta {
  margin: 1rem 1.4rem 0;
  padding-top: 0.95rem;
  border-top: 1px dashed #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.id-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
}
.id-k {
  color: #94a3b8;
  font-weight: 600;
}
.id-v {
  color: #0f172a;
  font-weight: 700;
  max-width: 62%;
  text-align: right;
}
.id-v.mono {
  font-family: 'Courier New', monospace;
  letter-spacing: 0.02em;
}
.id-footer {
  margin: 1.1rem 1.4rem 0;
}
.id-barcode {
  height: 34px;
  border-radius: 5px;
  background: repeating-linear-gradient(
    90deg,
    #0f172a 0 2px,
    #fff 2px 4px,
    #0f172a 4px 5px,
    #fff 5px 8px,
    #0f172a 8px 11px,
    #fff 11px 12px
  );
}
.id-sign {
  display: block;
  text-align: center;
  font-size: 0.62rem;
  color: #94a3b8;
  letter-spacing: 0.03em;
  margin-top: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.id-actions {
  display: flex;
  gap: 8px;
  margin: 1.1rem 1.4rem 0;
}
.id-mini {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0.5rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.16s;
}
.id-mini:hover {
  background: var(--accent-soft);
  color: var(--accent-strong);
  border-color: transparent;
}
.id-mini.primary {
  background: var(--accent);
  color: #fff;
  border-color: transparent;
}
.id-mini.primary:hover {
  background: var(--accent-strong);
}

/* ── Responsive Viewport Systems ── */
@media (max-width: 1024px) {
  .filters-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 768px) {
  .employee-list-container {
    padding: 1rem;
  }
  .header-content {
    flex-direction: column;
    text-align: center;
  }
  .filters-grid {
    grid-template-columns: 1fr;
  }
  .pagination-container {
    flex-direction: column;
    align-items: flex-start;
  }
}
@media (max-width: 576px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
