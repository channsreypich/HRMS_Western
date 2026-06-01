<template>
  <MainLayout>
    <div class="att-container">
      <div class="page-header">
        <div>
          <h1 class="page-title"><i class="fas fa-clock me-2 text-gradient"></i>Attendance</h1>
          <p class="page-sub">Track and manage employee attendance records</p>
        </div>
        <div class="header-actions">
          <button class="btn-outline" @click="exportCSV">
            <i class="fas fa-download"></i> Export
          </button>
          <button class="btn-primary" @click="openMarkModal">
            <i class="fas fa-plus-circle"></i> Mark Attendance
          </button>
        </div>
      </div>

      <div class="summary-row">
        <div
          class="summary-card"
          v-for="s in summaryCards"
          :key="s.label"
          :style="{ '--accent': s.color }"
        >
          <div class="sum-icon-wrap" :style="{ background: s.color + '20' }">
            <i :class="s.icon" :style="{ color: s.color }"></i>
          </div>
          <div class="sum-content">
            <div class="sum-value">{{ s.value }}</div>
            <div class="sum-label">{{ s.label }}</div>
          </div>
          <div class="sum-pct">{{ s.pct }}%</div>
        </div>
      </div>

      <div class="dark-card toolbar">
        <div class="search-wrap">
          <i class="fas fa-search si"></i>
          <input type="text" class="search-inp" placeholder="Search employee..." v-model="search" />
        </div>
        <input type="date" class="date-inp" v-model="filterDate" />
        <select class="filter-sel" v-model="filterStatus">
          <option value="">All Status</option>
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="absent">Absent</option>
          <option value="half_day">Half Day</option>
        </select>
        <select class="filter-sel" v-model="filterDept">
          <option value="">All Departments</option>
          <option v-for="d in departments" :key="d" :value="d">{{ d }}</option>
        </select>
        <button class="btn-outline" @click="resetFilters">
          <i class="fas fa-redo-alt"></i> Reset
        </button>
        <div class="view-toggle">
          <button
            :class="['view-btn', { active: viewMode === 'table' }]"
            @click="viewMode = 'table'"
          >
            <i class="fas fa-list"></i>
          </button>
          <button
            :class="['view-btn', { active: viewMode === 'calendar' }]"
            @click="viewMode = 'calendar'"
          >
            <i class="fas fa-calendar"></i>
          </button>
        </div>
      </div>

      <div v-if="viewMode === 'table'" class="dark-card">
        <div class="table-head-row">
          <div>
            <span class="tbl-title">Attendance Records</span>
            <span class="count-badge ms-2">{{ filtered.length }} records</span>
          </div>
        </div>
        <div class="table-responsive">
          <table class="dark-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="attStore.loading">
                <td colspan="6" class="loading-row">
                  <div class="pulse-loader"></div>
                  Loading records...
                </td>
              </tr>
              <tr v-else-if="paginated.length === 0">
                <td colspan="6" class="empty-row">
                  <i class="fas fa-clock fa-2x mb-2"></i><br />No records found
                </td>
              </tr>
              <tr v-else v-for="rec in paginated" :key="rec.id" class="att-row">
                <td>
                  <div class="emp-cell">
                    <div
                      class="avatar-sm"
                      :style="{ background: getAvatarGradient(rec.first_name) }"
                    >
                      {{ getInitials(rec.first_name, rec.last_name) }}
                    </div>
                    <span class="emp-name">{{ rec.first_name }} {{ rec.last_name }}</span>
                  </div>
                </td>
                <td>
                  <span class="dept-chip">{{ rec.department_name || '—' }}</span>
                </td>
                <td>{{ formatDate(rec.date) }}</td>
                <td>
                  <span class="time-badge" v-if="rec.check_in">
                    <i class="fas fa-sign-in-alt"></i> {{ rec.check_in }}
                  </span>
                  <span class="na-text" v-else>—</span>
                </td>
                <td>
                  <span class="time-badge out" v-if="rec.check_out">
                    <i class="fas fa-sign-out-alt"></i> {{ rec.check_out }}
                  </span>
                  <span class="na-text" v-else>—</span>
                </td>
                <td>
                  <span class="status-chip" :class="'status-' + (rec.status || '').toLowerCase()">{{
                    rec.status
                  }}</span>
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

      <div v-else class="dark-card">
        <div class="cal-header">
          <button class="cal-nav" @click="prevMonth"><i class="fas fa-chevron-left"></i></button>
          <h3 class="cal-month-title">{{ calMonthLabel }}</h3>
          <button class="cal-nav" @click="nextMonth"><i class="fas fa-chevron-right"></i></button>
        </div>
        <div class="cal-legend">
          <span v-for="s in statusLegend" :key="s.key" class="legend-item">
            <span class="legend-dot" :style="{ background: s.color }"></span> {{ s.label }}
          </span>
        </div>
        <div class="cal-grid">
          <div
            class="cal-day-label"
            v-for="d in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']"
            :key="d"
          >
            {{ d }}
          </div>
          <div
            v-for="(day, i) in calDays"
            :key="i"
            class="cal-cell"
            :class="{ 'other-month': !day.isCurrentMonth, today: day.isToday }"
          >
            <div class="cell-date">{{ day.day }}</div>
            <div class="cell-badges">
              <span
                v-for="(cnt, status) in day.counts"
                :key="status"
                v-if="cnt > 0"
                class="cal-badge"
                :style="{ background: statusColors[status] + '25', color: statusColors[status] }"
              >
                {{ cnt
                }}{{
                  status === 'present'
                    ? 'P'
                    : status === 'late'
                      ? 'L'
                      : status === 'absent'
                        ? 'A'
                        : 'HD'
                }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showMarkModal" @click.self="showMarkModal = false">
      <div class="modal-box">
        <div class="modal-head">
          <h3><i class="fas fa-clock me-2"></i>Mark Attendance</h3>
          <button class="close-btn" @click="showMarkModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form @submit.prevent="markAtt" class="modal-form">
          <div class="form-row">
            <div class="form-field">
              <label>Employee *</label>
              <select v-model="markForm.employee_id" @change="updateFormEmployeeCode" required>
                <option value="">Select employee</option>
                <option v-for="e in employeeStore.employees" :key="e.id" :value="e.id">
                  {{ e.first_name }} {{ e.last_name }} ({{ e.employee_code }})
                </option>
              </select>
            </div>
            <div class="form-field">
              <label>Date *</label>
              <input type="date" v-model="markForm.date" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Status</label>
              <select v-model="markForm.status">
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
                <option value="half_day">Half Day</option>
              </select>
            </div>
            <div class="form-field">
              <label>Check In</label>
              <input type="time" v-model="markForm.check_in" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Check Out</label>
              <input type="time" v-model="markForm.check_out" />
            </div>
            <div class="form-field">
              <label>Notes</label>
              <input type="text" v-model="markForm.notes" placeholder="Optional notes..." />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-outline" @click="showMarkModal = false">Cancel</button>
            <button type="submit" class="btn-primary" :disabled="attStore.loading">
              <span v-if="attStore.loading" class="spinner-sm"></span> Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import MainLayout from '@/components/layouts/MainLayout.vue'
import { useAttendanceStore } from '@/stores/attendance'
import { useEmployeeStore } from '@/stores/employee'
import { toast } from 'vue3-toastify'
import api from '@/services/api'

const attStore = useAttendanceStore()
const employeeStore = useEmployeeStore()

const search = ref('')
const filterDate = ref('')
const filterStatus = ref('')
const filterDept = ref('')
const viewMode = ref('table')
const page = ref(1)
const perPage = 12
const showMarkModal = ref(false)
const calOffset = ref(0)

const markForm = reactive({
  employee_id: '',
  employee_code: '',
  date: new Date().toISOString().split('T')[0],
  status: 'present',
  check_in: '08:00',
  check_out: '17:00',
  notes: '',
})

const departments = computed(() => {
  const records = attStore.attendanceRecords || []
  return [...new Set(records.map((r) => r.department_name).filter(Boolean))]
})

const statusColors = { present: '#34d399', late: '#fbbf24', absent: '#f87171', half_day: '#60a5fa' }
const statusLegend = [
  { key: 'present', label: 'Present', color: '#34d399' },
  { key: 'late', label: 'Late', color: '#fbbf24' },
  { key: 'absent', label: 'Absent', color: '#f87171' },
  { key: 'half_day', label: 'Half Day', color: '#60a5fa' },
]

const summaryCards = computed(() => {
  const records = attStore.attendanceRecords || []
  const total = records.length || 1

  const present = records.filter((r) => r?.status === 'present').length
  const late = records.filter((r) => r?.status === 'late').length
  const absent = records.filter((r) => r?.status === 'absent').length
  const halfDay = records.filter((r) => r?.status === 'half_day').length

  return [
    {
      label: 'Present',
      value: present,
      pct: Math.round((present / total) * 100),
      icon: 'fas fa-check-circle',
      color: '#34d399',
    },
    {
      label: 'Late',
      value: late,
      pct: Math.round((late / total) * 100),
      icon: 'fas fa-clock',
      color: '#fbbf24',
    },
    {
      label: 'Absent',
      value: absent,
      pct: Math.round((absent / total) * 100),
      icon: 'fas fa-times-circle',
      color: '#f87171',
    },
    {
      label: 'Half Day',
      value: halfDay,
      pct: Math.round((halfDay / total) * 100),
      icon: 'fas fa-hourglass-half',
      color: '#60a5fa',
    },
  ]
})

// 📊 កែសម្រួលផ្នែក filtered ក្នុង src/views/attendance/AttendanceList.vue ឡើងវិញ៖
const filtered = computed(() => {
  const records = attStore.attendanceRecords || []
  return records.filter((r) => {
    // 💡 ដំណោះស្រាយ៖ ប្រសិនបើមិនទាន់មានឈ្មោះបុគ្គលិក ឱ្យដាក់ពាក្យថា "Unknown Employee" ការពារកូដគាំងលាក់ជួរ
    const firstName = r?.first_name || 'Unknown'
    const lastName = r?.last_name || 'Employee'

    const q = (search.value || '').toLowerCase()
    const fullName = `${firstName} ${lastName}`.toLowerCase()
    const matchSearch = !q || fullName.includes(q)

    // 💡 ដំណោះស្រាយ Timezone
    let formattedRecDate = ''
    if (r?.date) {
      const d = new Date(r.date)
      formattedRecDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }

    // 💡 កែសម្រួលលក្ខខណ្ឌថ្ងៃខែ៖ បើលីហ្សាមិនទាន់រើសថ្ងៃខែ (filterDate ទទេ) ឱ្យវាបង្ហាញទិន្នន័យទាំងអស់តែម្តង
    const matchDate = !filterDate.value || formattedRecDate === filterDate.value
    const matchStatus = !filterStatus.value || r?.status === filterStatus.value
    const matchDept = !filterDept.value || r?.department_name === filterDept.value

    return matchSearch && matchDate && matchStatus && matchDept
  })
})

// 📅 2. កែសម្រួលផ្នែក CalDays ផ្ទាំងប្រតិទិន
const calDays = computed(() => {
  const year = calYear.value,
    month = calMonth.value
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = new Date().toISOString().split('T')[0]
  const days = []

  const records = attStore.attendanceRecords || []

  for (let i = 0; i < firstDay; i++) {
    days.push({ day: '', isCurrentMonth: false, isToday: false, counts: {} })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

    const dayRecords = records.filter((r) => {
      if (!r?.date) return false
      const recDate = new Date(r.date)
      const formattedRecDate = `${recDate.getFullYear()}-${String(recDate.getMonth() + 1).padStart(
        2,
        '0',
      )}-${String(recDate.getDate()).padStart(2, '0')}`
      return formattedRecDate === dateStr
    })

    const counts = { present: 0, late: 0, absent: 0, half_day: 0 }
    dayRecords.forEach((r) => {
      if (r?.status && counts[r.status] !== undefined) counts[r.status]++
    })
    days.push({ day: d, isCurrentMonth: true, isToday: dateStr === todayStr, counts })
  }
  return days
})

const totalPages = computed(() => Math.ceil(filtered.value.length / perPage))
const paginated = computed(() => {
  const start = (page.value - 1) * perPage
  return filtered.value.slice(start, start + perPage)
})

const calYear = computed(() => {
  const d = new Date()
  d.setMonth(d.getMonth() + calOffset.value)
  return d.getFullYear()
})
const calMonth = computed(() => {
  const d = new Date()
  d.setMonth(d.getMonth() + calOffset.value)
  return d.getMonth()
})
const calMonthLabel = computed(() =>
  new Date(calYear.value, calMonth.value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  }),
)

