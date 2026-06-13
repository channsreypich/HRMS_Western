<template>
  <MainLayout>
    <div class="dept-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <VsxIcon iconName="Building" :size="18" class="me-2 text-gradient" />Departments
          </h1>
          <p class="page-sub">Manage your organizational structure</p>
        </div>
        <button class="btn-primary" @click="openCreate">
          <VsxIcon iconName="AddCircle" :size="18" /> Add Department
        </button>
      </div>

      <div class="stats-row">
        <div class="stat-pill" v-for="s in headerStats" :key="s.label">
          <VsxIcon :iconName="s.icon" :size="22" :style="{ color: s.color }" />
          <div>
            <div class="stat-num">{{ s.value }}</div>
            <div class="stat-lbl">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <div class="toolbar dark-card">
        <div class="search-wrap">
          <VsxIcon iconName="SearchNormal1" :size="18" class="si" />
          <input
            type="text"
            class="search-inp"
            placeholder="Search departments..."
            v-model="search"
          />
        </div>
        <div class="view-toggle">
          <button :class="['view-btn', { active: viewMode === 'grid' }]" @click="viewMode = 'grid'">
            <VsxIcon iconName="Category" :size="18" />
          </button>
          <button
            :class="['view-btn', { active: viewMode === 'table' }]"
            @click="viewMode = 'table'"
          >
            <VsxIcon iconName="TaskSquare" :size="18" />
          </button>
        </div>
      </div>

      <div v-if="deptStore.loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading departments...</p>
      </div>

      <template v-else>
        <div v-if="viewMode === 'grid'" class="dept-grid">
          <div class="kpi-card" v-for="dept in filtered" :key="dept.id">
            <div class="kpi-bar" :style="{ background: dept.color }"></div>
            <div class="kpi-top">
              <div class="kpi-icon" :style="{ background: dept.color + '18', color: dept.color }">
                <VsxIcon iconName="Buildings2" :size="22" type="bold" />
              </div>
              <div class="kpi-actions">
                <button class="btn-icon" @click="openEdit(dept)" title="Edit">
                  <VsxIcon iconName="Edit2" :size="16" />
                </button>
                <button class="btn-icon danger" @click="confirmDelete(dept)" title="Delete">
                  <VsxIcon iconName="Trash" :size="16" />
                </button>
              </div>
            </div>
            <div class="kpi-value" :style="{ color: dept.color }">{{ memberCount(dept) }}</div>
            <div class="kpi-metric-label">Employees</div>
            <h3 class="kpi-name">{{ dept.name }}</h3>
            <div class="kpi-foot">
              <span class="code-chip" :style="{ color: dept.color, background: dept.color + '14' }">
                {{ dept.code }}
              </span>
              <span class="kpi-date">{{ formatDate(dept.created_at) }}</span>
            </div>
          </div>

          <div v-if="filtered.length === 0" class="empty-state">
            <VsxIcon iconName="Buildings2" :size="44" />
            <p>No departments found</p>
            <button class="btn-primary btn-sm" @click="openCreate">Add Department</button>
          </div>
        </div>

        <div v-else class="dark-card">
          <div class="table-responsive">
            <table class="dark-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th class="sortable" @click="toggle('code')">
                    Code <VsxIcon :iconName="sortIcon('code')" :size="14" class="sort-ic" />
                  </th>
                  <th class="sortable" @click="toggle('name')">
                    Department Name
                    <VsxIcon :iconName="sortIcon('name')" :size="14" class="sort-ic" />
                  </th>
                  <th class="sortable" @click="toggle('created_at')">
                    Created Date
                    <VsxIcon :iconName="sortIcon('created_at')" :size="14" class="sort-ic" />
                  </th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(dept, index) in sortedDepts" :key="dept.id">
                  <td>
                    <span class="emp-id">{{ index + 1 }}</span>
                  </td>
                  <td>
                    <span
                      class="code-badge"
                      :style="{
                        color: dept.color,
                        borderColor: dept.color + '40',
                        background: dept.color + '12',
                      }"
                      >{{ dept.code }}</span
                    >
                  </td>
                  <td>
                    <div class="dept-row-info">
                      <div class="dept-dot" :style="{ background: dept.color }"></div>
                      <div>
                        <div class="table-name">{{ dept.name }}</div>
                      </div>
                    </div>
                  </td>
                  <td>{{ formatDate(dept.created_at) }}</td>
                  <td><span class="status-badge badge-active">active</span></td>
                  <td>
                    <div class="action-buttons">
                      <button class="btn-icon" @click="openEdit(dept)">
                        <VsxIcon iconName="Edit2" :size="18" />
                      </button>
                      <button class="btn-icon danger" @click="confirmDelete(dept)">
                        <VsxIcon iconName="Trash" :size="18" />
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="filtered.length === 0">
                  <td colspan="6" class="empty-row">No departments found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>

    <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="modal-box">
        <div class="modal-head">
          <h3>{{ editingDept ? 'Edit Department' : 'Add Department' }}</h3>
          <button class="close-btn" @click="showModal = false">
            <VsxIcon iconName="CloseCircle" :size="18" />
          </button>
        </div>
        <form @submit.prevent="saveDept" class="modal-form">
          <div class="form-row">
            <div class="form-field">
              <label>Department Name *</label>
              <input type="text" v-model="form.name" placeholder="e.g. Engineering" required />
            </div>
            <div class="form-field">
              <label>Code *</label>
              <input
                type="text"
                v-model="form.code"
                placeholder="e.g. ENG"
                maxlength="20"
                required
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label>Theme Color</label>
              <div class="color-picker-row">
                <input type="color" v-model="form.color" class="color-inp" />
                <div class="color-presets">
                  <span
                    v-for="c in colorPresets"
                    :key="c"
                    class="color-dot"
                    :style="{
                      background: c,
                      outline: form.color === c ? '2px solid white' : 'none',
                    }"
                    @click="form.color = c"
                  ></span>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-outline" @click="showModal = false">Cancel</button>
            <button type="submit" class="btn-primary" :disabled="deptStore.loading">
              <span v-if="deptStore.loading" class="spinner-sm"></span>
              {{ editingDept ? 'Update' : 'Create' }} Department
            </button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal-overlay" v-if="showDeleteModal" @click.self="showDeleteModal = false">
      <div class="modal-box modal-sm">
        <div class="modal-head">
          <h3>Delete Department</h3>
          <button class="close-btn" @click="showDeleteModal = false">
            <VsxIcon iconName="CloseCircle" :size="18" />
          </button>
        </div>
        <div class="delete-body">
          <div class="delete-icon-wrap"><VsxIcon iconName="Warning2" :size="18" /></div>
          <p>
            Are you sure you want to delete <strong>{{ deletingDept?.name }}</strong
            >?
          </p>
          <p class="delete-warning">
            This action cannot be undone and will permanently remove this record from the system.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn-outline" @click="showDeleteModal = false">Cancel</button>
          <button class="btn-danger" @click="deleteDept" :disabled="deptStore.loading">
            <span v-if="deptStore.loading" class="spinner-sm"></span>
            Delete Department
          </button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>
