<template>
  <MainLayout>
    <div class="leave-container">

      <div class="page-header">
        <div>
          <h1 class="page-title"><i class="fas fa-calendar-alt me-2 text-gradient"></i>Leave Management</h1>
          <p class="page-sub">Manage leave requests and approvals</p>
        </div>
        <router-link to="/leave/apply" class="btn-primary">
          <i class="fas fa-plus-circle"></i> Apply for Leave
        </router-link>
      </div>

      <div class="balance-row">
        <div class="balance-card" v-for="lt in leaveTypes" :key="lt.name" :style="{ '--c': lt.color }">
          <div class="bal-icon" :style="{ background: lt.color + '20', color: lt.color }">
            <i class="fas fa-umbrella-beach"></i>
          </div>
          <div class="bal-info">
            <div class="bal-type">{{ lt.name }}</div>
            <div class="bal-days">{{ lt.max_days }} days/year</div>
          </div>
          <div class="bal-chip" :style="{ background: lt.color + '18', color: lt.color }">
            {{ lt.carry_forward ? 'Carry fwd' : 'No carry' }}
          </div>
        </div>
      </div>

      <div class="dark-card filter-card">
        <div class="tab-row">
          <button v-for="tab in tabs" :key="tab.value" class="tab-btn" :class="{ active: activeTab === tab.value }" @click="activeTab = tab.value">
            {{ tab.label }}
            <span class="tab-count">{{ tabCounts[tab.value] }}</span>
          </button>
        </div>
        <div class="filters-row">
          <div class="search-wrap">
            <i class="fas fa-search si"></i>
            <input type="text" class="search-inp" placeholder="Search by employee..." v-model="search" />
          </div>
          <select class="filter-sel" v-model="filterType">
            <option value="">All Types</option>
            <option value="annual">Annual Leave</option>
            <option value="sick">Sick Leave</option>
            <option value="casual">Casual Leave</option>
            <option value="unpaid">Unpaid Leave</option>
          </select>
        </div>
      </div>

      <div class="dark-card">
        
        <div v-if="leaveStore.loading" class="text-center py-5">
          <div class="spinner-sm" style="width:30px; height:30px; border-width:3px; border-top-color:#6823ff;"></div>
          <p class="mt-2" style="color:rgba(255,255,255,0.3)">Loading leave records...</p>
        </div>

        <template v-else>
          <div v-if="filtered.length === 0" class="empty-state">
            <i class="fas fa-calendar-times fa-3x"></i>
            <p>No {{ activeTab !== 'all' ? activeTab : '' }} leave requests found</p>
          </div>

          <div class="leave-list" v-else>
            <div class="leave-item" v-for="req in filtered" :key="req.id">
              
              <div class="leave-emp">
                <div class="avatar-circle" :style="{ background: getAvatarGradient(req.first_name) }">
                  {{ getInitials(req.first_name, req.last_name) }}
                </div>
                <div class="emp-details">
                  <div class="emp-name">{{ req.first_name }} {{ req.last_name }}</div>
                  <div class="emp-dept">{{ req.department_name || 'General Office' }}</div>
                </div>
              </div>

              <div class="leave-type-col">
                <span class="type-pill" :style="{ background: getTypeColor(req.leave_type) + '18', color: getTypeColor(req.leave_type), borderColor: getTypeColor(req.leave_type) + '35' }">
                  {{ getTypeNameFormatted(req.leave_type) }}
                </span>
              </div>

              <div class="leave-dates">
                <div class="date-range">
                  <i class="fas fa-calendar-day"></i>
                  {{ formatDate(req.start_date) }}
                </div>
                <div class="date-sep">→</div>
                <div class="date-range">{{ formatDate(req.end_date) }}</div>
                <span class="days-chip">{{ req.total_days }} day{{ req.total_days > 1 ? 's' : '' }}</span>
              </div>

              <div class="leave-reason" :title="req.reason">{{ req.reason }}</div>

              <div class="applied-on">
                <div class="applied-label">Applied ID</div>
                <div class="applied-date">#LEAVE-{{ req.id }}</div>
              </div>

              <div class="status-col">
                <span class="status-badge" :class="'status-' + req.status">
                  <i :class="statusIcon(req.status)"></i> {{ req.status }}
                </span>
              </div>

              <div class="leave-actions" v-if="req.status === 'pending'">
                <button class="btn-approve" @click="updateStatus(req.id, 'approved')" title="Approve">
                  <i class="fas fa-check"></i>
                </button>
                <button class="btn-reject" @click="updateStatus(req.id, 'rejected')" title="Reject">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <div class="leave-actions" v-else>
                <button class="btn-reject" @click="deleteRecord(req.id)" title="Delete Record" style="background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.05); color: rgba(255,255,255,0.25);">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>

            </div>
          </div>
        </template>

      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '@/components/layouts/MainLayout.vue'
import { useLeaveStore } from '@/stores/leave'
import { toast } from 'vue3-toastify'

const leaveStore = useLeaveStore()
const activeTab = ref('all')
const search = ref('')
const filterType = ref('')

