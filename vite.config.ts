import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import path from 'node:path';
import fs from 'node:fs';

/** Preloads are plain CommonJS (sandboxed); copy them next to main.cjs. */
function copyPreloads(): Plugin {
  return {
    name: 'copy-preloads',
    buildStart() {
      const dest = path.resolve(__dirname, 'dist-electron');
      fs.mkdirSync(dest, { recursive: true });
      fs.copyFileSync(path.resolve(__dirname, 'electron/preload/app.cjs'), path.join(dest, 'preload-app.cjs'));
    },
  };
}

const rendererOnly = process.env.TEKELI_RENDERER_ONLY === '1';

export default defineConfig({
  plugins: [
    react(),
    ...(rendererOnly
      ? []
      : [
          electron({
            entry: 'electron/main.ts',
            vite: {
              build: {
                outDir: 'dist-electron',
                rollupOptions: {
                  external: ['electron', /^node:/],
                  output: { format: 'cjs', entryFileNames: '[name].cjs' },
                },
              },
              plugins: [copyPreloads()],
            },
          }),
        ]),
  ],
  resolve: { alias: { '@': path.resolve(__dirname, './src'), '@shared': path.resolve(__dirname, './shared') } },
  server: {
    port: 5173,
    strictPort: true,
    // Pages are served through tekeli://<page>, so HMR must not guess the host from location.
    hmr: { host: 'localhost', port: 5173, protocol: 'ws' },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: { chrome: path.resolve(__dirname, 'chrome.html'), pages: path.resolve(__dirname, 'pages.html') },
    },
  },
});