<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import MainLayout from '@/components/layouts/MainLayout.vue'
import { useDepartmentStore } from '@/stores/department'
import { useEmployeeStore } from '@/stores/employee'
import { useTableSort } from '@/composables/useTableSort'
import { toast } from 'vue3-toastify'

const deptStore = useDepartmentStore()
const employeeStore = useEmployeeStore()

// Real headcount per department (KPI metric on each card).
const memberCount = (dept) =>
  (employeeStore.employees || []).filter(
    (e) => e.department_id === dept.id || e.department_name === dept.name,
  ).length
const search = ref('')
const viewMode = ref('grid')
const showModal = ref(false)
const showDeleteModal = ref(false)
const editingDept = ref(null)
const deletingDept = ref(null)

const colorPresets = [
  '#4f7cff',
  '#40c8da',
  '#fbbf24',
  '#f87171',
  '#34d399',
  '#a78bfa',
  '#f472b6',
  '#60a5fa',
]

// 💡 Form reactive ផ្ទុកតែ Column ណាដែលមានពិតប្រាកដក្នុង MySQL Workbench របស់លីហ្សា
const form = reactive({ name: '', code: '', color: '#4f7cff' })

// 📊 គណនាស្ថិតិពិតៗចេញពី Database យកមកបង្ហាញលើក្បាលទំព័រ
const headerStats = computed(() => [
  {
    label: 'Total Departments',
    value: deptStore.departments.length,
    icon: 'Building',
    color: '#4f7cff',
  },
  {
    label: 'Active Depts',
    value: deptStore.departments.length,
    icon: 'TickCircle',
    color: '#34d399',
  },
])