const leaveTypes = ref([
  { name: 'Annual Leave', value: 'annual', color: '#6823ff', max_days: 18, carry_forward: true },
  { name: 'Sick Leave', value: 'sick', color: '#40c8da', max_days: 7, carry_forward: false },
  { name: 'Casual Leave', value: 'casual', color: '#fbbf24', max_days: 5, carry_forward: false }
])

const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

const tabCounts = computed(() => {
  const list = leaveStore.leaves || []
  return {
    all: list.length,
    pending: list.filter(r => r.status === 'pending').length,
    approved: list.filter(r => r.status === 'approved').length,
    rejected: list.filter(r => r.status === 'rejected').length,
  }
})

const filtered = computed(() => {
  const list = leaveStore.leaves || []
  return list.filter(r => {
    const q = search.value.toLowerCase()
    const fullName = `${r.first_name || ''} ${r.last_name || ''}`.toLowerCase()
    const matchSearch = !search.value || fullName.includes(q)
    const matchTab = activeTab.value === 'all' || r.status === activeTab.value
    
    // កែលក្ខខណ្ឌ Filter Type ត្រូវនឹងតម្លៃអក្សរតូចរបស់ Database
    const matchType = !filterType.value || String(r.leave_type).toLowerCase() === filterType.value.toLowerCase()
    return matchSearch && matchTab && matchType
  })
})

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const statusIcon = (s) => ({ pending: 'fas fa-hourglass-half', approved: 'fas fa-check-circle', rejected: 'fas fa-times-circle' })[s] || ''
const getInitials = (first, last) => ((first?.charAt(0) || '') + (last?.charAt(0) || '')).toUpperCase()
const getAvatarGradient = (name) => {
  const g = ['linear-gradient(135deg,#6823ff,#13707f)','linear-gradient(135deg,#a47bff,#40c8da)','linear-gradient(135deg,#f87171,#a47bff)','linear-gradient(135deg,#fbbf24,#f87171)','linear-gradient(135deg,#34d399,#40c8da)']
  return g[(name?.charCodeAt(0) || 0) % g.length]
}

// 💡 ២. មុខងារកំណត់ពណ៌ Chip តាមប្រភេទអក្សរតូចមកពី MySQL
const getTypeColor = (type) => {
  const colors = { annual: '#6823ff', sick: '#40c8da', casual: '#fbbf24', unpaid: '#f87171' }
  return colors[String(type).toLowerCase()] || '#a47bff'
}

// 💡 ៣. មុខងារបំប្លែងទម្រង់អក្សរឱ្យមកជាឈ្មោះពេញៗលើ UI វិញ
const getTypeNameFormatted = (type) => {
  if (!type) return '—'
  const t = String(type).toLowerCase()
  if (t === 'annual') return 'Annual Leave'
  if (t === 'sick') return 'Sick Leave'
  if (t === 'casual') return 'Casual Leave'
  if (t === 'unpaid') return 'Unpaid Leave'
  return type
}

async function updateStatus(id, newStatus) {
  const res = await leaveStore.updateLeaveRequest(id, { status: newStatus })
  if (res?.success) {
    toast.success(`Leave request ${newStatus} successfully!`)
  } else {
    toast.error(leaveStore.error || 'Failed to update status')
  }
}

async function deleteRecord(id) {
  if (confirm("Are you sure you want to delete this leave record?")) {
    const res = await leaveStore.deleteLeaveRecord(id)
    if (res?.success) toast.success('Leave record removed')
    else toast.error('Delete failed')
  }
}

