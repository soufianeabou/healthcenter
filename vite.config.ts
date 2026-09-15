import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// PWA support (vite-plugin-pwa) is disabled for now — the generated service
// worker took over navigation in production and broke the Outlook OAuth
// redirect (/oauth2/authorization/azure-dev) for every role, super admin
// included. See src/main.tsx for the code that actively unregisters any
// service worker already installed in a browser from that deploy.
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://192.168.1.97:8282',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
