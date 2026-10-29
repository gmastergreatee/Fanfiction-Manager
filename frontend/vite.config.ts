import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'serve-v4-covers',
      configureServer(server) {
        server.middlewares.use('/covers', (req, res, next) => {
          const rawUrl = (req.url || '').replace(/^\//, '').split('?')[0];
          const fileName = decodeURIComponent(rawUrl);
          const candidatePaths = [
            path.resolve(__dirname, '../v4_data/covers', fileName),
            path.resolve(__dirname, '../../v4_data/covers', fileName),
          ];
          for (const p of candidatePaths) {
            if (fs.existsSync(p) && fs.statSync(p).isFile()) {
              res.setHeader('Content-Type', 'image/png');
              res.setHeader('Cache-Control', 'public, max-age=86400');
              if (req.method === 'HEAD') {
                return res.end();
              }
              return fs.createReadStream(p).pipe(res);
            }
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Tauri expects a fixed port, fail if that port is not available
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  build: {
    outDir: '../dist_ui',
    emptyOutDir: true,
    target: process.env.TAURI_ENV_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
});
