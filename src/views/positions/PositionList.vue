<template>
  <MainLayout>
    <div class="pos-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <VsxIcon iconName="Briefcase" :size="18" class="me-2 text-gradient" />Positions
          </h1>
          <p class="page-sub">Manage job titles and base salary ranges</p>
        </div>
        <button class="btn-primary" @click="openCreate">
          <VsxIcon iconName="AddCircle" :size="18" /> Add Position
        </button>
      </div>

      <div class="stats-row">
        <div class="stat-pill" v-for="s in stats" :key="s.label">
          <VsxIcon :iconName="s.icon" :size="22" :style="{ color: s.color }" />
          <div>
            <div class="stat-num">{{ s.value }}</div>
            <div class="stat-lbl">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <div class="light-card toolbar">
        <div class="search-wrap">
          <VsxIcon iconName="SearchNormal1" :size="18" class="si" />
          <input
            type="text"
            class="search-inp"
            placeholder="Search positions by title..."
            v-model="search"
          />
        </div>
        <div class="toolbar-right">
          <div class="view-toggle">
            <button :class="['view-btn', { active: viewMode === 'grid' }]" @click="viewMode = 'grid'" title="Card view">
              <VsxIcon iconName="Category" :size="18" />
            </button>
            <button :class="['view-btn', { active: viewMode === 'table' }]" @click="viewMode = 'table'" title="Table view">
              <VsxIcon iconName="TaskSquare" :size="18" />
            </button>
          </div>
          <button class="btn-outline" @click="search = ''">
            <VsxIcon iconName="Refresh2" :size="18" /> Reset
          </button>
        </div>
      </div>

      <!-- KPI card view -->
      <div v-if="viewMode === 'grid'" class="pos-grid">
        <div v-if="positionStore.loading" class="empty-row w-100">Loading positions...</div>
        <div v-else-if="filtered.length === 0" class="empty-state">
          <VsxIcon iconName="Briefcase" :size="44" />
          <p>No positions found</p>
          <button class="btn-primary btn-sm" @click="openCreate">Add Position</button>
        </div>
        <div class="kpi-card" v-for="pos in sortedPos" :key="pos.id">
          <div class="kpi-bar" :style="{ background: pos.dept_color || '#4f7cff' }"></div>
          <div class="kpi-top">
            <div
              class="kpi-icon"
              :style="{ background: (pos.dept_color || '#4f7cff') + '18', color: pos.dept_color || '#4f7cff' }"
            >
              <VsxIcon iconName="Briefcase" :size="22" type="bold" />
            </div>
            <div class="kpi-actions">
              <button class="btn-icon" @click="openEdit(pos)" title="Edit">
                <VsxIcon iconName="Edit2" :size="16" />
              </button>
              <button class="btn-icon danger" @click="confirmDelete(pos)" title="Delete">
                <VsxIcon iconName="Trash" :size="16" />
              </button>
            </div>
          </div>
          <div class="kpi-value">${{ formatNum(pos.base_salary) }}</div>
          <div class="kpi-metric-label">Base Salary / mo</div>
          <h3 class="kpi-name">{{ pos.title }}</h3>
          <div class="kpi-foot">
            <span
              class="code-chip"
              :style="{ color: pos.dept_color || '#4f7cff', background: (pos.dept_color || '#4f7cff') + '14' }"
            >
              {{ pos.department_name || 'Unassigned' }}
            </span>
            <span class="kpi-members">{{ holderCount(pos) }} staff</span>
          </div>
        </div>
      </div>

      <div v-else class="light-card">
        <div class="table-head-row">
          <div>
            <h5 class="tbl-title">Position Directory</h5>
            <span class="count-badge">{{ filtered.length }} positions</span>
          </div>
          <button class="btn-icon" @click="positionStore.fetchPositions()">
            <VsxIcon iconName="Refresh2" :size="18" />
          </button>
        </div>
        <div class="table-responsive">
          <table class="light-table">
            <thead>
              <tr>
                <th># ID</th>
                <th class="sortable" @click="toggle('title')">
                  Position Title <VsxIcon :iconName="sortIcon('title')" :size="14" class="sort-ic" />
                </th>
                <th class="sortable" @click="toggle('department_name')">
                  Department
                  <VsxIcon :iconName="sortIcon('department_name')" :size="14" class="sort-ic" />
                </th>
                <th class="sortable" @click="toggle('base_salary')">
                  Base Salary
                  <VsxIcon :iconName="sortIcon('base_salary')" :size="14" class="sort-ic" />
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="positionStore.loading">
                <td colspan="6" class="loading-row">
                  <div class="pulse-loader"></div>
                  Loading positions...
                </td>
              </tr>
              <tr v-else-if="filtered.length === 0">
                <td colspan="6" class="empty-row">
                  <VsxIcon iconName="Briefcase" :size="28" /><br />No positions found
                </td>
              </tr>
              <tr v-for="pos in sortedPos" :key="pos.id" class="pos-row">
                <td>
                  <span class="row-num">#{{ pos.id }}</span>
                </td>
                <td>
                  <div class="pos-info">
                    <div
                      class="pos-icon-wrap"
                      :style="{
                        background: (pos.dept_color || '#4f7cff') + '12',
                        color: pos.dept_color || '#4f7cff',
                      }"
                    >
                      <VsxIcon iconName="Briefcase" :size="18" />
                    </div>
                    <div>
                      <div class="pos-title-text">{{ pos.title }}</div>
                      <div class="pos-desc">Standard corporate rank within the organization.</div>
                    </div>
                  </div>
                </td>

                <td>
                  <span
                    class="code-badge"
                    :style="{
                      color: pos.dept_color || '#4f7cff',
                      borderColor: (pos.dept_color || '#4f7cff') + '30',
                      background: (pos.dept_color || '#4f7cff') + '08',
                    }"
                  >
                    <VsxIcon iconName="Building" :size="18" class="me-1" />{{
                      pos.department_name || 'Unassigned'
                    }}
                  </span>
                </td>

                <td>
                  <div class="salary-range">
                    <span class="sal-max" style="color: #16a34a; font-weight: 700"
                      >${{ formatNum(pos.base_salary) }}</span
                    >
                  </div>
                </td>
                <td><span class="status-badge badge-active">active</span></td>
                <td>
                  <div class="action-buttons">
                    <button class="btn-icon" @click="openEdit(pos)" title="Edit">
                      <VsxIcon iconName="Edit2" :size="18" />
                    </button>
                    <button class="btn-icon danger" @click="confirmDelete(pos)" title="Delete">
                      <VsxIcon iconName="Trash" :size="18" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="modal-box">
        <div class="modal-head">
          <h3>{{ editingPos ? 'Edit Position' : 'Add Position' }}</h3>
          <button class="close-btn" @click="showModal = false">
            <VsxIcon iconName="CloseCircle" :size="18" />
          </button>
        </div>
        <form @submit.prevent="savePos" class="modal-form">
          <div class="form-row">
            <div class="form-field">
              <label>Position Title *</label>
              <input
                type="text"
                v-model="form.title"
                placeholder="e.g. Software Engineer"
                required
              />
            </div>
            <div class="form-field">
              <label>Base Salary ($) *</label>
              <input
                type="number"
                v-model="form.base_salary"
                placeholder="e.g. 800"
                min="0"
                required
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label>Belongs to Department *</label>
              <select v-model="form.department_id" class="form-select" required>
                <option value="" disabled>-- Select Department --</option>
                <option v-for="dept in deptStore.departments" :key="dept.id" :value="dept.id">
                  {{ dept.name }} ({{ dept.code }})
                </option>
              </select>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-outline" @click="showModal = false">Cancel</button>
            <button type="submit" class="btn-primary" :disabled="positionStore.loading">
              <span v-if="positionStore.loading" class="spinner-sm"></span>
              {{ editingPos ? 'Update' : 'Create' }} Position
            </button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal-overlay" v-if="showDeleteModal" @click.self="showDeleteModal = false">
      <div class="modal-box modal-sm">
        <div class="modal-head">
          <h3>Delete Position</h3>
          <button class="close-btn" @click="showDeleteModal = false">
            <VsxIcon iconName="CloseCircle" :size="18" />
          </button>
        </div>
        <div class="delete-body">
          <div class="delete-icon-wrap"><VsxIcon iconName="Warning2" :size="18" /></div>
          <p>
            Are you sure you want to delete <strong>{{ deletingPos?.title }}</strong
            >?
          </p>
          <p class="delete-warning">
            This action will permanently erase this position profile from the database records.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn-outline" @click="showDeleteModal = false">Cancel</button>
          <button class="btn-danger" @click="deletePos" :disabled="positionStore.loading">
            <span v-if="positionStore.loading" class="spinner-sm"></span>Delete Position
          </button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import MainLayout from '@/components/layouts/MainLayout.vue'
