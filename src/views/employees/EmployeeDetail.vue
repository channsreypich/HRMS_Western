<template>
  <MainLayout>
    <div class="employee-detail-container">
      <!-- ⬜ Loading state configured for clean light layouts -->
      <div v-if="loading" class="light-card loading-state fade-in">
        <div class="liquid-loading"></div>
        <p>Loading employee details...</p>
      </div>

      <!-- ⬜ Error layout with clean borders -->
      <div v-else-if="error" class="light-card error-state fade-in">
        <i class="fas fa-exclamation-triangle fa-3x mb-3" style="color: #dc2626"></i>
        <h3>Error Loading Employee</h3>
        <p>{{ error }}</p>
        <button class="btn-primary mt-3" @click="router.push('/employees')">
          Back to Employees
        </button>
      </div>

      <template v-else>
        <!-- ⬜ Profile Header Card -->
        <div class="light-card header-section fade-in">
          <div class="header-content">
            <div class="header-left">
              <div
                class="avatar-large"
                :style="{ background: getAvatarGradient(employee?.first_name) }"
              >
                {{ getInitials(employee?.first_name, employee?.last_name) }}
              </div>
              <div>
                <h1 class="page-title">{{ employee?.first_name }} {{ employee?.last_name }}</h1>
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
          <!-- ⬜ Profile Block: Personal Details -->
          <div class="light-card info-card fade-in" style="animation-delay: 0.08s">
            <div class="card-header">
              <div class="card-icon-wrap" style="background: rgba(104, 35, 255, 0.08)">
                <i class="fas fa-user" style="color: #6823ff"></i>
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
                  <a :href="'mailto:' + employee?.email" class="link-purple">{{
                    employee?.email
                  }}</a>
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">Phone</span>
                <span class="info-value">{{ employee?.phone || 'N/A' }}</span>
              </div>
            </div>
          </div>

          <!-- ⬜ Profile Block: Job Parameters -->
          <div class="light-card info-card fade-in" style="animation-delay: 0.14s">
            <div class="card-header">
              <div class="card-icon-wrap" style="background: rgba(6, 182, 212, 0.08)">
                <i class="fas fa-briefcase" style="color: #06b6d4"></i>
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
                  <span v-else style="color: #94a3b8">Not assigned</span>
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
                <span class="info-value salary-value">{{
                  formatSalary(employee?.base_salary)
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ⬜ Bottom Action Toolbar Layout -->
        <div class="light-card action-bar fade-in" style="animation-delay: 0.32s">
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

    <!-- 🗳️ Prompt Dialog Layer Reconstructed for clean white popups -->
    <div class="modal-overlay" v-if="showDeleteModal" @click="showDeleteModal = false">
      <div class="modal-box light-card" @click.stop>
        <div class="modal-header">
          <h3>Confirm Delete</h3>
          <button class="btn-icon" @click="showDeleteModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="delete-icon-wrap">
            <i class="fas fa-exclamation-triangle" style="color: #dc2626; font-size: 2.5rem"></i>
          </div>
          <p class="delete-msg">
            Are you sure you want to delete
            <strong style="color: #0f172a"
              >{{ employee?.first_name }} {{ employee?.last_name }}</strong
            >?
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

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
const formatSalary = (salary) => {
  if (!salary) return 'Not specified'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(salary)
}
const getStatusClass = (status) =>
  ({ active: 'badge-active', inactive: 'badge-inactive', suspended: 'badge-terminated' })[status] ||
  'badge-inactive'
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

const editEmployee = () => router.push(`/employees/${route.params.id}/edit`)
const confirmDelete = () => {
  showDeleteModal.value = true
}

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
  loading.value = true
  error.value = null
  try {
    await employeeStore.fetchEmployees()
    const empId = route.params.id
    const foundEmp = employeeStore.employees.find((e) => String(e.id) === String(empId))

    if (foundEmp) {
      employee.value = foundEmp
    } else {
      error.value = 'Employee record not found in the database.'
    }
  } catch (err) {
    error.value = 'Could not load employee details. Please try again.'
    console.error(err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* ── Base Container Layout ── */
.employee-detail-container {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ── Crisp Clean White Cards ── */
.light-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.03),
    0 2px 4px -1px rgba(0, 0, 0, 0.01);
  border-radius: 18px;
  padding: 1.5rem;
  transition:
    border-color 0.25s,
    box-shadow 0.25s;
}
.light-card:hover {
  border-color: rgba(104, 35, 255, 0.2);
  box-shadow: 0 6px 12px -1px rgba(104, 35, 255, 0.04);
}

/* ── Content States ── */
.loading-state,
.error-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
}
.error-state h3 {
  color: #0f172a;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

/* ── Profile Header Section ── */
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}
.avatar-large {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 800;
  font-size: 1.35rem;
  box-shadow: 0 6px 16px rgba(104, 35, 255, 0.25);
}
.page-title {
  font-size: 1.55rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.5rem 0;
}
.header-badges {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.emp-id-badge {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 3px 10px;
  border-radius: 20px;
  font-family: 'Courier New', monospace;
  font-size: 0.73rem;
  font-weight: 700;
  color: #475569;
}
.dept-chip {
  background: rgba(6, 182, 212, 0.08);
  color: #0891b2;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.73rem;
  font-weight: 600;
}
.badge-status {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: capitalize;
}
.badge-active {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}
.badge-inactive {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}
.badge-terminated {
  background: rgba(220, 38, 38, 0.08);
  color: #dc2626;
}
.header-actions {
  display: flex;
  gap: 0.75rem;
}

/* ── Split Information Block Layout ── */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f1f5f9;
}
.card-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}
.card-header h3 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: #1e293b;
}
.info-rows {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.info-row {
  display: flex;
  align-items: baseline;
  gap: 1rem;
}

.info-label {
  width: 110px;
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.info-value {
  flex: 1;
  color: #334155;
  font-size: 0.88rem;
  font-weight: 500;
}
.link-purple {
  color: #6823ff;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}
.link-purple:hover {
  color: #4f0fdb;
  text-decoration: underline;
}

.salary-value {
  background: linear-gradient(135deg, #4f0fdb, #0891b2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
  font-size: 0.95rem;
}
.dept-badge {
  background: rgba(104, 35, 255, 0.08);
  color: #6823ff;
  padding: 2px 9px;
  border-radius: 20px;
  font-size: 0.73rem;
  font-weight: 700;
}

/* ── Interactive Toolbar Actions ── */
.action-buttons {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

/* ── UI Button Controls ── */
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
  transition:
    opacity 0.2s,
    transform 0.1s;
  box-shadow: 0 4px 14px rgba(104, 35, 255, 0.2);
}
.btn-primary:hover {
  opacity: 0.95;
}
.btn-primary:active {
  transform: scale(0.98);
}
.mt-3 {
  margin-top: 1rem;
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.6rem 1.1rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #475569;
  font-size: 0.83rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-ghost:hover {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.6rem 1.2rem;
  background: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: 10px;
  color: #dc2626;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-danger:hover {
  background: #fee2e2;
  border-color: #f87171;
  color: #b91c1c;
}

.btn-icon {
  width: 32px;
  height: 32px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  transition: all 0.2s;
}
.btn-icon:hover {
  background: rgba(104, 35, 255, 0.08);
  color: #6823ff;
  border-color: rgba(104, 35, 255, 0.2);
}

/* ── Warning Confirmation Modals ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-box {
  width: 420px;
  max-width: calc(100vw - 2rem);
  padding: 0;
  overflow: hidden;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
.modal-header {
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
}
.modal-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}
.modal-body {
  padding: 2rem 1.5rem;
  text-align: center;
}
.delete-icon-wrap {
  margin-bottom: 1rem;
}
.delete-msg {
  color: #334155;
  font-size: 0.9rem;
  margin-bottom: 0.35rem;
}
.delete-warn {
  font-size: 0.78rem;
  color: #64748b;
  font-weight: 500;
}
.modal-footer {
  padding: 1.25rem 1.5rem;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

/* ── Structural Transition System ── */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.fade-in {
  animation: fadeIn 0.4s ease-out both;
}

/* ── Mobile Layout Media Overrides ── */
@media (max-width: 1024px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .employee-detail-container {
    padding: 1rem;
  }
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  .action-buttons {
    flex-direction: column;
    width: 100%;
  }
  .action-buttons button {
    width: 100%;
    justify-content: center;
  }
  .info-row {
    flex-direction: column;
    gap: 0.2rem;
  }
  .info-label {
    width: auto;
  }
}
</style>
