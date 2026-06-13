<template>
  <div class="public-scan-wrapper">
    <div class="glass-scan-card fade-in">
      <div class="scan-header text-center">
        <div class="qr-icon-animation">
          <VsxIcon iconName="ScanBarcode" :size="18" />
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
            ><VsxIcon
              iconName="Personalcard"
              :size="18"
              class="me-2"
              style="color: var(--accent)"
            />Employee Code (ID)</label
          >
          <input
            type="text"
            v-model="temporaryCode"
            class="form-control-custom"
            style="text-transform: uppercase"
            placeholder="e.g. EMP-001"
            autocomplete="off"
            autofocus
            @keyup.enter="saveSetup"
          />
          <small class="text-muted" style="font-size: 11px"
            >Use the exact code from the Employees list (e.g. EMP-001).</small
          >
        </div>
        <button type="button" class="btn-scan btn-checkin w-100" @click="saveSetup">
          <VsxIcon iconName="Save2" :size="18" class="me-2" /> Register Device
        </button>
      </div>

      <form v-else @submit.prevent class="mt-4">
        <div class="form-group mb-4">
          <label class="form-label-custom"
            ><VsxIcon iconName="Camera" :size="18" class="me-2" style="color: #40c8da" />Face
            Verification *</label
          >

          <!-- Live webcam stage (laptop + mobile) -->
          <div class="camera-stage">
            <!-- Captured preview -->
            <img v-if="previewUrl" :src="previewUrl" alt="Selfie Preview" class="camera-feed" />
            <!-- Live video (mirrored so it feels like a selfie) -->
            <video
              v-show="!previewUrl"
              ref="videoRef"
              class="camera-feed mirror"
              autoplay
              playsinline
              muted
            ></video>

            <div v-if="!cameraOn && !previewUrl" class="camera-placeholder">
              <VsxIcon iconName="Camera" :size="44" />
              <span>Camera is off</span>
            </div>
          </div>
          <canvas ref="canvasRef" class="d-none"></canvas>

          <!-- Camera controls -->
          <div class="cam-controls mt-3">
            <button
              v-if="!cameraOn && !previewUrl"
              type="button"
              class="btn-cam"
              @click="startCamera"
            >
              <VsxIcon iconName="Video" :size="18" class="me-2" /> Open Camera
            </button>
            <button
              v-if="cameraOn && !previewUrl"
              type="button"
              class="btn-cam btn-cam-snap"
              @click="capturePhoto"
            >
              <VsxIcon iconName="Camera" :size="18" class="me-2" /> Capture
            </button>
            <button v-if="previewUrl" type="button" class="btn-cam" @click="retake">
              <VsxIcon iconName="Refresh2" :size="18" class="me-2" /> Retake
            </button>
          </div>

          <!-- Face recognition status -->
          <div class="face-status mt-2">
            <span v-if="faceProcessing" style="color: #40c8da">
              <VsxIcon iconName="Refresh2" :size="18" class="vsx-spin" /> Scanning face…
            </span>
            <span v-else-if="previewUrl && faceDescriptor" style="color: #34d399">
              <VsxIcon iconName="UserTick" :size="18" /> Face detected & ready to verify
            </span>
            <span v-else-if="faceReady" style="color: rgba(255, 255, 255, 0.5)">
              <VsxIcon iconName="ShieldTick" :size="18" /> Face recognition ready
            </span>
            <span v-else style="color: #fbbf24">
              <VsxIcon iconName="Refresh2" :size="18" class="vsx-spin" /> Loading face models…
              (photo still works)
            </span>
          </div>

          <!-- Fallback: upload a photo (devices without a webcam) -->
          <div class="file-input-wrapper mt-2">
            <input
              type="file"
              accept="image/*"
              capture="user"
              @change="handleFileUpload"
              class="form-control-file-hidden"
              id="selfie-camera"
            />
            <label for="selfie-camera" class="upload-fallback-link">
              or upload a photo instead
            </label>
          </div>
        </div>

        <div class="actions-grid mt-4">
          <button
            type="button"
            class="btn-scan btn-checkin"
            @click="triggerAttendance('Present')"
            :disabled="isSubmitting"
          >
            <VsxIcon iconName="Login" :size="18" class="me-2" />
            {{ isSubmitting ? 'Verifying...' : 'Check In' }}
          </button>
          <button
            type="button"
            class="btn-scan btn-checkout"
            @click="triggerAttendance('Left')"
            :disabled="isSubmitting"
          >
            <VsxIcon iconName="Logout" :size="18" class="me-2" />
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
import { reactive, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import api from '@/services/api'
import Swal from 'sweetalert2'
import { loadFaceModels, computeFaceDescriptor } from '@/utils/face'

const isConfigured = ref(false)
const temporaryCode = ref('')

const form = reactive({ employee_code: '' })
const selfieFile = ref(null)
const fileName = ref('')
const previewUrl = ref('')
const isSubmitting = ref(false)

// ── Live webcam capture ──
const videoRef = ref(null)
const canvasRef = ref(null)
const cameraOn = ref(false)
let mediaStream = null

// ── Face recognition ──
const faceDescriptor = ref(null) // 128-number array for the captured face
const faceReady = ref(false) // models loaded?
const faceProcessing = ref(false) // computing descriptor right now

const startCamera = async () => {
  // getUserMedia only exists in a secure context (https or http://localhost)
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    Swal.fire({
      icon: 'error',
      title: 'Camera not available',
      html:
        'The browser blocked camera access. Open the app via <b>http://localhost</b> or <b>https</b> ' +
        '(the camera is disabled on plain <i>http://</i> LAN addresses), or use ' +
        '<b>“upload a photo instead”</b> below.',
    })
    return
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    })
    cameraOn.value = true
    await nextTick() // ensure the <video> is in the DOM before attaching the stream
    const video = videoRef.value
    if (video) {
      video.srcObject = mediaStream
      // Some browsers only render once metadata is ready
      video.onloadedmetadata = () => video.play().catch(() => {})
      await video.play().catch(() => {})
    }
  } catch (err) {
    stopCamera()
    const name = err?.name || ''
    let text = 'Could not access the camera. '
    if (name === 'NotAllowedError' || name === 'SecurityError')
      text += 'Permission was denied — allow camera access in the browser address bar, then retry.'
    else if (name === 'NotFoundError' || name === 'OverconstrainedError')
      text += 'No camera was found on this device.'
    else if (name === 'NotReadableError')
      text += 'The camera is already in use by another app — close it and retry.'
    else text += 'You can use “upload a photo instead”. (' + (name || 'error') + ')'
    Swal.fire({ icon: 'error', title: 'Camera unavailable', text })
  }
}

