<template>
  <MainLayout>
    <div class="employee-form-container">

      <div class="dark-card header-section fade-in">
        <div class="header-content">
          <div>
            <h1 class="page-title">
              <i class="fas fa-user-edit me-2" style="color:#a47bff"></i>
              <span class="text-gradient">{{ isEdit ? 'Edit Employee' : 'Add New Employee' }}</span>
            </h1>
            <p class="page-subtitle">{{ isEdit ? 'Update employee information' : 'Add a new employee to the system' }}</p>
          </div>
          <div class="header-actions">
            <button class="btn-ghost" @click="cancelForm">
              <i class="fas fa-times me-2"></i>Cancel
            </button>
            <button class="btn-primary" @click="saveEmployee" :disabled="saving">
              <i class="fas fa-save me-2"></i>{{ saving ? 'Saving...' : 'Save Employee' }}
            </button>
          </div>
        </div>
      </div>

      <div class="steps-track fade-in" style="animation-delay:0.06s">
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="step-item"
          :class="{ active: currentStep === index, completed: currentStep > index }"
          @click="goToStep(index)"
        >
          <div class="step-circle">
            <i v-if="currentStep > index" class="fas fa-check"></i>
            <i v-else :class="step.icon"></i>
          </div>
          <div class="step-info" v-if="!isMobile">
            <span class="step-label">{{ step.label }}</span>
            <span class="step-desc">{{ step.description }}</span>
          </div>
          <div class="step-connector" v-if="index < steps.length - 1"></div>
        </div>
      </div>

      <div class="dark-card form-content fade-in" style="animation-delay:0.12s">

        <div v-show="currentStep === 0" class="form-step">
          <h3 class="step-title"><i class="fas fa-user me-2" style="color:#a47bff"></i>Personal Information</h3>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">First Name</label>
              <input type="text" class="dark-input" v-model="form.first_name" placeholder="Enter first name" :class="{ 'is-invalid': errors.first_name }" />
              <span class="err-msg" v-if="errors.first_name">{{ errors.first_name }}</span>
            </div>
            <div class="form-group">
              <label class="form-label required">Last Name</label>
              <input type="text" class="dark-input" v-model="form.last_name" placeholder="Enter last name" :class="{ 'is-invalid': errors.last_name }" />
              <span class="err-msg" v-if="errors.last_name">{{ errors.last_name }}</span>
            </div>
            <div class="form-group">
              <label class="form-label required">Email</label>
              <input type="email" class="dark-input" v-model="form.email" placeholder="employee@company.com" :class="{ 'is-invalid': errors.email }" :disabled="isEdit" />
              <span class="err-msg" v-if="errors.email">{{ errors.email }}</span>
            </div>
            <div class="form-group">
              <label class="form-label required">Phone</label>
              <input type="tel" class="dark-input" v-model="form.phone" placeholder="e.g., 012345678" :class="{ 'is-invalid': errors.phone }" />
              <span class="err-msg" v-if="errors.phone">{{ errors.phone }}</span>
            </div>
          </div>
        </div>

        <div v-show="currentStep === 1" class="form-step">
          <h3 class="step-title"><i class="fas fa-briefcase me-2" style="color:#40c8da"></i>Employment Details</h3>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">Department</label>
              <select class="dark-select" v-model="form.department_id" :class="{ 'is-invalid': errors.department_id }">
                <option value="">Select Department</option>
                <option v-for="dept in departments" :key="dept.id" :value="dept.id">{{ dept.name }} ({{ dept.code }})</option>
              </select>
              <span class="err-msg" v-if="errors.department_id">{{ errors.department_id }}</span>
            </div>
            <div class="form-group">
              <label class="form-label required">Position</label>
              <select class="dark-select" v-model="form.position_id" :class="{ 'is-invalid': errors.position_id }">
                <option value="">Select Position</option>
                <option v-for="pos in positions" :key="pos.id" :value="pos.id">{{ pos.title }}</option>
              </select>
              <span class="err-msg" v-if="errors.position_id">{{ errors.position_id }}</span>
            </div>
            <div class="form-group">
              <label class="form-label required">Status</label>
              <select class="dark-select" v-model="form.status" :class="{ 'is-invalid': errors.status }">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
              <span class="err-msg" v-if="errors.status">{{ errors.status }}</span>
            </div>
            <div class="form-group">
              <label class="form-label required">Hire Date</label>
              <input type="date" class="dark-input" v-model="form.hire_date" :class="{ 'is-invalid': errors.hire_date }" />
              <span class="err-msg" v-if="errors.hire_date">{{ errors.hire_date }}</span>
            </div>
          </div>
        </div>

        <div v-show="currentStep === 2" class="form-step">
          <h3 class="step-title"><i class="fas fa-money-bill me-2" style="color:#34d399"></i>Compensation Info</h3>
          <div class="info-alert">
            <i class="fas fa-info-circle me-2"></i>
            <span>Base salary is automatically synced from the chosen <strong>Position Profile</strong> in the system database.</span>
          </div>
          <div class="form-grid mt-3">
            <div class="form-group">
              <label class="form-label">System Record ID</label>
              <input type="text" class="dark-input" :value="isEdit ? `EMP-${String(route.params.id).padStart(3, '0')}` : 'Auto-generated on creation'" disabled style="opacity: 0.6;" />
            </div>
          </div>
        </div>

        <div v-show="currentStep === 3" class="form-step">
          <h3 class="step-title"><i class="fas fa-file-alt me-2" style="color:#fbbf24"></i>Verification Documents</h3>
          <div class="upload-zone" @click="triggerFileUpload" @dragover.prevent @drop.prevent="handleFileDrop">
            <div class="upload-icon"><i class="fas fa-cloud-upload-alt"></i></div>
            <p class="upload-text">Drag & drop files here or click to upload</p>
            <p class="upload-sub">Supported: PDF, JPG, PNG (Max 5MB)</p>
            <input type="file" ref="fileInput" class="d-none" multiple @change="handleFileSelect" accept=".pdf,.jpg,.jpeg,.png" />
          </div>
          <div class="uploaded-files" v-if="documentsList.length">
            <div v-for="(file, index) in documentsList" :key="index" class="file-row">
              <i :class="getFileIcon(file.type)" class="file-icon"></i>
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
              <button class="btn-icon danger" @click="removeFile(index)"><i class="fas fa-times"></i></button>
            </div>
          </div>
        </div>

        <div class="form-nav">
          <button class="btn-ghost" @click="previousStep" :disabled="currentStep === 0">
            <i class="fas fa-chevron-left me-2"></i>Previous
          </button>
          <div class="step-indicator">Step {{ currentStep + 1 }} of {{ steps.length }}</div>
          <button v-if="currentStep < steps.length - 1" class="btn-primary" @click="nextStep">
            Next <i class="fas fa-chevron-right ms-2"></i>
          </button>
          <button v-else class="btn-success" @click="saveEmployee" :disabled="saving">
            <i class="fas fa-check me-2"></i>{{ saving ? 'Saving...' : 'Submit' }}
          </button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayout from '@/components/layouts/MainLayout.vue'
