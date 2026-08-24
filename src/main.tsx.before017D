import "./pdiIsoPrecisionUx.css";
import "./pdiIsoUxRuntimePatch.js";
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Global error listener for non-React uncaught runtime and resource-loading crashes
window.addEventListener("error", (event) => {
  console.error("Global system error caught:", event.error || event.message);
  const rootEl = document.getElementById("root");
  if (rootEl && !rootEl.hasChildNodes()) {
    rootEl.innerHTML = `
      <div style="background-color: #020617; color: #ffffff; min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: system-ui, -apple-system, sans-serif; padding: 24px; box-sizing: border-box;">
        <div style="max-width: 600px; width: 100%; background-color: #0f172a; border: 1px solid rgba(239, 68, 68, 0.4); padding: 32px; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); box-sizing: border-box;">
          <div style="display: flex; align-items: center; gap: 16px; color: #ef4444; margin-bottom: 24px;">
            <span style="font-size: 36px; line-height: 1;">⚠️</span>
            <div>
              <h2 style="margin: 0; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Erreur Système Globale</h2>
              <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8; font-weight: 500;">L'application n'a pas pu s'initialiser correctement.</p>
            </div>
          </div>
          <div style="background-color: #020617; border: 1px solid #1e293b; padding: 18px; border-radius: 16px; font-family: monospace; font-size: 11px; color: #f87171; overflow: auto; max-height: 250px; line-height: 1.6; box-sizing: border-box;">
            <strong>${event.message || 'Erreur inconnue'}</strong><br/>
            <pre style="margin: 8px 0 0; white-space: pre-wrap; word-break: break-all; opacity: 0.85;">${event.error?.stack || 'Pas de trace de pile disponible.'}</pre>
          </div>
          <div style="margin-top: 24px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 10px; font-family: monospace; color: #64748b;">SONELGAZ-TG • Diagnostic</span>
            <button onclick="window.location.reload()" style="background-color: #f97316; hover:background-color: #ea580c; color: #ffffff; border: none; padding: 10px 20px; border-radius: 12px; font-size: 12px; font-weight: bold; cursor: pointer; transition: all 0.2s;">Recharger la page</button>
          </div>
        </div>
      </div>
    `;
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

