import { defineStore } from 'pinia'
import { ref } from 'vue'
import api, { unwrap } from '@/services/api'

// Normalize a backend EmployeeResponse (snake_case JSON) into the shape the views expect.
function mapEmployee(e) {
  const first = e.first_name ?? e.firstName ?? ''
  const last = e.last_name ?? e.lastName ?? ''
  const active = e.is_active ?? e.active ?? false
  return {
    id: e.id,
    code: e.employee_code ?? e.employeeCode ?? '',
    employee_code: e.employee_code ?? e.employeeCode ?? '',
    first_name: first,
    last_name: last,
    name: `${first} ${last}`.trim(),
    username: e.username,
    email: e.email,
    phone: e.phone ?? '',
    role_name: e.role_name ?? e.roleName ?? '',
    department_id: e.department_id ?? e.departmentId ?? '',
    department_name: e.department_name ?? e.departmentName ?? '',
    position_id: e.position_id ?? e.positionId ?? '',
    position_title: e.position_title ?? e.positionTitle ?? '',
    status: e.status || (active ? 'active' : 'inactive'),
    hire_date: e.hire_date ?? e.hireDate ?? null,
    base_salary: e.base_salary ?? e.baseSalary ?? null,
    face_enrolled: e.face_enrolled ?? e.faceEnrolled ?? false,
    documents: e.documents || [],
  }
}

export const useEmployeeStore = defineStore('employee', () => {
  const employees = ref([])
  const loading = ref(false)
  const error = ref(null)

  // ១. GET ALL EMPLOYEES FROM BACKEND
  async function fetchEmployees() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/api/employees')
      if (response.data.success) {
        const data = unwrap(response) // unwraps the paginated Page -> array
        employees.value = Array.isArray(data) ? data.map(mapEmployee) : []
      }
      return employees.value
    } catch (err) {
      // ⚠️ FALLBACK: បើមិនទាន់មាន Backend ទេ គឺប្រើប្រាស់ទិន្នន័យ Mock ដើម្បីឱ្យផ្ទាំងបញ្ជីបង្ហាញរ៉ឹងមាំ
      console.warn('Employees endpoint missing or offline. Loading fallback mock directory...')

      if (employees.value.length === 0) {
        employees.value = [
          {
            id: 101,
            code: 'EMP-001',
            first_name: 'Channsreypich',
            last_name: 'Chhun',
            name: 'Channsreypich Chhun',
            email: 'channsreypich@gmail.com',
            department: 'Information Technology',
            position: 'Fullstack Developer',
            status: 'Active',
            joined_date: '2025-11-15',
          },
          {
            id: 102,
            code: 'EMP-002',
            first_name: 'John',
            last_name: 'Doe',
            name: 'John Doe',
            email: 'hr@gmail.com',
            department: 'Human Resources',
            position: 'HR Manager',
            status: 'Active',
            joined_date: '2026-02-10',
          },
        ]
      }
      return employees.value
    } finally {
      loading.value = false
    }
  }

  // ២. CREATE NEW EMPLOYEE (បង្កើតគណនីបុគ្គលិកថ្មី)
  async function createEmployee(data) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/api/employees', data)
      if (response.data.success) {
        await fetchEmployees()
        return { success: true, data: response.data.data }
      }
      return { success: false, error: response.data.message || 'Failed to create employee' }
    } catch (err) {
      // Surface the real backend error so the user knows exactly what went wrong
      error.value = err.response?.data?.message || 'Failed to create employee'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // ៣. UPDATE EMPLOYEE DATA (កែប្រែទិន្នន័យបុគ្គលិក)
  async function updateEmployee(id, data) {
    loading.value = true
    error.value = null
    try {
      const response = await api.put(`/api/employees/${id}`, data)
      if (response.data.success) {
        await fetchEmployees()
        return { success: true }
      }
      return { success: false, error: response.data.message || 'Failed to update employee' }
    } catch (err) {
      // Surface the real backend error instead of silently faking success
      error.value = err.response?.data?.message || 'Failed to update employee'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // ៤. DELETE EMPLOYEE FROM SYSTEM (លុបបុគ្គលិកចេញពីប្រព័ន្ធ)
  async function deleteEmployee(id) {
    loading.value = true
    error.value = null
    try {
      const response = await api.delete(`/api/employees/${id}`)
      if (response.data.success) {
        await fetchEmployees()
        return { success: true }
      }
      return { success: false, error: response.data.message || 'Failed to delete employee' }
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
