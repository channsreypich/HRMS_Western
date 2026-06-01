<template>
  <div class="public-scan-wrapper">
    <div class="glass-scan-card fade-in">
      <div class="scan-header text-center">
        <div class="qr-icon-animation">
          <i class="fas fa-qrcode"></i>
        </div>
        <h2 class="text-gradient mt-3">Staff Attendance</h2>

        <p v-if="!isConfigured" class="text-muted small">
          Please enter your ID once to register this mobile device.
        </p>
        <p v-else class="text-muted small">
          Device Registered: <strong style="color: #40c8da">{{ form.employee_code }}</strong>
        </p>
        <span
          v-if="IS_TEST_MODE"
          style="
            background: rgba(251, 191, 36, 0.2);
            color: #fbbf24;
            padding: 2px 8px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: bold;
          "
          >TEST MODE ENABLED (GPS BYPASSED)</span
        >
      </div>

      <div v-if="!isConfigured" class="mt-4">
        <div class="form-group mb-4">
          <label class="form-label-custom"
            ><i class="fas fa-id-badge me-2" style="color: #6823ff"></i>Employee Code (ID)</label
          >
          <input
            type="text"
            v-model="temporaryCode"
            class="form-control-custom"
            placeholder="e.g. EMP001"
          />
        </div>
        <button type="button" class="btn-scan btn-checkin w-100" @click="saveSetup">
          <i class="fas fa-save me-2"></i> Register Device
        </button>
      </div>

      <form v-else @submit.prevent class="mt-4">
        <div class="form-group mb-4">
          <label class="form-label-custom"
            ><i class="fas fa-camera me-2" style="color: #40c8da"></i>Take a Selfie Verification
            *</label
          >
          <div class="file-input-wrapper">
            <input
              type="file"
              accept="image/*"
              capture="user"
              @change="handleFileUpload"
              class="form-control-file-hidden"
              id="selfie-camera"
              required
            />
            <label for="selfie-camera" class="btn-upload-trigger">
              <i class="fas fa-user-circle me-2"></i>
              {{ fileName || 'Tap to Open Front Camera' }}
            </label>
          </div>

          <div v-if="previewUrl" class="image-preview-box mt-3 text-center">
            <img :src="previewUrl" alt="Selfie Preview" class="img-preview-thumb" />
          </div>
        </div>

        <div class="actions-grid mt-4">
          <button
            type="button"
            class="btn-scan btn-checkin"
            @click="triggerAttendance('Present')"
            :disabled="isSubmitting"
          >
            <i class="fas fa-sign-in-alt me-2"></i> {{ isSubmitting ? 'Verifying...' : 'Check In' }}
          </button>
          <button
            type="button"
            class="btn-scan btn-checkout"
            @click="triggerAttendance('Left')"
            :disabled="isSubmitting"
          >
            <i class="fas fa-sign-out-alt me-2"></i>
            {{ isSubmitting ? 'Verifying...' : 'Check Out' }}
          </button>
        </div>

        <div class="text-center mt-4">
          <span
            @click="resetSetup"
            style="
              color: rgba(255, 255, 255, 0.3);
              font-size: 11px;
              cursor: pointer;
              text-decoration: underline;
            "
          >
            Change Employee ID
          </span>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'

const isConfigured = ref(false)
const temporaryCode = ref('')

const form = reactive({ employee_code: '' })
const selfieFile = ref(null)
const fileName = ref('')
const previewUrl = ref('')
const isSubmitting = ref(false)

const OFFICE_LAT = 11.5723117
const OFFICE_LNG = 104.8715964
const ALLOWED_RADIUS_METERS = 50

const IS_TEST_MODE = ref(true)

onMounted(() => {
  const savedCode = localStorage.getItem('user_employee_code')
  if (savedCode) {
    form.employee_code = savedCode
    isConfigured.value = true
  }
})

const saveSetup = () => {
  if (!temporaryCode.value.trim()) {
    Swal.fire({ icon: 'warning', title: 'Oops...', text: 'Please enter your Employee Code!' })
    return
  }
  localStorage.setItem('user_employee_code', temporaryCode.value.trim())
  form.employee_code = temporaryCode.value.trim()
  isConfigured.value = true
  Swal.fire({
    icon: 'success',
    title: 'Device Registered!',
    text: `This device is now linked to ${form.employee_code}`,
    timer: 2000,
    showConfirmButton: false,
  })
}

const resetSetup = () => {
  Swal.fire({
    title: 'Are you sure?',
    text: 'Do you want to unlink this Employee ID from this device?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#6823ff',
    cancelButtonColor: '#2d2d44',
    confirmButtonText: 'Yes, change it!',
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem('user_employee_code')
      form.employee_code = ''
      temporaryCode.value = ''
      isConfigured.value = false
    }
  })
}

// រូបមន្តគណនាចម្ងាយផែនដី (Haversine Formula)
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3
  const p1 = (lat1 * Math.PI) / 180
  const p2 = (lat2 * Math.PI) / 180
  const deltaP = ((lat2 - lat1) * Math.PI) / 180
  const deltaL = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(deltaP / 2) * Math.sin(deltaP / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(deltaL / 2) * Math.sin(deltaL / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    selfieFile.value = file
    fileName.value = file.name
    previewUrl.value = URL.createObjectURL(file)
  }
}

