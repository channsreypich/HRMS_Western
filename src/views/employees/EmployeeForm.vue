<template>
  <MainLayout>
    <div class="employee-form-container">
      <div class="light-card header-section fade-in">
        <div class="header-content">
          <div>
            <h1 class="page-title">
              <i class="fas fa-user-edit me-2" style="color: #6823ff"></i>
              <span class="text-gradient">{{ isEdit ? 'Edit Employee' : 'Add New Employee' }}</span>
            </h1>
            <p class="page-subtitle">
              {{ isEdit ? 'Update employee information' : 'Add a new employee to the system' }}
            </p>
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

      <div class="light-card steps-track fade-in" style="animation-delay: 0.06s">
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

      <div class="light-card form-content fade-in" style="animation-delay: 0.12s">
        <div v-show="currentStep === 0" class="form-step">
          <h3 class="step-title">
            <i class="fas fa-user me-2" style="color: #6823ff"></i>Personal Information
          </h3>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">First Name</label>
              <input
                type="text"
                class="light-input"
                v-model="form.first_name"
                @input="onNameInput('first_name')"
                placeholder="Enter first name"
                :class="{ 'is-invalid': errors.first_name }"
              />
              <span class="err-msg" v-if="errors.first_name">{{ errors.first_name }}</span>
            </div>
            <div class="form-group">
              <label class="form-label required">Last Name</label>
              <input
                type="text"
                class="light-input"
                v-model="form.last_name"
                @input="onNameInput('last_name')"
                placeholder="Enter last name"
                :class="{ 'is-invalid': errors.last_name }"
              />
              <span class="err-msg" v-if="errors.last_name">{{ errors.last_name }}</span>
            </div>
            <div class="form-group">
              <label class="form-label required">Email</label>
              <input
                type="email"
                class="light-input"
                v-model="form.email"
                placeholder="employee@company.com"
                :class="{ 'is-invalid': errors.email }"
                :disabled="isEdit"
              />
              <span class="err-msg" v-if="errors.email">{{ errors.email }}</span>
            </div>
            <div class="form-group">
              <label class="form-label required">Phone</label>
              <input
                type="tel"
                inputmode="numeric"
                class="light-input"
                v-model="form.phone"
                @input="onPhoneInput"
                placeholder="e.g., 012345678"
                :class="{ 'is-invalid': errors.phone }"
              />
              <span class="err-msg" v-if="errors.phone">{{ errors.phone }}</span>
            </div>
            <div class="form-group">
              <label class="form-label" :class="{ required: !isEdit }">Login Password</label>
              <input
                type="text"
                class="light-input"
                v-model="form.password"
                :placeholder="isEdit ? 'Leave blank to keep current password' : 'Set a login password'"
                :class="{ 'is-invalid': errors.password }"
              />
              <span class="err-msg" v-if="errors.password">{{ errors.password }}</span>
              <small v-else class="text-muted" style="font-size: 11px; color: #64748b">
                The employee signs in with their <strong>email</strong> + this password.
              </small>
            </div>
          </div>
        </div>

        <div v-show="currentStep === 1" class="form-step">
          <h3 class="step-title">
            <i class="fas fa-briefcase me-2" style="color: #06b6d4"></i>Employment Details
          </h3>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">Department</label>
              <select
                class="light-select"
                v-model="form.department_id"
                :class="{ 'is-invalid': errors.department_id }"
              >
                <option value="">Select Department</option>
                <option v-for="dept in departments" :key="dept.id" :value="dept.id">
                  {{ dept.name }} ({{ dept.code }})
                </option>
              </select>
              <span class="err-msg" v-if="errors.department_id">{{ errors.department_id }}</span>
            </div>
            <div class="form-group">
              <label class="form-label required">Position</label>
              <select
                class="light-select"
                v-model="form.position_id"
                :class="{ 'is-invalid': errors.position_id }"
              >
                <option value="">Select Position</option>
                <option v-for="pos in positions" :key="pos.id" :value="pos.id">
                  {{ pos.title }}
                </option>
              </select>
              <span class="err-msg" v-if="errors.position_id">{{ errors.position_id }}</span>
            </div>
            <div class="form-group">
              <label class="form-label required">Status</label>
              <select
                class="light-select"
                v-model="form.status"
                :class="{ 'is-invalid': errors.status }"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
              <span class="err-msg" v-if="errors.status">{{ errors.status }}</span>
            </div>
            <div class="form-group">
              <label class="form-label required">Hire Date</label>
              <input
                type="date"
                class="light-input"
                v-model="form.hire_date"
                :class="{ 'is-invalid': errors.hire_date }"
              />
              <span class="err-msg" v-if="errors.hire_date">{{ errors.hire_date }}</span>
            </div>
          </div>
        </div>

        <div v-show="currentStep === 2" class="form-step">
          <h3 class="step-title">
            <i class="fas fa-money-bill me-2" style="color: #059669"></i>Compensation Info
          </h3>
          <div class="info-alert">
            <i class="fas fa-info-circle me-2"></i>
            <span
              >Set the employee's monthly <strong>base salary</strong>. It is saved straight to the
              database and used to generate payroll.</span
            >
          </div>
          <div class="form-grid mt-3">
            <div class="form-group">
              <label class="form-label required">Base Salary (USD / month)</label>
              <div class="salary-wrap" :class="{ 'is-invalid': errors.base_salary }">
                <span class="salary-prefix">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  class="salary-input"
                  v-model.number="form.base_salary"
                  placeholder="0.00"
                />
              </div>
              <span class="err-msg" v-if="errors.base_salary">{{ errors.base_salary }}</span>
            </div>
            <div class="form-group">
              <label class="form-label">Employee Code</label>
              <input
                type="text"
                class="light-input"
                :value="isEdit ? form.employee_code || '—' : 'Auto-generated on creation'"
                disabled
                style="opacity: 0.65; background: #f1f5f9"
              />
              <small class="text-muted" style="font-size: 11px; color: #64748b"
                >This is the code the employee enters to scan attendance.</small
              >
            </div>
          </div>
        </div>

        <div v-show="currentStep === 3" class="form-step">
          <h3 class="step-title">
            <i class="fas fa-file-alt me-2" style="color: #b45309"></i>Verification Documents
          </h3>
          <div
            class="upload-zone"
            @click="triggerFileUpload"
            @dragover.prevent
            @drop.prevent="handleFileDrop"
          >
            <div class="upload-icon"><i class="fas fa-cloud-upload-alt"></i></div>
            <p class="upload-text">Drag & drop files here or click to upload</p>
            <p class="upload-sub">Supported: PDF, JPG, PNG (Max 5MB)</p>
            <input
              type="file"
              ref="fileInput"
              class="d-none"
              multiple
              @change="handleFileSelect"
              accept=".pdf,.jpg,.jpeg,.png"
            />
          </div>
          <div class="uploaded-files" v-if="documentsList.length">
            <div v-for="(file, index) in documentsList" :key="index" class="file-row">
              <i :class="getFileIcon(file.type)" class="file-icon"></i>
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
              <button class="btn-icon danger" @click="removeFile(index)">
                <i class="fas fa-times"></i>
              </button>
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
import api from '@/services/api'

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

