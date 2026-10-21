import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Workbox service worker in production; clean up any stale dev service workers in dev preview
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    try {
      registerSW({
        immediate: true,
        onNeedRefresh() {
          console.log('New content available, reload to update.');
        },
        onOfflineReady() {
          console.log('App ready to work offline.');
        },
      });
    } catch (err) {
      console.warn('Service worker registration deferred:', err);
    }
  } else {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      })
      .catch(() => {});
  }
}

createRoot(document.getElementById('root')!).render(<App />);
