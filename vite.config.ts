import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    // Relative base ensures GitHub Pages works seamlessly on any subpath (e.g. /my-repo/)
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifestFilename: 'manifest.webmanifest',
        includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon.png'],
        manifest: {
          id: '/',
          name: 'One — Student Workspace',
          short_name: 'One',
          description: 'Minimal, offline-first student personal workspace, task manager, timetable integrator, and academic alignment engine.',
          theme_color: '#1C1917',
          background_color: '#F9F7F2',
          display: 'standalone',
          display_override: ['standalone', 'window-controls-overlay', 'minimal-ui'],
          orientation: 'portrait-primary',
          start_url: './',
          scope: './',
          categories: ['education', 'productivity'],
          prefer_related_applications: false,
          icons: [
            {
              src: './pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: './pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: './pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          shortcuts: [
            {
              name: 'Daily Planner',
              short_name: 'Planner',
              description: 'Open your daily time blocks and schedule',
              url: './#planner',
              icons: [{ src: './pwa-192x192.png', sizes: '192x192' }],
            },
            {
              name: 'Course Tracker',
              short_name: 'Courses',
              description: 'Track syllabus mastery and subject documents',
              url: './#study',
              icons: [{ src: './pwa-192x192.png', sizes: '192x192' }],
            },
            {
              name: 'Focus Timer',
              short_name: 'Focus',
              description: 'Launch Pomodoro deep work timer',
              url: './#focus',
              icons: [{ src: './pwa-192x192.png', sizes: '192x192' }],
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
      {
        name: 'disable-vite-client-ws',
        transform(code, id) {
          if (id.includes('vite/dist/client/client.mjs')) {
            return code
              .replace(
                'else throw new SendBeforeConnectError("send was called before connect");',
                'else return;'
              )
              .replace(
                'else throw new SendBeforeConnectError("invoke was called before connect");',
                'else return;'
              )
              .replace(
                'async connect({ onMessage, onDisconnection }) {',
                'async connect() { return; },\n\t\tasync _disabledConnect({ onMessage, onDisconnection }) {'
              )
              .replace(
                'ws.send(JSON.stringify(data));',
                'ws?.send?.(JSON.stringify(data));'
              )
              .replace(
                'setupForwardConsoleHandler(transport, forwardConsole);',
                '/* Console forwarding disabled */'
              );
          }
          if (id.includes('pwa-entry-point-loaded')) {
            return 'export default function registerDevSW() {}\n';
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR & WebSocket server are disabled in AI Studio to prevent WebSocket connection errors.
      hmr: false,
      ws: false,
      watch: null,
    },
  };
});
