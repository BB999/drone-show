import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

// 証明書ファイルが存在する場合のみHTTPS設定を行う
const certPath = path.resolve(__dirname, '.cert/cert.pem');
const keyPath = path.resolve(__dirname, '.cert/key.pem');
const httpsConfig = fs.existsSync(certPath) && fs.existsSync(keyPath) ? {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath)
} : false;

export default defineConfig({
  // GitHub Pages用: 相対パスで公開
  base: './',
  server: {
    https: httpsConfig,
    host: '0.0.0.0'
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['doron.glb', 'doron.blend', '*.mp3', 'icons/*.png'],
      manifest: {
        name: 'DROCON - MR Drone Simulator',
        short_name: 'DROCON',
        description: 'Mixed Reality Drone Simulator for Quest 3 / Quest Pro',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#00c8ff',
        orientation: 'any',
        icons: [
          {
            src: './icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: './icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: './icons/icon-192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: './icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,glb,mp3,png,jpg,svg,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024, // 15MB for large GLB files
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ]
});
