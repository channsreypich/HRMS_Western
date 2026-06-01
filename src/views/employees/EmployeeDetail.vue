<template>
  <MainLayout>
    <div class="employee-detail-container">

      <div v-if="loading" class="dark-card loading-state fade-in">
        <div class="liquid-loading"></div>
        <p>Loading employee details...</p>
      </div>

      <div v-else-if="error" class="dark-card error-state fade-in">
        <i class="fas fa-exclamation-triangle fa-3x mb-3" style="color:#f87171"></i>
        <h3>Error Loading Employee</h3>
        <p>{{ error }}</p>
        <button class="btn-primary mt-3" @click="router.push('/employees')">Back to Employees</button>
      </div>

      <template v-else>
        <div class="dark-card header-section fade-in">
          <div class="header-content">
            <div class="header-left">
              <div class="avatar-large" :style="{ background: getAvatarGradient(employee?.first_name) }">
                {{ getInitials(employee?.first_name, employee?.last_name) }}
              </div>
              <div>
                <h1 class="page-title">
                  {{ employee?.first_name }} {{ employee?.last_name }}
                </h1>
                <div class="header-badges">
                  <span class="emp-id-badge">EMP-{{ String(employee?.id).padStart(3, '0') }}</span>
                  <span class="badge-status" :class="getStatusClass(employee?.status)">
                    {{ employee?.status }}
                  </span>
                  <span class="dept-chip" v-if="employee?.department_name">
                    <i class="fas fa-building me-1"></i>{{ employee.department_name }}
                  </span>
                </div>
              </div>
            </div>
            <div class="header-actions">
              <button class="btn-ghost" @click="router.push('/employees')">
                <i class="fas fa-arrow-left me-2"></i>Back
              </button>
              <button class="btn-primary" @click="editEmployee">
                <i class="fas fa-edit me-2"></i>Edit
              </button>
            </div>
          </div>
        </div>

        <div class="info-grid">

          <div class="dark-card info-card fade-in" style="animation-delay:0.08s">
            <div class="card-header">
              <div class="card-icon-wrap" style="background:rgba(164,123,255,0.12)">
                <i class="fas fa-user" style="color:#a47bff"></i>
              </div>
              <h3>Personal Information</h3>
            </div>
            <div class="info-rows">
              <div class="info-row">
                <span class="info-label">Full Name</span>
                <span class="info-value">{{ employee?.first_name }} {{ employee?.last_name }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email</span>
                <span class="info-value">
                  <a :href="'mailto:' + employee?.email" class="link-purple">{{ employee?.email }}</a>
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">Phone</span>
                <span class="info-value">{{ employee?.phone || 'N/A' }}</span>
              </div>
            </div>
          </div>

          <div class="dark-card info-card fade-in" style="animation-delay:0.14s">
            <div class="card-header">
              <div class="card-icon-wrap" style="background:rgba(64,200,218,0.12)">
                <i class="fas fa-briefcase" style="color:#40c8da"></i>
              </div>
              <h3>Employment Information</h3>
            </div>
            <div class="info-rows">
              <div class="info-row">
                <span class="info-label">Department</span>
                <span class="info-value">
                  <span class="dept-badge" v-if="employee?.department_name">
                    {{ employee.department_name }}
                  </span>
                  <span v-else style="color:rgba(255,255,255,0.25)">Not assigned</span>
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">Position</span>
                <span class="info-value">{{ employee?.position_title || 'Not assigned' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Hire Date</span>
                <span class="info-value">{{ formatDate(employee?.hire_date) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Base Salary</span>
                <span class="info-value salary-value">{{ formatSalary(employee?.base_salary) }}</span>
              </div>
            </div>
          </div>

        </div>

        <div class="dark-card action-bar fade-in" style="animation-delay:0.32s">
          <div class="action-buttons">
            <button class="btn-ghost" @click="router.push('/employees')">
              <i class="fas fa-arrow-left me-2"></i>Back to List
            </button>
            <button class="btn-primary" @click="editEmployee">
              <i class="fas fa-edit me-2"></i>Edit Employee
            </button>
            <button class="btn-danger" @click="confirmDelete">
              <i class="fas fa-trash me-2"></i>Delete Employee
            </button>
          </div>
        </div>
      </template>
    </div>

    <div class="modal-overlay" v-if="showDeleteModal" @click="showDeleteModal = false">
      <div class="modal-box dark-card" @click.stop>
        <div class="modal-header">
          <h3>Confirm Delete</h3>
          <button class="btn-icon" @click="showDeleteModal = false"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <div class="delete-icon-wrap">
            <i class="fas fa-exclamation-triangle" style="color:#f87171; font-size:2.5rem"></i>
          </div>
          <p class="delete-msg">
            Are you sure you want to delete
            <strong style="color:rgba(255,255,255,0.9)">{{ employee?.first_name }} {{ employee?.last_name }}</strong>?
          </p>
          <p class="delete-warn">This action cannot be undone.</p>
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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayout from '@/components/layouts/MainLayout.vue'
import { useEmployeeStore } from '@/stores/employee'
import { toast } from 'vue3-toastify'

const route = useRoute()
const router = useRouter()
const employeeStore = useEmployeeStore()

const loading = ref(true)
const error = ref(null)
const employee = ref(null)
const showDeleteModal = ref(false)

const formatDate = (date) => { if (!date) return 'N/A'; return new Date(date).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }) }
const formatSalary = (salary) => { if (!salary) return 'Not specified'; return new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', minimumFractionDigits:2 }).format(salary) }
const getStatusClass = (status) => ({ active:'badge-active', inactive:'badge-inactive', suspended:'badge-terminated' })[status] || 'badge-inactive'
const getInitials = (first, last) => ((first?.charAt(0) || '') + (last?.charAt(0) || '')).toUpperCase()
const getAvatarGradient = (name) => {
  const g = ['linear-gradient(135deg,#6823ff,#13707f)','linear-gradient(135deg,#a47bff,#40c8da)','linear-gradient(135deg,#f87171,#a47bff)','linear-gradient(135deg,#fbbf24,#f87171)','linear-gradient(135deg,#34d399,#40c8da)']
  return g[(name?.charCodeAt(0) || 0) % g.length]
}

const editEmployee = () => router.push(`/employees/${route.params.id}/edit`)
const confirmDelete = () => { showDeleteModal.value = true }

const deleteEmployee = async () => {
  const result = await employeeStore.deleteEmployee(route.params.id)
  if (result?.success) { 
    toast.success('Employee deleted successfully')
    router.push('/employees') 
  } else { 
    toast.error(employeeStore.error || 'Failed to delete employee') 
  }
  showDeleteModal.value = false
}

onMounted(async () => {
  loading.value = true; error.value = null
  try {
    // ហៅទាញទិន្នន័យរួមពីឃ្លាំង Store សិនដើម្បីដំណើរការ
    await employeeStore.fetchEmployees()
    
    //ស្វែងរកទិន្នន័យបុគ្គលិកម្នាក់នេះយកមកបង្ហាញ Profile UI 
    const empId = route.params.id
    const foundEmp = employeeStore.employees.find(e => String(e.id) === String(empId))
    
    if (foundEmp) {
      employee.value = foundEmp
    } else {
      error.value = 'Employee record not found in the database.'
    }
  } catch (err) {
    error.value = 'Could not load employee details. Please try again.'; 
    console.error(err)
  } finally { 
    loading.value = false 
  }
})
</script>
<style scoped>
/* ── Base ── */
.employee-detail-container {
  padding: 1.5rem; max-width: 1400px; margin: 0 auto;
  display: flex; flex-direction: column; gap: 1.25rem;
}

/* ── Dark card ── */
.dark-card {
  background: #0d0d1a;
  border: 1px solid rgba(104,35,255,0.13);
  border-radius: 18px; padding: 1.5rem;
  transition: border-color 0.25s;
}
.dark-card:hover { border-color: rgba(104,35,255,0.22); }

/* ── States ── */
.loading-state, .error-state {
  text-align: center; padding: 4rem 2rem;
  color: rgba(255,255,255,0.5);
}

/* ── Header ── */
.header-content {
  display: flex; justify-content: space-between; align-items: center;
  gap: 1.5rem; flex-wrap: wrap;
}
.header-left { display: flex; align-items: center; gap: 1.25rem; }
.avatar-large {
  width: 64px; height: 64px; border-radius: 18px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: 800; font-size: 1.35rem;
  box-shadow: 0 8px 24px rgba(104,35,255,0.3);
}
.page-title {
  font-size: 1.55rem; font-weight: 700; color: rgba(255,255,255,0.92); margin-bottom: 0.5rem;
}
.header-badges { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.emp-id-badge {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  padding: 3px 10px; border-radius: 20px;
  font-family: 'Courier New', monospace; font-size: 0.73rem; font-weight: 700;
  color: rgba(255,255,255,0.45);
}
.dept-chip {
  background: rgba(64,200,218,0.1); color: #40c8da;
  padding: 3px 10px; border-radius: 20px; font-size: 0.73rem; font-weight: 600;
}
.badge-status {
  padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; text-transform: capitalize;
}
.badge-active { background: rgba(16,185,129,0.12); color: #34d399; }
.badge-inactive { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); }
.badge-terminated { background: rgba(239,68,68,0.12); color: #f87171; }
.header-actions { display: flex; gap: 0.75rem; }

/* ── Info Grid ── */
.info-grid {
  display: grid; grid-template-columns: repeat(2,1fr); gap: 1.25rem;
}
.info-card { }
.card-header {
  display: flex; align-items: center; gap: 0.85rem;
  margin-bottom: 1.25rem; padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.card-icon-wrap {
  width: 38px; height: 38px; border-radius: 11px;
  display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0;
}
.card-header h3 { margin: 0; font-size: 0.88rem; font-weight: 700; color: rgba(255,255,255,0.8); }
.info-rows { display: flex; flex-direction: column; gap: 0.7rem; }
.info-row { display: flex; align-items: baseline; gap: 1rem; }
.info-label {
  width: 110px; flex-shrink: 0; font-size: 0.75rem; font-weight: 600;
  color: rgba(255,255,255,0.28); text-transform: uppercase; letter-spacing: 0.4px;
}
.info-value { flex: 1; color: rgba(255,255,255,0.7); font-size: 0.83rem; font-weight: 500; }
.link-purple { color: #a47bff; text-decoration: none; transition: color 0.2s; }
.link-purple:hover { color: #c5a3ff; text-decoration: underline; }
.salary-value {
  background: linear-gradient(135deg,#a47bff,#40c8da);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  font-weight: 700; font-size: 0.9rem;
}
.dept-badge {
  background: rgba(164,123,255,0.12); color: #a47bff;
  padding: 2px 9px; border-radius: 20px; font-size: 0.73rem; font-weight: 700;
}

/* ── Action Bar ── */
.action-bar { }
.action-buttons { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }

/* ── Buttons ── */
.btn-primary {
  display: inline-flex; align-items: center; gap: 7px; padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg,#6823ff,#4f0fdb);
  border: none; border-radius: 10px; color: white;
  font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s, transform 0.1s;
  box-shadow: 0 4px 20px rgba(104,35,255,0.35);
}
.btn-primary:hover { opacity: 0.9; }
.mt-3 { margin-top: 1rem; }

.btn-ghost {
  display: inline-flex; align-items: center; gap: 6px; padding: 0.6rem 1.1rem;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px; color: rgba(255,255,255,0.5); font-size: 0.83rem; cursor: pointer; transition: all 0.2s;
}
.btn-ghost:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.8); }

.btn-danger {
  display: inline-flex; align-items: center; gap: 6px; padding: 0.6rem 1.2rem;
  background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.25);
  border-radius: 10px; color: #f87171; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.btn-danger:hover { background: rgba(239,68,68,0.22); border-color: rgba(239,68,68,0.45); }

.btn-icon {
  width: 32px; height: 32px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
  border-radius: 9px; color: rgba(255,255,255,0.4);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 0.8rem; transition: all 0.2s;
}
.btn-icon:hover { background: rgba(104,35,255,0.2); color: #c5a3ff; border-color: rgba(104,35,255,0.4); }

/* ── Modal ── */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-box { width: 420px; max-width: calc(100vw - 2rem); padding: 0; overflow: hidden; }
.modal-header {
  padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.modal-header h3 { margin: 0; font-size: 1rem; font-weight: 700; color: rgba(255,255,255,0.88); }
.modal-body { padding: 2rem 1.5rem; text-align: center; }
.delete-icon-wrap { margin-bottom: 1rem; }
.delete-msg { color: rgba(255,255,255,0.6); font-size: 0.88rem; margin-bottom: 0.35rem; }
.delete-warn { font-size: 0.75rem; color: rgba(255,255,255,0.25); }
.modal-footer {
  padding: 1.25rem 1.5rem; display: flex; gap: 0.75rem; justify-content: flex-end;
  border-top: 1px solid rgba(255,255,255,0.06);
}

/* ── Animation ── */
@keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
.fade-in { animation: fadeIn 0.45s ease both; }

/* ── Responsive ── */
@media (max-width: 1024px) { .info-grid { grid-template-columns: 1fr; } }
@media (max-width: 768px) {
  .employee-detail-container { padding: 1rem; }
  .header-content { flex-direction: column; align-items: flex-start; }
  .action-buttons { flex-direction: column; }
  .info-row { flex-direction: column; gap: 0.2rem; }
  .info-label { width: auto; }
}
</style>