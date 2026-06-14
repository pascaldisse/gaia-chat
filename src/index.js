import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Add discord dark theme class to body
document.body.classList.add('discord-dark');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Unregister any existing service workers and clear caches (cleanup from CRA migration)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
  if (window.caches) caches.keys().then(ks => ks.forEach(k => caches.delete(k)));
}


