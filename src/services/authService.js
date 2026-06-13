import api from './api'

export const authService = {
  async login(credentials) {
    try {
      const response = await api.post('/api/v1/auth/login', credentials)

      return response.data
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message)
      throw error
    }
  },
}

