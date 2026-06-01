import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api' 

export const useAttendanceStore = defineStore('attendance', () => {
  const attendanceRecords = ref([])
  const loading = ref(false)
  const error = ref(null)

  // FETCH ALL ATTENDANCE FOR HR DASHBOARD
  async function fetchAllAttendance() {
    loading.value = true
    error.value = null
    try {
      // បាញ់ទៅកាន់ Endpoint Backend ដែលទាញយកវត្តមានទាំងអស់ (ឧទាហរណ៍៖ /attendance ឬ /attendance/all)
      const response = await api.get('/attendance') 
      if (response.data.success) {
        attendanceRecords.value = response.data.data
      }
      return attendanceRecords.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch all attendance records'
    } finally {
      loading.value = false
    }
  }

  // 1. FETCH ATTENDANCE HISTORY FOR A SPECIFIC EMPLOYEE
  async function fetchEmployeeHistory(employeeId) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/attendance/history/${employeeId}`)
      if (response.data.success) {
        attendanceRecords.value = response.data.data
      }
      return attendanceRecords.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch attendance history'
    } finally {
      loading.value = false
    }
  }

  // 2. CLOCK IN / CHECK IN (Handles text fields and Multipart Selfie Image upload)
  async function checkIn(formData) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/attendance/check-in', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return { success: true, data: response.data.data }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to check in'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 3. CLOCK OUT / CHECK OUT (Handles raw JSON object transmission data)
  async function checkOut(employeeCode) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/attendance/check-out', {
        employee_code: employeeCode
      })
      return { success: true, data: response.data.data }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to check out'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  return {
    attendanceRecords,
    loading,
    error,
    fetchAllAttendance, 
    fetchEmployeeHistory,
    checkIn,
    checkOut
  }
})