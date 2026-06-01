<template>
  <MainLayout>
    <div class="leave-form-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <i class="fas fa-calendar-day me-2 text-gradient"></i>Apply for Leave
          </h1>
          <p class="page-sub">Submit a leave request for approval</p>
        </div>
        <router-link to="/leave" class="btn-outline">
          <i class="fas fa-arrow-left"></i> Back to Leave
        </router-link>
      </div>

      <div class="form-layout">
        <div class="dark-card form-card">
          <h3 class="card-title">Leave Request Details</h3>
          <form @submit.prevent="submitLeave" class="leave-form">
            <div class="form-field">
              <label>Select Employee *</label>
              <select v-model="form.employee_id" class="light-select" required>
                <option value="">-- Choose Employee --</option>
                <option v-for="emp in employees" :key="emp.id" :value="emp.id">
                  {{ emp.employee_code }} : {{ emp.first_name }} {{ emp.last_name }}
                </option>
              </select>
            </div>

            <div class="form-field">
              <label>Leave Type *</label>
              <div class="type-picker">
                <div
                  v-for="lt in leaveTypes"
                  :key="lt.value"
                  class="type-option"
                  :class="{ selected: form.leave_type === lt.value }"
                  :style="
                    form.leave_type === lt.value
                      ? { borderColor: lt.color, background: lt.color + '12' }
                      : {}
                  "
                  @click="form.leave_type = lt.value"
                >
                  <span class="type-dot" :style="{ background: lt.color }"></span>
                  <span>{{ lt.name }}</span>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label>From Date *</label>
                <input type="date" v-model="form.start_date" required @change="calcDays" />
              </div>
              <div class="form-field">
                <label>To Date *</label>
                <input
                  type="date"
                  v-model="form.to_date"
                  :min="form.start_date"
                  required
                  @change="calcDays"
                />
              </div>
            </div>

            <div class="days-display" v-if="displayDays > 0">
              <i class="fas fa-calendar-day"></i>
              <strong>{{ displayDays }}</strong> working day{{
                displayDays > 1 ? 's' : ''
              }}
              selected
            </div>

            <div class="form-field">
              <label>Reason *</label>
              <textarea
                v-model="form.reason"
                rows="4"
                placeholder="Please explain the reason for your leave request..."
                required
              ></textarea>
            </div>

            <div class="form-field">
              <label>Supporting Document</label>
              <div
                class="file-upload-area"
                @click="triggerFileInput"
                @dragover.prevent
                @drop.prevent="handleDrop"
              >
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Drag & drop or <span class="click-link">click to upload</span></p>
                <p class="file-hint">PDF, JPG, PNG up to 5MB</p>
                <p class="file-name" v-if="fileName">{{ fileName }}</p>
              </div>
              <input
                type="file"
                ref="fileInput"
                style="display: none"
                @change="handleFile"
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </div>

            <div class="form-actions">
              <router-link to="/leave" class="btn-outline">Cancel</router-link>
              <button
                type="submit"
                class="btn-primary"
                :disabled="leaveStore.loading || displayDays <= 0"
              >
                <span v-if="leaveStore.loading" class="spinner-sm"></span>
                <i v-else class="fas fa-paper-plane me-2"></i>
                Submit Leave Request
              </button>
            </div>
          </form>
        </div>

        <div class="info-panel">
          <div class="dark-card info-card" v-if="selectedType">
            <h4 class="info-title">Leave Policy</h4>
            <div class="policy-row">
              <span class="policy-label">Type</span>
              <span class="policy-val" :style="{ color: selectedType.color }">{{
                selectedType.name
              }}</span>
            </div>
            <div class="policy-row">
              <span class="policy-label">Max Days/Year</span>
              <span class="policy-val">{{ selectedType.max_days }} days</span>
            </div>
            <div class="policy-row">
              <span class="policy-label">Carry Forward</span>
              <span
                class="policy-val"
                :class="selectedType.carry_forward ? 'text-green' : 'text-red'"
              >
                {{ selectedType.carry_forward ? 'Yes' : 'No' }}
              </span>
            </div>
          </div>

          <div class="dark-card info-card">
            <h4 class="info-title">
              <i class="fas fa-lightbulb me-2" style="color: #d97706"></i>Tips
            </h4>
            <ul class="tips-list">
              <li>Submit your request at least <strong>3 days</strong> in advance</li>
              <li>Emergency leave can be submitted on the same day</li>
              <li>Approval is usually within <strong>24 hours</strong></li>
              <li>Check your leave balance before applying</li>
            </ul>
          </div>

          <div class="dark-card info-card preview-card" v-if="displayDays > 0">
            <h4 class="info-title">Request Preview</h4>
            <div class="preview-item">
              <span class="preview-label">Type</span>
              <span
                class="type-pill"
                v-if="selectedType"
                :style="{ background: selectedType.color + '12', color: selectedType.color }"
                >{{ selectedType.name }}</span
              >
            </div>
            <div class="preview-item" v-if="form.start_date">
              <span class="preview-label">From</span>
              <span class="preview-val">{{ formatDate(form.start_date) }}</span>
            </div>
            <div class="preview-item" v-if="form.to_date">
              <span class="preview-label">To</span>
              <span class="preview-val">{{ formatDate(form.to_date) }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">Duration</span>
              <span class="preview-val highlight"
                >{{ displayDays }} day{{ displayDays !== 1 ? 's' : '' }}</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/components/layouts/MainLayout.vue'
import { useLeaveStore } from '@/stores/leave'
import { useEmployeeStore } from '@/stores/employee'
import { toast } from 'vue3-toastify'

const leaveStore = useLeaveStore()
const employeeStore = useEmployeeStore()
const router = useRouter()

const fileInput = ref(null)
const fileName = ref('')
const displayDays = ref(0)

const leaveTypes = ref([
  { name: 'Annual Leave', value: 'annual', color: '#6823ff', max_days: 18, carry_forward: true },
  { name: 'Sick Leave', value: 'sick', color: '#0284c7', max_days: 7, carry_forward: false },
  { name: 'Casual Leave', value: 'casual', color: '#d97706', max_days: 5, carry_forward: false },
])

const form = reactive({
  employee_id: '',
  leave_type: 'annual',
  start_date: '',
  to_date: '',
  reason: '',
})

const employees = computed(() => {
  return employeeStore.employees || employeeStore.employeeList || []
})

const selectedType = computed(() => leaveTypes.value.find((lt) => lt.value === form.leave_type))

const calcDays = () => {
  if (form.start_date && form.to_date) {
    const diff = (new Date(form.to_date) - new Date(form.start_date)) / (1000 * 60 * 60 * 24) + 1
    displayDays.value = Math.max(0, diff)
  }
}

const formatDate = (d) =>
  d
    ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : ''
const triggerFileInput = () => fileInput.value?.click()
const handleFile = (e) => {
  fileName.value = e.target.files[0]?.name || ''
}
const handleDrop = (e) => {
  fileName.value = e.dataTransfer.files[0]?.name || ''
}

async function submitLeave() {
  if (!form.employee_id) {
    toast.error('Please select an employee!')
    return
  }

  const payload = {
    employee_id: form.employee_id,
    leave_type: form.leave_type,
    start_date: form.start_date,
    end_date: form.to_date,
    reason: form.reason,
  }

  const res = await leaveStore.createLeaveRequest(payload)
  if (res?.success) {
    toast.success('Leave request submitted successfully!')
    router.push('/leave')
  } else {
    toast.error(leaveStore.error || 'Failed to submit leave request')
  }
}

onMounted(async () => {
  await employeeStore.fetchEmployees()
})
</script>

<style scoped>
/* Structural Canvas & Core Frame Layout */
.leave-form-container {
  padding: 2rem;
  max-width: 1200px;
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
  margin-bottom: 0.5rem;
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

/* Control Action Buttons */
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
  box-shadow: none;
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
  text-decoration: none;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.btn-outline:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #0f172a;
}

/* Two-Column Form Container Layout */
.form-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 1.5rem;
}
.dark-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow:
    0 4px 6px -1px rgba(15, 23, 42, 0.03),
    0 2px 4px -1px rgba(15, 23, 42, 0.02);
}
.card-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 1.5rem;
}
.leave-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Input Form Controls Framework */
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
.form-field input,
.form-field textarea,
.light-select {
  padding: 0.65rem 0.9rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #0f172a;
  font-size: 0.9rem;
  outline: none;
  font-family: inherit;
  transition: all 0.2s ease;
}
.form-field input:focus,
.form-field textarea:focus,
.light-select:focus {
  border-color: #6823ff;
  box-shadow: 0 0 0 3px rgba(104, 35, 255, 0.1);
}
.form-field textarea {
  resize: vertical;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* Form Component Pickers */
.type-picker {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
}
.type-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0.65rem 0.85rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  color: #475569;
  font-weight: 500;
}
.type-option:hover {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}
.type-option.selected {
  color: #0f172a;
  font-weight: 700;
  border-width: 1px;
}
.type-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.days-display {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0.85rem 1.25rem;
  background: #eeebff;
  border: 1px solid rgba(104, 35, 255, 0.2);
  border-radius: 12px;
  color: #5215e6;
  font-size: 0.9rem;
  font-weight: 500;
}
.days-display strong {
  font-size: 1.15rem;
  color: #6823ff;
}

