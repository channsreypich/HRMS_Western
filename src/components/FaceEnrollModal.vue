<template>
  <div v-if="show" class="fe-overlay" @click.self="close">
    <div class="fe-modal">
      <div class="fe-head">
        <h3><VsxIcon iconName="SecurityUser" :size="18" class="me-2" />Enroll Face</h3>
        <button class="fe-close" @click="close">
          <VsxIcon iconName="CloseCircle" :size="18" />
        </button>
      </div>
      <p class="fe-sub">
        Register the face for <strong>{{ employeeName }}</strong
        >. They'll use this to verify attendance scans.
      </p>

      <div class="fe-stage">
        <img v-if="previewUrl" :src="previewUrl" class="fe-feed" alt="capture" />
        <video
          v-show="!previewUrl"
          ref="videoRef"
          class="fe-feed mirror"
          autoplay
          playsinline
          muted
        ></video>
        <div v-if="!cameraOn && !previewUrl" class="fe-placeholder">
          <VsxIcon iconName="Camera" :size="40" /><span>Camera is off</span>
        </div>
      </div>
      <canvas ref="canvasRef" class="d-none"></canvas>

      <div class="fe-status">
        <span v-if="processing" style="color: #0284c7"
          ><VsxIcon iconName="Refresh2" :size="18" class="vsx-spin" /> Detecting face…</span
        >
        <span v-else-if="previewUrl && descriptor" style="color: #16a34a"
          ><VsxIcon iconName="UserTick" :size="18" /> Face detected — ready to save</span
        >
        <span v-else-if="!ready" style="color: #d97706"
          ><VsxIcon iconName="Refresh2" :size="18" class="vsx-spin" /> Loading face models…</span
        >
        <span v-else style="color: #64748b">Position the employee's face in the frame.</span>
      </div>

      <div class="fe-actions">
        <button v-if="!cameraOn && !previewUrl" class="fe-btn" @click="startCamera">
          <VsxIcon iconName="Video" :size="18" class="me-2" />Open Camera
        </button>
        <button v-if="cameraOn && !previewUrl" class="fe-btn primary" @click="capture">
          <VsxIcon iconName="Camera" :size="18" class="me-2" />Capture
        </button>
        <button v-if="previewUrl" class="fe-btn" @click="retake">
          <VsxIcon iconName="Refresh2" :size="18" class="me-2" />Retake
        </button>
        <button
          v-if="previewUrl && descriptor"
          class="fe-btn success"
          :disabled="saving"
          @click="save"
        >
          <VsxIcon iconName="Save2" :size="18" class="me-2" />{{
            saving ? 'Saving…' : 'Save Enrollment'
          }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import Swal from 'sweetalert2'
import api from '@/services/api'
import { loadFaceModels, computeFaceDescriptor } from '@/utils/face'

const props = defineProps({
  show: { type: Boolean, default: false },
  employeeId: { type: [String, Number], default: '' },
  employeeName: { type: String, default: '' },
})
const emit = defineEmits(['close', 'enrolled'])

const videoRef = ref(null)
const canvasRef = ref(null)
const cameraOn = ref(false)
const previewUrl = ref('')
const descriptor = ref(null)
const ready = ref(false)
const processing = ref(false)
const saving = ref(false)
let mediaStream = null

watch(
  () => props.show,
  async (visible) => {
    if (visible) {
      reset()
      try {
        await loadFaceModels()
        ready.value = true
      } catch {
        ready.value = false
      }
    } else {
      stopCamera()
    }
  },
)

const startCamera = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    Swal.fire({
      icon: 'error',
      title: 'Camera not available',
      text: 'Use http://localhost or HTTPS to access the camera.',
    })
    return
  }
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: false,
    })
    cameraOn.value = true
    await new Promise((r) => setTimeout(r, 0))
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
      await videoRef.value.play().catch(() => {})
    }
  } catch (err) {
    stopCamera()
    Swal.fire({
      icon: 'error',
      title: 'Camera unavailable',
      text: 'Allow camera permission and retry. (' + (err?.name || 'error') + ')',
    })
  }
}

const stopCamera = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop())
    mediaStream = null
  }
  cameraOn.value = false
}

const capture = async () => {
  const video = videoRef.value
  const canvas = canvasRef.value
  if (!video || !canvas || !video.videoWidth) return
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)

  processing.value = true
  try {
    descriptor.value = ready.value ? await computeFaceDescriptor(canvas) : null
  } catch {
    descriptor.value = null
  } finally {
    processing.value = false
  }

  if (!descriptor.value) {
    Swal.fire({
      icon: 'warning',
      title: 'No face detected',
      text: 'Center the face with good lighting, then Capture again.',
    })
    return
  }
  canvas.toBlob(
    (blob) => {
      if (blob) {
        if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
        previewUrl.value = URL.createObjectURL(blob)
      }
      stopCamera()
    },
    'image/jpeg',
    0.9,
  )
}

const retake = () => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  descriptor.value = null
  startCamera()
}

const save = async () => {
  if (!descriptor.value) return
  saving.value = true
  try {
    await api.post(`/api/attendance/face/${props.employeeId}`, {
      descriptor: descriptor.value.join(','),
    })
    Swal.fire({
      icon: 'success',
      title: 'Enrolled',
      text: 'Face registered successfully.',
      timer: 1800,
      showConfirmButton: false,
    })
    emit('enrolled')
    close()
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Failed',
      text: err.response?.data?.message || 'Could not save enrollment',
    })
  } finally {
    saving.value = false
  }
}

const reset = () => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  descriptor.value = null
  saving.value = false
  processing.value = false
}

const close = () => {
  stopCamera()
  reset()
  emit('close')
}

onBeforeUnmount(stopCamera)
</script>

<style scoped>
.fe-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.fe-modal {
  background: #fff;
  border-radius: 18px;
  padding: 1.5rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}
.fe-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.fe-head h3 {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}
.fe-close {
  background: none;
  border: none;
  font-size: 1.1rem;
  color: #94a3b8;
  cursor: pointer;
}
.fe-sub {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0.5rem 0 1rem;
}
.fe-stage {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: #0b0b16;
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fe-feed {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.fe-feed.mirror {
  transform: scaleX(-1);
}
.fe-placeholder {
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
.fe-placeholder i {
  font-size: 32px;
}
.fe-status {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  margin: 0.75rem 0;
  min-height: 18px;
}
.fe-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}
.fe-btn {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
  border-radius: 10px;
  padding: 0.55rem 1rem;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}
.fe-btn.primary {
  background: linear-gradient(135deg, #0284c7, #40c8da);
  color: #fff;
  border: none;
}
.fe-btn.success {
  background: linear-gradient(135deg, #16a34a, #15803d);
  color: #fff;
  border: none;
}
.d-none {
  display: none;
}
</style>
