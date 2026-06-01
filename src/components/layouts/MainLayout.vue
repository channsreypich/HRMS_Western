<template>
  <div class="app-layout">
    <Sidebar />
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

const sidebarCollapsed = ref(false)

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: #ffffff;
}

.main-content {
  flex: 1;
  margin-left: 260px;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content.sidebar-collapsed {
  margin-left: 72px;
}

.page-content {
  flex: 1;
  padding: 2rem;
  color: #1a1a1a;
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
