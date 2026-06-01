<template>
  <MainLayout>
    <div class="payslip-container" v-if="record">

      <div class="page-header">
        <div>
          <h1 class="page-title"><i class="fas fa-file-invoice me-2 text-gradient"></i>Payslip</h1>
          <p class="page-sub">{{ record.first_name }} {{ record.last_name }} · {{ monthLabel }}</p>
        </div>
        <div class="header-actions">
          <button class="btn-outline" @click="$router.back()"><i class="fas fa-arrow-left"></i> Back</button>
          <button class="btn-primary" @click="printPayslip"><i class="fas fa-print"></i> Print</button>
        </div>
      </div>

      <div class="payslip-doc" id="payslip-print">
        <div class="doc-header">
          <div class="company-info">
            <div class="company-logo">
              <i class="fas fa-building"></i>
            </div>
            <div>
              <div class="company-name">HRM System Company</div>
              <div class="company-address">Sen Sok District, Phnom Penh, Cambodia</div>
              <div class="company-address">hr@hrmcompany.com · +855 (012) 345-678</div>
            </div>
          </div>
          <div class="payslip-title-block">
            <div class="payslip-label">PAYSLIP</div>
            <div class="payslip-month">{{ monthLabel }}</div>
            <div class="payslip-id">Ref: PSL-{{ String(record.id).padStart(5, '0') }}</div>
          </div>
        </div>

        <div class="doc-divider"></div>

        <div class="employee-section">
          <div class="emp-grid">
            <div class="emp-field">
              <div class="field-label">Employee Name</div>
              <div class="field-value">{{ record.first_name }} {{ record.last_name }}</div>
            </div>
            <div class="emp-field">
              <div class="field-label">Employee ID</div>
              <div class="field-value">EMP-{{ String(record.employee_id).padStart(3, '0') }}</div>
            </div>
            <div class="emp-field">
              <div class="field-label">Department</div>
              <div class="field-value">{{ record.department_name || '—' }}</div>
            </div>
            <div class="emp-field">
              <div class="field-label">Position</div>
              <div class="field-value">{{ record.position_title || '—' }}</div>
            </div>
            <div class="emp-field">
              <div class="field-label">Bank Sync</div>
              <div class="field-value">ABA Bank</div>
            </div>
            <div class="emp-field">
              <div class="field-label">Account status</div>
              <div class="field-value">Payroll Transfer</div>
            </div>
          </div>
        </div>

        <div class="pay-columns">
          <div class="pay-col">
            <div class="col-title earnings-title">
              <i class="fas fa-arrow-up"></i> Earnings
            </div>
            <div class="pay-row-item" v-for="e in earnings" :key="e.label">
              <span class="item-label">{{ e.label }}</span>
              <span class="item-amount green">${{ formatNum(e.amount) }}</span>
            </div>
            <div class="col-total">
              <span>Gross Salary</span>
              <span class="total-val green">${{ formatNum(record.gross_salary) }}</span>
            </div>
          </div>

          <div class="pay-col">
            <div class="col-title deductions-title">
              <i class="fas fa-arrow-down"></i> Deductions
            </div>
            <div class="pay-row-item" v-for="d in deductions" :key="d.label">
              <span class="item-label">{{ d.label }}</span>
              <span class="item-amount red">-${{ formatNum(d.amount) }}</span>
            </div>
            <div class="col-total">
              <span>Total Deductions</span>
              <span class="total-val red">-${{ formatNum(totalDeductions) }}</span>
            </div>
          </div>
        </div>

        <div class="net-pay-banner">
          <div class="net-label">NET PAY</div>
          <div class="net-amount">${{ formatNum(record.net_salary) }}</div>
          <div class="net-status">
            <span class="status-pill" :class="'s-' + (record.status || '').toLowerCase()">{{ record.status }}</span>
            <span class="paid-on" v-if="record.status === 'Paid'">Processed via Bank Network</span>
          </div>
        </div>

        <div class="doc-footer-note">
          <i class="fas fa-info-circle"></i>
          This payslip is system-generated and does not require a signature. For any queries, contact the HR department.
        </div>
      </div>
    </div>

    <div v-else class="dark-card not-found">
      <i class="fas fa-file-times fa-3x"></i>
      <p>Payslip record not found</p>
      <button class="btn-outline" @click="$router.back()">Go Back</button>
    </div>
  </MainLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from '@/components/layouts/MainLayout.vue'
