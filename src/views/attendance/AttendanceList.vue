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
        '0'
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
  })
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
  
  console.log("=== CHECK ATTENDANCE DATA FROM BACKEND ===")
  console.log(JSON.parse(JSON.stringify(attStore.attendanceRecords)))
})
</script>
<style scoped>
.att-container {
  padding: 1.5rem;
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.92);
  margin: 0 0 0.3rem;
}
.page-sub {
  font-size: 0.83rem;
  color: rgba(255, 255, 255, 0.35);
  margin: 0;
}
.text-gradient {
  background: linear-gradient(135deg, #a47bff, #40c8da);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.header-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #6823ff, #4f0fdb);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 20px rgba(104, 35, 255, 0.35);
}
.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0.55rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 9px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.83rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-outline:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Summary */
.summary-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}
.summary-card {
  background: #0d0d1a;
  border: 1px solid rgba(104, 35, 255, 0.13);
  border-radius: 16px;
  padding: 1.1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  transition: all 0.25s;
}
.summary-card:hover {
  border-color: var(--accent, #6823ff);
  transform: translateY(-2px);
}
.sum-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}
.sum-content {
  flex: 1;
}
.sum-value {
  font-size: 1.6rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1;
}
.sum-label {
  font-size: 0.73rem;
  color: rgba(255, 255, 255, 0.35);
  margin-top: 3px;
}
.sum-pct {
  font-size: 0.78rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.3);
}

/* Toolbar */
.dark-card {
  background: #0d0d1a;
  border: 1px solid rgba(104, 35, 255, 0.13);
  border-radius: 18px;
  padding: 1.5rem;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 1rem 1.25rem;
}
.search-wrap {
  position: relative;
  flex: 1;
  min-width: 180px;
}
.si {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.82rem;
}
.search-inp {
  width: 100%;
  padding: 0.6rem 1rem 0.6rem 2.2rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 9px;
  color: white;
  font-size: 0.83rem;
  outline: none;
}
.search-inp:focus {
  border-color: rgba(104, 35, 255, 0.5);
}
.search-inp::placeholder {
  color: rgba(255, 255, 255, 0.25);
}
.date-inp {
  padding: 0.58rem 0.9rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 9px;
  color: white;
  font-size: 0.82rem;
  outline: none;
  cursor: pointer;
}
.date-inp:focus {
  border-color: rgba(104, 35, 255, 0.5);
}
.filter-sel {
  padding: 0.58rem 0.9rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 9px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.82rem;
  outline: none;
  cursor: pointer;
}
.filter-sel option {
  background: #1a1a2e;
}
.view-toggle {
  display: flex;
  gap: 4px;
}
.view-btn {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.view-btn.active {
  background: rgba(104, 35, 255, 0.25);
  color: #a47bff;
  border-color: rgba(104, 35, 255, 0.4);
}

/* Table */
.table-head-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.tbl-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.8);
}
.count-badge {
  background: rgba(104, 35, 255, 0.15);
  color: #a47bff;
  padding: 2px 9px;
  border-radius: 12px;
  font-size: 0.72rem;
  font-weight: 700;
}
.ms-2 {
  margin-left: 0.5rem;
}
.table-responsive {
  overflow-x: auto;
}
.dark-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.dark-table th {
  padding: 0.65rem 0.9rem;
  text-align: left;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.25);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.dark-table td {
  padding: 0.75rem 0.9rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.6);
  vertical-align: middle;
}
.dark-table tbody tr:hover td {
  background: rgba(104, 35, 255, 0.05);
}
.dark-table tbody tr:last-child td {
  border-bottom: none;
}

.emp-cell {
  display: flex;
  align-items: center;
  gap: 9px;
}
.avatar-sm {
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, #6823ff, #13707f);
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}
.emp-name {
  font-size: 0.83rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
}
.dept-chip {
  padding: 2px 8px;
  background: rgba(64, 200, 218, 0.1);
  color: #40c8da;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}
.time-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.78rem;
  color: rgba(52, 211, 153, 0.9);
  font-weight: 600;
}
.time-badge.out {
  color: rgba(248, 113, 113, 0.85);
}
.time-badge i {
  font-size: 0.7rem;
}
.na-text {
  color: rgba(255, 255, 255, 0.2);
}
.status-chip {
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: capitalize;
}
.status-present {
  background: rgba(52, 211, 153, 0.12);
  color: #34d399;
}
.status-late {
  background: rgba(251, 191, 36, 0.12);
  color: #fbbf24;
}
.status-absent {
  background: rgba(248, 113, 113, 0.12);
  color: #f87171;
}
.status-leave {
  background: rgba(96, 165, 250, 0.12);
  color: #60a5fa;
}

.loading-row,
.empty-row {
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.3);
}
.pulse-loader {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(104, 35, 255, 0.3);
  border-top-color: #a47bff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 0.5rem;
}

/* Pagination */
.pagination-wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.page-info {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.35);
}
.page-btns {
  display: flex;
  gap: 4px;
}
.page-btn {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 7px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  font-size: 0.78rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.page-btn:hover:not(:disabled) {
  background: rgba(104, 35, 255, 0.2);
  color: #a47bff;
}
.page-btn.active {
  background: rgba(104, 35, 255, 0.3);
  color: #c5a3ff;
  border-color: rgba(104, 35, 255, 0.4);
}
.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Calendar */
.cal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
}
.cal-month-title {
  font-size: 1rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}
.cal-nav {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  transition: all 0.2s;
}
.cal-nav:hover {
  background: rgba(104, 35, 255, 0.2);
  color: #a47bff;
}
.cal-legend {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.45);
}
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.cal-day-label {
  text-align: center;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.25);
  padding: 0.5rem 0;
}
.cal-cell {
  min-height: 80px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 0.5rem;
  transition: all 0.2s;
}
.cal-cell:hover {
  background: rgba(104, 35, 255, 0.07);
  border-color: rgba(104, 35, 255, 0.2);
}
.cal-cell.today {
  border-color: rgba(104, 35, 255, 0.5);
  background: rgba(104, 35, 255, 0.08);
}
.cal-cell.other-month {
  opacity: 0.3;
}
.cell-date {
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 4px;
}
.cal-cell.today .cell-date {
  color: #a47bff;
}
.cell-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}
.cal-badge {
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 0.62rem;
  font-weight: 700;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}
.modal-box {
  background: #0f0f20;
  border: 1px solid rgba(104, 35, 255, 0.2);
  border-radius: 20px;
  width: 100%;
  max-width: 560px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
  animation: modalIn 0.25s ease;
}
.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.modal-head h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
}
.close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  font-size: 1rem;
  padding: 4px;
  transition: color 0.2s;
}
.close-btn:hover {
  color: rgba(255, 255, 255, 0.8);
}
.modal-form {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.form-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.form-field label {
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
}
.form-field input,
.form-field select {
  padding: 0.6rem 0.9rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 9px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.83rem;
  outline: none;
}
.form-field input:focus,
.form-field select:focus {
  border-color: rgba(104, 35, 255, 0.5);
  background: rgba(104, 35, 255, 0.07);
}
.form-field select option {
  background: #1a1a2e;
}
.modal-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.spinner-sm {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
  margin-right: 6px;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
