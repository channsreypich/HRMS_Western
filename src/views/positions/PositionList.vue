<template>
  <MainLayout>
    <div class="pos-container">
      <div class="page-header">
        <div>
          <h1 class="page-title"><i class="fas fa-briefcase me-2 text-gradient"></i>Positions</h1>
          <p class="page-sub">Manage job titles and base salary ranges</p>
        </div>
        <button class="btn-primary" @click="openCreate">
          <i class="fas fa-plus-circle"></i> Add Position
        </button>
      </div>

      <div class="stats-row">
        <div class="stat-pill" v-for="s in stats" :key="s.label">
          <i :class="s.icon" :style="{ color: s.color }"></i>
          <div>
            <div class="stat-num">{{ s.value }}</div>
            <div class="stat-lbl">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <div class="light-card toolbar">
        <div class="search-wrap">
          <i class="fas fa-search si"></i>
          <input
            type="text"
            class="search-inp"
            placeholder="Search positions by title..."
            v-model="search"
          />
        </div>
        <button class="btn-outline" @click="search = ''">
          <i class="fas fa-redo-alt"></i> Reset
        </button>
      </div>

      <div class="light-card">
        <div class="table-head-row">
          <div>
            <h5 class="tbl-title">Position Directory</h5>
            <span class="count-badge">{{ filtered.length }} positions</span>
          </div>
          <button class="btn-icon" @click="positionStore.fetchPositions()">
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
        <div class="table-responsive">
          <table class="light-table">
            <thead>
              <tr>
                <th># ID</th>
                <th>Position Title</th>
                <th>Department</th>
                <th>Base Salary</th>
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
                  <i class="fas fa-briefcase fa-2x"></i><br />No positions found
                </td>
              </tr>
              <tr v-for="pos in filtered" :key="pos.id" class="pos-row">
                <td>
                  <span class="row-num">#{{ pos.id }}</span>
                </td>
                <td>
                  <div class="pos-info">
                    <div
                      class="pos-icon-wrap"
                      :style="{
                        background: (pos.dept_color || '#6823ff') + '12',
                        color: pos.dept_color || '#6823ff',
                      }"
                    >
                      <i class="fas fa-briefcase"></i>
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
                      color: pos.dept_color || '#6823ff',
                      borderColor: (pos.dept_color || '#6823ff') + '30',
                      background: (pos.dept_color || '#6823ff') + '08',
                    }"
                  >
                    <i class="fas fa-building me-1"></i>{{ pos.department_name || 'Unassigned' }}
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
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon danger" @click="confirmDelete(pos)" title="Delete">
                      <i class="fas fa-trash"></i>
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
          <button class="close-btn" @click="showModal = false"><i class="fas fa-times"></i></button>
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
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="delete-body">
          <div class="delete-icon-wrap"><i class="fas fa-exclamation-triangle"></i></div>
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
import { toast } from 'vue3-toastify'

const positionStore = usePositionStore()
const deptStore = useDepartmentStore()
const search = ref('')
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
    { label: 'Total Positions', value: list.length, icon: 'fas fa-briefcase', color: '#6823ff' },
    {
      label: 'Avg Base Salary',
      value: '$' + new Intl.NumberFormat().format(avgSalary),
      icon: 'fas fa-dollar-sign',
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
    department_id: Number(form.department_id),
  }

  if (editingPos.value) {
    const res = await positionStore.updatePosition(editingPos.value.id, data)
    if (res?.success) {
      toast.success('Position updated!')
      showModal.value = false
    } else {
      toast.error('Update failed')
    }
  } else {
    const res = await positionStore.createPosition(data)
    if (res?.success) {
      toast.success('Position created!')
      showModal.value = false
    } else {
      toast.error('Create failed')
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

/* Control Buttons styling */
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
  border-color: #6823ff;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(104, 35, 255, 0.1);
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
  color: #6823ff;
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
  color: #6823ff;
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
  border-top-color: #6823ff;
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
  border-color: #6823ff;
  box-shadow: 0 0 0 4px rgba(104, 35, 255, 0.1);
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
