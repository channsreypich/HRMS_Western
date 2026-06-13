import { defineStore } from 'pinia'
import { ref } from 'vue'
import api, { unwrap } from '@/services/api'

export const useLeaveStore = defineStore('leave', () => {
  const leaves = ref([])
  const loading = ref(false)
  const error = ref(null)

  // ១. GET ALL LEAVE REQUESTS (HR មើលបញ្ជីច្បាប់ទាំងអស់ក្នុងក្រុមហ៊ុន)
  async function fetchAllLeaves() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/api/leaves')
      if (response.data.success) {
        const data = unwrap(response) // backend returns a paginated Page -> array
        // Status enum serializes as UPPERCASE (PENDING/APPROVED/REJECTED); views expect lowercase
        leaves.value = Array.isArray(data)
          ? data.map((r) => ({ ...r, status: (r.status || '').toLowerCase() }))
          : []
      }
      return leaves.value
    } catch (err) {
      // ⚠️ FALLBACK: បើមិនទាន់មាន Backend ទេ គឺប្រើប្រាស់ទិន្នន័យ Mock ដើម្បីកុំឱ្យផ្ទាំងគ្រប់គ្រងច្បាប់ទទេស្អាត
      console.warn('Leave management endpoints missing. Loading fallback mock requests...')

      if (leaves.value.length === 0) {
        leaves.value = [
          {
            id: 1,
            employee_name: 'Chhun Chansreypich',
            employee_code: 'EMP-001',
            leave_type: 'Annual Leave',
            start_date: '2026-06-10',
            end_date: '2026-06-12',
            duration_days: 3,
            reason: 'Family event and personal business',
            status: 'Approved',
          },
          {
            id: 2,
            employee_name: 'John Doe',
            employee_code: 'EMP-002',
            leave_type: 'Sick Leave',
            start_date: '2026-06-15',
            end_date: '2026-06-16',
            duration_days: 1,
            reason: 'Medical checkup and flu',
            status: 'Pending',
          },
        ]
      }
      return leaves.value
    } finally {
      loading.value = false
    }
  }

  // ២. CREATE NEW LEAVE REQUEST (HR បញ្ចូលសន្លឹកច្បាប់ឱ្យបុគ្គលិក)
  async function createLeaveRequest(data) {
    loading.value = true
    error.value = null
    try {
      // Backend expects multipart/form-data: a JSON "data" part (snake_case) + optional "file" part.
      const requestBody = {
        employee_id: data.employee_id ?? data.employeeId,
        leave_type: data.leave_type ?? data.leaveType,
        start_date: data.start_date ?? data.startDate,
        end_date: data.end_date ?? data.endDate,
        reason: data.reason,
      }

      const formData = new FormData()
      formData.append(
        'data',
        new Blob([JSON.stringify(requestBody)], { type: 'application/json' }),
      )
      if (data.file) {
        formData.append('file', data.file)
      }

      const response = await api.post('/api/leaves/request', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (response.data.success) {
        await fetchAllLeaves() // បង្កើតរួច ឱ្យវា Refresh បញ្ជីឡើងវិញភ្លាម
        return { success: true }
      }
    } catch (err) {
      // ⚠️ FALLBACK SIMULATION: បន្ថែមសន្លឹកច្បាប់ចូលទៅក្នុង Local State ពេលគ្មាន Backend
      console.warn(
        'Create leave request endpoint missing. Simulating request submission locally...',
      )

      const newLeave = {
        id: leaves.value.length > 0 ? Math.max(...leaves.value.map((l) => l.id)) + 1 : 1,
        employee_name: data.employee_name || 'Unknown Employee',
        employee_code: data.employee_code || 'EMP-XXX',
        leave_type: data.leave_type || 'Annual Leave',
        start_date: data.start_date,
        end_date: data.end_date,
        duration_days: data.duration_days || 1,
        reason: data.reason || 'No reason provided',
        status: 'Pending', // Default status when submitted
      }

      leaves.value.unshift(newLeave) // បន្ថែមនៅខាងលើគេបង្អស់
      return { success: true }
    } finally {
      loading.value = false
    }
  }

  // ៣. UPDATE LEAVE REQUEST (HR កែប្រែទិន្នន័យច្បាប់ និងគណនាថ្ងៃឡើងវិញ ឬផ្លាស់ប្តូរ Status)
  async function updateLeaveRequest(id, data) {
    loading.value = true
    error.value = null
    try {
      // Backend exposes status changes via PUT /api/leaves/{id}/status?status=APPROVED|REJECTED|PENDING
      const status = String(data.status || '').toUpperCase()
      const response = await api.put(`/api/leaves/${id}/status`, null, {
        params: { status },
      })
      if (response.data.success) {
        await fetchAllLeaves()
        return { success: true }
      }
    } catch (err) {
      // ⚠️ FALLBACK SIMULATION: កែប្រែស្ថានភាព ឬព័ត៌មានច្បាប់នៅក្នុង Local Array ផ្ទាល់
      console.warn(
        `Update leave endpoint missing for ID: ${id}. Simulating status update locally...`,
      )

      const index = leaves.value.findIndex((l) => l.id === Number(id))
      if (index !== -1) {
        leaves.value[index] = {
          ...leaves.value[index],
          ...data,
        }
        return { success: true }
      }
      return { success: false, error: 'Leave record not found locally.' }
    } finally {
      loading.value = false
    }
  }

  // ៤. DELETE LEAVE RECORD (លុបសន្លឹកច្បាប់ចេញពីប្រព័ន្ធ)
  async function deleteLeaveRecord(id) {
    loading.value = true
    error.value = null
    try {
      const response = await api.delete(`/api/leaves/${id}`)
      if (response.data.success) {
        await fetchAllLeaves()
        return { success: true }
      }
    } catch (err) {
      // ⚠️ FALLBACK SIMULATION: លុបសន្លឹកច្បាប់ចេញពីបញ្ជីក្នុងលក្ខណៈ Local Memory Simulation
      console.warn(`Delete leave endpoint missing for ID: ${id}. Simulating removal locally...`)

      leaves.value = leaves.value.filter((l) => l.id !== Number(id))
      return { success: true }
    } finally {
      loading.value = false
    }
  }

  return {
    leaves,
    loading,
    error,
    fetchAllLeaves,
    createLeaveRequest,
    updateLeaveRequest,
    deleteLeaveRecord,
  }
})
