<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()

onMounted(() => {
  if (auth.isAuthenticated) {
    // auth.fetchUser()
  }
})
</script>

<style>
@import 'bootstrap/dist/css/bootstrap.min.css';

:root {
  --primary-color: #0d6efd;
  --secondary-color: #6c757d;
  --success-color: #198754;
  --danger-color: #dc2626;
  --warning-color: #ffc107;
}

body {
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
  background-color: #f8f9fa;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
