// import './assets/main.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'
import '@fortawesome/fontawesome-free/css/all.min.css'
import 'vue3-toastify/dist/index.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Vue3Toastify from 'vue3-toastify'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Vue3Toastify, {
    autoClose: 3000,
    position: 'top-right',
    theme: 'light'
})

app.mount('#app')