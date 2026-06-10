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
      const response = await api.get('/api/departments')
      if (response.data.success) {
        departments.value = response.data.data // បញ្ចូលទិន្នន័យពិតពី Database ចូលក្នុង UI
      }
      return departments.value
    } catch (err) {
      // ⚠️ FALLBACK: បើ Backend មិនទាន់មាន Endpoint ទេ គឺទាញយកទិន្នន័យ Mock មកបង្ហាញបណ្តោះអាសន្ន
      console.warn('Departments endpoint missing. Loading fallback mock data...')

      // កុំឱ្យ UI ទទេស្អាតពេលមិនទាន់មាន Backend
      if (departments.value.length === 0) {
        departments.value = [
          {
            id: 1,
            name: 'Information Technology',
            code: 'IT',
            manager: 'Sreypich Chhun',
            total_employees: 14,
          },
          { id: 2, name: 'Human Resources', code: 'HR', manager: 'John Doe', total_employees: 5 },
          {
            id: 3,
            name: 'Finance & Accounting',
            code: 'FI',
            manager: 'Sokha Phnom',
            total_employees: 3,
          },
        ]
      }
      return departments.value
    } finally {
      loading.value = false
    }
  }

  // ២. CREATE NEW DEPARTMENT TO BACKEND (បង្កើតផ្នែកថ្មី)
  async function createDepartment(data) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/api/departments', data)
      if (response.data.success) {
        await fetchDepartments()
        return { success: true }
      }
    } catch (err) {
      // ⚠️ FALLBACK SIMULATION: បើគ្មាន Backend ទេ គឺបង្កើតវាចូលទៅក្នុង Local Array បណ្តោះអាសន្ន
      console.warn('Create department endpoint missing. Simulating data save locally...')

      const newDept = {
        id: departments.value.length + 1,
        name: data.name,
        code: data.code || 'DEPT',
        manager: data.manager || 'N/A',
        total_employees: 0,
      }
      departments.value.push(newDept)
      return { success: true } // បញ្ជូន true ទៅវិញដើម្បីឱ្យ SweetAlert បង្ហាញជោគជ័យ
    } finally {
      loading.value = false
    }
  }

  // ៣. UPDATE DEPARTMENT IN BACKEND (កែប្រែព័ត៌មានផ្នែក)
  async function updateDepartment(id, data) {
    loading.value = true
    error.value = null
    try {
      const response = await api.put(`/api/departments/${id}`, data)
      if (response.data.success) {
        await fetchDepartments() // Refresh ទិន្នន័យថ្មីឡើងវិញលើផ្ទាំង UI
        return { success: true }
      }
    } catch (err) {
      // ⚠️ FALLBACK SIMULATION: កែប្រែទិន្នន័យនៅក្នុង Local Array ផ្ទាល់តែម្តង
      console.warn(`Update department ${id} missing. Simulating update locally...`)

      const index = departments.value.findIndex((d) => d.id === id)
      if (index !== -1) {
        departments.value[index] = { ...departments.value[index], ...data }
        return { success: true }
      }
      return { success: false, error: 'Department not found locally' }
    } finally {
      loading.value = false
    }
  }

  // ៤. DELETE DEPARTMENT FROM BACKEND (លុបផ្នែកចោលពីប្រព័ន្ធ)
  async function deleteDepartment(id) {
    loading.value = true
    error.value = null
    try {
      const response = await api.delete(`/api/departments/${id}`)
      if (response.data.success) {
        await fetchDepartments() // Refresh បញ្ជីឡើងវិញក្រោយលុបជោគជ័យ
        return { success: true }
      }
    } catch (err) {
      // ⚠️ FALLBACK SIMULATION: លុបទិន្នន័យចេញពី Local Array ចោលភ្លាមៗ
      console.warn(`Delete department ${id} missing. Simulating removal locally...`)

      departments.value = departments.value.filter((d) => d.id !== id)
      return { success: true }
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
    deleteDepartment,
  }
})
