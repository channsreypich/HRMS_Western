<template>
  <MainLayout>
    <div class="admin-dashboard-layout">
      <div class="page-header fade-in">
        <div class="header-text">
          <h1 class="page-title">
            <i class="fas fa-user-shield me-2 icon-gradient"></i>
            <span class="text-gradient">HR Accounts Management</span>
          </h1>
          <p class="page-subtitle text-muted">
            Create, monitor, and control system access for HR operators.
          </p>
        </div>
        <button class="btn-create" @click="openCreateModal">
          <i class="fas fa-user-plus me-2"></i> Register New HR
        </button>
      </div>

      <div class="table-panel mt-4 fade-in">
        <div class="table-responsive">
          <table class="management-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created Date</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="hr in hrUsers" :key="hr.id">
                <td>#{{ hr.id }}</td>
                <td class="user-fullname">{{ hr.first_name }} {{ hr.last_name }}</td>
                <td>{{ hr.email }}</td>
                <td>
                  <span class="badge-role" :class="hr.role === 'Admin' ? 'role-admin' : 'role-hr'">
                    <i :class="hr.role === 'Admin' ? 'fas fa-crown' : 'fas fa-user-tie'"></i>
                    {{ hr.role }}
                  </span>
                </td>
                <td>
                  <span
                    class="status-badge"
                    :class="hr.status === 'Active' ? 'status-active' : 'status-inactive'"
                  >
                    <i class="fas fa-circle me-1" style="font-size: 0.5rem"></i>
                    {{ hr.status }}
                  </span>
                </td>
                <td>{{ new Date(hr.created_at).toLocaleDateString('km-KH') }}</td>
                <td class="text-center">
                  <button
                    class="btn-action-toggle me-2"
                    :class="hr.status === 'Active' ? 'deactivate-mode' : 'activate-mode'"
                    @click="handleToggleStatus(hr.id, hr.status)"
                    :disabled="hr.role === 'Admin'"
                  >
                    <i
                      :class="hr.status === 'Active' ? 'fas fa-user-slash' : 'fas fa-user-check'"
                    ></i>
                    {{ hr.status === 'Active' ? ' Deactivate' : ' Activate' }}
                  </button>

                  <button
                    class="btn-action-delete"
                    @click="handleDeleteUser(hr.id)"
                    :disabled="hr.role === 'Admin'"
                  >
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="hrUsers.length === 0">
                <td colspan="7" class="text-center text-muted py-4">
                  No HR operators found in the database.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="showModal" class="modal-overlay">
        <div class="light-modal">
          <div class="modal-header">
            <h3><i class="fas fa-user-plus me-2 text-purple"></i> Register HR Operator</h3>
            <button class="btn-close" @click="closeModal"><i class="fas fa-times"></i></button>
          </div>

          <form @submit.prevent="submitCreateHR" class="mt-3">
            <div class="row">
              <div class="col-6 mb-3">
                <label class="form-label-custom">First Name</label>
                <input type="text" v-model="form.first_name" class="form-input-custom" required />
              </div>
              <div class="col-6 mb-3">
                <label class="form-label-custom">Last Name</label>
                <input type="text" v-model="form.last_name" class="form-input-custom" required />
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label-custom">Email Address</label>
              <input
                type="email"
                v-model="form.email"
                class="form-input-custom"
                placeholder="example@hr.com"
                required
              />
            </div>
            <div class="mb-4">
              <label class="form-label-custom">Account Password</label>
              <input
                type="password"
                v-model="form.password"
                class="form-input-custom"
                placeholder="Minimum 6 characters"
                required
              />
            </div>

            <div class="d-flex justify-content-end gap-2">
              <button type="button" class="btn-cancel" @click="closeModal">Cancel</button>
              <button type="submit" class="btn-submit" :disabled="isSubmitting">
                {{ isSubmitting ? 'Registering...' : 'Save & Activate' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'
import MainLayout from '@/components/layouts/MainLayout.vue'

const hrUsers = ref([])
const showModal = ref(false)
const isSubmitting = ref(false)

const form = reactive({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
})

const fetchHRUsers = async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('http://localhost:8001/api/auth/users-list', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.data.success) {
      hrUsers.value = res.data.data
    }
  } catch (err) {
    console.error('Failed to load users:', err)
  }
}

const openCreateModal = () => {
  showModal.value = true
}
const closeModal = () => {
  showModal.value = false
  form.first_name = ''
  form.last_name = ''
  form.email = ''
  form.password = ''
}

const submitCreateHR = async () => {
  isSubmitting.value = true
  try {
    const token = localStorage.getItem('token')
    const payload = { ...form, role: 'HR' }

    const res = await axios.post('http://localhost:8001/api/auth/register-hr', payload, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.data.success) {
      Swal.fire({
        icon: 'success',
        title: 'HR Operator Registered!',
        text: 'The new HR account has been successfully created and activated.',
        background: '#ffffff',
        color: '#1a1a1a',
        confirmButtonColor: '#6823ff',
      })
      closeModal()
      fetchHRUsers()
    }
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Registration Failed',
      text: err.response?.data?.message || 'Something went wrong',
      background: '#ffffff',
      color: '#1a1a1a',
      confirmButtonColor: '#6823ff',
    })
  } finally {
    isSubmitting.value = false
  }
}