const filtered = computed(() => {
  if (!deptStore.departments) return []
  if (!search.value) return deptStore.departments
  const q = search.value.toLowerCase()
  return deptStore.departments.filter(
    (d) => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q),
  )
})

const { toggle, sortIcon, sorted: sortedDepts } = useTableSort(filtered, { defaultKey: 'name' })

const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function openCreate() {
  editingDept.value = null
  Object.assign(form, { name: '', code: '', color: '#4f7cff' })
  showModal.value = true
}

function openEdit(dept) {
  editingDept.value = dept
  Object.assign(form, { name: dept.name, code: dept.code, color: dept.color })
  showModal.value = true
}

function confirmDelete(dept) {
  deletingDept.value = dept
  showDeleteModal.value = true
}

async function saveDept() {
  if (editingDept.value) {
    const res = await deptStore.updateDepartment(editingDept.value.id, form)
    if (res?.success) {
      toast.success('Department updated!')
      showModal.value = false
    } else {
      toast.error(deptStore.error || 'Update failed')
    }
  } else {
    const res = await deptStore.createDepartment(form)
    if (res?.success) {
      toast.success('Department created!')
      showModal.value = false
    } else {
      toast.error(deptStore.error || 'Create failed')
    }
  }
}

async function deleteDept() {
  const res = await deptStore.deleteDepartment(deletingDept.value.id)
  if (res?.success) {
    toast.success('Department deleted')
    showDeleteModal.value = false
  } else {
    toast.error(deptStore.error || 'Delete failed')
  }
}

onMounted(async () => {
  await deptStore.fetchDepartments()
  if (!employeeStore.employees?.length) employeeStore.fetchEmployees?.()
})
</script>

<style scoped>
/* Core View Container & Canvas */
.dept-container {
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
  align-items: flex-start;
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
  gap: 7px;
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
.btn-sm {
  padding: 0.45rem 0.9rem;
  font-size: 0.8rem;
}

/* Statistics Component Cards */
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
  padding: 1.1rem 1.5rem;
  flex: 1;
  min-width: 180px;
  box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.02);
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.stat-pill:hover {
  border-color: #cbd5e1;
  box-shadow: 0 6px 12px -2px rgba(15, 23, 42, 0.04);
}
.stat-pill i {
  font-size: 1.4rem;
  flex-shrink: 0;
}
.stat-num {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
}
.stat-lbl {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 4px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

/* Filter Toolbar Layer */
.toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
  padding: 1rem 1.25rem;
}
.dark-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow:
    0 4px 6px -1px rgba(15, 23, 42, 0.03),
    0 2px 4px -1px rgba(15, 23, 42, 0.02);
}
.search-wrap {
  position: relative;
  flex: 1;
  max-width: 380px;
}
.si {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 0.85rem;
}
.search-inp {
  width: 100%;
  padding: 0.65rem 1rem 0.65rem 2.4rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #0f172a;
  font-size: 0.875rem;
  outline: none;
  transition: all 0.2s ease;
}
.search-inp:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.12);
}
.search-inp::placeholder {
  color: #94a3b8;
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
  background: #ffffff;
  color: var(--accent);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* KPI-style department cards */
.dept-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.25rem;
}
.kpi-card {
  position: relative;
  background: #ffffff;
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
  font-size: 2.2rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
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
  letter-spacing: 0.03em;
}
.kpi-date {
  font-size: 0.72rem;
  color: #94a3b8;
  font-weight: 500;
}

