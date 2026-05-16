import { defineConfig } from 'vite'

export default defineConfig({
  server: { port: 5173 },
  // MediaPipe WASM files need to be served with correct headers
  optimizeDeps: {
    exclude: ['@mediapipe/tasks-vision']
  }
})
