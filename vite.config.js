import { fileURLToPath, URL } from 'node:url'
import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      // '@': path.resolve(__dirname, './src'),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // 💡 ថែមកូដប្លុកខាងក្រោមនេះដើម្បីបិទផ្ទាំង Overlay ក្រហមដែលគាំង Cache ចោល
  server: {
    hmr: {
      overlay: false,
    },
  },
})
