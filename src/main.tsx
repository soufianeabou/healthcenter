import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

/* A short-lived PWA rollout registered a service worker that ended up
   intercepting navigation to /oauth2/authorization/azure-dev, breaking
   Outlook login for every role — including super admin, who never even
   reaches the app-level auth logic for that click. PWA support has been
   removed from the build, but a browser that already installed that
   service worker will keep running it (and stay broken) until it's
   explicitly unregistered. This runs on every load until enough time has
   passed that no affected browser is likely still out there — safe to
   delete this whole block once confirmed everyone's browser has cleared
   the old worker. */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  }).catch(() => {});
  if ('caches' in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    }).catch(() => {});
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
