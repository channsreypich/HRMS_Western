import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api' 

export const usePositionStore = defineStore('position', () => {
  const positions = ref([])
  const loading = ref(false)
  const error = ref(null)

  // ១. GET ALL POSITIONS (ទាញយកបញ្ជីតំណែងទាំងអស់ពី Database)
  async function fetchPositions() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/positions')
      if (response.data.success) {
        positions.value = response.data.data // ញាត់កញ្ចប់ទិន្នន័យពិតចូលក្នុង UI
      }
      return positions.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch positions'
    } finally {
      loading.value = false
    }
  }

  // ២. CREATE NEW POSITION (បង្កើតតំណែងថ្មី និងកំណត់ប្រាក់ខែគោល)
  async function createPosition(data) {
    loading.value = true
    error.value = null
    try {
      // បាញ់បញ្ជូន title និង base_salary ទៅកាន់ Backend
      const response = await api.post('/positions', data)
      if (response.data.success) {
        await fetchPositions() // បង្កើតជោគជ័យ ឱ្យវា Refresh បញ្ជីឡើងវិញភ្លាម
        return { success: true }
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to create position'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // ៣. UPDATE POSITION PROFILE (កែប្រែឈ្មោះតំណែង ឬប្រាក់ខែគោលក្នុង Database)
  async function updatePosition(id, data) {
    loading.value = true
    error.value = null
    try {
      const response = await api.put(`/positions/${id}`, data)
      if (response.data.success) {
        await fetchPositions() // Refresh ទិន្នន័យថ្មីក្រោយកែប្រែរួច
        return { success: true }
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update position'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // ៤. DELETE POSITION FROM SYSTEM (លុបតំណែងការងារចោល)
  async function deletePosition(id) {
    loading.value = true
    error.value = null
    try {
      const response = await api.delete(`/positions/${id}`)
      if (response.data.success) {
        await fetchPositions() // Refresh បញ្ជីឡើងវិញក្រោយលុបជោគជ័យ
        return { success: true }
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to delete position'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  return { 
    positions, 
    loading, 
    error, 
    fetchPositions, 
    createPosition, 
    updatePosition, 
    deletePosition 
  }
})