// មុខងារបញ្ជូនទិន្នន័យវត្តមាន ផ្ដាច់មុខងារ GPS បណ្ដោះអាសន្នបើស្ថិតក្នុង Test Mode
const sendAttendancePayload = async (statusType) => {
  const formData = new FormData()
  formData.append('employee_code', form.employee_code)

  if (selfieFile.value) {
    formData.append('selfie', selfieFile.value)
  }

  try {
    const endpoint = statusType === 'Present' ? 'check-in' : 'check-out'
    const res = await axios.post(`http://localhost:8001/api/attendance/${endpoint}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    if (res.data.success) {
      Swal.fire({ icon: 'success', title: 'Success!', text: res.data.message, timer: 3000 })
      selfieFile.value = null
      fileName.value = ''
      previewUrl.value = ''
    }
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Failed',
      text: err.response?.data?.message || 'Verification failed.',
    })
  } finally {
    isSubmitting.value = false
  }
}

const triggerAttendance = (statusType) => {
  if (statusType === 'Present' && !selfieFile.value) {
    Swal.fire({
      icon: 'warning',
      title: 'Selfie Required',
      text: 'Please take a selfie photo to verify check-in!',
    })
    return
  }

  isSubmitting.value = true

  // បើសិនជាបើក IS_TEST_MODE គឺបាញ់ទិន្នន័យទៅ Backend យកតែម្តង ដោយមិនបាច់ឆែក GPS នាំឱ្យគាំងឡើយ
  if (IS_TEST_MODE.value) {
    sendAttendancePayload(statusType)
    return
  }

  if (!navigator.geolocation) {
    Swal.fire({
      icon: 'error',
      title: 'GPS Error',
      text: 'Your browser does not support GPS Geolocation.',
    })
    isSubmitting.value = false
    return
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const userLat = position.coords.latitude
      const userLng = position.coords.longitude

      const distance = getDistance(userLat, userLng, OFFICE_LAT, OFFICE_LNG)

      if (distance > ALLOWED_RADIUS_METERS) {
        Swal.fire({
          icon: 'error',
          title: 'Scan Denied!',
          text: `You are outside the office area. Current distance: ${Math.round(distance)}m away.`,
        })
        isSubmitting.value = false
        return
      }

      sendAttendancePayload(statusType)
    },
    () => {
      Swal.fire({
        icon: 'info',
        title: 'GPS Required',
        text: 'Please enable GPS Location access on your phone to scan attendance.',
      })
      isSubmitting.value = false
    },
  )
}
</script>

<style scoped>
/* Core Layout & Background Wrapper - Updated to Light Slate */
.public-scan-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% 50%, #f8fafc 0%, #e2e8f0 100%);
  padding: 1.5rem;
  font-family:
    'Inter',
    system-ui,
    -apple-system,
    sans-serif;
}

/* Premium Light Glassmorphic Card */
.glass-scan-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 24px;
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 440px;
  box-shadow:
    0 20px 40px rgba(15, 23, 42, 0.06),
    0 1px 3px rgba(15, 23, 42, 0.02);
}

/* Header & Icon Elements */
.qr-icon-animation {
  font-size: 3.25rem;
  color: #6823ff;
  display: inline-block;
  animation: pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.text-gradient {
  background: linear-gradient(135deg, #6823ff 0%, #0284c7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.85rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

/* Input Fields & Form Typography */
.form-label-custom {
  display: flex;
  align-items: center;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.6rem;
}

.form-control-custom {
  width: 100%;
  padding: 0.95rem 1.1rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  color: #0f172a;
  font-size: 1rem;
  outline: none;
  transition: all 0.2s ease;
}

.form-control-custom:focus {
  border-color: #6823ff;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(104, 35, 255, 0.15);
}

.form-control-custom::placeholder {
  color: #94a3b8;
}

/* Native Camera Interface Mimic */
.form-control-file-hidden {
  display: none;
}

.btn-upload-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 1.1rem;
  background: rgba(14, 165, 233, 0.04);
  border: 2px dashed rgba(14, 165, 233, 0.3);
  border-radius: 12px;
  color: #0284c7;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-upload-trigger:hover {
  background: rgba(14, 165, 233, 0.08);
  border-color: #0284c7;
  color: #0369a1;
}

/* Circle Selfie Preview */
.img-preview-thumb {
  width: 130px;
  height: 130px;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid #0284c7;
  box-shadow: 0 8px 20px rgba(14, 165, 233, 0.2);
  padding: 3px;
  background: #ffffff;
}

/* Actions & Button Grids */
.actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.btn-scan {
  padding: 0.95rem;
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-checkin {
  background: linear-gradient(135deg, #6823ff 0%, #5215e6 100%);
  box-shadow: 0 4px 15px rgba(104, 35, 255, 0.25);
}

.btn-checkin:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(104, 35, 255, 0.35);
}

.btn-checkout {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-checkout:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

.btn-scan:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn-scan:active:not(:disabled) {
  transform: translateY(0);
}

.btn-scan:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

/* Alignment Helpers */
.w-100 {
  width: 100%;
}
.mt-3 {
  margin-top: 1rem;
}
.mt-4 {
  margin-top: 1.5rem;
}
.mb-4 {
  margin-bottom: 1.5rem;
}
.me-2 {
  margin-right: 0.5rem;
}
.text-center {
  text-align: center;
}

.text-muted {
  color: #64748b !important;
}
.small {
  font-size: 0.85rem;
}

/* Animations */
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.8;
    filter: drop-shadow(0 0 0px rgba(104, 35, 255, 0));
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
    color: #0284c7;
    filter: drop-shadow(0 0 8px rgba(14, 165, 233, 0.3));
  }
  100% {
    transform: scale(1);
    opacity: 0.8;
    filter: drop-shadow(0 0 0px rgba(104, 35, 255, 0));
  }
}

.fade-in {
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
