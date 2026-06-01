<template>
  <MainLayout>
    <div class="admin-dashboard-layout">
      
      <div class="page-header fade-in">
        <div class="header-text">
          <h1 class="page-title">
            <i class="fas fa-user-shield me-2 icon-gradient"></i>
            <span class="text-gradient">HR Accounts Management</span>
          </h1>
          <p class="page-subtitle text-muted">Create, monitor, and control system access for HR operators.</p>
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
                  <span class="status-badge" :class="hr.status === 'Active' ? 'status-active' : 'status-inactive'">
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
                    <i :class="hr.status === 'Active' ? 'fas fa-user-slash' : 'fas fa-user-check'"></i>
                    {{ hr.status === 'Active' ? ' Deactivate' : ' Activate' }}
                  </button>

                  <button class="btn-action-delete" @click="handleDeleteUser(hr.id)" :disabled="hr.role === 'Admin'">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="hrUsers.length === 0">
                <td colspan="7" class="text-center text-muted py-4">No HR operators found in the database.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="showModal" class="modal-overlay">
        <div class="glass-modal">
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
              <input type="email" v-model="form.email" class="form-input-custom" placeholder="example@hr.com" required />
            </div>
            <div class="mb-4">
              <label class="form-label-custom">Account Password</label>
              <input type="password" v-model="form.password" class="form-input-custom" placeholder="Minimum 6 characters" required />
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
  password: ''
})

const fetchHRUsers = async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('http://localhost:8001/api/auth/users-list', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.data.success) {
      hrUsers.value = res.data.data
    }
  } catch (err) {
    console.error('Failed to load users:', err)
  }
}

const openCreateModal = () => { showModal.value = true }
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
      headers: { Authorization: `Bearer ${token}` }
    })

    if (res.data.success) {
      Swal.fire({
        icon: 'success', title: 'HR Operator Registered!',
        text: 'The new HR account has been successfully created and activated.',
        background: '#110c26', color: '#fff', confirmButtonColor: '#6823ff'
      })
      closeModal()
      fetchHRUsers()
    }
  } catch (err) {
    Swal.fire({
      icon: 'error', title: 'Registration Failed',
      text: err.response?.data?.message || 'Something went wrong',
      background: '#110c26', color: '#fff'
    })
  } finally {
    isSubmitting.value = false
  }
}

const handleToggleStatus = async (userId, currentStatus) => {
  const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active'
  const textAlert = newStatus === 'Active' ? 'activate' : 'deactivate'

  const confirmResult = await Swal.fire({
    title: 'Are you sure?', text: `Do you want to ${textAlert} this HR account access?`,
    icon: 'question', showCancelButton: true, confirmButtonColor: '#6823ff',
    cancelButtonColor: 'rgba(255,255,255,0.1)', confirmButtonText: `Yes, ${textAlert}!`,
    background: '#110c26', color: '#fff'
  })

  if (confirmResult.isConfirmed) {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.patch(`http://localhost:8001/api/auth/user-status/${userId}`, 
        { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.data.success) {
        Swal.fire({ icon: 'success', title: 'Status Updated!', background: '#110c26', color: '#fff', confirmButtonColor: '#6823ff' })
        fetchHRUsers()
      }
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Failed to update status.', icon: 'error', background: '#110c26', color: '#fff' })
    }
  }
}

const handleDeleteUser = async (userId) => {
  const confirmResult = await Swal.fire({
    title: 'Permanently Remove?', text: "This will completely delete the HR operator from the system!",
    icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444',
    cancelButtonColor: 'rgba(255,255,255,0.1)', confirmButtonText: 'Yes, delete it!',
    background: '#110c26', color: '#fff'
  })

  if (confirmResult.isConfirmed) {
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`http://localhost:8001/api/auth/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      Swal.fire({ title: 'Removed!', icon: 'success', background: '#110c26', color: '#fff' })
      fetchHRUsers()
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Failed to delete user.', icon: 'error', background: '#110c26', color: '#fff' })
    }
  }
}

onMounted(() => { fetchHRUsers() })
</script>

<style scoped>
.admin-dashboard-layout { padding: 0.5rem; color: #fff; }
.page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
.text-gradient { background: linear-gradient(135deg, #a47bff 0%, #40c8da 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.page-subtitle { color: rgba(255,255,255,0.5); font-size: 0.88rem; margin-top: 4px; }

.btn-create { background: linear-gradient(135deg, #6823ff 0%, #8b5cf6 100%); border: none; color: #fff; padding: 10px 20px; font-weight: 600; border-radius: 10px; cursor: pointer; transition: 0.3s; }
.btn-create:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(104,35,255,0.3); }

.table-panel { background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 1.5rem; }
.management-table { width: 100%; border-collapse: collapse; }
.management-table th { padding: 14px; border-bottom: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.4); font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.5px; }
.management-table td { padding: 14px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.88rem; color: rgba(255,255,255,0.7); }
.user-fullname { color: #fff; font-weight: 600; }

.badge-role { padding: 4px 10px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; }
.role-admin { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
.role-hr { background: rgba(104, 35, 255, 0.15); color: #a47bff; }

.status-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; display: inline-flex; align-items: center; }
.status-active { background: rgba(52, 211, 153, 0.12); color: #34d399; }
.status-inactive { background: rgba(239, 68, 68, 0.12); color: #ef4444; }

.btn-action-toggle { border: none; padding: 6px 14px; border-radius: 8px; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: 0.2s; }
.deactivate-mode { background: rgba(251, 191, 36, 0.1); color: #fbbf24; }
.activate-mode { background: rgba(52, 211, 153, 0.1); color: #34d399; }

.btn-action-delete { border: none; background: transparent; color: #ef4444; padding: 6px 10px; cursor: pointer; border-radius: 6px; }
.btn-action-delete:hover:not(:disabled) { background: rgba(239, 68, 68, 0.15); }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 1050; }
.glass-modal { background: #0f0a22; border: 1px solid rgba(104, 35, 255, 0.2); border-radius: 20px; padding: 2rem; width: 100%; max-width: 500px; }
.form-label-custom { color: rgba(255,255,255,0.6); font-size: 0.82rem; margin-bottom: 6px; display: block; }
.form-input-custom { width: 100%; padding: 11px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #fff; outline: none; }
.btn-cancel { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 10px 20px; border-radius: 10px; cursor: pointer; }
.btn-submit { background: #6823ff; border: none; color: #fff; padding: 10px 20px; border-radius: 10px; cursor: pointer; }

.fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
</style>