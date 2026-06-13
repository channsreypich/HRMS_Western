<template>
  <MainLayout>
    <div class="leave-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <VsxIcon iconName="Calendar" :size="18" class="me-2 text-gradient" />Leave Management
          </h1>
          <p class="page-sub">Manage leave requests and approvals</p>
        </div>
        <router-link to="/leave/apply" class="btn-primary">
          <VsxIcon iconName="AddCircle" :size="18" /> Apply for Leave
        </router-link>
      </div>

      <div class="balance-row">
        <div
          class="balance-card"
          v-for="lt in leaveTypes"
          :key="lt.name"
          :style="{ '--c': lt.color }"
        >
          <div class="bal-icon" :style="{ background: lt.color + '12', color: lt.color }">
            <VsxIcon iconName="Airplane" :size="18" />
          </div>
          <div class="bal-info">
            <div class="bal-type">{{ lt.name }}</div>
            <div class="bal-days">{{ lt.max_days }} days/year</div>
          </div>
          <div class="bal-chip" :style="{ background: lt.color + '0d', color: lt.color }">
            {{ lt.carry_forward ? 'Carry fwd' : 'No carry' }}
          </div>
        </div>
      </div>

      <div class="light-card filter-card">
        <div class="tab-row">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            class="tab-btn"
            :class="{ active: activeTab === tab.value }"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
            <span class="tab-count">{{ tabCounts[tab.value] }}</span>
          </button>
        </div>
        <div class="filters-row">
          <div class="search-wrap">
            <VsxIcon iconName="SearchNormal1" :size="18" class="si" />
            <input
              type="text"
              class="search-inp"
              placeholder="Search by employee..."
              v-model="search"
            />
          </div>
          <select class="filter-sel" v-model="filterType">
            <option value="">All Types</option>
            <option value="annual">Annual Leave</option>
            <option value="sick">Sick Leave</option>
            <option value="casual">Casual Leave</option>
            <option value="unpaid">Unpaid Leave</option>
          </select>
          <select class="filter-sel" v-model="sortBy" title="Sort">
            <option value="recent">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Employee A–Z</option>
            <option value="status">Status</option>
            <option value="duration">Duration</option>
          </select>
        </div>
      </div>

      <div class="light-card">
        <div v-if="leaveStore.loading" class="text-center py-5">
          <div
            class="spinner-sm"
            style="width: 30px; height: 30px; border-width: 3px; border-top-color: #4f7cff"
          ></div>
          <p class="mt-2" style="color: #64748b">Loading leave records...</p>
        </div>

        <template v-else>
          <div v-if="filtered.length === 0" class="empty-state">
            <VsxIcon iconName="CalendarRemove" :size="44" />
            <p>No {{ activeTab !== 'all' ? activeTab : '' }} leave requests found</p>
          </div>

          <div class="leave-list" v-else>
            <div class="leave-item" v-for="req in sortedLeaves" :key="req.id">
              <div class="leave-emp">
                <div
                  class="avatar-circle"
                  :style="{ background: getAvatarGradient(req.first_name) }"
                >
                  {{ getInitials(req.first_name, req.last_name) }}
                </div>
                <div class="emp-details">
                  <div class="emp-name">{{ req.first_name }} {{ req.last_name }}</div>
                  <div class="emp-dept">{{ req.department_name || 'General Office' }}</div>
                </div>
              </div>

              <div class="leave-type-col">
                <span
                  class="type-pill"
                  :style="{
                    background: getTypeColor(req.leave_type) + '12',
                    color: getTypeColor(req.leave_type),
                    borderColor: getTypeColor(req.leave_type) + '25',
                  }"
                >
                  {{ getTypeNameFormatted(req.leave_type) }}
                </span>
              </div>

              <div class="leave-dates">
                <div class="date-range">
                  <VsxIcon iconName="Calendar1" :size="18" />
                  {{ formatDate(req.start_date) }}
                </div>
                <div class="date-sep">→</div>
                <div class="date-range">{{ formatDate(req.end_date) }}</div>
                <span class="days-chip"
                  >{{ req.total_days }} day{{ req.total_days > 1 ? 's' : '' }}</span
                >
              </div>

              <div class="leave-reason" :title="req.reason">{{ req.reason }}</div>

              <div class="applied-on">
                <div class="applied-label">Applied ID</div>
                <div class="applied-date">#LEAVE-{{ req.id }}</div>
              </div>

              <div class="status-col">
                <span class="status-badge" :class="'status-' + req.status">
                  <VsxIcon :iconName="statusIcon(req.status)" :size="16" /> {{ req.status }}
                </span>
              </div>

              <div class="leave-actions" v-if="req.status === 'pending'">
                <button
                  class="btn-approve"
                  @click="updateStatus(req.id, 'approved')"
                  title="Approve"
                >
                  <VsxIcon iconName="TickCircle" :size="18" />
                </button>
                <button class="btn-reject" @click="updateStatus(req.id, 'rejected')" title="Reject">
                  <VsxIcon iconName="CloseCircle" :size="18" />
                </button>
              </div>
              <div class="leave-actions" v-else>
                <button class="btn-delete" @click="deleteRecord(req.id)" title="Delete Record">
                  <VsxIcon iconName="Trash" :size="18" />
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
  { name: 'Annual Leave', value: 'annual', color: '#4f7cff', max_days: 18, carry_forward: true },
  { name: 'Sick Leave', value: 'sick', color: '#0284c7', max_days: 7, carry_forward: false },
  { name: 'Casual Leave', value: 'casual', color: '#d97706', max_days: 5, carry_forward: false },
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
    pending: list.filter((r) => r.status === 'pending').length,
    approved: list.filter((r) => r.status === 'approved').length,
    rejected: list.filter((r) => r.status === 'rejected').length,
  }
})

