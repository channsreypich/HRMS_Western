import { defineStore } from 'pinia';
import api from '@/services/api';

export const useDashboardStore = defineStore('dashboard', {
    state: () => ({
        stats: null,
        loading: false,
        error: null
    }),
    actions: {
        async fetchDashboardStats() {
            this.loading = true;
            this.error = null;
            try {
                const response = await api.get('/dashboard/stats');
                if (response.data.success) {
                    const rawData = response.data.data;
                    this.stats = [
                        { title: 'Total Employees', value: rawData.total_employees, icon: 'fas fa-users', color: '#13707F', trend: 12 },
                        { title: 'Total Departments', value: rawData.total_departments, icon: 'fas fa-building', color: '#6823ff', trend: 0 },
                        { title: 'Pending Leaves', value: rawData.pending_leaves, icon: 'fas fa-envelope-open-text', color: '#ffb300', trend: -5 },
                        { title: 'Total Payroll Expense', value: `$${rawData.total_payroll_expense}`, icon: 'fas fa-wallet', color: '#10b981', trend: 8 }
                    ];
                }
            } catch (err) {
                this.error = err.response?.data?.message || 'Failed to load stats';
                console.error(err);
            } finally {
                this.loading = false;
            }
        }
    }
});