import { usePayrollStore } from '@/stores/payroll'

const route = useRoute()
const payrollStore = usePayrollStore()
const record = ref(null)

//គណនាឈ្មោះខែ Dynamic ផ្អែកលើ Column `month` និង `year` ពី Database
const monthLabel = computed(() => {
  if (!record.value) return ''
  return new Date(Number(record.value.year), Number(record.value.month) - 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
})

const earnings = computed(() => record.value ? [
  { label: 'Basic Salary', amount: record.value.basic_salary },
  { label: 'Housing Allowance', amount: Math.round((record.value.allowances || 0) * 0.5) },
  { label: 'Transport Allowance', amount: Math.round((record.value.allowances || 0) * 0.3) },
  { label: 'Other Allowances', amount: Math.round((record.value.allowances || 0) * 0.2) },
  { label: 'Overtime Pay', amount: record.value.overtime_pay || 0 },
] : [])

const deductions = computed(() => record.value ? [
  { label: 'Income Tax', amount: Math.round((record.value.deductions || 0) * 0.5) },        /* កាត់ពន្ធ 50% */
  { label: 'Health Insurance', amount: Math.round((record.value.deductions || 0) * 0.3) }, /* ធានារ៉ាប់រង 30% */
  { label: 'Social Security', amount: Math.round((record.value.deductions || 0) * 0.2) },  /* មូលនិធិសង្គម 20% */
] : [])

const totalDeductions = computed(() => {
  if (!record.value) return 0
  return parseFloat(record.value.tax_deduction || 0) + parseFloat(record.value.insurance_deduction || 0)
})

const formatNum = (n) => new Intl.NumberFormat().format(Math.round(n || 0))

const printPayslip = () => {
  const el = document.getElementById('payslip-print')
  const w = window.open('', '_blank')
  w.document.write(`<html><head><title>Payslip - HRM</title><style>body{font-family:sans-serif;padding:2rem;color:#1e293b;background:#fff;} .payslip-doc{max-width:800px;margin:0 auto;} .company-info { display: flex; gap: 15px; } .doc-header { display: flex; justify-content: space-between; } .doc-divider { border-bottom: 2px solid #e2e8f0; margin: 20px 0; } .emp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; } .pay-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 20px; } .col-title { font-weight: bold; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid #cbd5e1; } .pay-row-item { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; } .col-total { display: flex; justify-content: space-between; font-weight: bold; margin-top: 15px; padding-top: 10px; border-top: 1px dashed #cbd5e1; } .net-pay-banner { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 10px; text-align: center; margin-top: 30px; } .net-amount { font-size: 28px; font-weight: 800; color: #6823ff; margin: 5px 0; } .doc-footer-note { font-size: 12px; color: #64748b; margin-top: 30px; text-align: center; }</style></head><body><div class="payslip-doc">${el.innerHTML}</div></body></html>`)
  w.document.close()
  setTimeout(() => {
    w.print()
  }, 300)
}

onMounted(async () => {
  //បាញ់ទៅទាញទិន្នន័យប្រាក់ខែរួមសិន រួចដេញរកមើល ID ឱ្យត្រូវនឹង URL params
  await payrollStore.fetchAllPayrolls()
  record.value = payrollStore.payrolls.find(r => r.id === Number(route.params.id)) || null
})
</script>

<style scoped>
.payslip-container { padding: 1.5rem; max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.25rem; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; }
.page-title { font-size: 1.6rem; font-weight: 700; color: rgba(255,255,255,0.92); margin: 0 0 0.3rem; }
.page-sub { font-size: 0.83rem; color: rgba(255,255,255,0.35); margin: 0; }
.text-gradient { background: linear-gradient(135deg, #a47bff, #40c8da); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.header-actions { display: flex; gap: 0.75rem; }
.btn-primary { display: inline-flex; align-items: center; gap: 7px; padding: 0.6rem 1.2rem; background: linear-gradient(135deg, #6823ff, #4f0fdb); border: none; border-radius: 10px; color: white; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(104,35,255,0.35); }
.btn-primary:hover { opacity: 0.9; }
.btn-outline { display: inline-flex; align-items: center; gap: 7px; padding: 0.55rem 1.1rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 9px; color: rgba(255,255,255,0.6); font-size: 0.83rem; cursor: pointer; transition: all 0.2s; }
.btn-outline:hover { background: rgba(255,255,255,0.1); }

.payslip-doc { background: #0d0d1a; border: 1px solid rgba(104,35,255,0.2); border-radius: 20px; padding: 2.5rem; }

/* Doc Header */
.doc-header { display: flex; justify-content: space-between; align-items: flex-start; }
.company-info { display: flex; align-items: center; gap: 1rem; }
.company-logo { width: 50px; height: 50px; background: linear-gradient(135deg, #6823ff, #13707f); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; color: white; flex-shrink: 0; }
.company-name { font-size: 1.05rem; font-weight: 800; color: rgba(255,255,255,0.9); margin-bottom: 3px; }
.company-address { font-size: 0.72rem; color: rgba(255,255,255,0.35); margin-bottom: 1px; }
.payslip-title-block { text-align: right; }
.payslip-label { font-size: 1.3rem; font-weight: 900; letter-spacing: 3px; background: linear-gradient(135deg, #a47bff, #40c8da); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.payslip-month { font-size: 0.85rem; color: rgba(255,255,255,0.6); margin-top: 3px; }
.payslip-id { font-size: 0.72rem; color: rgba(255,255,255,0.3); font-family: monospace; margin-top: 2px; }

.doc-divider { height: 1px; background: linear-gradient(90deg, rgba(104,35,255,0.4), transparent); margin: 1.5rem 0; }

/* Employee section */
.employee-section { margin-bottom: 1.5rem; }
.emp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.emp-field {}
.field-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(255,255,255,0.3); margin-bottom: 3px; }
.field-value { font-size: 0.85rem; font-weight: 600; color: rgba(255,255,255,0.82); }

/* Pay columns */
.pay-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
.pay-col {}
.col-title { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 0.6rem 0; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 7px; border-bottom: 1px solid rgba(255,255,255,0.06); }
.earnings-title { color: #34d399; }
.deductions-title { color: #f87171; }
.col-title i { font-size: 0.7rem; }
.pay-row-item { display: flex; justify-content: space-between; align-items: center; padding: 0.45rem 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
.item-label { font-size: 0.8rem; color: rgba(255,255,255,0.55); }
.item-amount { font-size: 0.82rem; font-weight: 600; font-family: 'Courier New', monospace; }
.item-amount.green { color: #34d399; }
.item-amount.red { color: #f87171; }
.col-total { display: flex; justify-content: space-between; align-items: center; padding: 0.7rem 0 0; margin-top: 0.25rem; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.82rem; font-weight: 700; color: rgba(255,255,255,0.7); }
.total-val { font-size: 0.95rem; font-family: 'Courier New', monospace; }
.total-val.green { color: #34d399; }
.total-val.red { color: #f87171; }

/* Net pay banner */
.net-pay-banner {
  background: linear-gradient(135deg, rgba(104,35,255,0.15), rgba(64,200,218,0.08));
  border: 1px solid rgba(104,35,255,0.3);
  border-radius: 14px; padding: 1.5rem 2rem;
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 1.5rem;
}
.net-label { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.4); }
.net-amount { font-size: 2.2rem; font-weight: 900; background: linear-gradient(135deg, #a47bff, #40c8da); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-family: 'Courier New', monospace; }
.net-status { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
.status-pill { padding: 4px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; text-transform: capitalize; }
.s-paid { background: rgba(52,211,153,0.15); color: #34d399; }
.s-pending { background: rgba(251,191,36,0.15); color: #fbbf24; }
.paid-on { font-size: 0.72rem; color: rgba(255,255,255,0.35); }

.doc-footer-note { font-size: 0.72rem; color: rgba(255,255,255,0.25); display: flex; align-items: flex-start; gap: 7px; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.06); }
.doc-footer-note i { flex-shrink: 0; margin-top: 1px; }

.dark-card { background: #0d0d1a; border: 1px solid rgba(104,35,255,0.13); border-radius: 18px; padding: 1.5rem; }
.not-found { text-align: center; padding: 3rem; color: rgba(255,255,255,0.3); display: flex; flex-direction: column; align-items: center; gap: 1rem; max-width: 400px; margin: 2rem auto; }
.not-found i { opacity: 0.3; }
.me-2 { margin-right: 0.5rem; }
</style>
