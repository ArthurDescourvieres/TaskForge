import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    watch: {
      // nécessaire pour le hot-reload dans un conteneur avec un volume monté depuis Windows
      usePolling: true,
    },
  },
})