const filtered = computed(() => {
  const list = leaveStore.leaves || []
  return list.filter((r) => {
    const q = search.value.toLowerCase()
    const fullName = `${r.first_name || ''} ${r.last_name || ''}`.toLowerCase()
    const matchSearch = !search.value || fullName.includes(q)
    const matchTab = activeTab.value === 'all' || r.status === activeTab.value
    const matchType =
      !filterType.value || String(r.leave_type).toLowerCase() === filterType.value.toLowerCase()
    return matchSearch && matchTab && matchType
  })
})

const sortBy = ref('recent')
const sortedLeaves = computed(() => {
  const list = [...filtered.value]
  const name = (r) => `${r.first_name || ''} ${r.last_name || ''}`.trim().toLowerCase()
  const day = (r) => new Date(r.start_date || 0).getTime() || 0
  switch (sortBy.value) {
    case 'oldest':
      return list.sort((a, b) => day(a) - day(b))
    case 'name':
      return list.sort((a, b) => name(a).localeCompare(name(b)))
    case 'status':
      return list.sort((a, b) => String(a.status).localeCompare(String(b.status)))
    case 'duration':
      return list.sort((a, b) => (b.duration_days || 0) - (a.duration_days || 0))
    case 'recent':
    default:
      return list.sort((a, b) => day(b) - day(a))
  }
})

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const statusIcon = (s) =>
  ({
    pending: 'Timer',
    approved: 'TickCircle',
    rejected: 'CloseCircle',
  })[s] || ''
const getInitials = (first, last) =>
  ((first?.charAt(0) || '') + (last?.charAt(0) || '')).toUpperCase()
const getAvatarGradient = (name) => {
  const g = [
    'linear-gradient(135deg, #4f7cff, #3b62d4)',
    'linear-gradient(135deg, #0284c7, #0369a1)',
    'linear-gradient(135deg, #e11d48, #be123c)',
    'linear-gradient(135deg, #d97706, #b45309)',
    'linear-gradient(135deg, #16a34a, #15803d)',
  ]
  return g[(name?.charCodeAt(0) || 0) % g.length]
}

const getTypeColor = (type) => {
  const colors = { annual: '#4f7cff', sick: '#0284c7', casual: '#d97706', unpaid: '#ea580c' }
  return colors[String(type).toLowerCase()] || '#4f7cff'
}

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
  if (confirm('Are you sure you want to delete this leave record?')) {
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
/* Structural Canvas Frame */
.leave-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background-color: #f8fafc;
  min-height: 100vh;
  font-family:
    'Plus Jakarta Sans',
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
  background: linear-gradient(135deg, var(--accent), #0284c7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0.65rem 1.25rem;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(var(--accent-rgb), 0.25);
  text-decoration: none;
}
.btn-primary:hover {
  box-shadow: 0 6px 18px rgba(var(--accent-rgb), 0.35);
  transform: translateY(-1px);
}

/* Leave Balance Cards Matrix */
.balance-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
}
.balance-card {
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
.balance-card:hover {
  border-color: var(--c);
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.05);
}
.bal-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}
.bal-info {
  flex: 1;
}
.bal-type {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
}
.bal-days {
  font-size: 0.775rem;
  color: #64748b;
  margin-top: 2px;
  font-weight: 500;
}
.bal-chip {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;
}

