<template>
  <MainLayout>
    <div class="dept-container">

      <div class="page-header">
        <div>
          <h1 class="page-title"><i class="fas fa-building me-2 text-gradient"></i>Departments</h1>
          <p class="page-sub">Manage your organizational structure</p>
        </div>
        <button class="btn-primary" @click="openCreate">
          <i class="fas fa-plus-circle"></i> Add Department
        </button>
      </div>

      <div class="stats-row">
        <div class="stat-pill" v-for="s in headerStats" :key="s.label">
          <i :class="s.icon" :style="{ color: s.color }"></i>
          <div>
            <div class="stat-num">{{ s.value }}</div>
            <div class="stat-lbl">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <div class="toolbar dark-card">
        <div class="search-wrap">
          <i class="fas fa-search si"></i>
          <input type="text" class="search-inp" placeholder="Search departments..." v-model="search" />
        </div>
        <div class="view-toggle">
          <button :class="['view-btn', { active: viewMode === 'grid' }]" @click="viewMode = 'grid'"><i class="fas fa-th-large"></i></button>
          <button :class="['view-btn', { active: viewMode === 'table' }]" @click="viewMode = 'table'"><i class="fas fa-list"></i></button>
        </div>
      </div>

      <div v-if="deptStore.loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading departments...</p>
      </div>

      <template v-else>
        <div v-if="viewMode === 'grid'" class="dept-grid">
          <div class="dept-card" v-for="dept in filtered" :key="dept.id">
            <div class="dept-color-bar" :style="{ background: dept.color }"></div>
            <div class="dept-card-body">
              <div class="dept-top">
                <div class="dept-icon-wrap" :style="{ background: dept.color + '20' }">
                  <i class="fas fa-building" :style="{ color: dept.color }"></i>
                </div>
                <div class="dept-actions-menu">
                  <button class="btn-icon" @click="openEdit(dept)" title="Edit"><i class="fas fa-edit"></i></button>
                  <button class="btn-icon danger" @click="confirmDelete(dept)" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
              </div>
              <div class="dept-code">{{ dept.code }}</div>
              <h3 class="dept-name">{{ dept.name }}</h3>
              
              <p class="dept-desc" :style="{ color: 'rgba(255,255,255,0.45)' }">
                The official operational hub for the <span :style="{ color: dept.color, fontWeight: '600' }">{{ dept.name }}</span> core framework.
              </p>
              
              <div class="dept-meta">
                <div class="meta-item">
                  <i class="fas fa-calendar-alt"></i>
                  <span>Created: {{ formatDate(dept.created_at) }}</span>
                </div>
              </div>
              <div class="dept-footer">
                <span class="status-badge badge-active">active</span>
                <span class="budget-label">ID: {{ dept.id }}</span>
              </div>
            </div>
          </div>

          <div v-if="filtered.length === 0" class="empty-state">
            <i class="fas fa-building fa-3x"></i>
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
                  <th>Code</th>
                  <th>Department Name</th>
                  <th>Created Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="dept in filtered" :key="dept.id">
                  <td><span class="emp-id">#{{ dept.id }}</span></td>
                  <td><span class="code-badge" :style="{ color: dept.color, borderColor: dept.color + '40', background: dept.color + '12' }">{{ dept.code }}</span></td>
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
                      <button class="btn-icon" @click="openEdit(dept)"><i class="fas fa-edit"></i></button>
                      <button class="btn-icon danger" @click="confirmDelete(dept)"><i class="fas fa-trash"></i></button>
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
          <button class="close-btn" @click="showModal = false"><i class="fas fa-times"></i></button>
        </div>
        <form @submit.prevent="saveDept" class="modal-form">
          <div class="form-row">
            <div class="form-field">
              <label>Department Name *</label>
              <input type="text" v-model="form.name" placeholder="e.g. Engineering" required />
            </div>
            <div class="form-field">
              <label>Code *</label>
              <input type="text" v-model="form.code" placeholder="e.g. ENG" maxlength="20" required />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-field">
              <label>Theme Color</label>
              <div class="color-picker-row">
                <input type="color" v-model="form.color" class="color-inp" />
                <div class="color-presets">
                  <span v-for="c in colorPresets" :key="c" class="color-dot"
                    :style="{ background: c, outline: form.color === c ? '2px solid white' : 'none' }"
                    @click="form.color = c"></span>
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
          <button class="close-btn" @click="showDeleteModal = false"><i class="fas fa-times"></i></button>
        </div>
        <div class="delete-body">
          <div class="delete-icon-wrap"><i class="fas fa-exclamation-triangle"></i></div>
          <p>Are you sure you want to delete <strong>{{ deletingDept?.name }}</strong>?</p>
          <p class="delete-warning">This action cannot be undone and will permanently remove this record from the system.</p>
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
import { toast } from 'vue3-toastify'

