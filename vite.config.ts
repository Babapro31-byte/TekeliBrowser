import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';
import fs from 'fs';

// Plugin to copy preload files (CommonJS files that shouldn't be processed)
function copyPreloadFiles(): Plugin {
  return {
    name: 'copy-preload-files',
    buildStart() {
      const destDir = path.resolve(__dirname, 'dist-electron');
      
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      // Copy main preload
      const preloadSrc = path.resolve(__dirname, 'electron/preload.cjs');
      const preloadDest = path.resolve(destDir, 'preload.cjs');
      fs.copyFileSync(preloadSrc, preloadDest);
      console.log('Copied preload.cjs to dist-electron/');
      
      // Copy webview preload
      const webviewPreloadSrc = path.resolve(__dirname, 'electron/webviewPreload.cjs');
      const webviewPreloadDest = path.resolve(destDir, 'webviewPreload.cjs');
      fs.copyFileSync(webviewPreloadSrc, webviewPreloadDest);
      console.log('Copied webviewPreload.cjs to dist-electron/');

      // Copy sql.js WASM (needed in packaged app)
      const sqlWasmSrc = path.resolve(__dirname, 'node_modules/sql.js/dist/sql-wasm.wasm');
      const sqlWasmDest = path.resolve(destDir, 'sql-wasm.wasm');
      if (fs.existsSync(sqlWasmSrc)) {
        fs.copyFileSync(sqlWasmSrc, sqlWasmDest);
        console.log('Copied sql-wasm.wasm to dist-electron/');
      }
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron']
            }
          },
          plugins: [copyPreloadFiles()]
        }
      },
      {
        entry: 'electron/adBlocker.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron']
            }
          }
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'framer-motion']
        }
      }
    }
  }
});