onMounted(() => {
  leaveStore.fetchAllLeaves()
})
</script>
<style scoped>
.leave-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.25rem; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; }
.page-title { font-size: 1.6rem; font-weight: 700; color: rgba(255,255,255,0.92); margin: 0 0 0.3rem; }
.page-sub { font-size: 0.83rem; color: rgba(255,255,255,0.35); margin: 0; }
.text-gradient { background: linear-gradient(135deg, #a47bff, #40c8da); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.btn-primary { display: inline-flex; align-items: center; gap: 7px; padding: 0.6rem 1.2rem; background: linear-gradient(135deg, #6823ff, #4f0fdb); border: none; border-radius: 10px; color: white; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(104,35,255,0.35); text-decoration: none; }
.btn-primary:hover { opacity: 0.9; }

/* Balance cards */
.balance-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
.balance-card {
  background: #0d0d1a; border: 1px solid rgba(104,35,255,0.13);
  border-radius: 16px; padding: 1rem 1.25rem;
  display: flex; align-items: center; gap: 0.85rem;
  transition: all 0.25s;
}
.balance-card:hover { border-color: var(--c); }
.bal-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; }
.bal-info { flex: 1; }
.bal-type { font-size: 0.83rem; font-weight: 600; color: rgba(255,255,255,0.85); }
.bal-days { font-size: 0.72rem; color: rgba(255,255,255,0.35); margin-top: 2px; }
.bal-chip { padding: 2px 8px; border-radius: 20px; font-size: 0.65rem; font-weight: 700; white-space: nowrap; }

/* Filter card */
.dark-card { background: #0d0d1a; border: 1px solid rgba(104,35,255,0.13); border-radius: 18px; padding: 1.5rem; }
.filter-card { padding: 1rem 1.25rem; }
.tab-row { display: flex; gap: 4px; margin-bottom: 1rem; flex-wrap: wrap; }
.tab-btn { padding: 0.5rem 1rem; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 9px; color: rgba(255,255,255,0.45); font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
.tab-btn:hover { background: rgba(104,35,255,0.12); color: rgba(255,255,255,0.7); }
.tab-btn.active { background: rgba(104,35,255,0.2); border-color: rgba(104,35,255,0.4); color: #c5a3ff; }
.tab-count { background: rgba(104,35,255,0.25); color: #a47bff; padding: 0 6px; border-radius: 10px; font-size: 0.68rem; }
.filters-row { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
.search-wrap { position: relative; flex: 1; min-width: 200px; }
.si { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.3); font-size: 0.82rem; }
.search-inp { width: 100%; padding: 0.58rem 1rem 0.58rem 2.2rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 9px; color: white; font-size: 0.82rem; outline: none; }
.search-inp::placeholder { color: rgba(255,255,255,0.25); }
.search-inp:focus { border-color: rgba(104,35,255,0.5); }
.filter-sel { padding: 0.58rem 0.9rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 9px; color: rgba(255,255,255,0.7); font-size: 0.82rem; outline: none; cursor: pointer; }
.filter-sel option { background: #1a1a2e; }

/* Leave list */
.leave-list { display: flex; flex-direction: column; gap: 0.6rem; }
.leave-item {
  display: grid;
  grid-template-columns: 180px 160px 1fr 1fr 100px 120px 80px;
  align-items: center; gap: 1rem;
  padding: 1rem 1.1rem;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px;
  transition: all 0.2s;
}
.leave-item:hover { background: rgba(104,35,255,0.06); border-color: rgba(104,35,255,0.2); }

.leave-emp { display: flex; align-items: center; gap: 10px; overflow: hidden; }
.avatar-circle { width: 36px; height: 36px; background: linear-gradient(135deg, #6823ff, #13707f); border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: white; flex-shrink: 0; }
.emp-name { font-size: 0.83rem; font-weight: 600; color: rgba(255,255,255,0.85); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.emp-dept { font-size: 0.7rem; color: rgba(255,255,255,0.35); margin-top: 1px; }

.type-pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.73rem; font-weight: 700; border: 1px solid transparent; }

.leave-dates { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.date-range { font-size: 0.78rem; color: rgba(255,255,255,0.6); display: flex; align-items: center; gap: 5px; }
.date-range i { color: rgba(255,255,255,0.25); font-size: 0.7rem; }
.date-sep { color: rgba(255,255,255,0.25); }
.days-chip { padding: 2px 7px; background: rgba(104,35,255,0.15); color: #a47bff; border-radius: 10px; font-size: 0.68rem; font-weight: 700; }

.leave-reason { font-size: 0.78rem; color: rgba(255,255,255,0.45); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.applied-on {}
.applied-label { font-size: 0.65rem; color: rgba(255,255,255,0.25); text-transform: uppercase; letter-spacing: 0.5px; }
.applied-date { font-size: 0.78rem; color: rgba(255,255,255,0.55); margin-top: 2px; }

.status-col {}
.status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; text-transform: capitalize; }
.status-pending { background: rgba(251,191,36,0.12); color: #fbbf24; }
.status-approved { background: rgba(52,211,153,0.12); color: #34d399; }
.status-rejected { background: rgba(248,113,113,0.12); color: #f87171; }
.approved-by { font-size: 0.65rem; color: rgba(255,255,255,0.25); margin-top: 3px; }

.leave-actions { display: flex; gap: 5px; }
.btn-approve { width: 32px; height: 32px; background: rgba(52,211,153,0.12); border: 1px solid rgba(52,211,153,0.25); border-radius: 8px; color: #34d399; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.82rem; transition: all 0.2s; }
.btn-approve:hover { background: rgba(52,211,153,0.25); }
.btn-reject { width: 32px; height: 32px; background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.25); border-radius: 8px; color: #f87171; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.82rem; transition: all 0.2s; }
.btn-reject:hover { background: rgba(248,113,113,0.2); }

.empty-state { text-align: center; padding: 3rem; color: rgba(255,255,255,0.3); display: flex; flex-direction: column; align-items: center; gap: 1rem; }
.empty-state i { opacity: 0.3; }

@media (max-width: 1100px) {
  .leave-item { grid-template-columns: 160px 140px 1fr 80px 70px; }
  .leave-reason, .applied-on { display: none; }
}
@media (max-width: 768px) {
  .leave-item { grid-template-columns: 1fr 1fr; row-gap: 0.5rem; }
  .leave-dates, .status-col, .leave-actions { grid-column: span 2; }
}
</style>
