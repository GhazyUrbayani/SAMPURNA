import { defineConfig } from 'vite'
import path from 'path'
import fs from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

function readPngAsDataUri(filename: string): string {
  try {
    const buf = fs.readFileSync(path.resolve(__dirname, 'public', filename))
    return `data:image/png;base64,${buf.toString('base64')}`
  } catch {
    return ''
  }
}

function buildManifestDataUri(): string {
  const icon192 = readPngAsDataUri('icon-192.png')
  const icon512 = readPngAsDataUri('icon-512.png')
  const icon512Maskable = readPngAsDataUri('icon-512-maskable.png')

  const manifest = {
    name: 'SAMPURNA — Smart Waste Monitoring',
    short_name: 'SAMPURNA',
    description: 'IoT-based waste bin monitoring and analytics dashboard',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#f8fafc',
    theme_color: '#2c5f6f',
    lang: 'en',
    dir: 'ltr',
    categories: ['productivity', 'utilities'],
    icons: [
      { src: icon192, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: icon512, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: icon512Maskable, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ].filter((i) => i.src),
  }

  const json = JSON.stringify(manifest)
  const b64 = Buffer.from(json, 'utf-8').toString('base64')
  return `data:application/manifest+json;base64,${b64}`
}


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig(() => {
  const manifestDataUri = buildManifestDataUri()
  const icon192Uri = readPngAsDataUri('icon-192.png')
  const icon512Uri = readPngAsDataUri('icon-512.png')

  return {
    plugins: [
    figmaAssetResolver(),
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used – do not remove them
      react(),
      tailwindcss(),
      {
        name: 'inject-pwa-manifest',
        transformIndexHtml(html) {
          return {
            html,
            tags: [
              { tag: 'link', attrs: { rel: 'manifest', href: manifestDataUri }, injectTo: 'head' },
              { tag: 'meta', attrs: { name: 'theme-color', content: '#2c5f6f' }, injectTo: 'head' },
              { tag: 'meta', attrs: { name: 'application-name', content: 'SAMPURNA' }, injectTo: 'head' },
              { tag: 'meta', attrs: { name: 'apple-mobile-web-app-capable', content: 'yes' }, injectTo: 'head' },
              { tag: 'meta', attrs: { name: 'apple-mobile-web-app-title', content: 'SAMPURNA' }, injectTo: 'head' },
              { tag: 'link', attrs: { rel: 'apple-touch-icon', href: icon192Uri || '/icon-192.png' }, injectTo: 'head' },
              { tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '192x192', href: icon192Uri || '/icon-192.png' }, injectTo: 'head' },
              { tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '512x512', href: icon512Uri || '/icon-512.png' }, injectTo: 'head' },
            ],
          };
        },
      },
    ],
    resolve: {
      alias: {
        // Alias @ to the src directory
        '@': path.resolve(__dirname, './src'),
      },
    },

    // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
    assetsInclude: ['**/*.svg', '**/*.csv'],
  }
})
