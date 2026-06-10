import { defineStore } from 'pinia'
import { ref } from 'vue'
import api, { unwrap } from '@/services/api'

// Normalize a backend PayrollResponse into the field names the views use.
// Backend gives basic_salary/net_pay; views read base_salary/net_salary/gross_salary.
function mapPayroll(r) {
  const basic = Number(r.basic_salary ?? r.base_salary ?? 0)
  const allowances = Number(r.allowances ?? 0)
  const deductions = Number(r.deductions ?? 0)
  const net = r.net_pay != null ? Number(r.net_pay) : basic + allowances - deductions
  return {
    ...r,
    basic_salary: basic,
    base_salary: basic,
    allowances,
    deductions,
    gross_salary: basic + allowances,
    net_pay: net,
    net_salary: net,
    payment_month: (r.payment_date || '').slice(0, 7),
    status: (r.status || '').toLowerCase(),
  }
}

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
      // Pull a large page so the summary cards and totals reflect every record,
      // not just the first default page (size 20) the backend would otherwise return.
      const response = await api.get('/api/payroll/records', { params: { page: 0, size: 1000 } })
      if (response.data.success) {
        const data = unwrap(response) // backend returns a paginated Page -> array
        payrolls.value = Array.isArray(data) ? data.map(mapPayroll) : []
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
      // Bulk-generate draft payroll for all active employees for the chosen month
      const response = await api.post('/api/payroll/generate-monthly', payrollData)
      if (response.data.success) {
        await fetchAllPayrolls()
        return { success: true, message: response.data.message }
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
      const response = await api.get(`/api/payroll/${id}`)
      if (response.data.success) {
        currentPayslip.value = mapPayroll(response.data.data)
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
      const response = await api.put(`/api/payroll/${id}/status`, statusData)
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
      const response = await api.delete(`/api/payroll/${id}`)
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
    deletePayroll,
  }
})
