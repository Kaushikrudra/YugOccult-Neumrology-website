import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function seoIndexingPlugin(): Plugin {
  return {
    name: 'vite-plugin-seo-indexing',
    transformIndexHtml(html: string) {
      const allowIndexing = process.env.VITE_ALLOW_INDEXING === 'true'
      if (allowIndexing) {
        return html.replace(
          /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
          '<meta name="robots" content="index, follow" />'
        )
      } else {
        if (/<meta\s+name="robots"/i.test(html)) {
          return html.replace(
            /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
            '<meta name="robots" content="noindex, nofollow" />'
          )
        }
        return html.replace(
          '</head>',
          '  <meta name="robots" content="noindex, nofollow" />\n</head>'
        )
      }
    },
    closeBundle() {
      const distDir = path.resolve(process.cwd(), 'dist')
      if (!fs.existsSync(distDir)) return

      const allowIndexing = process.env.VITE_ALLOW_INDEXING === 'true'
      const rawSiteUrl = process.env.VITE_SITE_URL || 'https://yugoccult.in'
      const siteUrl = rawSiteUrl.replace(/\/+$/, '')

      if (allowIndexing) {
        // 1. robots.txt for indexing allowed
        const robotsTxt = [
          '# YugOccult Learning Academy robots.txt',
          'User-agent: *',
          'Allow: /',
          'Disallow: /admin',
          'Disallow: /admin/*',
          'Disallow: /account',
          'Disallow: /account/*',
          'Disallow: /login',
          'Disallow: /signup',
          'Disallow: /payment',
          'Disallow: /payment/*',
          'Disallow: /forgot-password',
          'Disallow: /reset-password',
          '',
          `Sitemap: ${siteUrl}/sitemap.xml`,
          '',
        ].join('\n')
        fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsTxt, 'utf-8')

        // 2. sitemap.xml
        const routes = [
          '/',
          '/consultation',
          '/courses',
          '/reports',
          '/contact',
          '/terms',
          '/privacy-policy',
          '/refund-policy',
        ]
        const today = new Date().toISOString().split('T')[0]
        const sitemapEntries = routes
          .map(
            (r) =>
              `  <url>\n    <loc>${siteUrl}${r}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${r === '/' ? 'weekly' : 'monthly'}</changefreq>\n    <priority>${r === '/' ? '1.0' : '0.8'}</priority>\n  </url>`
          )
          .join('\n')

        const sitemapXml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          sitemapEntries,
          '</urlset>',
          '',
        ].join('\n')
        fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml, 'utf-8')

        // 3. _headers without noindex
        const headersContent = [
          '/*',
          '  X-Frame-Options: SAMEORIGIN',
          '  X-Content-Type-Options: nosniff',
          '  Referrer-Policy: strict-origin-when-cross-origin',
          '',
        ].join('\n')
        fs.writeFileSync(path.join(distDir, '_headers'), headersContent, 'utf-8')
      } else {
        // Disallow everything when indexing is false
        const robotsTxt = [
          '# Indexing disabled',
          'User-agent: *',
          'Disallow: /',
          '',
        ].join('\n')
        fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsTxt, 'utf-8')

        const headersContent = [
          '/*',
          '  X-Robots-Tag: noindex, nofollow',
          '  X-Frame-Options: SAMEORIGIN',
          '  X-Content-Type-Options: nosniff',
          '  Referrer-Policy: strict-origin-when-cross-origin',
          '',
        ].join('\n')
        fs.writeFileSync(path.join(distDir, '_headers'), headersContent, 'utf-8')

        // Ensure sitemap.xml is removed if previously created
        const sitemapPath = path.join(distDir, 'sitemap.xml')
        if (fs.existsSync(sitemapPath)) {
          fs.unlinkSync(sitemapPath)
        }
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), seoIndexingPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-icons': ['lucide-react'],
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