const formatDate = (d) => {
  if (!d) return '—'
  const dateObj = new Date(d)
  return `${dateObj.toLocaleString('en-US', {
    month: 'short',
  })} ${dateObj.getDate()}, ${dateObj.getFullYear()}`
}

const prevMonth = () => calOffset.value--
const nextMonth = () => calOffset.value++
const resetFilters = () => {
  search.value = ''
  filterDate.value = ''
  filterStatus.value = ''
  filterDept.value = ''
  page.value = 1
}

const openMarkModal = () => {
  Object.assign(markForm, {
    employee_id: '',
    employee_code: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    check_in: '08:00',
    check_out: '17:00',
    notes: '',
  })
  showMarkModal.value = true
}

const updateFormEmployeeCode = () => {
  const emp = employeeStore.employees.find((e) => e.id === markForm.employee_id)
  if (emp) {
    markForm.employee_code = emp.employee_code
  }
}

const exportCSV = () => toast.info('Export feature linked to repository')

const getInitials = (first, last) =>
  ((first?.charAt(0) || '') + (last?.charAt(0) || '')).toUpperCase()
const getAvatarGradient = (name) => {
  const g = [
    'linear-gradient(135deg,#6823ff,#13707f)',
    'linear-gradient(135deg,#a47bff,#40c8da)',
    'linear-gradient(135deg,#f87171,#a47bff)',
    'linear-gradient(135deg,#fbbf24,#f87171)',
    'linear-gradient(135deg,#34d399,#40c8da)',
  ]
  return g[(name?.charCodeAt(0) || 0) % g.length]
}

