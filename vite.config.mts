import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: resolve(import.meta.dirname, 'planner-app'),
  envDir: import.meta.dirname,
  base: '/planner/',
  plugins: [react()],
  build: {
    outDir: resolve(import.meta.dirname, 'dist/planner'),
    emptyOutDir: false,
    sourcemap: false,
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@supabase')) return 'supabase';
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react';
          if (id.includes('node_modules/zod')) return 'validation';
          return undefined;
        },
      },
    },
  },
  test: {
    root: resolve(import.meta.dirname),
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
