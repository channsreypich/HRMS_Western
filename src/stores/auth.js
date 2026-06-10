import { ref, computed } from 'vue'
import api from '@/services/api'
import { defineStore } from 'pinia'

const MOCK_USERS = [
  {
    email: 'channsreypich@gmail.com',
    password: 'Password123!',
    first_name: 'Channsrey',
    last_name: 'Pich',
    role: 'Admin',
  },
  {
    email: 'hr@gmail.com',
    password: 'Password123!',
    first_name: 'HR',
    last_name: 'Manager',
    role: 'HR',
  },
]

const STORAGE_TOKEN = 'token'
const STORAGE_USER = 'user'
const STORAGE_ROLE = 'user_role'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(STORAGE_TOKEN) || null)
  const user = ref(safeParse(localStorage.getItem(STORAGE_USER)))
  const loading = ref(false)
  const error = ref(null)
  const isUsingMockFallback = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const role = computed(() => user.value?.role || localStorage.getItem(STORAGE_ROLE) || null)
  const isAdmin = computed(() => role.value === 'Admin')
  const isHR = computed(() => role.value === 'HR')
  const homeRoute = computed(() => {
    if (!isAuthenticated.value) return '/login'
    return isAdmin.value ? '/admin/dashboard' : '/dashboard'
  })

  // Actions
  async function login(credentials) {
    loading.value = true
    error.value = null

    try {
      const response = await api.post('/api/v1/auth/login', {
        email: credentials.email?.toLowerCase().trim(),
        password: credentials.password,
      })

      const result = response.data.data || response.data

      const rawRole = (result.roles && result.roles[0]) || ''
      const bareRole = rawRole.replace(/^ROLE_/, '')
      const normalizedRole = bareRole === 'ADMIN' ? 'Admin' : bareRole === 'HR' ? 'HR' : bareRole

      const profile = {
        email: result.email,
        role: normalizedRole,
        first_name: result.email?.split('@')[0] || 'User',
        last_name: '',
      }

      // Backend (snake_case JSON) returns access_token; keep accessToken as a fallback
      const accessToken = result.access_token || result.accessToken

      token.value = accessToken
      user.value = profile
      isUsingMockFallback.value = false

      localStorage.setItem(STORAGE_TOKEN, accessToken)
      localStorage.setItem(STORAGE_USER, JSON.stringify(profile))
      localStorage.setItem(STORAGE_ROLE, normalizedRole)

      return { success: true }
    } catch (err) {
      console.warn('Backend login failed, attempting mock fallback...')

      const match = MOCK_USERS.find(
        (u) => u.email === credentials.email && u.password === credentials.password,
      )

      if (!match) {
        error.value = 'Invalid email or password.'
        return { success: false }
      }

      const { password: _omit, ...profile } = match
      const fakeToken = `mock-jwt-${profile.role.toLowerCase()}-token`

      token.value = fakeToken
      user.value = profile
      isUsingMockFallback.value = true

      localStorage.setItem(STORAGE_TOKEN, fakeToken)
      localStorage.setItem(STORAGE_USER, JSON.stringify(profile))
      localStorage.setItem(STORAGE_ROLE, profile.role)

      return { success: true }
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = null
    user.value = null
    isUsingMockFallback.value = false
    localStorage.clear()
    return Promise.resolve()
  }
  function canAccess(requiredRole) {
    if (!requiredRole) return true
    // Handle array: allows the route to accept multiple roles
    if (Array.isArray(requiredRole)) return requiredRole.includes(role.value)
    // Handle single string: backward compatibility
    return role.value === requiredRole
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    isHR,
    homeRoute,
    login,
    logout,
    canAccess
  }
})

function safeParse(value) {
  try {
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}
