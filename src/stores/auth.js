import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api' 

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  const loading = ref(false)
  const error = ref(null)

  // Getter: ពិនិត្យមើលថាតើមានអ្នកកំពុង Login ប្រើប្រាស់ប្រព័ន្ធឬអត់
  const isAuthenticated = computed(() => !!token.value)
  
  // Getter: ទាញយកឈ្មោះអ្នកប្រើប្រាស់មកបង្ហាញលើក្បាលទំព័រ Welcome
  const userName = computed(() => {
    if (user.value) return `${user.value.first_name} ${user.value.last_name}`
    return localStorage.getItem('user_name') || 'User'
  })

  // មុខងារ LOGIN (បន្ថែមការរក្សាទុក role ចូល LocalStorage)
  async function login(credentials) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/auth/login', credentials)
      
      // 💡 ពិនិត្យលក្ខខណ្ឌជោគជ័យពី Backend
      if (response.data.success) {
        const resBody = response.data // 👈 ចាប់យកជាន់ក្រៅបង្អស់នៃ Response
        
        // រក្សាទុកកូដសោរ Token និងព័ត៌មានបុគ្គលិកចូលក្នុង Pinia State
        token.value = resBody.token
        user.value = resBody.user
        
        // 💾 រក្សាទុកក្នុង LocalStorage ការពារការបាត់បង់ពេល Refresh ទំព័រ
        localStorage.setItem('token', resBody.token)
        localStorage.setItem('user_name', `${resBody.user.first_name} ${resBody.user.last_name}`)
        
        // 👑 👑 👑 ថែមជួរនេះ៖ រក្សាទុកតួនាទីរបស់គាត់ ('Admin' ឬ 'HR') ដើម្បីឱ្យ Router & Sidebar យកទៅប្រើ
        localStorage.setItem('user_role', resBody.user.role)
        
        return { success: true }
      } else {
        error.value = response.data.message || 'Login failed'
        return { success: false }
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Login failed. Please check your credentials.'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // មុខងារ FETCH PROFILE (បន្ថែមការទាញយកតួនាទីមកអាប់ដេតឡើងវិញ)
  async function fetchProfile() {
    if (!token.value) return null
    try {
      const response = await api.get('/auth/profile')
      if (response.data.success) {
        user.value = response.data.user || response.data.data
        
        //អាប់ដេតតួនាទីនៅក្នុង LocalStorage ឱ្យត្រូវគ្នាជានិច្ច
        if (user.value?.role) {
          localStorage.setItem('user_role', user.value.role)
        }
        
        return user.value
      }
    } catch (err) {
      console.error('Session expired or invalid token')
      logout()
    }
  }

  // ៣. LOGOUT FUNCTION (មុខងារចាកចេញពីប្រព័ន្ធ និងសម្អាតសោរចោលទាំងអស់)
  function logout() {
    token.value = null
    user.value = null
    
    // បោសសម្អាតកម្ទេចកម្ទីសោរចេញពី LocalStorage ឱ្យស្អាតទទេស្អាត
    localStorage.removeItem('token')
    localStorage.removeItem('user_name')
    localStorage.removeItem('user_role') 
    
    // បង្វែរឱ្យរត់ត្រឡប់ទៅកាន់ផ្ទាំង Login វិញដោយស្វ័យប្រវត្តិ
    window.location.href = '/login'
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    userName,
    login,
    fetchProfile,
    logout
  }
})