const form = reactive({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  hire_date: new Date().toISOString().split('T')[0],
  department_id: '',
  position_id: '',
  status: 'active',
  base_salary: '',
  employee_code: '',
  username: '', // Add an input for this or generate it
  password: '', // HR sets the login password (prefilled with a default on create)
  role_id: '',
})

const steps = [
  { label: 'Personal Info', description: 'Basic information', icon: 'fas fa-user' },
  { label: 'Employment', description: 'Job details', icon: 'fas fa-briefcase' },
  { label: 'Compensation', description: 'Salary synced', icon: 'fas fa-money-bill' },
  { label: 'Documents', description: 'Verification docs', icon: 'fas fa-file-alt' },
]

const errors = ref({})

const departments = computed(() => departmentStore.departments)
const positions = computed(() => positionStore.positions)

// Letters, spaces, hyphens and apostrophes only — must start with a letter
const NAME_RE = /^[A-Za-z][A-Za-z\s'-]*$/
// 8–15 digits, optionally a single leading +
const PHONE_RE = /^\+?\d{8,15}$/

// Live input filters so the user physically cannot type invalid characters
const onNameInput = (field) => {
  form[field] = form[field].replace(/[^A-Za-z\s'-]/g, '')
}
const onPhoneInput = () => {
  // keep digits and a single leading +
  form.phone = form.phone.replace(/(?!^)\+/g, '').replace(/[^\d+]/g, '')
}

const validateStep = (step) => {
  const e = {}
  if (step === 0) {
    if (!form.first_name?.trim()) e.first_name = 'First name is required'
    else if (!NAME_RE.test(form.first_name.trim()))
      e.first_name = 'Name cannot contain numbers or symbols'
    if (!form.last_name?.trim()) e.last_name = 'Last name is required'
    else if (!NAME_RE.test(form.last_name.trim()))
      e.last_name = 'Name cannot contain numbers or symbols'
    if (!form.email) e.email = 'Email is required'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email format'
    if (!form.phone?.trim()) e.phone = 'Phone number is required'
    else if (!PHONE_RE.test(form.phone.trim())) e.phone = 'Phone must be 8–15 digits (numbers only)'
    if (!isEdit.value && !form.password) e.password = 'Login password is required'
    else if (form.password && form.password.length < 6)
      e.password = 'Password must be at least 6 characters'
  } else if (step === 1) {
    if (!form.department_id) e.department_id = 'Department selection is required'
    if (!form.position_id) e.position_id = 'Position selection is required'
    if (!form.status) e.status = 'Status is required'
    if (!form.hire_date) e.hire_date = 'Hire date is required'
  } else if (step === 2) {
    if (form.base_salary === '' || form.base_salary === null || form.base_salary === undefined)
      e.base_salary = 'Base salary is required'
    else if (Number(form.base_salary) < 0) e.base_salary = 'Base salary cannot be negative'
  }
  errors.value = e
  return Object.keys(e).length === 0
}

const nextStep = () => {
  if (validateStep(currentStep.value)) currentStep.value++
}
const previousStep = () => {
  currentStep.value--
}
const goToStep = (step) => {
  if (step < currentStep.value || validateStep(currentStep.value)) currentStep.value = step
}

  const saveEmployee = async () => {
    // 1. Validation Logic
    for (let i = 0; i <= currentStep.value; i++) {
      if (!validateStep(i)) {
        currentStep.value = i
        toast.error('Please fill in all required fields')
        return
      }
    }

    saving.value = true

    // 2. Map form to backend DTO structure (role_id omitted -> backend defaults to EMPLOYEE)
    const payload = {
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      phone: form.phone,
      hire_date: form.hire_date,
      department_id: form.department_id,
      position_id: form.position_id,
      status: form.status,
      // Always send salary so an edit never accidentally blanks it on the backend
      base_salary:
        form.base_salary === '' || form.base_salary == null ? 0 : Number(form.base_salary),
      username: form.email.split('@')[0],
    }
    // Only send a password when set: required on create, optional on edit (blank = keep current)
    if (form.password) payload.password = form.password
    if (form.role_id) payload.role_id = form.role_id

    try {
      let employeeId = route.params.id
      if (isEdit.value) {
        const res = await employeeStore.updateEmployee(route.params.id, payload)
        if (!res.success) throw new Error(res.error || 'Failed to update employee')
      } else {
        const res = await employeeStore.createEmployee(payload)
        if (!res.success) throw new Error(res.error || 'Failed to create employee')
        employeeId = res.data?.id
      }

      // 3. Upload any attached documents for this employee
      const newFiles = documentsList.value.filter((d) => d.file)
      if (employeeId && newFiles.length) {
        await Promise.all(
          newFiles.map((d) => {
            const fd = new FormData()
            fd.append('file', d.file)
            return api.post(`/api/documents/upload/${employeeId}`, fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
            })
          }),
        )
      }

      toast.success(isEdit.value ? 'Employee updated successfully' : 'Employee created successfully')
      router.push('/employees')
    } catch (error) {
      console.error('Submission Error:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to sync data with database')
    } finally {
      saving.value = false
    }
}

const cancelForm = () => {
  if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.'))
    router.push('/employees')
}

const triggerFileUpload = () => {
  fileInput.value.click()
}
const handleFileSelect = (event) => {
  addFiles(Array.from(event.target.files))
}
const handleFileDrop = (event) => {
  addFiles(Array.from(event.dataTransfer.files))
}
const addFiles = (files) => {
  const max = 5 * 1024 * 1024
  files.forEach((f) => {
    if (f.size > max) {
      toast.error(`${f.name} exceeds 5MB limit`)
      return
    }
    documentsList.value.push({ name: f.name, size: f.size, type: f.type, file: f })
  })
}
const removeFile = (index) => {
  documentsList.value.splice(index, 1)
}
const getFileIcon = (type) => {
  if (type.includes('pdf')) return 'fas fa-file-pdf'
  if (type.includes('image')) return 'fas fa-file-image'
  return 'fas fa-file'
}
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024,
    s = ['Bytes', 'KB', 'MB'],
    i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + s[i]
}

onMounted(async () => {
  await departmentStore.fetchDepartments()
  await positionStore.fetchPositions()

  // Prefill a sensible default password for NEW employees (HR can change it before saving)
  if (!isEdit.value) {
    form.password = 'Password@123'
  }

  if (isEdit.value) {
    await employeeStore.fetchEmployees()
    const emp = employeeStore.employees.find((e) => String(e.id) === String(route.params.id))
    if (emp) {
      Object.assign(form, {
        first_name: emp.first_name || '',
        last_name: emp.last_name || '',
        email: emp.email || '',
        phone: emp.phone || '',
        hire_date: emp.hire_date
          ? new Date(emp.hire_date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        department_id: emp.department_id || '',
        position_id: emp.position_id || '',
        status: emp.status || 'active',
        base_salary: emp.base_salary ?? 0,
        employee_code: emp.employee_code ?? '',
      })
    }
  }
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 768
  })
})
</script>