const stopCamera = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop())
    mediaStream = null
  }
  cameraOn.value = false
}

const capturePhoto = async () => {
  const video = videoRef.value
  const canvas = canvasRef.value
  if (!video || !canvas) return

  // The video may not have a frame yet right after opening
  if (!video.videoWidth) {
    Swal.fire({
      icon: 'info',
      title: 'One moment',
      text: 'The camera is still starting — wait a second and tap Capture again.',
      timer: 1500,
      showConfirmButton: false,
    })
    return
  }

  const w = video.videoWidth
  const h = video.videoHeight
  canvas.width = w
  canvas.height = h
  // Save the true (un-mirrored) frame so HR sees the real face orientation
  canvas.getContext('2d').drawImage(video, 0, 0, w, h)

  // Run face recognition on the captured frame (when models are available)
  if (faceReady.value) {
    faceProcessing.value = true
    try {
      faceDescriptor.value = await computeFaceDescriptor(canvas)
    } catch {
      faceDescriptor.value = null
    } finally {
      faceProcessing.value = false
    }
    if (!faceDescriptor.value) {
      Swal.fire({
        icon: 'warning',
        title: 'No face detected',
        text: 'Center your face in the frame with good lighting, then tap Capture again.',
      })
      return // keep the camera on so the user can retry
    }
  }

  canvas.toBlob(
    (blob) => {
      if (!blob) return
      selfieFile.value = new File([blob], `selfie_${Date.now()}.jpg`, { type: 'image/jpeg' })
      fileName.value = selfieFile.value.name
      if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = URL.createObjectURL(blob)
      stopCamera()
    },
    'image/jpeg',
    0.9,
  )
}

const retake = () => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  selfieFile.value = null
  fileName.value = ''
  faceDescriptor.value = null
  startCamera()
}

onBeforeUnmount(stopCamera)

const OFFICE_LAT = 11.5723117
const OFFICE_LNG = 104.8715964
const ALLOWED_RADIUS_METERS = 50

const IS_TEST_MODE = ref(true)

