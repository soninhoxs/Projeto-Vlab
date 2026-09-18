import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      // Necessário no Docker + Windows para detectar alterações do volume montado
      usePolling: true,
      interval: 300,
    },
  },
})