<style scoped>
/* ── Base Container System ── */
.employee-form-container {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ── Modern Crisp White Cards ── */
.light-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.03),
    0 2px 4px -1px rgba(0, 0, 0, 0.01);
  border-radius: 18px;
  padding: 1.5rem;
  transition: border-color 0.25s;
}

/* ── Top Header Section ── */
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.3rem;
}
.text-gradient {
  background: linear-gradient(135deg, #531cbd, #11606d);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.page-subtitle {
  font-size: 0.85rem;
  color: #64748b;
}
.header-actions {
  display: flex;
  gap: 0.75rem;
}

/* ── Multi-Step Indicator Timeline ── */
.steps-track {
  display: flex;
  align-items: flex-start;
  padding: 1.25rem 1.75rem;
  gap: 0;
}
.step-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex: 1;
  position: relative;
  cursor: pointer;
}
.step-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #e2e8f0;
  background: #f8fafc;
  color: #94a3b8;
  font-size: 1rem;
  transition: all 0.3s;
  z-index: 1;
}
.step-item.active .step-circle {
  border-color: #6823ff;
  color: #6823ff;
  background: rgba(104, 35, 255, 0.08);
  box-shadow: 0 0 14px rgba(104, 35, 255, 0.15);
}
.step-item.completed .step-circle {
  border-color: #059669;
  color: white;
  background: #059669;
}
.step-info {
  flex: 1;
}
.step-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
}
.step-desc {
  font-size: 0.72rem;
  color: #94a3b8;
}
.step-item.active .step-label {
  color: #6823ff;
}
.step-item.completed .step-label {
  color: #059669;
}
.step-connector {
  position: absolute;
  top: 22px;
  left: calc(44px + 0.85rem);
  right: calc(-1 * (0.85rem));
  height: 2px;
  background: #e2e8f0;
  z-index: 0;
}
.step-item.completed .step-connector {
  background: rgba(5, 150, 105, 0.4);
}

