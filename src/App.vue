<template>
  <div class="app-container">
    <RouterView />
  </div>
  <!--  <router-view />-->
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { applySavedPrefs } from './utils/theme'

const auth = useAuthStore()

// Apply the saved accent/theme before anything paints so it's live everywhere.
applySavedPrefs()

onMounted(() => {
  if (auth.isAuthenticated) {
    // auth.fetchUser()
  }
})
</script>

<style>
.app-container {
  min-height: 100vh;
  background: var(--bg-app);
  color: var(--text);
}

.cursor-pointer {
  cursor: pointer;
}

/* Iconsax (VsxIcon) helpers — render as inline SVGs */
svg {
  vertical-align: middle;
}
.vsx-spin {
  animation: vsx-spin 0.8s linear infinite;
}
@keyframes vsx-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
