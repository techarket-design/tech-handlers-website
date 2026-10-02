import { timingSafeEqual } from 'node:crypto';
import { changedUrls, submitUrls } from '../server/indexnow.mjs';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  if (req.method !== 'POST') return res.status(405).end();
  const secret = process.env.CONTENT_WEBHOOK_SECRET;
  const expected = Buffer.from(`Bearer ${secret || ''}`);
  const supplied = Buffer.from(String(req.headers.authorization || ''));
  if (!secret || expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || JSON.stringify(body).length > 1000000) return res.status(400).json({ error: 'Invalid event' });
    const urls = changedUrls(body);
    if (!urls.length) return res.status(200).json({ submitted: 0 });
    const status = await submitUrls(urls);
    return res.status(200).json({ submitted: urls.length, acceptedStatus: status, indexed: false });
  } catch (error) {
    console.error('Content discovery failed:', error.message);
    return res.status(503).json({ error: 'Discovery notification failed; sitemap discovery remains available' });
  }
}
