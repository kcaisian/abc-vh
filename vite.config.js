import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: { port: 5173 },
  optimizeDeps: {
    exclude: ['@mediapipe/tasks-vision']
  },
  build: {
    rollupOptions: {
      input: {
        index:  resolve(__dirname, 'index.html'),
        main:   resolve(__dirname, 'main.html'),
        muscle: resolve(__dirname, 'muscle.html'),
      }
    }
  }
})
