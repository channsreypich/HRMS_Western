import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api' 

export const usePayrollStore = defineStore('payroll', () => {
  const payrolls = ref([])
  const currentPayslip = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // ១. FETCH ALL PAYROLL RECORDS (ទាញយកបញ្ជីបើកប្រាក់ខែរួមទាំងអស់)
  async function fetchAllPayrolls() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/payroll/admin/all') 
      if (response.data.success) {
        payrolls.value = response.data.data
      }
      return payrolls.value
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch payroll records'
    } finally {
      loading.value = false
    }
  }

  // ២. GENERATE MONTHLY PAYROLL (HR បង្កើតតារាងបើកប្រាក់ខែឱ្យបុគ្គលិកម្នាក់)
async function generateMonthlyPayroll(payrollData) {
  loading.value = true
  error.value = null
  try {
    const response = await api.post('/payroll/generate', payrollData)
    if (response.data.success) {
      await fetchAllPayrolls() 
      return { success: true }
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to generate payroll'
    
    await fetchAllPayrolls() 
    
    return { success: false, error: error.value }
  } finally {
    loading.value = false
  }
}

  // ៣. GET PAYSLIP BY ID (ទាញយកសន្លឹកបៀវត្សរ៍លម្អិតរបស់បុគ្គលិកម្នាក់យកមកបង្ហាញលើ UI)
  async function fetchPayslipById(id) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(`/payroll/admin/all/${id}`)
      if (response.data.success) {
        currentPayslip.value = response.data.data
        return currentPayslip.value
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch payslip details'
      return null
    } finally {
      loading.value = false
    }
  }

  // ៤. UPDATE PAYROLL STATUS (មុខងារប្ដូរស្ថានភាព ដូចជា ចុចបើកលុយរួចរាល់ 'paid')
  async function updatePayrollStatus(id, statusData) {
    loading.value = true
    error.value = null
    try {
      const response = await api.put(`/payroll/admin/status/${id}`, statusData)
      if (response.data.success) {
        await fetchAllPayrolls() 
        return { success: true }
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update payroll status'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // ៥. DELETE PAYROLL RECORD (លុបកត់ត្រាប្រាក់ខែ)
  async function deletePayroll(id) {
    loading.value = true
    error.value = null
    try {
      const response = await api.delete(`/payroll/admin/delete/${id}`)
      if (response.data.success) {
        await fetchAllPayrolls()
        return { success: true }
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to delete payroll record'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  return {
    payrolls,
    currentPayslip,
    loading,
    error,
    fetchAllPayrolls,
    generateMonthlyPayroll,
    fetchPayslipById,
    updatePayrollStatus,
    deletePayroll
  }
})