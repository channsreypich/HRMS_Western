import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api' 

export const useDepartmentStore = defineStore('department', () => {
  const departments = ref([]) // ទុកជា Array ទទេស្អាត ដើម្បីរង់ចាំទិន្នន័យពិតពី Database
  const loading = ref(false)
  const error = ref(null)

  // ១. GET ALL DEPARTMENTS FROM BACKEND 
  async function fetchDepartments() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/departments') 
      if (response.data.success) {
        departments.value = response.data.data // បញ្ចូលទិន្នន័យពិតពី Database ចូលក្នុង UI
      }
      return departments.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch departments'
    } finally {
      loading.value = false
    }
  }

  // ២. CREATE NEW DEPARTMENT TO BACKEND (បង្កើតផ្នែកថ្មី)
  async function createDepartment(data) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/departments', data)
      if (response.data.success) {
        await fetchDepartments() 
        return { success: true }
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to create department'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // ៣. UPDATE DEPARTMENT IN BACKEND (កែប្រែព័ត៌មានផ្នែក)
  async function updateDepartment(id, data) {
    loading.value = true
    error.value = null
    try {
      const response = await api.put(`/departments/${id}`, data)
      if (response.data.success) {
        await fetchDepartments() // Refresh ទិន្នន័យថ្មីឡើងវិញលើផ្ទាំង UI
        return { success: true }
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update department'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // ៤. DELETE DEPARTMENT FROM BACKEND (លុបផ្នែកចោលពីប្រព័ន្ធ)
  async function deleteDepartment(id) {
    loading.value = true
    error.value = null
    try {
      const response = await api.delete(`/departments/${id}`)
      if (response.data.success) {
        await fetchDepartments() // Refresh បញ្ជីឡើងវិញក្រោយលុបជោគជ័យ
        return { success: true }
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to delete department'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  return { 
    departments, 
    loading, 
    error, 
    fetchDepartments, 
    createDepartment, 
    updateDepartment, 
    deleteDepartment 
  }
})