import { useEmployeeStore } from '@/stores/employee'
import { useDepartmentStore } from '@/stores/department'
import { usePositionStore } from '@/stores/position'
import { toast } from 'vue3-toastify'

const route = useRoute()
const router = useRouter()
const employeeStore = useEmployeeStore()
const departmentStore = useDepartmentStore()
const positionStore = usePositionStore()

const isEdit = computed(() => !!route.params.id)
const saving = ref(false)
const currentStep = ref(0)
const isMobile = ref(window.innerWidth < 768)
const fileInput = ref(null)
const documentsList = ref([])

// Form Reactive Object match with Columns in MySQL database 
const form = reactive({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  hire_date: new Date().toISOString().split('T')[0],
  department_id: '',
  position_id: '',
  status: 'active'
})

const steps = [
  { label: 'Personal Info', description: 'Basic information', icon: 'fas fa-user' },
  { label: 'Employment', description: 'Job details', icon: 'fas fa-briefcase' },
  { label: 'Compensation', description: 'Salary synced', icon: 'fas fa-money-bill' },
  { label: 'Documents', description: 'Verification docs', icon: 'fas fa-file-alt' },
]

const errors = ref({})

// Get data array list from pinia store
const departments = computed(() => departmentStore.departments)
const positions = computed(() => positionStore.positions)