/* Document Attachment Area */
.file-upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: 14px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #64748b;
  background: #f8fafc;
}
.file-upload-area:hover {
  border-color: #6823ff;
  background: #f5f3ff;
  color: #0f172a;
}
.file-upload-area i {
  font-size: 2.25rem;
  margin-bottom: 0.5rem;
  color: #94a3b8;
}
.file-upload-area:hover i {
  color: #6823ff;
}
.file-upload-area p {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.4;
}
.click-link {
  color: #6823ff;
  font-weight: 700;
}
.file-hint {
  font-size: 0.75rem !important;
  color: #94a3b8 !important;
  margin-top: 4px !important;
}
.file-name {
  font-size: 0.825rem !important;
  color: #15803d !important;
  font-weight: 600;
  margin-top: 8px !important;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e2e8f0;
}

/* Metrics & Policy Panel */
.info-panel {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.info-card {
  padding: 1.25rem 1.5rem;
}
.info-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: #475569;
  margin: 0 0 1rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.policy-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f1f5f9;
}
.policy-row:last-child {
  border-bottom: none;
}
.policy-label {
  font-size: 0.85rem;
  color: #64748b;
}
.policy-val {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
}
.text-green {
  color: #16a34a !important;
}
.text-red {
  color: #dc2626 !important;
}

.tips-list {
  margin: 0;
  padding-left: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.tips-list li {
  font-size: 0.85rem;
  color: #475569;
  line-height: 1.4;
}
.tips-list strong {
  color: #0f172a;
}

/* Real-time Preview Card Components */
.preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f1f5f9;
}
.preview-item:last-child {
  border-bottom: none;
}
.preview-label {
  font-size: 0.85rem;
  color: #64748b;
}
.preview-val {
  font-size: 0.875rem;
  color: #1e293b;
  font-weight: 600;
}
.preview-val.highlight {
  color: #6823ff;
  font-weight: 800;
}
.type-pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
}

/* Runtime Load Spinners */
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
.me-2 {
  margin-right: 0.5rem;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .form-layout {
    grid-template-columns: 1fr;
  }
}
</style>
