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

function generatePngIcon(size: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const radius = size * 0.18;
  ctx.fillStyle = '#2c5f6f';
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();

  const s = size / 192;
  ctx.strokeStyle = 'white';
  ctx.fillStyle = 'white';
  ctx.lineWidth = 6 * s;
  ctx.lineCap = 'round';

  ctx.fillRect(64 * s, 56 * s, 64 * s, 8 * s);

  ctx.beginPath();
  ctx.moveTo(56 * s, 72 * s);
  ctx.lineTo(136 * s, 72 * s);
  ctx.lineTo(128 * s, 152 * s);
  ctx.quadraticCurveTo(128 * s, 160 * s, 120 * s, 160 * s);
  ctx.lineTo(72 * s, 160 * s);
  ctx.quadraticCurveTo(64 * s, 160 * s, 64 * s, 152 * s);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(80 * s, 88 * s);
  ctx.lineTo(80 * s, 148 * s);
  ctx.moveTo(112 * s, 88 * s);
  ctx.lineTo(112 * s, 148 * s);
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

function buildManifestBlobUrl(icon192: string, icon512: string): string {
  const origin = window.location.origin;
  const manifest = {
    id: '/sampurna-app',
    name: 'SAMPURNA — Smart Waste Monitoring',
    short_name: 'SAMPURNA',
    description: 'IoT-based waste bin monitoring and analytics dashboard for smart city sanitation management',
    start_url: `${origin}/dashboard`,
    scope: `${origin}/`,
    display: 'standalone',
    orientation: 'any',
    background_color: '#f8fafc',
    theme_color: '#2c5f6f',
    categories: ['productivity', 'utilities'],
    lang: 'id',
    dir: 'ltr',
    icons: [
      { src: icon192, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: icon192, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: icon512, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: icon512, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
  return URL.createObjectURL(blob);
}

export function setupPwa() {
  if (typeof document === 'undefined') return;

  ensureMeta('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5');
  ensureMeta('theme-color', '#2c5f6f');
  ensureMeta('apple-mobile-web-app-capable', 'yes');
  ensureMeta('apple-mobile-web-app-status-bar-style', 'default');
  ensureMeta('apple-mobile-web-app-title', 'SAMPURNA');
  ensureMeta('mobile-web-app-capable', 'yes');
  ensureMeta('description', 'SAMPURNA — IoT-based waste bin monitoring and analytics dashboard for smart city sanitation management');
  ensureMeta('application-name', 'SAMPURNA');

  if (!document.title || document.title.toLowerCase().includes('vite')) {
    document.title = 'SAMPURNA — Smart Waste Monitoring';
  }

  try {
    const icon192 = generatePngIcon(192);
    const icon512 = generatePngIcon(512);
    const manifestUrl = buildManifestBlobUrl(icon192, icon512);
    ensureLink('manifest', manifestUrl);
    ensureLink('apple-touch-icon', icon192, { sizes: '192x192' });
    ensureLink('icon', icon192, { type: 'image/png', sizes: '192x192' });
    ensureLink('shortcut icon', icon192);
  } catch (err) {
    console.warn('PWA manifest setup failed:', err);
  }

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
