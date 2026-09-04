import { chromium } from '@playwright/test';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const snapshotsDir = path.resolve(__dirname, '../prerendered-snapshots');

// Static file server to serve the SPA locally
const server = http.createServer((req, res) => {
  let filePath = path.join(distDir, req.url.split('?')[0]);
  if (req.url === '/' || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html'); // SPA fallback
  }
  const ext = path.extname(filePath);
  const mimeTypes = { 
    '.html': 'text/html', 
    '.js': 'text/javascript', 
    '.css': 'text/css',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.json': 'application/json'
  };
  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  res.end(fs.readFileSync(filePath));
});

async function main() {
  console.log("Starting local server for prerendering...");
  server.listen(3000);
  
  console.log("Launching headless browser...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const sitemapPath = path.join(distDir, 'sitemap.xml');
  let routes = ['/'];
  if (fs.existsSync(sitemapPath)) {
    const sitemap = fs.readFileSync(sitemapPath, 'utf-8');
    const urls = [...sitemap.matchAll(/<loc>https:\/\/techhandlers\.in(.*?)<\/loc>/g)].map(m => m[1]);
    routes = [...new Set([...routes, ...urls])];
  } else {
    routes = ['/', '/about', '/blog', '/case-studies', '/services/digital-marketing', '/services/seo', '/services/performance-marketing', '/services/social-media-marketing', '/services/web-development', '/services/linkedin-automation', '/privacy-policy', '/terms-of-service', '/refund-policy', '/cookie-policy'];
  }

  for (const route of routes) {
    if (route.startsWith('/admin') || route.includes('.xml')) continue;
    
    console.log("Snapshotting " + route + "...");
    try {
      await page.goto("http://localhost:3000" + route, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForFunction(() => !document.body.innerText.includes('Loading Tech Handlers...'), { timeout: 10000 }).catch(() => {});
      await page.waitForSelector('#root > *', { timeout: 5000 }).catch(() => {});

      let html = await page.content();
      
      const outPath = path.join(snapshotsDir, route === '/' ? 'index.html' : route + '/index.html');
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, html);
      console.log("Saved " + outPath);
    } catch (err) {
      console.error("Failed to snapshot " + route + ":", err.message);
    }
  }
  
  await browser.close();
  server.close();
  console.log("Snapshotting complete!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});