/* Control Filtration & Filter Card Panels */
.light-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow:
    0 4px 6px -1px rgba(15, 23, 42, 0.02),
    0 2px 4px -1px rgba(15, 23, 42, 0.01);
}
.filter-card {
  padding: 1.25rem;
}
.tab-row {
  display: flex;
  gap: 6px;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}
.tab-btn {
  padding: 0.5rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}
.tab-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
  border-color: #cbd5e1;
}
.tab-btn.active {
  background: #eeebff;
  border-color: rgba(var(--accent-rgb), 0.25);
  color: var(--accent);
}
.tab-count {
  background: #ffffff;
  color: #64748b;
  padding: 1px 7px;
  border-radius: 8px;
  font-size: 0.725rem;
  font-weight: 700;
  border: 1px solid #e2e8f0;
}
.tab-btn.active .tab-count {
  background: var(--accent);
  color: #ffffff;
  border-color: var(--accent);
}

.filters-row {
  display: flex;
  gap: 0.85rem;
  align-items: center;
  flex-wrap: wrap;
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
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.1);
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
  border-color: var(--accent);
}

/* Leave Management Request Registry Table/List */
.leave-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.leave-item {
  display: grid;
  grid-template-columns: 200px 150px 1.1fr 1fr 110px 135px 80px;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  transition: all 0.2s ease;
}
.leave-item:hover {
  background: #fdfdfd;
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.02);
}

.leave-emp {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
}
.avatar-circle {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}
.emp-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.emp-dept {
  font-size: 0.775rem;
  color: #64748b;
  margin-top: 2px;
  font-weight: 500;
}

.type-pill {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.775rem;
  font-weight: 700;
  border: 1px solid transparent;
  text-align: center;
}

.leave-dates {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.date-range {
  font-size: 0.85rem;
  color: #334155;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}
.date-range :deep(svg) {
  color: #94a3b8;
}
.date-sep {
  color: #cbd5e1;
  font-weight: 400;
}
.days-chip {
  padding: 2px 8px;
  background: #eeebff;
  color: var(--accent);
  border-radius: 8px;
  font-size: 0.725rem;
  font-weight: 700;
  border: 1px solid rgba(var(--accent-rgb), 0.1);
}

.leave-reason {
  font-size: 0.85rem;
  color: #475569;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
}

.applied-label {
  font-size: 0.675rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}
.applied-date {
  font-size: 0.8rem;
  color: #475569;
  margin-top: 2px;
  font-weight: 600;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.775rem;
  font-weight: 700;
  text-transform: capitalize;
}
.status-pending {
  background: #fef3c7;
  color: #d97706;
}
.status-approved {
  background: #dcfce7;
  color: #16a34a;
}
.status-rejected {
  background: #fee2e2;
  color: #dc2626;
}

/* Action Triggers Framework */
.leave-actions {
  display: flex;
  gap: 6px;
}
.btn-approve {
  width: 34px;
  height: 34px;
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  color: #15803d;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  transition: all 0.2s;
}
.btn-approve:hover {
  background: #bbf7d0;
  color: #166534;
}
.btn-reject {
  width: 34px;
  height: 34px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #b91c1c;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  transition: all 0.2s;
}
.btn-reject:hover {
  background: #fecaca;
  color: #991b1b;
}
.btn-delete {
  width: 34px;
  height: 34px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  transition: all 0.2s;
}
.btn-delete:hover {
  background: #fee2e2;
  border-color: #fecaca;
  color: #dc2626;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.empty-state :deep(svg) {
  color: #cbd5e1;
}
.empty-state p {
  font-size: 0.95rem;
  font-weight: 500;
  color: #64748b;
  margin: 0;
}

.spinner-sm {
  border: 2px solid #e2e8f0;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
.mt-2 {
  margin-top: 0.5rem;
}
.py-5 {
  padding-top: 3rem;
  padding-bottom: 3rem;
}
.text-center {
  text-align: center;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* System Responsiveness Controls */
@media (max-width: 1200px) {
  .leave-item {
    grid-template-columns: 180px 130px 1.2fr 90px 100px;
  }
  .leave-reason,
  .applied-on {
    display: none;
  }
}
@media (max-width: 768px) {
  .leave-item {
    grid-template-columns: 1fr 1fr;
    row-gap: 0.75rem;
    padding: 1.25rem;
  }
  .leave-dates,
  .status-col,
  .leave-actions {
    grid-column: span 2;
  }
}
</style>
