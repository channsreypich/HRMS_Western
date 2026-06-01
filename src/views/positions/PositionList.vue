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

      <div class="dark-card toolbar">
        <div class="search-wrap">
          <i class="fas fa-search si"></i>
          <input type="text" class="search-inp" placeholder="Search positions by title..." v-model="search" />
        </div>
        <button class="btn-outline" @click="search = ''">
          <i class="fas fa-redo-alt"></i> Reset
        </button>
      </div>

      <div class="dark-card">
        <div class="table-head-row">
          <div>
            <h5 class="tbl-title">Position Directory</h5>
            <span class="count-badge">{{ filtered.length }} positions</span>
          </div>
          <button class="btn-icon" @click="positionStore.fetchPositions()"><i class="fas fa-sync-alt"></i></button>
        </div>
        <div class="table-responsive">
          <table class="dark-table">
            <thead>
              <tr>
                <th># ID</th>
                <th>Position Title</th>
                <th>Department</th> <th>Base Salary</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="positionStore.loading">
                <td colspan="6" class="loading-row"><div class="pulse-loader"></div> Loading positions...</td>
              </tr>
              <tr v-else-if="filtered.length === 0">
                <td colspan="6" class="empty-row">
                  <i class="fas fa-briefcase fa-2x"></i><br>No positions found
                </td>
              </tr>
              <tr v-for="pos in filtered" :key="pos.id" class="pos-row">
                <td><span class="row-num">#{{ pos.id }}</span></td>
                <td>
                  <div class="pos-info">
                    <div class="pos-icon-wrap" :style="{ background: (pos.dept_color || '#6823ff') + '15', color: pos.dept_color || '#a47bff' }">
                      <i class="fas fa-briefcase"></i>
                    </div>
                    <div>
                      <div class="pos-title-text">{{ pos.title }}</div>
                      <div class="pos-desc">Standard corporate rank within the organization.</div>
                    </div>
                  </div>
                </td>
                
                <td>
                  <span class="code-badge" :style="{ color: pos.dept_color || '#a47bff', borderColor: (pos.dept_color || '#a47bff') + '40', background: (pos.dept_color || '#a47bff') + '12' }">
                    <i class="fas fa-building me-1"></i>{{ pos.department_name || 'Unassigned' }}
                  </span>
                </td>

                <td>
                  <div class="salary-range">
                    <span class="sal-max" style="color: #34d399; font-weight: 700;">${{ formatNum(pos.base_salary) }}</span>
                  </div>
                </td>
                <td><span class="status-badge badge-active">active</span></td>
                <td>
                  <div class="action-buttons">
                    <button class="btn-icon" @click="openEdit(pos)" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon danger" @click="confirmDelete(pos)" title="Delete"><i class="fas fa-trash"></i></button>
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
              <input type="text" v-model="form.title" placeholder="e.g. Software Engineer" required />
            </div>
            <div class="form-field">
              <label>Base Salary ($) *</label>
              <input type="number" v-model="form.base_salary" placeholder="e.g. 800" min="0" required />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-field">
              <label>Belongs to Department *</label>
              <select v-model="form.department_id" class="form-select" required style="width: 100%; padding: 0.65rem; background: #1a1625; color: white; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px;">
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
          <button class="close-btn" @click="showDeleteModal = false"><i class="fas fa-times"></i></button>
        </div>
        <div class="delete-body">
          <div class="delete-icon-wrap"><i class="fas fa-exclamation-triangle"></i></div>
          <p>Are you sure you want to delete <strong>{{ deletingPos?.title }}</strong>?</p>
          <p class="delete-warning">This action will permanently erase this position profile from the database records.</p>
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
import { useDepartmentStore } from '@/stores/department' // ហៅ Store ដេប៉ាតាម៉ង់មកប្រើដើម្បីទាញយកបញ្ជីឈ្មោះ
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
    { label: 'Avg Base Salary', value: '$' + new Intl.NumberFormat().format(avgSalary), icon: 'fas fa-dollar-sign', color: '#34d399' }
  ]
})

const filtered = computed(() => {
  const list = positionStore.positions || []
  if (!search.value) return list
  const q = search.value.toLowerCase()
  return list.filter(p => p.title?.toLowerCase().includes(q))
})

const formatNum = (n) => new Intl.NumberFormat().format(n || 0)

