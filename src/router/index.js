// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Settings from '@/views/settings/SettingsView.vue'

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
      // 💡 ជំនួសឱ្យការកំណត់រុញទៅកាន់ទំព័រចៃដន្យ ទុកឱ្យគណនេយ្យភាពរបស់ authStore សម្រេចចិត្ត
      redirect: () => {
        const auth = useAuthStore()
        if (!auth.isAuthenticated) return '/login'
        return auth.homeRoute
      },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/dashboard/Dashboard.vue'),
      children: [
        {
          path: 'settings',
          name: 'Settings',
          component: Settings // The page content
        }
      ],
      // Now Admin and HR can both access this route
      meta: { requiresAuth: true, role: ['HR', 'Admin'] },
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
      component: () => import('@/views/attendance/ScanAttendance.vue'),
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
    {
      path: '/reports/:type',
      name: 'report-detail',
      component: () => import('@/views/reports/ReportDetail.vue'),
      meta: { requiresAuth: true },
    },

    //  ─── SUPER ADMIN CHANNELS ───
    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: () => import('@/views/admin/AdminDashboard.vue'),
      meta: { requiresAuth: true, role: 'Admin' },
    },
    {
      path: '/manage-hr',
      name: 'manage-hr',
      component: () => import('@/views/admin/ManageHRAccounts.vue'),
      meta: { requiresAuth: true, role: 'Admin' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/settings/SettingsView.vue'),
      meta: { requiresAuth: true },
    },

    // ─── CATCH-ALL 404 ───
    // Any unknown path (typos, refresh on a removed route) falls back to the
    // root resolver, which sends guests to /login and users to their home page.
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      redirect: '/',
    },
  ],
})

// ===================================================================
// CENTRAL NAVIGATION GUARD
// គ្រប់គ្រងសិទ្ធិចូលប្រើប្រាស់ និងការបង្វែរផ្លូវផ្អែកលើស្ថានភាពពិតរបស់ authStore
// ===================================================================
router.beforeEach((to) => {
  const auth = useAuthStore()

  // ១. បើទំព័រនោះត្រូវការ Login (requiresAuth) តែមិនទាន់បានផ្ទៀងផ្ទាត់ ➔ រុញទៅ Login
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return '/login'
  }

  // ២. បើមានសោរ Login រួចរាល់ហើយ តែចង់ព្យាយាមចូលទៅកាន់ទំព័រ Guest (e.g. /login) ➔ បោះទៅទំព័រដើមតាម Role
  if (to.meta.requiresGuest && auth.isAuthenticated) {
    return auth.homeRoute
  }

  // ៣. ប្រព័ន្ធការពារសិទ្ធិ Role Gate (RBAC)៖ បើចូលទំព័រខុសពីតួនាទីខ្លួនឯង ➔ បញ្ជូនត្រឡប់ទៅទំព័រដើមវិញ
  if (auth.isAuthenticated && to.meta.role && !auth.canAccess(to.meta.role)) {
    return auth.homeRoute
  }

  // អនុញ្ញាតឱ្យឆ្លងកាត់ដោយជោគជ័យ
  return true
})

export default router