/* Responsive Corporate Data Table */
.dark-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.dark-table th {
  padding: 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}
.dark-table td {
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: middle;
}
.dark-table tbody tr:hover td {
  background: #f8fafc;
}
.dark-table th.sortable {
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}
.dark-table th.sortable:hover {
  color: var(--accent);
}
.sort-ic {
  opacity: 0.55;
  vertical-align: -2px;
}
.dark-table th.sortable:hover .sort-ic {
  opacity: 1;
}
.dark-table tbody tr:last-child td {
  border-bottom: none;
}
.code-badge {
  padding: 3px 10px;
  border-radius: 6px;
  border: 1px solid;
  font-size: 0.75rem;
  font-weight: 700;
}
.dept-row-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.dept-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.table-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #0f172a;
}
.emp-id {
  font-weight: 600;
  color: #64748b;
}
.empty-row {
  text-align: center;
  padding: 3rem !important;
  color: #64748b;
  font-size: 0.9rem;
}

/* Pill Status Elements */
.status-badge {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: capitalize;
}
.badge-active {
  background: #d1fae5;
  color: #065f46;
}

/* Icon Operations Button Triggers */
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
  color: #475569;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.btn-icon:hover {
  background: #f1f5f9;
  color: var(--accent);
  border-color: #94a3b8;
}
.btn-icon.danger:hover {
  background: #fef2f2;
  color: #ef4444;
  border-color: #fca5a5;
}

/* Empty Workspace Placeholder Fallback */
.empty-state {
  grid-column: 1/-1;
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

/* Light Form Modal Box Backings */
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
  border-radius: 20px;
  width: 100%;
  max-width: 560px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: modalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-sm {
  max-width: 440px;
}
.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}
.modal-head h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
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
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-field label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
}
.form-field input {
  padding: 0.65rem 0.9rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #0f172a;
  font-size: 0.9rem;
  outline: none;
  transition: all 0.2s ease;
}
.form-field input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.1);
}
.form-field input::placeholder {
  color: #cbd5e1;
}

.color-picker-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.color-inp {
  width: 42px;
  height: 38px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: none;
  cursor: pointer;
  padding: 2px;
}
.color-presets {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.color-dot {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.15s;
  outline-offset: 2px;
}
.color-dot:hover {
  transform: scale(1.15);
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}
.btn-outline {
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

/* Structural Record Removal Warning Popups */
.delete-body {
  padding: 2.25rem 1.5rem 1.5rem 1.5rem;
  text-align: center;
}
.delete-icon-wrap {
  width: 56px;
  height: 56px;
  background: #fef2f2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
  border: 1px solid #fee2e2;
}
.delete-icon-wrap :deep(svg) {
  color: #ef4444;
}
.delete-body p {
  color: #334155;
  font-size: 0.95rem;
  margin: 0 0 0.5rem;
}
.delete-warning {
  color: #64748b !important;
  font-size: 0.825rem !important;
  line-height: 1.4;
}
.btn-danger {
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border: none;
  border-radius: 10px;
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}
.btn-danger:hover:not(:disabled) {
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.3);
  opacity: 0.95;
}
.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Runtime Progress Loaders */
.loading-container {
  text-align: center;
  padding: 5rem 2rem;
  color: #64748b;
  font-size: 0.9rem;
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
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
@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
