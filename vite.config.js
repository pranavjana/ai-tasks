import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [tailwindcss(), react()],
    server: {
      port: 5174,
      strictPort: true, // This ensures it only uses this port
      host: true // This enables network access
    },
    resolve: {
      alias: {
        '@mui/styled-engine': '@mui/styled-engine-sc'
      },
    },
    optimizeDeps: {
      include: ['@emotion/styled']
    },
    // Expose env variables to your client code
    define: {
      'process.env': env
    }
  }
})
