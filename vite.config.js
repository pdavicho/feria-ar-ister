import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ¡Sin configuraciones raras aquí! Deja que Vite use sus valores por defecto (dist)
})