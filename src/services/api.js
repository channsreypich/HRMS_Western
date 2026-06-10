import axios from 'axios'

const api = axios.create({
  // 💡 Points to your Spring Boot API root (e.g., http://localhost:8080).
  // Each store already includes the full controller path (/api/..., /api/v1/auth/...),
  // so the baseURL must stay at the server root — do NOT append /api/v1 here.
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── REQUEST INTERCEPTOR ───────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// ─── RESPONSE INTERCEPTOR (WITH LIVE SPRINGBOOT FALLBACK) ──────────
api.interceptors.response.use(
  (response) => {
    // If the backend endpoint is ready and works, return the live data smoothly!
    return response
  },
  (error) => {
    const { config, response } = error

    // Check if the global mock control flag is enabled
    const isMockEnabled = import.meta.env.VITE_USE_MOCK_DATA === 'true'

    if (isMockEnabled && config) {
      // Look up our static mock database if Spring Boot returns an error (404, 500, or network down)
      const mockData = getMockDataForUrl(config.url, config.method)

      if (mockData !== null) {
        console.warn(
          `⚠️ Backend API Error on [${config.method.toUpperCase()}] ${config.url}. Falling back to mock data dataset.`,
        )

        // Return a simulated structured response matching standard Spring Boot JSON outputs
        return Promise.resolve({
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          data: {
            success: true,
            message: 'Retrieved from development fallback mock data store',
            data: mockData,
          },
        })
      }
    }

    // If mock data isn't configured for this URL or mock mode is turned off, throw the real backend error
    return Promise.reject(error)
  },
)

// ─── MOCK DATABASE REPOSITORY ─────────────────────────────────────
function getMockDataForUrl(url, method) {
  const normalizedMethod = method.toLowerCase()

  // 1. HR Management & User Authentication Lists
  if (url.includes('/api/auth/users-list') && normalizedMethod === 'get') {
    return [
      {
        id: 1,
        first_name: 'Sreypich',
        last_name: 'Chhun',
        email: 'sreypich.chhun@company.com',
        role: 'Admin',
        status: 'Active',
        created_at: '2025-11-15T08:30:00Z',
      },
      {
        id: 2,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@company.com',
        role: 'HR',
        status: 'Active',
        created_at: '2026-02-10T09:15:00Z',
      },
    ]
  }

  // 2. Attendance Tracking Module
  // បន្ថែម ឬជំនួសត្រង់ផ្នែក Attendance Tracking Module ក្នុងឯកសារ api.js
  if (url.includes('/api/attendance') && normalizedMethod === 'get') {
    // ការពារករណីហៅសួររក History របស់បុគ្គលិកម្នាក់ៗ
    if (url.includes('/history/')) {
      return [
        {
          id: 501,
          date: '2026-06-05',
          clockIn: '07:55 AM',
          clockOut: '05:02 PM',
          status: 'On Time',
        },
        {
          id: 502,
          date: '2026-06-06',
          clockIn: '08:02 AM',
          clockOut: '05:00 PM',
          status: 'On Time',
        },
      ]
    }

    // បញ្ជូនទិន្នន័យរួមសម្រាប់ផ្ទាំង HR Accounts Dashboard ធំ
    return [
      {
        id: 1,
        employeeName: 'Sreypich Chhun',
        date: '2026-06-07',
        clockIn: '08:00 AM',
        clockOut: '05:00 PM',
        status: 'On Time',
      },
      {
        id: 2,
        employeeName: 'John Doe',
        date: '2026-06-07',
        clockIn: '08:45 AM',
        clockOut: '05:05 PM',
        status: 'Late',
      },
    ]
  }

  // គាំទ្រការសាកល្បងមុខងារ Check-In និង Check-Out កុំឱ្យធ្លាក់ទៅ Error catch
  if (url.includes('/api/attendance/check-in') && normalizedMethod === 'post') {
    return { message: 'Mock check-in registration successful', time: '08:00 AM' }
  }

  if (url.includes('/api/attendance/check-out') && normalizedMethod === 'post') {
    return { message: 'Mock check-out tracking successful', time: '05:00 PM' }
  }

  // 3. Employee Master Data Profile Directory
  if (url.includes('/api/employees') && normalizedMethod === 'get') {
    return [
      {
        id: 101,
        code: 'EMP-001',
        name: 'Sreypich Chhun',
        department: 'IT',
        position: 'Fullstack Developer',
        status: 'Active',
      },
      {
        id: 102,
        code: 'EMP-002',
        name: 'John Doe',
        department: 'HR',
        position: 'HR Manager',
        status: 'Active',
      },
    ]
  }

  // 4. Leave & Absence Management Applications
  if (url.includes('/api/leave') && normalizedMethod === 'get') {
    return [
      {
        id: 1,
        employeeName: 'Sreypich Chhun',
        type: 'Annual Leave',
        duration: '3 Days',
        status: 'Approved',
      },
    ]
  }

  return null // Return null so if an unknown URL fails, we see the real system console track trace
}

// ─── RESPONSE UNWRAP HELPER ────────────────────────────────────────
// Backend wraps everything in ApiResponse: { success, message, data, timestamp }.
// Paginated endpoints put a Spring Data Page in `data` ({ content: [...], totalElements, ... }).
// This returns the meaningful payload: the Page's content array, or the raw data otherwise.
export function unwrap(response) {
  const payload = response?.data?.data
  if (payload && Array.isArray(payload.content)) return payload.content
  return payload
}

export default api