// Validate inputs each step and remove check password logic
const validateStep = (step) => {
  const e = {}
  if (step === 0) {
    if (!form.first_name) e.first_name = 'First name is required'
    if (!form.last_name) e.last_name = 'Last name is required'
    if (!form.email) e.email = 'Email is required'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email format'
    if (!form.phone) e.phone = 'Phone number is required'
  } else if (step === 1) {
    if (!form.department_id) e.department_id = 'Department selection is required'
    if (!form.position_id) e.position_id = 'Position selection is required'
    if (!form.status) e.status = 'Status is required'
    if (!form.hire_date) e.hire_date = 'Hire date is required'
  }
  errors.value = e
  return Object.keys(e).length === 0
}

const nextStep = () => { if (validateStep(currentStep.value)) currentStep.value++ }
const previousStep = () => { currentStep.value-- }
const goToStep = (step) => { if (step < currentStep.value || validateStep(currentStep.value)) currentStep.value = step }

// Main function logic save data to store and database
const saveEmployee = async () => {
  for (let i = 0; i <= currentStep.value; i++) {
    if (!validateStep(i)) { currentStep.value = i; toast.error('Please fill in all required fields'); return }
  }
  saving.value = true
  try {
    if (isEdit.value) { 
      // Update employee information route
      const res = await employeeStore.updateEmployee(route.params.id, form);
      if (res) toast.success('Employee updated successfully')
    } else { 
      
      // Auto generate employee_code because it is NOT NULL column in MySQL table
      const payload = {
        ...form,
        employee_code: 'EMP-' + Date.now() 
      }

      // Send payload object to create employee store api
      const res = await employeeStore.createEmployee(payload);
      if (res) toast.success('Employee created successfully')
    }
    router.push('/employees')
  } catch (error) { 
    toast.error(error.message || 'Failed to sync data with database') 
  } finally { 
    saving.value = false 
  }
}

const cancelForm = () => { if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) router.push('/employees') }

const triggerFileUpload = () => { fileInput.value.click() }
const handleFileSelect = (event) => { addFiles(Array.from(event.target.files)) }
const handleFileDrop = (event) => { addFiles(Array.from(event.dataTransfer.files)) }
const addFiles = (files) => {
  const max = 5 * 1024 * 1024
  files.forEach(f => {
    if (f.size > max) { toast.error(`${f.name} exceeds 5MB limit`); return }
    documentsList.value.push({ name: f.name, size: f.size, type: f.type })
  })
}
const removeFile = (index) => { documentsList.value.splice(index, 1) }
const getFileIcon = (type) => {
  if (type.includes('pdf')) return 'fas fa-file-pdf'
  if (type.includes('image')) return 'fas fa-file-image'
  return 'fas fa-file'
}
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024, s = ['Bytes','KB','MB'], i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + s[i]
}

onMounted(async () => {
  // Fetch lists data from drop down components
  await departmentStore.fetchDepartments()
  await positionStore.fetchPositions()
  
  if (isEdit.value) {
    // If route state is edit find employee profile object data
    await employeeStore.fetchEmployees()
    const emp = employeeStore.employees.find(e => String(e.id) === String(route.params.id))
    if (emp) {
      Object.assign(form, {
        first_name: emp.first_name,
        last_name: emp.last_name,
        email: emp.email,
        phone: emp.phone,
        hire_date: new Date(emp.hire_date).toISOString().split('T')[0],
        department_id: emp.department_id,
        position_id: emp.position_id,
        status: emp.status
      })
    }
  }
  window.addEventListener('resize', () => { isMobile.value = window.innerWidth < 768 })
})
</script>

<style scoped>
/* ── Base ── */
.employee-form-container {
  padding: 1.5rem; max-width: 1200px; margin: 0 auto;
  display: flex; flex-direction: column; gap: 1.25rem;
}

/* ── Dark card ── */
.dark-card {
  background: #0d0d1a;
  border: 1px solid rgba(104,35,255,0.13);
  border-radius: 18px; padding: 1.5rem;
  transition: border-color 0.25s;
}

