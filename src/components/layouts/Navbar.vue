<template>
  <nav class="navbar">
    <div class="navbar-container">
      <div class="navbar-left">
        <h2 class="page-title">{{ currentPage }}</h2>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// 🎯 បង្ហាញឈ្មោះទំព័រខ្លីៗមួយម៉ាត់ចំៗទៅបង្ហាញក្នុង <h2>
const currentPage = computed(() => {
  const path = route.path
  if (path === '/dashboard') return 'Dashboard'
  if (path.includes('/employees')) return 'Employees'
  if (path.includes('/departments')) return 'Departments'
  if (path.includes('/positions')) return 'Positions'
  if (path.includes('/payroll')) return 'Payroll'
  if (path.includes('/reports')) return 'Reports'
  return 'System'
})
</script>

<style scoped>
.navbar {
  position: sticky; top: 0; z-index: 100;
  height: 60px;
  background: rgba(10, 10, 20, 0.85);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(104, 35, 255, 0.15);
}

.navbar-container {
  height: 100%; 
  padding: 0 2rem; 
  display: flex; 
  align-items: center;
}

.navbar-left { 
  display: flex; 
  align-items: center; 
}

.page-title {
  margin: 0;
  font-size: 1.2rem; 
  font-weight: 700;
  background: linear-gradient(135deg, #a47bff, #40c8da);
  -webkit-background-clip: text; 
  -webkit-text-fill-color: transparent; 
  background-clip: text;
  letter-spacing: 0.5px;
}
</style>