import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'
import 'vue3-toastify/dist/index.css'
import './assets/theme.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Vue3Toastify from 'vue3-toastify'
import { VsxIcon } from 'vue-iconsax'

import App from './App.vue'
import router from './router'

const app = createApp(App)

// 💡 Iconsax icons registered globally as <VsxIcon iconName="..." />
app.component('VsxIcon', VsxIcon)

app.use(createPinia())
app.use(router)
app.use(Vue3Toastify, {
  autoClose: 3000,
  position: 'top-right',
  theme: 'light',
})

app.mount('#app')
