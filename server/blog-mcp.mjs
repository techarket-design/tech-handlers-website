import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import sanitizeHtml from 'sanitize-html';
import { z } from 'zod';

export class PublisherError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const hash = value => createHash('sha256').update(value).digest('hex');
export const challenge = value => createHash('sha256').update(value).digest('base64url');
export const opaqueToken = () => randomBytes(32).toString('base64url');
export function secureEqual(a, b) {
  return typeof a === 'string' && typeof b === 'string' && timingSafeEqual(Buffer.from(hash(a)), Buffer.from(hash(b)));
}
export function configuration() {
  const origin = process.env.MCP_PUBLIC_ORIGIN;
  const clientId = process.env.MCP_OAUTH_CLIENT_ID;
  const clientSecret = process.env.MCP_OAUTH_CLIENT_SECRET;
  const redirects = (process.env.MCP_OAUTH_REDIRECT_URIS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!origin || !clientId || !/^[A-Za-z0-9_-]{1,100}$/.test(clientId) || !clientSecret || clientSecret.length < 32 || !redirects.length) throw new PublisherError(503, 'TH Blog Publisher has not been configured');
  const url = new URL(origin);
  if (url.origin !== origin || (url.protocol !== 'https:' && origin !== 'http://127.0.0.1:4173')) throw new PublisherError(503, 'Invalid publisher origin configuration');
  for (const redirect of redirects) { const target = new URL(redirect); if (target.protocol !== 'https:' || target.hash || target.username || target.password) throw new PublisherError(503, 'Invalid callback configuration'); }
  return { origin, clientId, clientSecret, redirects, resource: `${origin}/api/mcp` };
}
export function validateAuthorization(input, config = configuration()) {
  if (input.client_id !== config.clientId || !config.redirects.includes(input.redirect_uri)) throw new PublisherError(400, 'Unknown client or callback URL');
  if (input.response_type !== 'code' || input.code_challenge_method !== 'S256' || !/^[A-Za-z0-9_-]{43}$/.test(input.code_challenge || '')) throw new PublisherError(400, 'Authorization requires a code and PKCE S256');
  if (input.resource && input.resource !== config.resource) throw new PublisherError(400, 'Invalid resource');
  if (input.scope && input.scope !== 'blog:manage') throw new PublisherError(400, 'Invalid scope');
  if (typeof input.state !== 'string' || !input.state || input.state.length > 2048) throw new PublisherError(400, 'Invalid authorization state');
  return { client_id: input.client_id, redirect_uri: input.redirect_uri, response_type: 'code', code_challenge: input.code_challenge,
    code_challenge_method: 'S256', state: input.state, scope: 'blog:manage', resource: config.resource };
}
const nullableText = max => z.string().trim().max(max).nullable().optional();
const httpsUrl = z.string().max(2000).url().refine(value => { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password; }, 'Use an HTTPS image URL');
export const postShape = {
  title: z.string().trim().min(1).max(180), slug: z.string().max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  content: z.string().trim().min(1).max(100000).describe('HTML article body; scripts and unsafe attributes are removed'),
  excerpt: z.string().trim().min(1).max(500), author_name: nullableText(100), category: nullableText(100),
  tags: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  featured_image_url: httpsUrl.nullable().optional(), image_alt: nullableText(250),
  meta_title: nullableText(180), meta_description: nullableText(500), focus_keyword: nullableText(100),
  secondary_keywords: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
};
export const postSchema = z.object(postShape).strict();
export function normalizePost(input) {
  const p = postSchema.parse(input);
  p.content = sanitizeHtml(p.content, {
    allowedTags: ['p','br','h2','h3','h4','strong','em','b','i','ul','ol','li','blockquote','a','img','figure','figcaption','table','thead','tbody','tr','th','td','pre','code','hr'],
    allowedAttributes: { a: ['href','title','rel'], img: ['src','alt','title','width','height'] },
    allowedSchemes: ['https','http','mailto'], allowedSchemesByTag: { img: ['https'] }, allowProtocolRelative: false,
    transformTags: { a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }) },
  });
  const words = p.content.replace(/<[^>]*>/g,' ').trim().split(/\s+/).filter(Boolean).length;
  if (!words) throw new PublisherError(400, 'Article needs readable text');
  return { ...p, tags: p.tags || [], secondary_keywords: p.secondary_keywords || [], meta_title: p.meta_title || p.title,
    meta_description: p.meta_description || p.excerpt, author_name: p.author_name || 'Tech Handlers', reading_time_minutes: Math.max(1,Math.round(words / 220)) };
}
export function editablePost(post) { return Object.fromEntries(Object.keys(postShape).filter(k => post[k] !== undefined).map(k => [k,post[k]])); }
const knownErrors = new Set(['invalid_grant','invalid_token','post_not_found','post_changed','edit_drafts_only','confirmation_required','incomplete_post','request_id_reused']);
export async function publisherDatabase(path, { method = 'POST', body, headers = {} } = {}, fetcher = fetch) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new PublisherError(503, 'Publisher database is not configured');
  const response = await fetcher(`${url}/rest/v1/${path}`, { method, headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(10000) });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (knownErrors.has(error.message)) throw new PublisherError(error.message === 'invalid_token' ? 401 : 400, error.message);
    if (error.code === '23505') throw new PublisherError(409, 'A blog post with that slug already exists');
    throw new PublisherError(503, 'Publisher database operation failed');
  }
  const raw = await response.text(); return raw ? JSON.parse(raw) : null;
}
export async function requireAdmin(req, db = publisherDatabase, fetcher = fetch) {
  const token = bearer(req), url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new PublisherError(503,'Admin authentication is not configured');
  const result = await fetcher(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) });
  if (!result.ok) throw new PublisherError(401,'Sign in to your TH admin account');
  const user = await result.json();
  if (!user.id || !await db('rpc/has_role', { body: { _user_id: user.id, _role: 'admin' } })) throw new PublisherError(403,'Only TH administrators can connect the publisher');
  return user.id;
}
export function bearer(req) {
  const header = req.headers.authorization;
  if (typeof header !== 'string' || !/^Bearer [A-Za-z0-9._~-]{20,8192}$/.test(header)) throw new PublisherError(401,'Authentication required');
  return header.slice(7);
}
export function action(token, name, args, db = publisherDatabase) {
  return db('rpc/blog_mcp_action', { body: { p_hash: hash(token), p_resource: configuration().resource, p_action: name, p_args: args } });
}
export const uuid = z.string().uuid();
export const version = z.string().datetime({ offset: true });
export function postResult(post, config = configuration()) {
  return { ...post, url: `${config.origin}/blog/${post.slug}`, admin_url: `${config.origin}/admin/blog`, visibility: post.is_published ? 'published' : 'draft', cache_refresh_seconds: 30 };
}