/* ── Header ── */
.header-content {
  display: flex; justify-content: space-between; align-items: center;
  gap: 1rem; flex-wrap: wrap;
}
.page-title { font-size: 1.6rem; font-weight: 700; color: rgba(255,255,255,0.92); margin-bottom: 0.3rem; }
.text-gradient {
  background: linear-gradient(135deg,#a47bff,#40c8da);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.page-subtitle { font-size: 0.83rem; color: rgba(255,255,255,0.35); }
.header-actions { display: flex; gap: 0.75rem; }

/* ── Steps Track ── */
.steps-track {
  display: flex; align-items: flex-start;
  background: #0d0d1a;
  border: 1px solid rgba(104,35,255,0.13);
  border-radius: 18px; padding: 1.25rem 1.75rem;
  gap: 0;
}
.step-item {
  display: flex; align-items: center; gap: 0.85rem;
  flex: 1; position: relative; cursor: pointer;
}
.step-circle {
  width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.3); font-size: 1rem;
  transition: all 0.3s; z-index: 1;
}
.step-item.active .step-circle {
  border-color: #a47bff; color: #a47bff; background: rgba(164,123,255,0.12);
  box-shadow: 0 0 20px rgba(164,123,255,0.25);
}
.step-item.completed .step-circle {
  border-color: #34d399; color: white; background: #34d399;
}
.step-info { flex: 1; }
.step-label { display: block; font-size: 0.8rem; font-weight: 700; color: rgba(255,255,255,0.7); }
.step-desc { font-size: 0.7rem; color: rgba(255,255,255,0.28); }
.step-item.active .step-label { color: #a47bff; }
.step-item.completed .step-label { color: #34d399; }
.step-connector {
  position: absolute; top: 22px; left: calc(44px + 0.85rem);
  right: calc(-1 * (0.85rem));
  height: 2px; background: rgba(255,255,255,0.07); z-index: 0;
}
.step-item.completed .step-connector { background: rgba(52,211,153,0.3); }

/* ── Form ── */
.form-step { animation: fadeIn 0.3s ease; }
.step-title {
  font-size: 0.95rem; font-weight: 700; color: rgba(255,255,255,0.8);
  margin-bottom: 1.5rem; padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex; align-items: center;
}
.mt-section { margin-top: 2rem; }
.subsection-title {
  font-size: 0.83rem; font-weight: 700; color: rgba(255,255,255,0.6);
  margin: 1.5rem 0 1rem; display: flex; align-items: center;
}
.form-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
}
.form-group { display: flex; flex-direction: column; }
.form-label {
  display: block; margin-bottom: 0.45rem;
  font-size: 0.75rem; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase;
  color: rgba(255,255,255,0.35);
}
.form-label.required::after { content: '*'; color: #f87171; margin-left: 3px; }

.dark-input, .dark-select {
  width: 100%; padding: 0.65rem 1rem;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px; color: rgba(255,255,255,0.75);
  font-size: 0.83rem; outline: none; transition: border-color 0.2s, box-shadow 0.2s;
}
.dark-input:focus, .dark-select:focus {
  border-color: rgba(104,35,255,0.5);
  box-shadow: 0 0 0 3px rgba(104,35,255,0.08);
}
.dark-input.is-invalid, .dark-select.is-invalid { border-color: rgba(248,113,113,0.5); }
.dark-input::placeholder { color: rgba(255,255,255,0.18); }
.dark-select option { background: #0d0d1a; }
.err-msg { margin-top: 0.3rem; font-size: 0.72rem; color: #f87171; }

.input-with-prefix { display: flex; }
.input-prefix {
  padding: 0.65rem 0.85rem;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
  border-right: none; border-radius: 10px 0 0 10px;
  color: rgba(255,255,255,0.3); font-size: 0.83rem;
}
.dark-input.prefixed { border-radius: 0 10px 10px 0; }

/* ── Allowances ── */
.allowances-list { display: flex; flex-direction: column; gap: 0.75rem; }
.allowance-row {
  display: grid; grid-template-columns: 1fr 200px auto;
  gap: 0.75rem; align-items: center;
  background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px; padding: 0.75rem;
}
.btn-add-row {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 0.55rem 1.1rem;
  background: rgba(164,123,255,0.08); border: 1px dashed rgba(164,123,255,0.3);
  border-radius: 10px; color: #a47bff; font-size: 0.8rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s; align-self: flex-start;
}
.btn-add-row:hover { background: rgba(164,123,255,0.15); border-color: rgba(164,123,255,0.5); }

/* ── Upload ── */
.upload-zone {
  border: 2px dashed rgba(255,255,255,0.1);
  border-radius: 14px; padding: 2.5rem 2rem; text-align: center;
  cursor: pointer; transition: all 0.25s;
}
.upload-zone:hover {
  border-color: rgba(104,35,255,0.5); background: rgba(104,35,255,0.05);
}
.upload-icon { font-size: 2.5rem; color: rgba(164,123,255,0.5); margin-bottom: 0.75rem; }
.upload-text { color: rgba(255,255,255,0.55); font-size: 0.88rem; margin-bottom: 0.25rem; }
.upload-sub { color: rgba(255,255,255,0.25); font-size: 0.75rem; }
.d-none { display: none; }

.uploaded-files { margin-top: 0.85rem; display: flex; flex-direction: column; gap: 0.5rem; }
.file-row {
  display: flex; align-items: center; gap: 0.85rem;
  padding: 0.6rem 0.9rem;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
  border-radius: 10px;
}
.file-icon { color: #a47bff; font-size: 1rem; }
.file-name { flex: 1; font-size: 0.8rem; color: rgba(255,255,255,0.7); }
.file-size { font-size: 0.72rem; color: rgba(255,255,255,0.25); }

/* ── Navigation ── */
.form-nav {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 2rem; padding-top: 1.25rem;
  border-top: 1px solid rgba(255,255,255,0.06);
  gap: 1rem;
}
.step-indicator { font-size: 0.78rem; color: rgba(255,255,255,0.25); white-space: nowrap; }

/* ── Buttons ── */
.btn-primary {
  display: inline-flex; align-items: center; gap: 7px; padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg,#6823ff,#4f0fdb);
  border: none; border-radius: 10px; color: white;
  font-size: 0.85rem; font-weight: 600; cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
  box-shadow: 0 4px 20px rgba(104,35,255,0.35);
}
.btn-primary:hover:not(:disabled) { opacity: 0.9; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-ghost {
  display: inline-flex; align-items: center; gap: 6px; padding: 0.6rem 1.1rem;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px; color: rgba(255,255,255,0.5); font-size: 0.83rem; cursor: pointer; transition: all 0.2s;
}
.btn-ghost:hover:not(:disabled) { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.8); }
.btn-ghost:disabled { opacity: 0.3; cursor: not-allowed; }

.btn-success {
  display: inline-flex; align-items: center; gap: 7px; padding: 0.6rem 1.3rem;
  background: linear-gradient(135deg,#10b981,#059669);
  border: none; border-radius: 10px; color: white;
  font-size: 0.85rem; font-weight: 600; cursor: pointer;
  transition: opacity 0.2s; box-shadow: 0 4px 20px rgba(16,185,129,0.3);
}
.btn-success:hover:not(:disabled) { opacity: 0.9; }
.btn-success:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-icon {
  width: 32px; height: 32px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
  border-radius: 9px; color: rgba(255,255,255,0.4);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 0.8rem; transition: all 0.2s; flex-shrink: 0;
}
.btn-icon:hover { background: rgba(104,35,255,0.2); color: #c5a3ff; border-color: rgba(104,35,255,0.4); }
.btn-icon.danger:hover { background: rgba(239,68,68,0.15); color: #f87171; border-color: rgba(239,68,68,0.3); }

/* ── Animation ── */
@keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
.fade-in { animation: fadeIn 0.45s ease both; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .employee-form-container { padding: 1rem; }
  .header-content { flex-direction: column; align-items: flex-start; }
  .steps-track { padding: 1rem; }
  .step-info { display: none; }
  .form-grid { grid-template-columns: 1fr; }
  .allowance-row { grid-template-columns: 1fr; }
  .form-nav { flex-wrap: wrap; }
  .step-indicator { order: -1; width: 100%; text-align: center; }
  .btn-success { width: 100%; justify-content: center; }
}
</style>