import { usePositionStore } from '@/stores/position'
import { useDepartmentStore } from '@/stores/department'
import { useEmployeeStore } from '@/stores/employee'
import { useTableSort } from '@/composables/useTableSort'
import { toast } from 'vue3-toastify'

const positionStore = usePositionStore()
const deptStore = useDepartmentStore()
const employeeStore = useEmployeeStore()
const search = ref('')
const viewMode = ref('grid')

// How many employees currently hold this position (KPI footer metric).
const holderCount = (pos) =>
  (employeeStore.employees || []).filter(
    (e) => e.position_id === pos.id || e.position_title === pos.title,
  ).length
const showModal = ref(false)
const showDeleteModal = ref(false)
const editingPos = ref(null)
const deletingPos = ref(null)

const form = reactive({ title: '', base_salary: '', department_id: '' })

const stats = computed(() => {
  const list = positionStore.positions || []
  const totalSalary = list.reduce((s, p) => s + parseFloat(p.base_salary || 0), 0)
  const avgSalary = list.length ? Math.round(totalSalary / list.length) : 0

  return [
    { label: 'Total Positions', value: list.length, icon: 'Briefcase', color: '#4f7cff' },
    {
      label: 'Avg Base Salary',
      value: '$' + new Intl.NumberFormat().format(avgSalary),
      icon: 'DollarCircle',
      color: '#16a34a',
    },
  ]
})

