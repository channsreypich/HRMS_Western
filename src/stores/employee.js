import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useEmployeeStore = defineStore('employee', () => {
  const employees = ref([])
  const loading = ref(false)
  const error = ref(null)

  // ១. GET ALL EMPLOYEES FROM BACKEND
  async function fetchEmployees() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/employees')
      if (response.data.success) {
        employees.value = response.data.data 
      }
      return employees.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch employees'
    } finally {
      loading.value = false
    }
  }

  // ២. CREATE NEW EMPLOYEE
  async function createEmployee(data) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/employees', data)
      if (response.data.success) {
        await fetchEmployees() 
        return { success: true, data: response.data.data }
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to create employee'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // ៣. UPDATE EMPLOYEE DATA
  async function updateEmployee(id, data) {
    loading.value = true
    error.value = null
    try {
      const response = await api.put(`/employees/${id}`, data)
      if (response.data.success) {
        await fetchEmployees() 
        return { success: true }
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update employee'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // ៤. DELETE EMPLOYEE FROM SYSTEM
  async function deleteEmployee(id) {
    loading.value = true
    error.value = null
    try {
      const response = await api.delete(`/employees/${id}`)
      if (response.data.success) {
        await fetchEmployees() 
        return { success: true }
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to delete employee'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  return {
    employees,
    loading,
    error,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
  }
})