const deptStore = useDepartmentStore()
const search = ref('')
const viewMode = ref('grid')
const showModal = ref(false)
const showDeleteModal = ref(false)
const editingDept = ref(null)
const deletingDept = ref(null)

const colorPresets = ['#6823ff', '#40c8da', '#fbbf24', '#f87171', '#34d399', '#a78bfa', '#f472b6', '#60a5fa']

// 💡 Form reactive ផ្ទុកតែ Column ណាដែលមានពិតប្រាកដក្នុង MySQL Workbench របស់លីហ្សា
const form = reactive({ name: '', code: '', color: '#6823ff' })

// 📊 គណនាស្ថិតិពិតៗចេញពី Database យកមកបង្ហាញលើក្បាលទំព័រ
const headerStats = computed(() => [
  { label: 'Total Departments', value: deptStore.departments.length, icon: 'fas fa-building', color: '#6823ff' },
  { label: 'Active Depts', value: deptStore.departments.length, icon: 'fas fa-check-circle', color: '#34d399' }
])

const filtered = computed(() => {
  if (!deptStore.departments) return []
  if (!search.value) return deptStore.departments
  const q = search.value.toLowerCase()
  return deptStore.departments.filter(d => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q))
})

const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function openCreate() {
  editingDept.value = null
  Object.assign(form, { name: '', code: '', color: '#6823ff' })
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
  console.log("=== 🔄 START FETCHING DEPARTMENTS FROM UI ===")
  
  const resData = await deptStore.fetchDepartments()
  
  console.log("Raw API Response Data:", resData)
  console.log("Data inside Pinia Store:", deptStore.departments)
  console.log("Error status if any:", deptStore.error)
})

</script>


