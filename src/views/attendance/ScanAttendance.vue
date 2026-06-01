<template>
  <div class="public-scan-wrapper">
    <div class="glass-scan-card fade-in">
      
      <div class="scan-header text-center">
        <div class="qr-icon-animation">
          <i class="fas fa-qrcode"></i>
        </div>
        <h2 class="text-gradient mt-3">Staff Attendance</h2>
        
        <p v-if="!isConfigured" class="text-muted small">Please enter your ID once to register this mobile device.</p>
        <p v-else class="text-muted small">Device Registered: <strong style="color: #40c8da;">{{ form.employee_code }}</strong></p>
        <span v-if="IS_TEST_MODE" style="background: rgba(251,191,36,0.2); color: #fbbf24; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: bold;">TEST MODE ENABLED (GPS BYPASSED)</span>
      </div>

      <div v-if="!isConfigured" class="mt-4">
        <div class="form-group mb-4">
          <label class="form-label-custom"><i class="fas fa-id-badge me-2" style="color: #6823ff"></i>Employee Code (ID)</label>
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
          <label class="form-label-custom"><i class="fas fa-camera me-2" style="color: #40c8da"></i>Take a Selfie Verification *</label>
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
          <button type="button" class="btn-scan btn-checkin" @click="triggerAttendance('Present')" :disabled="isSubmitting">
            <i class="fas fa-sign-in-alt me-2"></i> {{ isSubmitting ? 'Verifying...' : 'Check In' }}
          </button>
          <button type="button" class="btn-scan btn-checkout" @click="triggerAttendance('Left')" :disabled="isSubmitting">
            <i class="fas fa-sign-out-alt me-2"></i> {{ isSubmitting ? 'Verifying...' : 'Check Out' }}
          </button>
        </div>

        <div class="text-center mt-4">
          <span @click="resetSetup" style="color: rgba(255,255,255,0.3); font-size: 11px; cursor: pointer; text-decoration: underline;">
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

const OFFICE_LAT = 11.5723117;   
const OFFICE_LNG = 104.8715964;  
const ALLOWED_RADIUS_METERS = 50 

const IS_TEST_MODE = ref(true); 

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
  Swal.fire({ icon: 'success', title: 'Device Registered!', text: `This device is now linked to ${form.employee_code}`, timer: 2000, showConfirmButton: false })
}

const resetSetup = () => {
  Swal.fire({
    title: 'Are you sure?',
    text: "Do you want to unlink this Employee ID from this device?",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#6823ff',
    cancelButtonColor: '#2d2d44',
    confirmButtonText: 'Yes, change it!'
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
  const p1 = lat1 * Math.PI / 180
  const p2 = lat2 * Math.PI / 180
  const deltaP = (lat2 - lat1) * Math.PI / 180
  const deltaL = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(deltaP/2) * Math.sin(deltaP/2) +
            Math.cos(p1) * Math.cos(p2) * Math.sin(deltaL/2) * Math.sin(deltaL/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
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
    const endpoint = statusType === 'Present' ? 'check-in' : 'check-out';
    const res = await axios.post(`http://localhost:8001/api/attendance/${endpoint}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    if (res.data.success) {
      Swal.fire({ icon: 'success', title: 'Success!', text: res.data.message, timer: 3000 })
      selfieFile.value = null
      fileName.value = ''
      previewUrl.value = ''
    }
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'Failed', text: err.response?.data?.message || 'Verification failed.' })
  } finally {
    isSubmitting.value = false
  }
}

const triggerAttendance = (statusType) => {
  if (statusType === 'Present' && !selfieFile.value) {
    Swal.fire({ icon: 'warning', title: 'Selfie Required', text: 'Please take a selfie photo to verify check-in!' })
    return;
  }

  isSubmitting.value = true

  // បើសិនជាបើក IS_TEST_MODE គឺបាញ់ទិន្នន័យទៅ Backend យកតែម្តង ដោយមិនបាច់ឆែក GPS នាំឱ្យគាំងឡើយ
  if (IS_TEST_MODE.value) {
    sendAttendancePayload(statusType)
    return
  }

  if (!navigator.geolocation) {
    Swal.fire({ icon: 'error', title: 'GPS Error', text: 'Your browser does not support GPS Geolocation.' })
    isSubmitting.value = false;
    return;
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;

    const distance = getDistance(userLat, userLng, OFFICE_LAT, OFFICE_LNG);

    if (distance > ALLOWED_RADIUS_METERS) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Scan Denied!', 
        text: `You are outside the office area. Current distance: ${Math.round(distance)}m away.` 
      })
      isSubmitting.value = false;
      return;
    }

    sendAttendancePayload(statusType)
  }, () => {
    Swal.fire({ icon: 'info', title: 'GPS Required', text: 'Please enable GPS Location access on your phone to scan attendance.' })
    isSubmitting.value = false;
  });
}
</script>

<style scoped>
.public-scan-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% 50%, #1a103c 0%, #0b071e 100%);
  padding: 20px;
}
.glass-scan-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 40px 30px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}
.text-gradient {
  background: linear-gradient(135deg, #a47bff 0%, #40c8da 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 800;
}
.form-label-custom {
  display: block;
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 8px;
}
.form-control-custom {
  width: 100%;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(104, 35, 255, 0.2);
  border-radius: 12px;
  color: #fff;
  font-size: 1rem;
  transition: all 0.3s;
}
.form-control-custom:focus {
  outline: none;
  border-color: #6823ff;
  background: rgba(104, 35, 255, 0.05);
  box-shadow: 0 0 12px rgba(104, 35, 255, 0.25);
}
.form-control-file-hidden {
  display: none;
}
.btn-upload-trigger {
  display: block;
  text-align: center;
  padding: 16px;
  background: rgba(64, 200, 218, 0.05);
  border: 2px dashed rgba(64, 200, 218, 0.3);
  border-radius: 12px;
  color: #40c8da;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-upload-trigger:hover {
  background: rgba(64, 200, 218, 0.1);
  border-color: #40c8da;
}
.img-preview-thumb {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid #40c8da;
  box-shadow: 0 0 15px rgba(64, 200, 218, 0.3);
}
.actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.btn-scan {
  padding: 14px;
  border: none;
  border-radius: 12px;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-checkin {
  background: linear-gradient(135deg, #6823ff 0%, #8b5cf6 100%);
  box-shadow: 0 6px 20px rgba(104, 35, 255, 0.3);
}
.btn-checkout {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.btn-scan:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(1.1);
}
.w-100 {
  width: 100%;
}
.qr-icon-animation {
  font-size: 3rem;
  color: #6823ff;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.08); opacity: 1; color: #40c8da; }
  100% { transform: scale(1); opacity: 0.8; }
}
</style>