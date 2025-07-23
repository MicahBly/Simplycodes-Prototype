import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, rmSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-public-files',
      closeBundle() {
        // Ensure dist directory exists
        const distDir = resolve(__dirname, 'dist');
        if (!existsSync(distDir)) {
          mkdirSync(distDir, { recursive: true });
        }
        
        // Copy manifest
        const manifestPath = resolve(__dirname, 'public/manifest.json');
        if (existsSync(manifestPath)) {
          copyFileSync(
            manifestPath,
            resolve(__dirname, 'dist/manifest.json')
          );
        }
        
        // Copy icons directory
        const iconsDir = resolve(__dirname, 'public/icons');
        const distIconsDir = resolve(__dirname, 'dist/icons');
        if (existsSync(iconsDir)) {
          if (!existsSync(distIconsDir)) {
            mkdirSync(distIconsDir, { recursive: true });
          }
          
          const files = readdirSync(iconsDir);
          files.forEach(file => {
            const srcPath = resolve(iconsDir, file);
            if (statSync(srcPath).isFile() && file.endsWith('.png')) {
              copyFileSync(srcPath, resolve(distIconsDir, file));
            }
          });
        }
        
        // Move HTML files to correct location
        const htmlFiles = [
          { from: 'dist/src/popup/index.html', to: 'dist/popup/index.html' },
          { from: 'dist/src/sidebar/index.html', to: 'dist/sidebar/index.html' }
        ];
        
        htmlFiles.forEach(({ from, to }) => {
          const fromPath = resolve(__dirname, from);
          const toPath = resolve(__dirname, to);
          if (existsSync(fromPath)) {
            copyFileSync(fromPath, toPath);
          }
        });
        
        // Clean up src directory in dist
        const distSrcDir = resolve(__dirname, 'dist/src');
        if (existsSync(distSrcDir)) {
          rmSync(distSrcDir, { recursive: true, force: true });
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        sidebar: resolve(__dirname, 'src/sidebar/index.html'),
        background: resolve(__dirname, 'src/background/service-worker.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : '';
          if (facadeModuleId?.includes('service-worker')) {
            return 'service-worker.js';
          }
          if (facadeModuleId?.includes('content/index')) {
            return 'content.js';
          }
          return '[name]/[name].js';
        },
        chunkFileNames: 'chunks/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            if (assetInfo.name.includes('content')) {
              return 'content.css';
            }
          }
          return 'assets/[name].[ext]';
        },
        // Ensure content script is a single file
        manualChunks: (id) => {
          // Don't chunk the content script dependencies
          if (id.includes('src/content/') || 
              (id.includes('node_modules') && 
               (id.includes('shared-mock-data') || id.includes('types')) &&
               !id.includes('fuse.js'))) {
            return undefined;
          }
        },
      },
    },
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV === 'development',
    minify: process.env.NODE_ENV === 'production',
    target: 'chrome110',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@simplycodes/types': resolve(__dirname, '../types/src'),
      '@simplycodes/web-llm': resolve(__dirname, '../web-llm/src'),
      '@simplycodes/shared-mock-data': resolve(__dirname, '../shared-mock-data/src'),
    },
  },
  optimizeDeps: {
    include: ['onnxruntime-web', 'fuse.js'],
  },
});