const handleToggleStatus = async (userId, currentStatus) => {
  const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active'
  const textAlert = newStatus === 'Active' ? 'activate' : 'deactivate'

  const confirmResult = await Swal.fire({
    title: 'Are you sure?',
    text: `Do you want to ${textAlert} this HR account access?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#6823ff',
    cancelButtonColor: '#e2e8f0',
    confirmButtonText: `Yes, ${textAlert}!`,
    background: '#ffffff',
    color: '#1a1a1a',
  })

  if (confirmResult.isConfirmed) {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.patch(
        `http://localhost:8001/api/auth/user-status/${userId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Status Updated!',
          background: '#ffffff',
          color: '#1a1a1a',
          confirmButtonColor: '#6823ff',
        })
        fetchHRUsers()
      }
    } catch (err) {
      Swal.fire({
        title: 'Error',
        text: 'Failed to update status.',
        icon: 'error',
        background: '#ffffff',
        color: '#1a1a1a',
        confirmButtonColor: '#6823ff',
      })
    }
  }
}

const handleDeleteUser = async (userId) => {
  const confirmResult = await Swal.fire({
    title: 'Permanently Remove?',
    text: 'This will completely delete the HR operator from the system!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#e2e8f0',
    confirmButtonText: 'Yes, delete it!',
    background: '#ffffff',
    color: '#1a1a1a',
  })

  if (confirmResult.isConfirmed) {
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`http://localhost:8001/api/auth/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      Swal.fire({
        title: 'Removed!',
        icon: 'success',
        background: '#ffffff',
        color: '#1a1a1a',
        confirmButtonColor: '#6823ff',
      })
      fetchHRUsers()
    } catch (err) {
      Swal.fire({
        title: 'Error',
        text: 'Failed to delete user.',
        icon: 'error',
        background: '#ffffff',
        color: '#1a1a1a',
        confirmButtonColor: '#6823ff',
      })
    }
  }
}

onMounted(() => {
  fetchHRUsers()
})
</script>

<style scoped>

.admin-dashboard-layout {
  padding: 0.5rem;
  color: #1a1a1a;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}
.text-gradient {
  background: linear-gradient(135deg, #531cbd 0%, #11606d 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.icon-gradient {
  color: #531cbd;
}
.page-subtitle {
  color: #64748b !important;
  font-size: 0.88rem;
  margin-top: 4px;
}

.btn-create {
  background: linear-gradient(135deg, #6823ff 0%, #8b5cf6 100%);
  border: none;
  color: #fff;
  padding: 10px 20px;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.3s;
}
.btn-create:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(104, 35, 255, 0.25);
}

.table-panel {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.01),
    0 2px 4px -1px rgba(0, 0, 0, 0.01);
  border-radius: 16px;
  padding: 1.5rem;
}
.management-table {
  width: 100%;
  border-collapse: collapse;
}
.management-table th {
  padding: 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  color: #64748b;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}
.management-table td {
  padding: 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  font-size: 0.88rem;
  color: #334155;
}
.user-fullname {
  color: #0f172a !important;
  font-weight: 600;
}

.badge-role {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.role-admin {
  background: rgba(217, 119, 6, 0.12);
  color: #b45309;
}
.role-hr {
  background: rgba(104, 35, 255, 0.1);
  color: #6823ff;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
}
.status-active {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
}
.status-inactive {
  background: rgba(220, 38, 38, 0.12);
  color: #dc2626;
}

.btn-action-toggle {
  border: none;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}
.deactivate-mode {
  background: rgba(217, 119, 6, 0.1);
  color: #b45309;
}
.deactivate-mode:hover {
  background: rgba(217, 119, 6, 0.18);
}
.activate-mode {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}
.activate-mode:hover {
  background: rgba(16, 185, 129, 0.18);
}

.btn-action-delete {
  border: none;
  background: transparent;
  color: #dc2626;
  padding: 6px 10px;
  cursor: pointer;
  border-radius: 6px;
  transition: 0.2s;
}
.btn-action-delete:hover:not(:disabled) {
  background: rgba(220, 38, 38, 0.08);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.3);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}
.light-modal {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border-radius: 20px;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
}
.light-modal h3 {
  color: #0f172a;
  font-weight: 700;
  font-size: 1.2rem;
  margin: 0;
}
.text-purple {
  color: #6823ff !important;
}
.btn-close {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 1.1rem;
  transition: 0.2s;
}
.btn-close:hover {
  color: #1a1a1a;
}

.form-label-custom {
  color: #475569;
  font-size: 0.82rem;
  margin-bottom: 6px;
  display: block;
  font-weight: 500;
}
.form-input-custom {
  width: 100%;
  padding: 11px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: #1a1a1a;
  outline: none;
  transition: 0.2s;
}
.form-input-custom:focus {
  background: #ffffff;
  border-color: #6823ff;
  box-shadow: 0 0 0 3px rgba(104, 35, 255, 0.1);
}
.form-input-custom::placeholder {
  color: #94a3b8;
}

.btn-cancel {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #475569;
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  transition: 0.2s;
}
.btn-cancel:hover {
  background: #e2e8f0;
  color: #1a1a1a;
}
.btn-submit {
  background: #6823ff;
  border: none;
  color: #fff;
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: 0.2s;
}
.btn-submit:hover {
  background: #531cbd;
  box-shadow: 0 4px 12px rgba(104, 35, 255, 0.2);
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
