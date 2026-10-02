export default function handler(req, res) {
  if (!['GET', 'HEAD'].includes(req.method)) return res.status(405).end();
  const key = process.env.INDEXNOW_KEY;
  if (!/^[a-zA-Z0-9-]{8,128}$/.test(key || '')) return res.status(404).end();
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  return req.method === 'HEAD' ? res.status(200).end() : res.send(key);
}
