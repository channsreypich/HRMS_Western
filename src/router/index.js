// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/Login.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/',
      // 💡 ជំនួសឱ្យការកំណត់រុញទៅ /dashboard ងងឹតងងល់ ពួកយើងទុកឱ្យ beforeEach ខាងក្រោមជាអ្នកបែងចែកផ្លូវវិញ
      redirect: to => {
        const token = localStorage.getItem('token')
        const userRole = localStorage.getItem('user_role')

        if (!token) return '/login'
        if (userRole === 'Admin') return '/admin/dashboard'
        return '/dashboard'
      }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/dashboard/Dashboard.vue'),
      meta: { requiresAuth: true },
      // 🔄 មុខងារពិសេស៖ ឆែកសិទ្ធិមុននឹងបើកទ្វារឱ្យចូលទំព័រ Dashboard របស់ HR
      beforeEnter: (to, from, next) => {
        const userRole = localStorage.getItem('user_role')
        // 👑 បើរកឃើញក្នុង LocalStorage ថាជា Admin ពិតមែន គឺបង្វែរផ្លូវទៅផ្ទាំង Admin Dashboard ភ្លាម!
        if (userRole === 'Admin') {
          next('/admin/dashboard')
        } else {
          next()
        }
      }
    },
    {
      path: '/employees',
      name: 'employees',
      component: () => import('@/views/employees/EmployeeList.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/employees/create',
      name: 'employee-create',
      component: () => import('@/views/employees/EmployeeForm.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/employees/:id/edit',
      name: 'employee-edit',
      component: () => import('@/views/employees/EmployeeForm.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/employees/:id',
      name: 'employee-detail',
      component: () => import('@/views/employees/EmployeeDetail.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/departments',
      name: 'departments',
      component: () => import('@/views/departments/DepartmentList.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/positions',
      name: 'positions',
      component: () => import('@/views/positions/PositionList.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/attendance',
      name: 'attendance',
      component: () => import('@/views/attendance/AttendanceList.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/scan-attendance',
      name: 'ScanAttendance',
      component: () => import('@/views/attendance/ScanAttendance.vue'),
    },

{
  path: '/public/scan',
  name: 'PublicScan',
  component: () => import('@/views/attendance/ScanAttendance.vue')
},
    {
      path: '/leave',
      name: 'leave',
      component: () => import('@/views/leave/LeaveList.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/leave/apply',
      name: 'leave-apply',
      component: () => import('@/views/leave/LeaveForm.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/payroll',
      name: 'payroll',
      component: () => import('@/views/payroll/PayrollList.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/payroll/:id/payslip',
      name: 'payslip-view',
      component: () => import('@/views/payroll/PayslipView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('@/views/reports/ReportsDashboard.vue'),
      meta: { requiresAuth: true },
    },

    //  ─── SUPER ADMIN CHANNELS ───
    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: () => import('@/views/admin/AdminDashboard.vue'),
      meta: { requiresAuth: true, role: 'Admin' }
    },
    {
      path: '/manage-hr',
      name: 'manage-hr',
      component: () => import('@/views/admin/ManageHRAccounts.vue'),
      meta: { requiresAuth: true, role: 'Admin' }
    }

  ],
})

// ===================================================================
// NAVIGATION GUARD ជួសជុលថ្មី (រឹងមាំ និងឆ្លាតវៃបំផុត)
// ===================================================================
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // ចាប់យកទិន្នន័យផ្ទាល់ពី LocalStorage ការពារការបាត់បង់ Role ពេល Refresh ទំព័រ
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('user_role')

  // ១. បើទំព័រនោះត្រូវការ Login (requiresAuth) តែគ្មានសោរ Token ផ្ញើមកទេ ➔ រុញទៅទំព័រ Login ភ្លាម!
  if (to.meta.requiresAuth && !token) {
    return next('/login')
  }

  // ២. បើមានសោរ Login រួចរាល់ហើយ តែចង់ព្យាយាមចូលទៅកាន់ទំព័រ Login សារជាថ្មី
  if (to.meta.requiresGuest && token) {
    if (userRole === 'Admin') {
      return next('/admin/dashboard')
    }
    return next('/dashboard')
  }

  // ៣. បើគាត់បើកចំលីង /dashboard ធម្មតា ប៉ុន្តែតួនាទីជា Admin ➔ បង្វែរផ្លូវទៅកាន់ផ្ទាំង Admin ភ្លាម
  if (to.path === '/dashboard' && userRole === 'Admin') {
    return next('/admin/dashboard')
  }

  // ៤. ខ្សែការពារដេញជើងសិទ្ធិដាច់ណាត់ (RBAC)៖ បើទំព័ររបស់ Admin តែអ្នកលួចចូលជា HR ➔ ទាត់ចេញភ្លាម!
  if (to.meta.role && to.meta.role !== userRole) {
    return next('/dashboard')
  }

  next() // ដើរចូលទំព័រដោយជោគជ័យ
})

export default router
