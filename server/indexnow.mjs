import { COLLECTIONS } from './discovery.mjs';
import { SITE_URL, routeInfo } from './content.mjs';
export function changedUrls(event) {
  const group = Object.values(COLLECTIONS).find(config => config.table === event.table);
  if (!group || event.schema !== 'public' || !['INSERT', 'UPDATE', 'DELETE'].includes(event.type)) return [];
  return [...new Set([event.record, event.old_record].filter(row => row?.slug && row[group.flag] === true && !row.noindex).map(row => {
    const path = `/${group.prefix}/${encodeURIComponent(row.slug)}`;
    return routeInfo(path).kind === 'missing' ? null : SITE_URL + path;
  }).filter(Boolean))];
}
export async function submitUrls(urls, fetcher = fetch) {
  const key = process.env.INDEXNOW_KEY;
  if (!/^[a-zA-Z0-9-]{8,128}$/.test(key || '')) throw new Error('IndexNow key is not configured');
  const response = await fetcher('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ host: new URL(SITE_URL).host, key, keyLocation: SITE_URL + '/indexnow-key.txt', urlList: urls }), signal: AbortSignal.timeout(10000) });
  if (![200, 202].includes(response.status)) throw new Error(`IndexNow returned ${response.status}`);
  return response.status;
}
