import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Workbox service worker for offline caching and PWA installation
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
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
}

createRoot(document.getElementById('root')!).render(<App />);
