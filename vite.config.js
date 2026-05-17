import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: { port: 5173 },
  optimizeDeps: {
    exclude: ['@mediapipe/tasks-vision']
  },
  build: {
    // Increase chunk size warning limit — MediaPipe is intentionally large
    chunkSizeWarningLimit: 10000,
    rollupOptions: {
      input: {
        index:  resolve(__dirname, 'index.html'),
        main:   resolve(__dirname, 'main.html'),
        muscle: resolve(__dirname, 'muscle.html'),
      },
      // Don't bundle MediaPipe — it loads from CDN at runtime
      external: [
        /^https:\/\/cdn\.jsdelivr\.net/,
        /^https:\/\/storage\.googleapis\.com/,
      ]
    }
  }
})
