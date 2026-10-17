import { readFileSync } from 'node:fs'
import { availableParallelism } from 'node:os'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'

// package.json is where the version is set; the app shows that same number.
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },

  test: {
    globals: true, 
    environment: 'jsdom', 
    setupFiles: './src/test/setup.ts', 
    css: false, 
    // Left to itself Vitest starts a worker per logical processor, and they starve each other.
    maxWorkers: Math.min(6, Math.max(1, availableParallelism() - 1)),
    // A test of the whole app takes seconds in jsdom, and longer on a busy machine.
    testTimeout: 15000,
  },
})