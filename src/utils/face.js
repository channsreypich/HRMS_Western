// Lightweight wrapper around face-api.js for in-browser face recognition.
// Models are served from /public/models (loaded once, cached).
import * as faceapi from 'face-api.js'

let loadPromise = null

export function loadFaceModels() {
  if (!loadPromise) {
    const base = (import.meta.env.BASE_URL || '/') + 'models'
    loadPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(base),
      faceapi.nets.faceLandmark68Net.loadFromUri(base),
      faceapi.nets.faceRecognitionNet.loadFromUri(base),
    ]).catch((e) => {
      loadPromise = null // allow a retry next time
      throw e
    })
  }
  return loadPromise
}

// Returns a 128-number face descriptor array, or null if no face is detected.
// Accepts an HTMLImageElement, HTMLVideoElement or HTMLCanvasElement.
export async function computeFaceDescriptor(source) {
  await loadFaceModels()
  const detection = await faceapi
    .detectSingleFace(source, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 }))
    .withFaceLandmarks()
    .withFaceDescriptor()
  return detection ? Array.from(detection.descriptor) : null
}