async function markAtt() {
  if (!markForm.employee_id) {
    toast.error('Please choose an employee')
    return
  }

  attStore.loading = true
  try {
    const response = await api.post('/attendance/check-in', {
      employee_code: markForm.employee_code,
      bypass_selfie: true,
      date: markForm.date,
      status: markForm.status,
      check_in: markForm.check_in,
      check_out: markForm.check_out,
    })

    if (response.data.success) {
      toast.success('Attendance record saved!')
      await attStore.fetchAllAttendance()
      showMarkModal.value = false
    }
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to save attendance record')
  } finally {
    attStore.loading = false
  }
}

onMounted(async () => {
  await attStore.fetchAllAttendance()
  await employeeStore.fetchEmployees()

  console.log('=== CHECK ATTENDANCE DATA FROM BACKEND ===')
  console.log(JSON.parse(JSON.stringify(attStore.attendanceRecords)))
})
</script>
<style scoped>
/* Core Styling Layout Container */
.att-container {
  padding: 2rem;
  background-color: #f8fafc;
  min-height: 100vh;
  font-family:
    'Inter',
    system-ui,
    -apple-system,
    sans-serif;
}

/* Page Header Configurations */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 0.25rem 0;
  display: flex;
  align-items: center;
}

.page-sub {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0;
}

