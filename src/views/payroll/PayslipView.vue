<template>
  <MainLayout>
    <div class="payslip-container" v-if="record">
      <div class="page-header">
        <div>
          <h1 class="page-title"><i class="fas fa-file-invoice me-2 text-gradient"></i>Payslip</h1>
          <p class="page-sub">{{ record.first_name }} {{ record.last_name }} · {{ monthLabel }}</p>
        </div>
        <div class="header-actions">
          <button class="btn-outline" @click="$router.back()">
            <i class="fas fa-arrow-left"></i> Back
          </button>
          <button class="btn-primary" @click="printPayslip">
            <i class="fas fa-print"></i> Print
          </button>
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
            <div class="col-title earnings-title"><i class="fas fa-arrow-up"></i> Earnings</div>
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
            <span class="status-pill" :class="'s-' + (record.status || '').toLowerCase()">{{
              record.status
            }}</span>
            <span class="paid-on" v-if="record.status === 'Paid'">Processed via Bank Network</span>
          </div>
        </div>

        <div class="doc-footer-note">
          <i class="fas fa-info-circle"></i>
          This payslip is system-generated and does not require a signature. For any queries,
          contact the HR department.
        </div>
      </div>
    </div>

    <div v-else class="light-card not-found">
      <i class="fas fa-file-excel fa-3x"></i>
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

const monthLabel = computed(() => {
  if (!record.value) return ''
  return new Date(Number(record.value.year), Number(record.value.month) - 1).toLocaleDateString(
    'en-US',
    { year: 'numeric', month: 'long' },
  )
})

const earnings = computed(() =>
  record.value
    ? [
        { label: 'Basic Salary', amount: record.value.basic_salary },
        { label: 'Housing Allowance', amount: Math.round((record.value.allowances || 0) * 0.5) },
        { label: 'Transport Allowance', amount: Math.round((record.value.allowances || 0) * 0.3) },
        { label: 'Other Allowances', amount: Math.round((record.value.allowances || 0) * 0.2) },
        { label: 'Overtime Pay', amount: record.value.overtime_pay || 0 },
      ]
    : [],
)

const deductions = computed(() =>
  record.value
    ? [
        { label: 'Income Tax', amount: Math.round((record.value.deductions || 0) * 0.5) },
        { label: 'Health Insurance', amount: Math.round((record.value.deductions || 0) * 0.3) },
        { label: 'Social Security', amount: Math.round((record.value.deductions || 0) * 0.2) },
      ]
    : [],
)

const totalDeductions = computed(() => {
  if (!record.value) return 0
  return (
    parseFloat(record.value.tax_deduction || 0) + parseFloat(record.value.insurance_deduction || 0)
  )
})

const formatNum = (n) => new Intl.NumberFormat().format(Math.round(n || 0))

const printPayslip = () => {
  const el = document.getElementById('payslip-print')
  const w = window.open('', '_blank')
  w.document.write(
    `<html><head><title>Payslip - HRM</title><style>body{font-family:sans-serif;padding:2rem;color:#0f172a;background:#fff;} .payslip-doc{max-width:800px;margin:0 auto;border:1px solid #e2e8f0;padding:2.5rem;border-radius:16px;} .company-info { display: flex; gap: 15px; align-items: center; } .doc-header { display: flex; justify-content: space-between; align-items: flex-start; } .company-name { font-weight: 800; font-size: 1.1rem; color: #0f172a; } .company-address { color: #64748b; font-size: 12px; } .payslip-label { font-size: 1.4rem; font-weight: 900; letter-spacing: 2px; color: #6823ff; } .payslip-month { color: #334155; font-size: 14px; margin-top: 4px; } .payslip-id { font-size: 12px; color: #94a3b8; font-family: monospace; } .doc-divider { border-bottom: 1px solid #e2e8f0; margin: 24px 0; } .emp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; } .field-label { font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight:600; } .field-value { font-size: 14px; color: #1e293b; font-weight: 700; margin-top:2px; } .pay-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin: 24px 0; } .col-title { font-weight: 800; font-size: 12px; text-transform: uppercase; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #f1f5f9; display: flex; align-items: center; gap: 6px; } .earnings-title { color: #16a34a; } .deductions-title { color: #dc2626; } .pay-row-item { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; color: #475569; } .item-amount { font-family: monospace; font-weight: 600; } .item-amount.green { color: #16a34a; } .item-amount.red { color: #dc2626; } .col-total { display: flex; justify-content: space-between; font-weight: 700; font-size: 14px; color: #0f172a; margin-top: 16px; padding-top: 12px; border-top: 1px dashed #cbd5e1; } .total-val { font-family: monospace; } .total-val.green { color: #16a34a; } .total-val.red { color: #dc2626; } .net-pay-banner { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-top: 24px; } .net-label { font-size: 12px; font-weight: 800; color: #64748b; } .net-amount { font-size: 28px; font-weight: 900; color: #6823ff; font-family: monospace; } .net-status { text-align: right; } .status-pill { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; } .s-paid { background: #dcfce7; color: #16a34a; } .s-pending { background: #fef3c7; color: #d97706; } .paid-on { font-size: 11px; color: #94a3b8; display: block; margin-top: 4px; } .doc-footer-note { font-size: 12px; color: #94a3b8; margin-top: 24px; text-align: center; border-top: 1px dashed #e2e8f0; padding-top: 16px; }</style></head><body><div class="payslip-doc">${el.innerHTML}</div></body></html>`,
  )
  w.document.close()
  setTimeout(() => {
    w.print()
  }, 300)
}

