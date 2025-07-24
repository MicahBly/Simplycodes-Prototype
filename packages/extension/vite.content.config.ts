import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/content/index.ts'),
      name: 'SimplyCodes',
      formats: ['iife'],
      fileName: () => 'content.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') {
            return 'content.css';
          }
          return assetInfo.name || '';
        },
      },
    },
    minify: true,
    target: 'chrome110',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});