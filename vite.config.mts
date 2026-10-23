import { createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: resolve(import.meta.dirname, 'planner-app'),
  envDir: import.meta.dirname,
  base: '/planner/',
  plugins: [
    react(),
    {
      name: 'shared-site-fonts',
      apply: 'serve',
      configureServer(server) {
        // Keep development on the same shared font URLs as the static production site.
        server.middlewares.use('/assets/fonts/', (request, response, next) => {
          const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
          if (!/^\/[\w.-]+\.(?:css|woff2)$/.test(pathname)) return next();
          const stream = createReadStream(resolve(import.meta.dirname, 'assets/fonts', pathname.slice(1)));
          response.setHeader('Content-Type', pathname.endsWith('.woff2') ? 'font/woff2' : 'text/css; charset=utf-8');
          response.setHeader('X-Content-Type-Options', 'nosniff');
          stream.on('error', () => {
            if (response.headersSent) response.destroy();
            else response.writeHead(404).end('Not found');
          });
          response.on('close', () => stream.destroy());
          stream.pipe(response);
        });
      },
    },
  ],
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