onMounted(async () => {
  const savedCode = localStorage.getItem('user_employee_code')
  if (savedCode) {
    form.employee_code = savedCode
    isConfigured.value = true
  }
  // Preload face-recognition models so capture is instant later
  try {
    await loadFaceModels()
    faceReady.value = true
  } catch (e) {
    faceReady.value = false
    console.warn('Face models failed to load; falling back to photo-only capture.', e)
  }
})

const saveSetup = () => {
  // Normalize the typed code: trim spaces and force uppercase so "emp-001",
  // " EMP-001 " and "EMP-001" all register the same way.
  const code = temporaryCode.value.trim().toUpperCase()
  if (!code) {
    Swal.fire({ icon: 'warning', title: 'Oops...', text: 'Please enter your Employee Code!' })
    return
  }
  temporaryCode.value = code
  localStorage.setItem('user_employee_code', code)
  form.employee_code = code
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
    confirmButtonColor: '#4f7cff',
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

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  selfieFile.value = file
  fileName.value = file.name
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = URL.createObjectURL(file)

  // Try to read a face from the uploaded photo too, so verification still applies
  if (faceReady.value) {
    faceProcessing.value = true
    try {
      const img = new Image()
      img.src = previewUrl.value
      await img.decode()
      faceDescriptor.value = await computeFaceDescriptor(img)
    } catch {
      faceDescriptor.value = null
    } finally {
      faceProcessing.value = false
    }
    if (!faceDescriptor.value) {
      Swal.fire({
        icon: 'warning',
        title: 'No face detected',
        text: 'The uploaded photo has no clear face. Please choose a clear, front-facing photo.',
      })
    }
  }
}

// មុខងារបញ្ជូនទិន្នន័យវត្តមាន ផ្ដាច់មុខងារ GPS បណ្ដោះអាសន្នបើស្ថិតក្នុង Test Mode
const sendAttendancePayload = async (statusType) => {
  const formData = new FormData()
  formData.append('employee_code', form.employee_code)

  if (selfieFile.value) {
    formData.append('selfie', selfieFile.value)
  }
  // Send the face descriptor so the backend can verify identity (or auto-enroll on first scan)
  if (faceDescriptor.value) {
    formData.append('face_descriptor', faceDescriptor.value.join(','))
  }

  try {
    const endpoint = statusType === 'Present' ? 'check-in' : 'check-out'
    const res = await api.post(`/api/attendance/${endpoint}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    if (res.data.success) {
      Swal.fire({ icon: 'success', title: 'Success!', text: res.data.message, timer: 3000 })
      selfieFile.value = null
      fileName.value = ''
      if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = ''
      faceDescriptor.value = null
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
  // Face capture is required for BOTH check-in and check-out so every scan is traceable
  if (!selfieFile.value) {
    Swal.fire({
      icon: 'warning',
      title: 'Face Required',
      text:
        'Please capture your face (Open Camera → Capture) before ' +
        (statusType === 'Present' ? 'checking in' : 'checking out') +
        '.',
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
    'Plus Jakarta Sans',
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
  color: var(--accent);
  display: inline-block;
  animation: pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.text-gradient {
  background: linear-gradient(135deg, var(--accent) 0%, #0284c7 100%);
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
  border-color: var(--accent);
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.15);
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

/* Live camera UI */
.camera-stage {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 16px;
  overflow: hidden;
  background: #0b0b16;
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}
.camera-feed {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.camera-feed.mirror {
  transform: scaleX(-1); /* mirror the live preview like a selfie */
}
.camera-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
}
.camera-placeholder i {
  font-size: 34px;
}
.cam-controls {
  display: flex;
  justify-content: center;
}
.btn-cam {
  border: none;
  border-radius: 12px;
  padding: 10px 22px;
  font-weight: 700;
  font-size: 14px;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(135deg, var(--accent), #64748b);
}
.btn-cam-snap {
  background: linear-gradient(135deg, #0284c7, #40c8da);
}
.upload-fallback-link {
  display: block;
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  text-decoration: underline;
  cursor: pointer;
  margin-top: 6px;
}
.face-status {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
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
  background: linear-gradient(135deg, var(--accent) 0%, #5215e6 100%);
  box-shadow: 0 4px 15px rgba(var(--accent-rgb), 0.25);
}

.btn-checkin:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(var(--accent-rgb), 0.35);
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
    filter: drop-shadow(0 0 0px rgba(var(--accent-rgb), 0));
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
    filter: drop-shadow(0 0 0px rgba(var(--accent-rgb), 0));
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
