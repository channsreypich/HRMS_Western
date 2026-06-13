import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useAttendanceStore = defineStore('attendance', () => {
  const attendanceRecords = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Backend serializes the status enum as UPPERCASE (PRESENT/LATE/...); the views expect lowercase keys.
  function normalize(record) {
    return { ...record, status: (record.status || '').toLowerCase() }
  }

  // FETCH ALL ATTENDANCE FOR HR DASHBOARD
  async function fetchAllAttendance() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/api/attendance')
      if (response.data.success) {
        attendanceRecords.value = (response.data.data || []).map(normalize)
      }
      return attendanceRecords.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch all attendance records'
    } finally {
      loading.value = false
    }
  }

  // ១. ទាញយកប្រវត្តិចូលរួមការងាររបស់បុគ្គលិកជាក់លាក់ (Employee Attendance History)
  async function fetchEmployeeHistory(employeeId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/api/attendance/history/${employeeId}`)
      if (response.data.success) {
        attendanceRecords.value = (response.data.data || []).map(normalize)
      }
      return attendanceRecords.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch attendance history'
    } finally {
      loading.value = false
    }
  }

  // ២. ស្កែនមេដៃ ឬថតរូបភាពស្កែនមុខចូលការងារ (Handles Multipart Selfie Image upload)
  async function checkIn(formData) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/api/attendance/check-in', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return { success: true, data: response.data.data }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to check in'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // ៣. ស្កែនចេញពីការងារ (Handles raw JSON object transmission data)
  async function checkOut(employeeCode, selfie = null) {
    loading.value = true
    error.value = null
    try {
      // Backend expects multipart form params: employee_code [+ optional selfie]
      const formData = new FormData()
      formData.append('employee_code', employeeCode)
      if (selfie) formData.append('selfie', selfie)

      const response = await api.post('/api/attendance/check-out', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return { success: true, data: response.data.data }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to check out'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // ៤. MANUAL ATTENDANCE ENTRY (HR sets date/status/times directly)
  async function markManual(payload) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/api/attendance/manual', payload)
      return { success: true, data: response.data.data }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to save attendance record'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  return {
    attendanceRecords,
    loading,
    error,
    markManual,
    fetchAllAttendance,
    fetchEmployeeHistory,
    checkIn,
    checkOut,
  }
})