const filtered = computed(() => {
  const list = positionStore.positions || []
  if (!search.value) return list
  const q = search.value.toLowerCase()
  return list.filter((p) => p.title?.toLowerCase().includes(q))
})

const { toggle, sortIcon, sorted: sortedPos } = useTableSort(filtered, { defaultKey: 'title' })

const formatNum = (n) => new Intl.NumberFormat().format(n || 0)

function openCreate() {
  editingPos.value = null
  Object.assign(form, { title: '', base_salary: '', department_id: '' })
  showModal.value = true
}

function openEdit(pos) {
  editingPos.value = pos
  Object.assign(form, {
    title: pos.title,
    base_salary: pos.base_salary,
    department_id: pos.department_id,
  })
  showModal.value = true
}

function confirmDelete(pos) {
  deletingPos.value = pos
  showDeleteModal.value = true
}

async function savePos() {
  const data = {
    title: form.title,
    base_salary: Number(form.base_salary),
    // department_id is a UUID string — never coerce it with Number()
    department_id: form.department_id || null,
  }

  if (editingPos.value) {
    const res = await positionStore.updatePosition(editingPos.value.id, data)
    if (res?.success) {
      toast.success('Position updated!')
      showModal.value = false
    } else {
      toast.error(res?.error || positionStore.error || 'Update failed')
    }
  } else {
    const res = await positionStore.createPosition(data)
    if (res?.success) {
      toast.success('Position created!')
      showModal.value = false
    } else {
      toast.error(res?.error || positionStore.error || 'Create failed')
    }
  }
}

async function deletePos() {
  const res = await positionStore.deletePosition(deletingPos.value.id)
  if (res?.success) {
    toast.success('Position deleted')
    showDeleteModal.value = false
  } else {
    toast.error('Delete failed')
  }
}

onMounted(() => {
  positionStore.fetchPositions()
  deptStore.fetchDepartments()
  if (!employeeStore.employees?.length) employeeStore.fetchEmployees?.()
})
</script>

<style scoped>
/* Main Background View Wrapper */
.pos-container {
  padding: 2rem;
  max-width: 1600px;
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

/* Toolbar right + view toggle */
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.view-toggle {
  display: flex;
  background: #f1f5f9;
  padding: 0.25rem;
  border-radius: 8px;
}
.view-btn {
  width: 34px;
  height: 34px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.view-btn.active {
  background: #fff;
  color: var(--accent, var(--accent));
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* KPI position cards */
.pos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.25rem;
}
.kpi-card {
  position: relative;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 1.4rem 1.4rem 1.2rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.02);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeUp 0.4s ease both;
}
.kpi-card:hover {
  border-color: #cbd5e1;
  transform: translateY(-4px);
  box-shadow: 0 14px 30px -10px rgba(15, 23, 42, 0.14);
}
.kpi-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}
.kpi-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.kpi-actions {
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s;
}
.kpi-card:hover .kpi-actions {
  opacity: 1;
}
.kpi-value {
  font-size: 1.9rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
  color: #16a34a;
}
.kpi-metric-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
  margin-top: 4px;
}
.kpi-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0.9rem 0 0;
}
.kpi-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.85rem;
  padding-top: 0.85rem;
  border-top: 1px dashed #e2e8f0;
}
.code-chip {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 7px;
}
.kpi-members {
  font-size: 0.72rem;
  color: #94a3b8;
  font-weight: 600;
}
.light-table th.sortable {
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}
.light-table th.sortable:hover {
  color: var(--accent);
}
.sort-ic {
  opacity: 0.55;
  vertical-align: -2px;
}
.light-table th.sortable:hover .sort-ic {
  opacity: 1;
}
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.empty-state :deep(svg) {
  color: #cbd5e1;
}
.btn-sm {
  padding: 0.45rem 0.9rem;
  font-size: 0.8rem;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

/* Control Buttons styling */
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
}
.btn-primary:hover:not(:disabled) {
  box-shadow: 0 6px 18px rgba(var(--accent-rgb), 0.35);
  transform: translateY(-1px);
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  white-space: nowrap;
}
.btn-outline:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #0f172a;
}

