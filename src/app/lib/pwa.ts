const SW_SOURCE = `
const CACHE_NAME = 'sampurna-shell-v1';
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('supabase.co') || url.pathname.startsWith('/api/')) return;
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
`;

function ensureMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function ensureLink(rel: string, href: string, attrs: Record<string, string> = {}) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
  Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
}

export function setupPwa() {
  if (typeof document === 'undefined') return;

  ensureMeta('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5');
  ensureMeta('theme-color', '#2c5f6f');
  ensureMeta('apple-mobile-web-app-capable', 'yes');
  ensureMeta('apple-mobile-web-app-status-bar-style', 'default');
  ensureMeta('apple-mobile-web-app-title', 'SAMPURNA');
  ensureMeta('mobile-web-app-capable', 'yes');
  ensureMeta('description', 'SAMPURNA — IoT-based waste bin monitoring and analytics dashboard');

  ensureLink('manifest', '/manifest.webmanifest');

  const appleIcon = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'><rect width='180' height='180' rx='32' fill='%232c5f6f'/><path d='M60 52h60v8H60zm-8 16h76v8l-8 76a8 8 0 0 1-8 8H68a8 8 0 0 1-8-8l-8-76zm22 16v60m34-60v60' stroke='white' stroke-width='6' stroke-linecap='round' fill='none'/></svg>`;
  ensureLink('apple-touch-icon', appleIcon);

  const host = window.location.hostname;
  const isFigmaPreview = host.includes('figma.site') || host.includes('figma.com') || window.self !== window.top;
  if ('serviceWorker' in navigator && window.isSecureContext && !isFigmaPreview) {
    try {
      const blob = new Blob([SW_SOURCE], { type: 'application/javascript' });
      const swUrl = URL.createObjectURL(blob);
      navigator.serviceWorker.register(swUrl).catch(() => {});
    } catch {}
  }
}