/* ── Standardized Form Elements ── */
.form-step {
  animation: fadeIn 0.35s ease;
}
.step-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
}
.form-group {
  display: flex;
  flex-direction: column;
}
.form-label {
  display: block;
  margin-bottom: 0.45rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: #64748b;
}
.form-label.required::after {
  content: '*';
  color: #dc2626;
  margin-left: 3px;
}

/* ⬜ Clear light inputs system */
.light-input,
.light-select {
  width: 100%;
  padding: 0.65rem 1rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #0f172a;
  font-size: 0.88rem;
  outline: none;
  transition: all 0.2s;
}
.light-input:focus,
.light-select:focus {
  border-color: #6823ff;
  box-shadow: 0 0 0 3px rgba(104, 35, 255, 0.1);
}
.light-input.is-invalid,
.light-select.is-invalid {
  border-color: #dc2626;
  background-color: #fffafb;
}
.light-input::placeholder {
  color: #94a3b8;
}
.err-msg {
  margin-top: 0.35rem;
  font-size: 0.72rem;
  color: #dc2626;
  font-weight: 500;
}

/* ── Base Salary Alert Strip ── */
.info-alert {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 0.85rem 1rem;
  display: flex;
  align-items: center;
  color: #166534;
  font-size: 0.83rem;
}