function openCreate() {
  editingPos.value = null
  Object.assign(form, { title: '', base_salary: '', department_id: '' }) // Reset ឱ្យទំនេរស្អាត
  showModal.value = true
}

function openEdit(pos) {
  editingPos.value = pos
  Object.assign(form, { title: pos.title, base_salary: pos.base_salary, department_id: pos.department_id })
  showModal.value = true
}

function confirmDelete(pos) {
  deletingPos.value = pos
  showDeleteModal.value = true
}

async function savePos() {
  //បោះកញ្ចប់ទិន្នន័យដែលមានទាំង title, base_salary, និង department_id ទៅកាន់ Backend
  const data = { 
    title: form.title,
    base_salary: Number(form.base_salary),
    department_id: Number(form.department_id) 
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

// ពេលបើកទំព័រមក បញ្ជាឱ្យរត់ទាញទាំងទិន្នន័យ Positions និងបញ្ជី Departments មកចាក់ត្រៀមតែម្ដង
onMounted(() => {
  positionStore.fetchPositions()
  deptStore.fetchDepartments()
})
</script>

<style scoped>
.pos-container { padding: 1.5rem; max-width: 1600px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.25rem; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; }
.page-title { font-size: 1.6rem; font-weight: 700; color: rgba(255,255,255,0.92); margin: 0 0 0.3rem; }
.page-sub { font-size: 0.83rem; color: rgba(255,255,255,0.35); margin: 0; }
.text-gradient { background: linear-gradient(135deg, #a47bff, #40c8da); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

.btn-primary { display: inline-flex; align-items: center; gap: 7px; padding: 0.6rem 1.2rem; background: linear-gradient(135deg, #6823ff, #4f0fdb); border: none; border-radius: 10px; color: white; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(104,35,255,0.35); }
.btn-primary:hover:not(:disabled) { opacity: 0.9; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.stats-row { display: flex; gap: 1rem; flex-wrap: wrap; }
.stat-pill { display: flex; align-items: center; gap: 12px; background: #0d0d1a; border: 1px solid rgba(104,35,255,0.13); border-radius: 14px; padding: 0.9rem 1.25rem; flex: 1; min-width: 160px; transition: border-color 0.2s; }
.stat-pill:hover { border-color: rgba(104,35,255,0.3); }
.stat-pill i { font-size: 1.3rem; flex-shrink: 0; }
.stat-num { font-size: 1.3rem; font-weight: 800; color: rgba(255,255,255,0.9); line-height: 1; }
.stat-lbl { font-size: 0.72rem; color: rgba(255,255,255,0.35); margin-top: 3px; }

.dark-card { background: #0d0d1a; border: 1px solid rgba(104,35,255,0.13); border-radius: 18px; padding: 1.5rem; }
.toolbar { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; padding: 1rem 1.25rem; }
.search-wrap { position: relative; flex: 1; min-width: 200px; }
.si { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.3); font-size: 0.82rem; }
.search-inp { width: 100%; padding: 0.6rem 1rem 0.6rem 2.2rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 9px; color: white; font-size: 0.83rem; outline: none; }
.search-inp:focus { border-color: rgba(104,35,255,0.5); background: rgba(104,35,255,0.07); }
.search-inp::placeholder { color: rgba(255,255,255,0.25); }
.filter-sel { padding: 0.6rem 0.9rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 9px; color: rgba(255,255,255,0.7); font-size: 0.82rem; outline: none; cursor: pointer; }
.filter-sel option { background: #1a1a2e; }
.btn-outline { display: inline-flex; align-items: center; gap: 7px; padding: 0.55rem 1rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 9px; color: rgba(255,255,255,0.6); font-size: 0.82rem; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.btn-outline:hover { background: rgba(255,255,255,0.1); }

.table-head-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.tbl-title { font-size: 0.9rem; font-weight: 700; color: rgba(255,255,255,0.8); margin: 0 0.75rem 0 0; display: inline; }
.count-badge { background: rgba(104,35,255,0.15); color: #a47bff; padding: 2px 9px; border-radius: 12px; font-size: 0.72rem; font-weight: 700; }

.table-responsive { overflow-x: auto; }
.dark-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
.dark-table th { padding: 0.65rem 0.9rem; text-align: left; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: rgba(255,255,255,0.25); border-bottom: 1px solid rgba(255,255,255,0.06); }
.dark-table td { padding: 0.8rem 0.9rem; border-bottom: 1px solid rgba(255,255,255,0.04); color: rgba(255,255,255,0.6); vertical-align: middle; }
.dark-table tbody tr:hover td { background: rgba(104,35,255,0.05); }
.dark-table tbody tr:last-child td { border-bottom: none; }
.row-num { font-size: 0.72rem; color: rgba(255,255,255,0.3); font-family: monospace; }

.pos-info { display: flex; align-items: center; gap: 10px; }
.pos-icon-wrap { width: 34px; height: 34px; background: rgba(104,35,255,0.15); border-radius: 9px; display: flex; align-items: center; justify-content: center; color: #a47bff; font-size: 0.85rem; flex-shrink: 0; }
.pos-title-text { font-size: 0.85rem; font-weight: 600; color: rgba(255,255,255,0.88); }
.pos-desc { font-size: 0.72rem; color: rgba(255,255,255,0.3); margin-top: 1px; max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.dept-chip { padding: 3px 10px; background: rgba(64,200,218,0.1); color: #40c8da; border-radius: 6px; font-size: 0.75rem; font-weight: 600; white-space: nowrap; }
.level-chip { padding: 3px 10px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; }
.level-intern, .level-junior { background: rgba(100,116,139,0.12); color: #94a3b8; }
.level-mid { background: rgba(59,130,246,0.12); color: #60a5fa; }
.level-senior, .level-lead { background: rgba(139,92,246,0.12); color: #a78bfa; }
.level-manager, .level-director { background: rgba(245,158,11,0.12); color: #fbbf24; }
.level-vp, .level-c-level { background: rgba(248,113,113,0.12); color: #f87171; }

.salary-range { display: flex; align-items: center; gap: 4px; font-size: 0.78rem; }
.sal-min, .sal-max { font-weight: 600; color: rgba(255,255,255,0.7); }
.sal-sep { color: rgba(255,255,255,0.25); }
.headcount { font-weight: 700; color: rgba(255,255,255,0.75); }
.slot-badge { padding: 3px 9px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; }
.slot-open { background: rgba(52,211,153,0.12); color: #34d399; }
.slot-full { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); }
.status-badge { padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; text-transform: capitalize; }
.badge-active { background: rgba(52,211,153,0.12); color: #34d399; }
.badge-inactive { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); }

.action-buttons { display: flex; gap: 5px; }
.btn-icon { width: 30px; height: 30px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; color: rgba(255,255,255,0.4); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; transition: all 0.2s; }
.btn-icon:hover { background: rgba(104,35,255,0.2); color: #c5a3ff; border-color: rgba(104,35,255,0.4); }
.btn-icon.danger:hover { background: rgba(239,68,68,0.15); color: #f87171; border-color: rgba(239,68,68,0.3); }

.loading-row, .empty-row { text-align: center; padding: 3rem; color: rgba(255,255,255,0.3); }
.pulse-loader { width: 32px; height: 32px; border: 3px solid rgba(104,35,255,0.3); border-top-color: #a47bff; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 0.5rem; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem; }
.modal-box { background: #0f0f20; border: 1px solid rgba(104,35,255,0.2); border-radius: 20px; width: 100%; max-width: 580px; box-shadow: 0 24px 64px rgba(0,0,0,0.6); animation: modalIn 0.25s ease; }
.modal-sm { max-width: 420px; }
.modal-head { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.06); }
.modal-head h3 { margin: 0; font-size: 1rem; font-weight: 700; color: rgba(255,255,255,0.9); }
.close-btn { background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; font-size: 1rem; padding: 4px; transition: color 0.2s; }
.close-btn:hover { color: rgba(255,255,255,0.8); }
.modal-form { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-field { display: flex; flex-direction: column; gap: 5px; }
.form-field label { font-size: 0.78rem; font-weight: 600; color: rgba(255,255,255,0.5); }
.form-field input, .form-field textarea, .form-field select { padding: 0.6rem 0.9rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09); border-radius: 9px; color: rgba(255,255,255,0.85); font-size: 0.83rem; outline: none; }
.form-field input:focus, .form-field textarea:focus, .form-field select:focus { border-color: rgba(104,35,255,0.5); background: rgba(104,35,255,0.07); }
.form-field textarea { resize: vertical; font-family: inherit; }
.form-field select option { background: #1a1a2e; }
.modal-footer { display: flex; gap: 0.75rem; justify-content: flex-end; padding: 1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.06); }

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
@keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
</style>