<style scoped>
.dept-container { padding: 1.5rem; max-width: 1600px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.25rem; }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; }
.page-title { font-size: 1.6rem; font-weight: 700; color: rgba(255,255,255,0.92); margin: 0 0 0.3rem; }
.page-sub { font-size: 0.83rem; color: rgba(255,255,255,0.35); margin: 0; }
.text-gradient { background: linear-gradient(135deg, #a47bff, #40c8da); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

.btn-primary {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #6823ff, #4f0fdb);
  border: none; border-radius: 10px; color: white;
  font-size: 0.85rem; font-weight: 600; cursor: pointer;
  transition: all 0.2s; box-shadow: 0 4px 20px rgba(104,35,255,0.35);
}
.btn-primary:hover:not(:disabled) { opacity: 0.9; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-sm { padding: 0.45rem 0.9rem; font-size: 0.8rem; }

/* Stats */
.stats-row { display: flex; gap: 1rem; flex-wrap: wrap; }
.stat-pill {
  display: flex; align-items: center; gap: 12px;
  background: #0d0d1a; border: 1px solid rgba(104,35,255,0.13);
  border-radius: 14px; padding: 0.9rem 1.25rem;
  flex: 1; min-width: 160px;
  transition: border-color 0.2s;
}
.stat-pill:hover { border-color: rgba(104,35,255,0.3); }
.stat-pill i { font-size: 1.3rem; flex-shrink: 0; }
.stat-num { font-size: 1.3rem; font-weight: 800; color: rgba(255,255,255,0.9); line-height: 1; }
.stat-lbl { font-size: 0.72rem; color: rgba(255,255,255,0.35); margin-top: 3px; }

/* Toolbar */
.toolbar { display: flex; align-items: center; gap: 1rem; justify-content: space-between; padding: 1rem 1.25rem; }
.dark-card { background: #0d0d1a; border: 1px solid rgba(104,35,255,0.13); border-radius: 18px; padding: 1.5rem; }
.search-wrap { position: relative; flex: 1; max-width: 380px; }
.si { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.3); font-size: 0.82rem; }
.search-inp {
  width: 100%; padding: 0.6rem 1rem 0.6rem 2.2rem;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 9px; color: white; font-size: 0.83rem; outline: none;
}
.search-inp:focus { border-color: rgba(104,35,255,0.5); background: rgba(104,35,255,0.07); }
.search-inp::placeholder { color: rgba(255,255,255,0.25); }
.view-toggle { display: flex; gap: 4px; }
.view-btn {
  width: 36px; height: 36px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px; color: rgba(255,255,255,0.4); cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all 0.2s;
}
.view-btn.active { background: rgba(104,35,255,0.25); color: #a47bff; border-color: rgba(104,35,255,0.4); }

/* Grid */
.dept-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.1rem;
}
.dept-card {
  background: #0d0d1a; border: 1px solid rgba(104,35,255,0.13);
  border-radius: 18px; overflow: hidden;
  transition: all 0.25s; animation: fadeUp 0.4s ease both;
}
.dept-card:hover { border-color: rgba(104,35,255,0.35); transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.3); }
.dept-color-bar { height: 4px; }
.dept-card-body { padding: 1.25rem; }
.dept-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
.dept-icon-wrap { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
.dept-actions-menu { display: flex; gap: 5px; }
.dept-code { font-size: 0.7rem; font-weight: 700; color: rgba(255,255,255,0.35); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
.dept-name { font-size: 1.05rem; font-weight: 700; color: rgba(255,255,255,0.9); margin: 0 0 0.4rem; }
.dept-desc { font-size: 0.78rem; color: rgba(255,255,255,0.38); margin: 0 0 0.9rem; line-height: 1.5; min-height: 36px; }
.dept-meta { display: flex; flex-direction: column; gap: 5px; margin-bottom: 0.9rem; }
.meta-item { display: flex; align-items: center; gap: 7px; font-size: 0.78rem; color: rgba(255,255,255,0.45); }
.meta-item i { width: 14px; color: rgba(255,255,255,0.25); }
.dept-footer { display: flex; justify-content: space-between; align-items: center; }
.budget-label { font-size: 0.73rem; color: rgba(255,255,255,0.35); }

/* Table */
.dark-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
.dark-table th { padding: 0.65rem 0.9rem; text-align: left; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: rgba(255,255,255,0.25); border-bottom: 1px solid rgba(255,255,255,0.06); }
.dark-table td { padding: 0.85rem 0.9rem; border-bottom: 1px solid rgba(255,255,255,0.04); color: rgba(255,255,255,0.6); vertical-align: middle; }
.dark-table tbody tr:hover td { background: rgba(104,35,255,0.05); }
.dark-table tbody tr:last-child td { border-bottom: none; }
.code-badge { padding: 3px 10px; border-radius: 6px; border: 1px solid; font-size: 0.72rem; font-weight: 700; }
.dept-row-info { display: flex; align-items: center; gap: 10px; }
.dept-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.table-name { font-size: 0.85rem; font-weight: 600; color: rgba(255,255,255,0.85); }
.table-desc { font-size: 0.73rem; color: rgba(255,255,255,0.3); margin-top: 1px; }
.count-badge { background: rgba(104,35,255,0.15); color: #a47bff; padding: 2px 9px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; }
.empty-row { text-align: center; padding: 2.5rem; color: rgba(255,255,255,0.3); }

/* Badges */
.status-badge { padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; text-transform: capitalize; }
.badge-active { background: rgba(52,211,153,0.12); color: #34d399; }
.badge-inactive { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); }

/* Action buttons */
.action-buttons { display: flex; gap: 5px; }
.btn-icon {
  width: 30px; height: 30px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.07);
  border-radius: 8px; color: rgba(255,255,255,0.4); cursor: pointer;
  display: flex; align-items: center; justify-content: center; font-size: 0.8rem; transition: all 0.2s;
}
.btn-icon:hover { background: rgba(104,35,255,0.2); color: #c5a3ff; border-color: rgba(104,35,255,0.4); }
.btn-icon.danger:hover { background: rgba(239,68,68,0.15); color: #f87171; border-color: rgba(239,68,68,0.3); }

/* Empty */
.empty-state { grid-column: 1/-1; text-align: center; padding: 3rem; color: rgba(255,255,255,0.3); display: flex; flex-direction: column; align-items: center; gap: 1rem; }
.empty-state i { font-size: 3rem; opacity: 0.3; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; padding: 1rem;
}
.modal-box {
  background: #0f0f20; border: 1px solid rgba(104,35,255,0.2);
  border-radius: 20px; width: 100%; max-width: 560px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.6);
  animation: modalIn 0.25s ease;
}
.modal-sm { max-width: 420px; }
.modal-head { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.06); }
.modal-head h3 { margin: 0; font-size: 1rem; font-weight: 700; color: rgba(255,255,255,0.9); }
.close-btn { background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; font-size: 1rem; padding: 4px; transition: color 0.2s; }
.close-btn:hover { color: rgba(255,255,255,0.8); }

.modal-form { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-field { display: flex; flex-direction: column; gap: 5px; }
.form-field label { font-size: 0.78rem; font-weight: 600; color: rgba(255,255,255,0.5); }
.form-field input, .form-field textarea, .form-field select {
  padding: 0.6rem 0.9rem;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09);
  border-radius: 9px; color: rgba(255,255,255,0.85); font-size: 0.83rem; outline: none;
}
.form-field input:focus, .form-field textarea:focus, .form-field select:focus { border-color: rgba(104,35,255,0.5); background: rgba(104,35,255,0.07); }
.form-field textarea { resize: vertical; font-family: inherit; }
.form-field select { cursor: pointer; }
.form-field select option { background: #1a1a2e; }

.color-picker-row { display: flex; align-items: center; gap: 10px; }
.color-inp { width: 40px; height: 36px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: none; cursor: pointer; padding: 2px; }
.color-presets { display: flex; gap: 6px; flex-wrap: wrap; }
.color-dot { width: 22px; height: 22px; border-radius: 6px; cursor: pointer; transition: transform 0.15s; outline-offset: 2px; }
.color-dot:hover { transform: scale(1.15); }

.modal-footer { display: flex; gap: 0.75rem; justify-content: flex-end; padding: 1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.06); }
.btn-outline { padding: 0.55rem 1.1rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 9px; color: rgba(255,255,255,0.6); font-size: 0.83rem; cursor: pointer; transition: all 0.2s; }
.btn-outline:hover { background: rgba(255,255,255,0.1); }

/* Delete modal */
.delete-body { padding: 2rem 1.5rem; text-align: center; }
.delete-icon-wrap { width: 60px; height: 60px; background: rgba(239,68,68,0.12); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
.delete-icon-wrap i { font-size: 1.5rem; color: #f87171; }
.delete-body p { color: rgba(255,255,255,0.7); font-size: 0.88rem; margin: 0 0 0.5rem; }
.delete-warning { color: rgba(248,113,113,0.7) !important; font-size: 0.78rem !important; }
.btn-danger { padding: 0.55rem 1.1rem; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); border-radius: 9px; color: #f87171; font-size: 0.83rem; cursor: pointer; transition: all 0.2s; }
.btn-danger:hover:not(:disabled) { background: rgba(239,68,68,0.25); }
.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner-sm { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; margin-right: 6px; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
</style>