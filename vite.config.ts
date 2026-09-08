import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served from https://<user>.github.io/cache/ — every asset, the manifest and
// the service worker resolve against this base.
export default defineConfig({
  base: '/cache/',
  plugins: [react()],
  build: { target: 'es2022' },
});
