import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Ensure CommonJS modules are properly resolved
      'hoist-non-react-statics': 'hoist-non-react-statics/dist/hoist-non-react-statics.cjs.js'
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-redux',
      'hoist-non-react-statics',
      'use-sync-external-store',
      'use-sync-external-store/shim',
      'use-sync-external-store/shim/with-selector',
      'eventemitter3',
      'react-is',
      'zustand',
      '@headlessui/react'
    ],
    // Defer heavy libs to dynamic import if needed
    exclude: ['xlsx', 'exceljs', 'pdfmake', 'recharts', '@mui/material', '@mui/x-date-pickers', 'react-phone-input-2', 'libphonenumber-js'],
    esbuildOptions: {
      // Properly handle CommonJS modules
      define: {
        global: 'globalThis'
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('xlsx')) return 'xlsx';
            if (id.includes('exceljs')) return 'exceljs';
            if (id.includes('pdfmake')) return 'pdfmake';
            if (id.includes('recharts')) return 'recharts';
            if (id.includes('@mui/material') || id.includes('@mui/x-date-pickers')) return 'mui';
            if (id.includes('react-phone-input-2') || id.includes('libphonenumber-js')) return 'phoneinput';
            if (id.includes('world-countries')) return 'countries';
          }
        }
      }
    }
  }
})
