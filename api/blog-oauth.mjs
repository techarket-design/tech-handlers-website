import { challenge, configuration, hash, opaqueToken, publisherDatabase, PublisherError, requireAdmin, secureEqual, validateAuthorization } from '../server/blog-mcp.mjs';

function parseBody(req) {
  const raw=req.body;
  if (typeof raw !== 'string') return raw || {};
  return String(req.headers['content-type'] || '').includes('application/x-www-form-urlencoded') ? Object.fromEntries(new URLSearchParams(raw)) : JSON.parse(raw);
}
function clientCredentials(req,body,config) {
  let id=body.client_id,secret=body.client_secret;
  if (req.headers.authorization?.startsWith('Basic ')) {
    const raw=Buffer.from(req.headers.authorization.slice(6),'base64').toString('utf8'),colon=raw.indexOf(':');
    id=decodeURIComponent(raw.slice(0,colon)); secret=decodeURIComponent(raw.slice(colon+1));
  }
  if (!secureEqual(id,config.clientId) || !secureEqual(secret,config.clientSecret)) throw new PublisherError(401,'invalid_client');
}
export function createOAuthHandler(db=publisherDatabase,admin=requireAdmin) {
  return async function handler(req,res) {
    res.setHeader('Cache-Control','no-store'); res.setHeader('X-Robots-Tag','noindex, nofollow');
    try {
      const config=configuration(),url=new URL(req.url,config.origin);
      // Vercel rewrites use req.query; local preview preserves the original URL.
      const route=req.query?.action || url.searchParams.get('action');
      if (route==='resource' && req.method==='GET') return res.json({ resource:config.resource,authorization_servers:[config.origin],scopes_supported:['blog:manage'],bearer_methods_supported:['header'],resource_name:'TH Blog Publisher' });
      if (route==='metadata' && req.method==='GET') return res.json({ issuer:config.origin,
        authorization_endpoint:`${config.origin}/api/blog-oauth?action=authorize`,token_endpoint:`${config.origin}/api/blog-oauth?action=token`,
        revocation_endpoint:`${config.origin}/api/blog-oauth?action=revoke`,response_types_supported:['code'],grant_types_supported:['authorization_code','refresh_token'],
        token_endpoint_auth_methods_supported:['client_secret_post','client_secret_basic'],code_challenge_methods_supported:['S256'],scopes_supported:['blog:manage'] });
      if (route==='authorize' && req.method==='GET') {
        const input=validateAuthorization(Object.fromEntries(url.searchParams),config);
        res.setHeader('Location',`/admin/blog-connection?${new URLSearchParams(input)}`); return res.status(302).end();
      }
      if (!['consent','token','revoke','connections'].includes(route)) return res.status(404).json({ error:'Unknown publisher endpoint' });
      if (route==='connections' && req.method==='GET') {
        const user=await admin(req,db);
        const grants=await db(`blog_mcp_grants?user_id=eq.${user}&select=id,created_at,expires_at,revoked_at&order=created_at.desc&limit=50`,{ method:'GET' });
        return res.json({ connections:grants });
      }
      if (req.method!=='POST') { res.setHeader('Allow','POST'); return res.status(405).json({ error:'Method not allowed' }); }
      const body=parseBody(req);
      if (!body || typeof body!=='object' || Array.isArray(body) || JSON.stringify(body).length>16000) throw new PublisherError(400,'invalid_request');
      if (route==='consent' || route==='connections') {
        if (req.headers.origin!==config.origin) throw new PublisherError(403,'Invalid origin');
        const user=await admin(req,db);
        if (route==='connections') {
          if (!/^[0-9a-f-]{36}$/i.test(body.id || '')) throw new PublisherError(400,'Invalid connection');
          await db(`blog_mcp_grants?id=eq.${body.id}&user_id=eq.${user}`,{ method:'PATCH',body:{ revoked_at:new Date().toISOString() } });
          return res.json({ revoked:true });
        }
        const input=validateAuthorization(body,config);
        if (body.approved!==true) throw new PublisherError(400,'Approval is required');
        const code=opaqueToken();
        const [grant]=await db('blog_mcp_grants',{ body:{ user_id:user,client_id:config.clientId,resource:config.resource },headers:{ Prefer:'return=representation' } });
        await db('blog_mcp_codes',{ body:{ code_hash:hash(code),grant_id:grant.id,redirect_uri:input.redirect_uri,challenge:input.code_challenge } });
        const redirect=new URL(input.redirect_uri); redirect.searchParams.set('code',code); redirect.searchParams.set('state',input.state);
        return res.json({ redirect:redirect.href });
      }
      clientCredentials(req,body,config);
      if (route==='revoke') {
        if (typeof body.token!=='string' || body.token.length>8192) throw new PublisherError(400,'invalid_request');
        const tokens=await db(`blog_mcp_tokens?token_hash=eq.${hash(body.token)}&select=grant_id`,{ method:'GET' });
        if (tokens?.[0]) await db(`blog_mcp_grants?id=eq.${tokens[0].grant_id}&client_id=eq.${encodeURIComponent(config.clientId)}`,{ method:'PATCH',body:{ revoked_at:new Date().toISOString() } });
        return res.status(200).end();
      }
      if (!['authorization_code','refresh_token'].includes(body.grant_type)) throw new PublisherError(400,'unsupported_grant_type');
      if (body.scope && body.scope!=='blog:manage') throw new PublisherError(400,'invalid_scope');
      if (body.resource && body.resource!==config.resource) throw new PublisherError(400,'invalid_target');
      const credential=body.grant_type==='authorization_code' ? body.code : body.refresh_token;
      if (typeof credential!=='string' || !/^[A-Za-z0-9_-]{43}$/.test(credential)) throw new PublisherError(400,'invalid_grant');
      if (body.grant_type==='authorization_code' && (!/^[A-Za-z0-9._~-]{43,128}$/.test(body.code_verifier || '') || !config.redirects.includes(body.redirect_uri))) throw new PublisherError(400,'invalid_grant');
      const access=opaqueToken(),refresh=opaqueToken();
      const result=await db('rpc/blog_mcp_exchange',{ body:{ p_kind:body.grant_type,p_hash:hash(credential),p_client:config.clientId,p_resource:config.resource,
        p_redirect:body.redirect_uri || '',p_challenge:body.code_verifier ? challenge(body.code_verifier) : '',p_access:hash(access),p_refresh:hash(refresh) } });
      return res.json({ access_token:access,token_type:'Bearer',expires_in:result.expires_in,refresh_token:refresh,scope:'blog:manage' });
    } catch(error) {
      if (error.status===401) res.setHeader('WWW-Authenticate','Basic realm="TH Blog Publisher"');
      return res.status(error instanceof SyntaxError ? 400 : error.status || 503).json({ error:error instanceof PublisherError ? error.message : 'Publisher authorization unavailable' });
    }
  };
}
export default createOAuthHandler();
