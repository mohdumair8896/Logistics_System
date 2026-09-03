/**
 * LogiFlow 24/7 Virtual Logistics Dispatcher - Embeddable Host Loader
 * Zero-conflict cross-origin iframe embed pipeline with PostMessage bridge.
 */
(function () {
  'use strict';

  if (window.__LOGIFLOW_LOADED__) return;
  window.__LOGIFLOW_LOADED__ = true;

  const currentScript = document.currentScript || document.querySelector('script[src*="loader.js"]');
  const hostOrigin = currentScript ? new URL(currentScript.src).origin : window.location.origin;

  let isExpanded = false;

  // 1. Inject Styles
  const style = document.createElement('style');
  style.innerHTML = `
    #logiflow-widget-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #logiflow-launcher-btn {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: linear-gradient(135deg, #F59E0B, #D97706);
      border: none;
      box-shadow: 0 8px 24px rgba(245, 158, 11, 0.45);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
    }
    #logiflow-launcher-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 12px 30px rgba(245, 158, 11, 0.6);
    }
    #logiflow-launcher-btn svg {
      width: 28px;
      height: 28px;
      fill: none;
      stroke: #1C1917;
      stroke-width: 2.2;
    }
    #logiflow-iframe-wrapper {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 380px;
      height: 600px;
      max-width: calc(100vw - 32px);
      max-height: calc(100vh - 120px);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
      border: 1px solid rgba(245, 158, 11, 0.3);
      display: none;
      transition: opacity 0.2s ease, transform 0.2s ease;
      z-index: 999999;
      background: #0C0A09;
    }
    #logiflow-iframe-wrapper.active {
      display: block;
      animation: logiflowSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    #logiflow-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    @keyframes logiflowSlideUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 480px) {
      #logiflow-iframe-wrapper {
        bottom: 0 !important;
        right: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        max-width: 100vw !important;
        max-height: 100vh !important;
        border-radius: 0 !important;
      }
    }
  `;
  document.head.appendChild(style);

  // 2. Build Container & Launcher
  const container = document.createElement('div');
  container.id = 'logiflow-widget-container';

  const launcher = document.createElement('button');
  launcher.id = 'logiflow-launcher-btn';
  launcher.setAttribute('aria-label', 'Open 24/7 Logistics Assistant');
  launcher.innerHTML = `
    <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
      <rect x="1" y="3" width="15" height="13"></rect>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
      <circle cx="5.5" cy="18.5" r="2.5"></circle>
      <circle cx="18.5" cy="18.5" r="2.5"></circle>
    </svg>
  `;

  // 3. Build Iframe Drawer
  const iframeWrapper = document.createElement('div');
  iframeWrapper.id = 'logiflow-iframe-wrapper';

  const iframe = document.createElement('iframe');
  iframe.id = 'logiflow-iframe';
  iframe.src = `${hostOrigin}/widget-frame`;
  iframe.title = 'LogiFlow 24/7 Virtual Dispatcher';
  iframe.allow = 'clipboard-write';

  iframeWrapper.appendChild(iframe);
  container.appendChild(launcher);
  document.body.appendChild(container);
  document.body.appendChild(iframeWrapper);

  // 4. Toggle Interaction
  launcher.addEventListener('click', function () {
    isExpanded = !isExpanded;
    if (isExpanded) {
      iframeWrapper.classList.add('active');
      launcher.innerHTML = `
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
    } else {
      iframeWrapper.classList.remove('active');
      launcher.innerHTML = `
        <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
          <rect x="1" y="3" width="15" height="13"></rect>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
          <circle cx="5.5" cy="18.5" r="2.5"></circle>
          <circle cx="18.5" cy="18.5" r="2.5"></circle>
        </svg>
      `;
    }
  });

  // 5. PostMessage Communication Bridge
  window.addEventListener('message', function (event) {
    if (!event.data || typeof event.data !== 'object') return;
    if (event.data.type === 'LF_LEAD_CONVERTED') {
      window.dispatchEvent(new CustomEvent('logiflow:lead_converted', { detail: event.data }));
    }
  });
})();
