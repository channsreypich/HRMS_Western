import { defineStore } from 'pinia'
import api from '@/services/api'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    stats: null,
    loading: false,
    error: null,
  }),
  actions: {
    async fetchDashboardStats() {
      this.loading = true
      this.error = null
      try {
        // Pull the real metrics from the Spring Boot controller
        const response = await api.get('/api/dashboard/metrics')

        if (response.data.success) {
          this.mapMetricsData(response.data.data)
        }
      } catch (err) {
        // Surface the failure instead of masking it with fabricated numbers,
        // so the dashboard never shows data that isn't really in the database.
        this.error = err.response?.data?.message || 'Failed to load dashboard metrics'
        this.stats = []
        console.error('Dashboard metrics request failed:', this.error)
      } finally {
        this.loading = false
      }
    },

    // 🛠️ Maps the real backend DashboardMetricsResponse (snake_case JSON) into the UI grid
    mapMetricsData(m) {
      const num = (snake, camel) => m[snake] ?? m[camel] ?? 0
      this.stats = [
        {
          title: 'Total Workforce',
          value: num('total_workforce', 'totalWorkforce'),
          icon: 'Profile2User',
          color: '#4f7cff',
          trend: num('total_workforce_trend', 'totalWorkforceTrend'),
        },
        {
          title: 'Active Staff',
          value: num('active_staff', 'activeStaff'),
          icon: 'UserTick',
          color: '#6f97ff',
          trend: num('active_staff_trend', 'activeStaffTrend'),
        },
        {
          title: 'Pending Leaves',
          value: num('pending_leaves', 'pendingLeaves'),
          icon: 'Sms',
          color: '#ffb300',
          trend: num('pending_leaves_trend', 'pendingLeavesTrend'),
        },
        {
          title: 'Present Today',
          value: num('present_today', 'presentToday'),
          icon: 'ClipboardTick',
          color: '#10b981',
          trend: num('present_today_trend', 'presentTodayTrend'),
        },
      ]
    },
  },
})