.text-gradient {
  background: linear-gradient(135deg, #6823ff 0%, #0284c7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Header Buttons Configurations */
.header-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-primary,
.btn-outline {
  padding: 0.65rem 1.2rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #6823ff 0%, #5215e6 100%);
  color: #ffffff;
  border: none;
  box-shadow: 0 4px 12px rgba(104, 35, 255, 0.2);
}

.btn-primary:hover {
  box-shadow: 0 6px 16px rgba(104, 35, 255, 0.3);
  transform: translateY(-1px);
}

.btn-outline {
  background: #ffffff;
  color: #334155;
  border: 1px solid #cbd5e1;
}

.btn-outline:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #0f172a;
}

/* White Core Cards System (Replacing Dark Card Styles) */
.dark-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow:
    0 4px 6px -1px rgba(15, 23, 42, 0.03),
    0 2px 4px -1px rgba(15, 23, 42, 0.02);
}

/* Statistics Summary Cards Row */
.summary-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  position: relative;
  box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.02);
  border-left: 4px solid var(--accent);
}

.sum-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  margin-right: 1rem;
}

.sum-content {
  flex-grow: 1;
}

.sum-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.sum-label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.sum-pct {
  font-size: 0.85rem;
  font-weight: 700;
  color: #475569;
  background: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

/* Filter Toolbar Layout Configuration */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.search-wrap {
  position: relative;
  flex-grow: 1;
  min-width: 240px;
}

.search-wrap .si {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.search-inp {
  width: 100%;
  padding: 0.65rem 1rem 0.65rem 2.5rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #0f172a;
  outline: none;
}

.date-inp,
.filter-sel {
  padding: 0.65rem 1rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #0f172a;
  outline: none;
  min-width: 160px;
}

.search-inp:focus,
.date-inp:focus,
.filter-sel:focus {
  border-color: #6823ff;
  box-shadow: 0 0 0 3px rgba(104, 35, 255, 0.12);
}

/* View Mode Toggles */
.view-toggle {
  display: flex;
  background: #f1f5f9;
  padding: 0.25rem;
  border-radius: 8px;
  margin-left: auto;
}

.view-btn {
  background: transparent;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s ease;
}

.view-btn.active {
  background: #ffffff;
  color: #6823ff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* White Corporate Data Table Config */
.table-head-row {
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tbl-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}

.count-badge {
  background: #e2e8f0;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.6rem;
  border-radius: 20px;
}

.table-responsive {
  overflow-x: auto;
}

.dark-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.dark-table th {
  background: #f8fafc;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.dark-table td {
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  font-size: 0.925rem;
}

.att-row:hover td {
  background-color: #f8fafc;
}

/* Table Cell Component Ornaments */
.emp-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.8rem;
}

.emp-name {
  font-weight: 600;
  color: #0f172a;
}

.dept-chip {
  background: #f1f5f9;
  color: #475569;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
}

.time-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #ecfdf5;
  color: #065f46;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.825rem;
  font-weight: 600;
}

.time-badge.out {
  background: #fef2f2;
  color: #991b1b;
}

.na-text {
  color: #94a3b8;
}

/* Global Status Badging Framework */
.status-chip {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: capitalize;
}

.status-present {
  background: #d1fae5;
  color: #065f46;
}
.status-late {
  background: #fef3c7;
  color: #92400e;
}
.status-absent {
  background: #fee2e2;
  color: #991b1b;
}
.status-half_day {
  background: #dbeafe;
  color: #1e40af;
}

/* Pagination Controls Layout */
.pagination-wrap {
  margin-top: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-info {
  color: #64748b;
  font-size: 0.85rem;
}

.page-btns {
  display: flex;
  gap: 0.25rem;
}

.page-btn {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.15s ease;
}

.page-btn:hover:not(:disabled) {
  background: #f1f5f9;
  color: #0f172a;
}

.page-btn.active {
  background: #6823ff;
  border-color: #6823ff;
  color: #ffffff;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Calendar Clean Light View Configurations */
.cal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1.25rem;
}

.cal-month-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.cal-nav {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
}

.cal-nav:hover {
  background: #f1f5f9;
}

.cal-legend {
  display: flex;
  justify-content: center;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.legend-item {
  font-size: 0.8rem;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 500;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #e2e8f0;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.cal-day-label {
  background: #f8fafc;
  color: #475569;
  padding: 0.75rem;
  text-align: center;
  font-size: 0.8rem;
  font-weight: 700;
}

.cal-cell {
  background: #ffffff;
  min-height: 90px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.cal-cell.other-month {
  background: #f8fafc;
}

.cal-cell.other-month .cell-date {
  color: #cbd5e1;
}

.cell-date {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}

.cal-cell.today {
  background: #f0fdf4;
}

.cal-cell.today .cell-date {
  color: #16a34a;
  font-weight: 800;
}

.cell-badges {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-top: 0.5rem;
}

.cal-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
  text-align: center;
}

/* Clean Form Light Modals Backdrop Architecture */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-box {
  background: #ffffff;
  border-radius: 20px;
  width: 100%;
  max-width: 580px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  border: 1px solid #e2e8f0;
  overflow: hidden;
  animation: modalSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalSlide {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-head {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
}

.modal-head h3 {
  margin: 0;
  font-size: 1.15rem;
  color: #0f172a;
  font-weight: 700;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.1rem;
  color: #94a3b8;
  cursor: pointer;
}

.close-btn:hover {
  color: #475569;
}

.modal-form {
  padding: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-field label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
}

.form-field input,
.form-field select {
  padding: 0.65rem 0.85rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #0f172a;
  outline: none;
  font-size: 0.9rem;
}

.form-field input:focus,
.form-field select:focus {
  border-color: #6823ff;
  box-shadow: 0 0 0 3px rgba(104, 35, 255, 0.1);
}

.modal-footer {
  margin-top: 1.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* Loading & Fallback Interface Ornaments */
.loading-row,
.empty-row {
  text-align: center;
  padding: 3rem !important;
  color: #64748b;
}

.pulse-loader {
  width: 24px;
  height: 24px;
  background-color: #6823ff;
  border-radius: 50%;
  margin: 0 auto 0.75rem auto;
  animation: pulseGrid 1.2s infinite ease-in-out;
}

@keyframes pulseGrid {
  0% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
}
</style>