/* Statistical Framework Row */
.stats-row {
  display: flex;
  gap: 1.25rem;
  flex-wrap: wrap;
}
.stat-pill {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem;
  flex: 1;
  min-width: 200px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
  transition: all 0.2s;
}
.stat-pill:hover {
  border-color: #cbd5e1;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.05);
}
.stat-pill i {
  font-size: 1.5rem;
  flex-shrink: 0;
}
.stat-num {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
}
.stat-lbl {
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
  margin-top: 4px;
}

/* Pure White Card Base Container */
.light-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.75rem;
  box-shadow:
    0 4px 6px -1px rgba(15, 23, 42, 0.02),
    0 2px 4px -1px rgba(15, 23, 42, 0.01);
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1.25rem;
}

/* Interactive Input Elements */
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
  font-size: 0.875rem;
}
.search-inp {
  width: 100%;
  padding: 0.625rem 1rem 0.625rem 2.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: #0f172a;
  font-size: 0.875rem;
  outline: none;
  transition: all 0.2s;
}
.search-inp:focus {
  border-color: var(--accent);
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(var(--accent-rgb), 0.1);
}
.search-inp::placeholder {
  color: #94a3b8;
}

.table-head-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}
.tbl-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  display: inline-block;
  vertical-align: middle;
}
.count-badge {
  background: #eef2ff;
  color: var(--accent);
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  margin-left: 8px;
  vertical-align: middle;
}

/* Grid Directory Table */
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
  color: #475569;
  vertical-align: middle;
}
.light-table tbody tr:hover td {
  background: #f8fafc;
}
.light-table tbody tr:last-child td {
  border-bottom: none;
}
.row-num {
  font-size: 0.75rem;
  color: #94a3b8;
  font-family: monospace;
  font-weight: 600;
}

.pos-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.pos-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  flex-shrink: 0;
}
.pos-title-text {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1e293b;
}
.pos-desc {
  font-size: 0.775rem;
  color: #94a3b8;
  margin-top: 2px;
  max-width: 260px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.code-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border: 1px solid;
  border-radius: 8px;
  font-size: 0.775rem;
  font-weight: 700;
  white-space: nowrap;
}
.salary-range {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
}
.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  display: inline-block;
}
.badge-active {
  background: #dcfce7;
  color: #16a34a;
}

/* Micro-action Panel buttons */
.action-buttons {
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
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}
.btn-icon:hover {
  background: #eef2ff;
  color: var(--accent);
  border-color: #cbd5e1;
}
.btn-icon.danger:hover {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fca5a5;
}

.loading-row,
.empty-row {
  text-align: center;
  padding: 4rem 2rem;
  color: #94a3b8;
  font-weight: 500;
}
.pulse-loader {
  width: 28px;
  height: 28px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 0.75rem;
}

/* Clean Sheet Overlays & Modal Blocks */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}
.modal-box {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  width: 100%;
  max-width: 580px;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: modalIn 0.2s ease-out;
}
.modal-sm {
  max-width: 420px;
}
.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.75rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}
.modal-head h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
}
.close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 4px;
  transition: color 0.2s;
}
.close-btn:hover {
  color: #475569;
}

.modal-form {
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-field label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
}

.form-field input,
.form-field select {
  padding: 0.65rem 0.9rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #0f172a;
  font-size: 0.875rem;
  outline: none;
  transition: all 0.2s;
}
.form-field input:focus,
.form-field select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px rgba(var(--accent-rgb), 0.1);
}
.form-field input::placeholder {
  color: #cbd5e1;
}
.modal-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1.25rem 1.75rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
}

/* Safe Zone Delete Components */
.delete-body {
  padding: 2.25rem 1.75rem;
  text-align: center;
}
.delete-icon-wrap {
  width: 56px;
  height: 56px;
  background: #fee2e2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
}
.delete-icon-wrap i {
  font-size: 1.5rem;
  color: #ef4444;
}
.delete-body p {
  color: #334155;
  font-size: 0.95rem;
  margin: 0 0 0.5rem;
}
.delete-warning {
  color: #94a3b8 !important;
  font-size: 0.8rem !important;
  line-height: 1.4;
}

.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.625rem 1.25rem;
  background: #dc2626;
  border: none;
  border-radius: 10px;
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
}
.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}
.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
    transform: translateY(12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
