import { chromium } from '@playwright/test';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

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
  
  // Read dynamic routes from sitemap
  const sitemapPath = path.join(distDir, 'sitemap.xml');
  let routes = ['/'];
  if (fs.existsSync(sitemapPath)) {
    const sitemap = fs.readFileSync(sitemapPath, 'utf-8');
    const urls = [...sitemap.matchAll(/<loc>https:\/\/techhandlers\.in(.*?)<\/loc>/g)].map(m => m[1]);
    routes = [...new Set([...routes, ...urls])]; // Merge and deduplicate
  }

  for (const route of routes) {
    if (route.startsWith('/admin') || route.includes('.xml')) continue;
    
    console.log(Prerendering \...);
    try {
      await page.goto(http://localhost:3000\, { waitUntil: 'networkidle', timeout: 15000 });
      
      // Wait for the loading spinner to disappear
      await page.waitForFunction(() => !document.body.innerText.includes('Loading Tech Handlers...'), { timeout: 10000 }).catch(() => {});
      
      // Also wait for the root to have some content inside it
      await page.waitForSelector('#root > *', { timeout: 5000 }).catch(() => {});

      let html = await page.content();
      
      // We don't want the prerendered HTML to completely break React hydration.
      // However, React 18 createRoot will seamlessly overwrite the static HTML when it boots up.
      
      const outPath = path.join(distDir, route, 'index.html');
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, html);
      console.log(Saved \);
    } catch (err) {
      console.error(Failed to prerender \:, err.message);
    }
  }
  
  await browser.close();
  server.close();
  console.log("Prerendering complete!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});