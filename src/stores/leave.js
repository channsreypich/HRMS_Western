import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useLeaveStore = defineStore('leave', () => {
  const leaves = ref([])
  const loading = ref(false)
  const error = ref(null)

  // ១. GET ALL LEAVE REQUESTS (HR មើលបញ្ជីច្បាប់ទាំងអស់ក្នុងក្រុមហ៊ុន)
  async function fetchAllLeaves() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/leaves/admin/all')
      if (response.data.success) {
        leaves.value = response.data.data // ទទួលកញ្ចប់សន្លឹកច្បាប់ពី MySQL
      }
      return leaves.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch leave records'
    } finally {
      loading.value = false
    }
  }

  // ២. CREATE NEW LEAVE REQUEST (HR បញ្ចូលសន្លឹកច្បាប់ឱ្យបុគ្គលិក)
  async function createLeaveRequest(data) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/leaves/request', data)
      if (response.data.success) {
        await fetchAllLeaves() // បង្កើតរួច ឱ្យវា Refresh បញ្ជីឡើងវិញភ្លាម
        return { success: true }
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to submit leave request'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // ៣. UPDATE LEAVE REQUEST (HR កែប្រែទិន្នន័យច្បាប់ និងគណនាថ្ងៃឡើងវិញ)
  async function updateLeaveRequest(id, data) {
    loading.value = true
    error.value = null
    try {
      const response = await api.put(`/leaves/admin/update/${id}`, data)
      if (response.data.success) {
        await fetchAllLeaves()
        return { success: true }
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update leave record'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // ៤. DELETE LEAVE RECORD
  async function deleteLeaveRecord(id) {
    loading.value = true
    error.value = null
    try {
      const response = await api.delete(`/leaves/admin/delete/${id}`)
      if (response.data.success) {
        await fetchAllLeaves()
        return { success: true }
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to delete leave record'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  return { leaves, loading, error, fetchAllLeaves, createLeaveRequest, updateLeaveRequest, deleteLeaveRecord }
})