/* ── Editable Salary Field ── */
.salary-wrap {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.2s;
}
.salary-wrap:focus-within {
  border-color: #6823ff;
  box-shadow: 0 0 0 3px rgba(104, 35, 255, 0.1);
}
.salary-wrap.is-invalid {
  border-color: #dc2626;
  background-color: #fffafb;
}
.salary-prefix {
  padding: 0.65rem 0.5rem 0.65rem 1rem;
  color: #64748b;
  font-weight: 700;
  font-size: 0.95rem;
}
.salary-input {
  flex: 1;
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  padding: 0.65rem 1rem 0.65rem 0.25rem;
  color: #0f172a;
  font-size: 0.88rem;
}

/* ── Document Drop-Zone Spaces ── */
.upload-zone {
  border: 2px dashed #cbd5e1;
  background: #f8fafc;
  border-radius: 14px;
  padding: 2.5rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}
.upload-zone:hover {
  border-color: #6823ff;
  background: rgba(104, 35, 255, 0.03);
}
.upload-icon {
  font-size: 2.5rem;
  color: #94a3b8;
  margin-bottom: 0.75rem;
}
.upload-text {
  color: #334155;
  font-size: 0.88rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}
.upload-sub {
  color: #64748b;
  font-size: 0.75rem;
}
.d-none {
  display: none;
}

.uploaded-files {
  margin-top: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.file-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.6rem 0.9rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}
.file-icon {
  color: #6823ff;
  font-size: 1rem;
}
.file-name {
  flex: 1;
  font-size: 0.83rem;
  color: #334155;
  font-weight: 500;
}
.file-size {
  font-size: 0.72rem;
  color: #64748b;
}

/* ── Flow Steering Controls ── */
.form-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding-top: 1.25rem;
  border-top: 1px solid #f1f5f9;
  gap: 1rem;
}
.step-indicator {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
  white-space: nowrap;
}

/* ── Action Buttons Styling ── */
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
.btn-primary:hover:not(:disabled) {
  opacity: 0.95;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
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
.btn-ghost:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}
.btn-ghost:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-success {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0.6rem 1.3rem;
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.2);
}
.btn-success:hover:not(:disabled) {
  opacity: 0.95;
}

.btn-icon {
  width: 32px;
  height: 32px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 9px;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  transition: all 0.2s;
  flex-shrink: 0;
}
.btn-icon:hover {
  background: rgba(104, 35, 255, 0.08);
  color: #6823ff;
  border-color: rgba(104, 35, 255, 0.2);
}
.btn-icon.danger:hover {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fca5a5;
}

/* ── Struct Animation ── */
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
@media (max-width: 768px) {
  .employee-form-container {
    padding: 1rem;
  }
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  .steps-track {
    padding: 1rem;
  }
  .step-info {
    display: none;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
  .form-nav {
    flex-wrap: wrap;
  }
  .step-indicator {
    order: -1;
    width: 100%;
    text-align: center;
  }
  .btn-success {
    width: 100%;
    justify-content: center;
  }
}
</style>
