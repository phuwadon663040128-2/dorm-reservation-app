import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1800,
    rolldownOptions: {
      checks: {
        pluginTimings: false,
      },
      onwarn(warning, warn) {
        if (warning.code === 'INVALID_ANNOTATION') return
        warn(warning)
      },
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (
            id.includes('vue')
            || id.includes('reka-ui')
            || id.includes('@vueuse')
            || id.includes('vaul-vue')
          ) {
            return 'vendor-vue-ui'
          }
          if (id.includes('@lucide') || id.includes('embla-carousel')) {
            return 'vendor-visual'
          }
          return 'vendor'
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