onMounted(async () => {
  await payrollStore.fetchAllPayrolls()
  record.value = payrollStore.payrolls.find((r) => r.id === Number(route.params.id)) || null
})
</script>

<style scoped>
/* Main Canvas Layer */
.payslip-container {
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background-color: #f8fafc;
  min-height: 100vh;
  font-family:
    'Inter',
    system-ui,
    -apple-system,
    sans-serif;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 0.25rem 0;
}
.page-sub {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
}
.text-gradient {
  background: linear-gradient(135deg, #6823ff, #0284c7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.header-actions {
  display: flex;
  gap: 0.75rem;
}

/* Global System Triggers */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0.65rem 1.25rem;
  background: linear-gradient(135deg, #6823ff, #4f0fdb);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(104, 35, 255, 0.25);
}
.btn-primary:hover {
  box-shadow: 0 6px 18px rgba(104, 35, 255, 0.35);
  transform: translateY(-1px);
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0.6rem 1.2rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #334155;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.btn-outline:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #0f172a;
}

/* Clean Sheet Document Wrapper */
.payslip-doc {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow:
    0 4px 6px -1px rgba(15, 23, 42, 0.02),
    0 2px 4px -1px rgba(15, 23, 42, 0.01);
}

/* Doc Header Layout */
.doc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.company-info {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}
.company-logo {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #6823ff, #4f0fdb);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
  flex-shrink: 0;
}
.company-name {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 2px;
}
.company-address {
  font-size: 0.8rem;
  color: #64748b;
}

.payslip-title-block {
  text-align: right;
}
.payslip-label {
  font-size: 1.4rem;
  font-weight: 900;
  letter-spacing: 2px;
  color: #6823ff;
}
.payslip-month {
  font-size: 0.875rem;
  color: #334155;
  font-weight: 600;
  margin-top: 3px;
}
.payslip-id {
  font-size: 0.75rem;
  color: #94a3b8;
  font-family: monospace;
  font-weight: 500;
  margin-top: 2px;
}

.doc-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 1.75rem 0;
}

/* Profile Parameters Section */
.employee-section {
  margin-bottom: 1.75rem;
  background: #f8fafc;
  padding: 1.25rem;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
}
.emp-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}
.field-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  font-weight: 700;
  margin-bottom: 3px;
}
.field-value {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1e293b;
}

/* Balance Transaction Columns */
.pay-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 1.75rem;
}
.col-title {
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-bottom: 0.5rem;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 2px solid #f1f5f9;
}
.earnings-title {
  color: #16a34a;
}
.deductions-title {
  color: #dc2626;
}
.col-title i {
  font-size: 0.75rem;
}

.pay-row-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f8fafc;
}
.item-label {
  font-size: 0.85rem;
  color: #475569;
  font-weight: 500;
}
.item-amount {
  font-size: 0.875rem;
  font-weight: 600;
  font-family: 'SF Mono', SFMono-Regular, Consolas, monospace;
}
.item-amount.green {
  color: #16a34a;
}
.item-amount.red {
  color: #dc2626;
}

.col-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.85rem;
  margin-top: 0.5rem;
  border-top: 1px dashed #cbd5e1;
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f172a;
}
.total-val {
  font-size: 1rem;
  font-family: 'SF Mono', SFMono-Regular, Consolas, monospace;
}
.total-val.green {
  color: #16a34a;
}
.total-val.red {
  color: #dc2626;
}

/* Financial Yield High-Contrast Banner */
.net-pay-banner {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.75rem;
}
.net-label {
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #475569;
}
.net-amount {
  font-size: 2.25rem;
  font-weight: 900;
  color: #6823ff;
  font-family: 'SF Mono', SFMono-Regular, Consolas, monospace;
}
.net-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.status-pill {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: capitalize;
}
.s-paid {
  background: #dcfce7;
  color: #16a34a;
}
.s-pending {
  background: #fef3c7;
  color: #d97706;
}
.paid-on {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

/* Disclaimers & Errors */
.doc-footer-note {
  font-size: 0.8rem;
  color: #94a3b8;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding-top: 1.25rem;
  border-top: 1px solid #e2e8f0;
  font-weight: 500;
  line-height: 1.4;
}
.doc-footer-note i {
  flex-shrink: 0;
  margin-top: 2px;
  color: #cbd5e1;
}

.light-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
}
.not-found {
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  max-width: 400px;
  margin: 4rem auto;
  box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.02);
}
.not-found i {
  color: #cbd5e1;
}
.me-2 {
  margin-right: 0.5rem;
}
</style>
