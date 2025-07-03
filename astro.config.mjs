// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import node from '@astrojs/node';
import { visualizer } from 'rollup-plugin-visualizer';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        plugins: [
          // Bundle analyzer - only in build mode
          process.env.ANALYZE && visualizer({
            filename: 'dist/bundle-analysis.html',
            open: true,
            gzipSize: true,
            brotliSize: true,
          }),
        ].filter(Boolean),
        output: {
          // Better chunk splitting
          manualChunks: {
            // React core
            'react': ['react', 'react-dom'],
            // UI libraries
            'ui-libs': ['@radix-ui/react-dialog', '@radix-ui/react-label', '@radix-ui/react-slot'],
            // Icons
            'icons': ['lucide-react'],
            // Forms and validation
            'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
            // Auth
            'auth': ['better-auth'],
            // Database
            'database': ['@libsql/client', '@libsql/kysely-libsql'],
            // Utilities
            'utils': ['clsx', 'class-variance-authority', 'tailwind-merge'],
            // Toast library (separate chunk for lazy loading)
            'toast': ['react-hot-toast'],
          }
        }
      },
      // Optimize dependencies
      minify: 'esbuild',
      cssMinify: true,
      // Remove console.log in production
      esbuild: {
        drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
      },
      // Chunk size warnings
      chunkSizeWarningLimit: 100,
      // Enable source maps for better debugging
      sourcemap: process.env.NODE_ENV !== 'production',
    },
    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        '@radix-ui/react-dialog',
        '@radix-ui/react-label',
        '@radix-ui/react-slot',
        'lucide-react',
        'clsx',
        'class-variance-authority',
        'tailwind-merge',
      ],
      exclude: [
        'react-hot-toast', // Exclude from optimization to enable lazy loading
      ],
    },
  },

  integrations: [react()]
});