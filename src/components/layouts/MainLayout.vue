<template>
  <div class="app-layout">
    <Sidebar :collapsed="sidebarCollapsed" />
    <div class="main-content" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <Navbar @toggle-sidebar="toggleSidebar" />
      <main class="page-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from './Sidebar.vue'
import Navbar from './Navbar.vue'
import { readPrefs } from '@/utils/theme'

// Restore the user's last choice and keep it until they change it again.
const SIDEBAR_KEY = 'hrm_sidebar_collapsed'
const initialCollapsed = (() => {
  const direct = localStorage.getItem(SIDEBAR_KEY)
  if (direct !== null) return direct === 'true'
  return readPrefs()?.interface?.collapsedSidebar || false
})()
const sidebarCollapsed = ref(initialCollapsed)

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem(SIDEBAR_KEY, String(sidebarCollapsed.value))
}
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-app);
}

.main-content {
  flex: 1;
  margin-left: var(--sidebar-w);
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.main-content.sidebar-collapsed {
  margin-left: var(--sidebar-collapsed-w);
}

.page-content {
  flex: 1;
  padding: 1.75rem 2rem 2.5rem;
  color: var(--text);
  animation: pageIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes pageIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
  }
  .page-content {
    padding: 1rem;
  }
}
</style>
