import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createPublisher } from '../api/mcp.mjs';
import mcpHandler from '../api/mcp.mjs';
import { createOAuthHandler } from '../api/blog-oauth.mjs';
import { challenge, configuration, hash, normalizePost, validateAuthorization, PublisherError } from '../server/blog-mcp.mjs';

process.env.MCP_PUBLIC_ORIGIN='https://www.techhandlers.in';
process.env.MCP_OAUTH_CLIENT_ID='test-client';
process.env.MCP_OAUTH_CLIENT_SECRET='test-only-client-secret-with-at-least-32-characters';
process.env.MCP_OAUTH_REDIRECT_URIS='https://gemini.google.com/test-callback';
const requestId='12345678-1234-4123-8123-123456789012';
const post={ title:'Test article',slug:'test-article',content:'<h2>Useful information</h2><p>A helpful article.</p>',excerpt:'Helpful advice.' };
const verifier='a'.repeat(43);
const authorization={ client_id:'test-client',redirect_uri:process.env.MCP_OAUTH_REDIRECT_URIS,response_type:'code',code_challenge_method:'S256',code_challenge:challenge(verifier),state:'test-state',resource:'https://www.techhandlers.in/api/mcp',scope:'blog:manage' };
function response() { return { statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.statusCode=n;return this;},json(v){this.body=v;return this;},end(){return this;} }; }

test('publisher validates article fields and strips executable HTML',() => {
  const clean=normalizePost({ ...post,content:'<p onclick="alert(1)">Advice</p><script>alert(1)</script><a href="javascript:alert(1)">link</a><img src="data:text/html,evil">' });
  assert.doesNotMatch(clean.content,/onclick|javascript:|<script|data:/);
  assert.equal(clean.meta_title,post.title); assert.equal(clean.reading_time_minutes,1);
  assert.throws(() => normalizePost({ ...post,is_published:true }));
  assert.throws(() => normalizePost({ ...post,slug:'../escape' }));
  assert.throws(() => normalizePost({ ...post,content:'<script>evil</script>' }));
  assert.throws(() => normalizePost({ ...post,featured_image_url:'javascript:alert(1)' }));
});
test('OAuth rejects unregistered redirects, missing PKCE, scope and audience escalation',() => {
  assert.equal(validateAuthorization(authorization).resource,configuration().resource);
  for (const change of [{ redirect_uri:'https://evil.example/callback' },{ code_challenge_method:'plain' },{ scope:'crm:manage' },{ resource:'https://elsewhere.example/mcp' },{ state:'' }]) assert.throws(() => validateAuthorization({ ...authorization,...change }));
});
test('OAuth discovery, consent, confidential client authentication and token exchange',async () => {
  const calls=[];
  const db=async (path,options) => { calls.push({ path,...options }); if(path==='blog_mcp_grants')return [{ id:requestId }]; if(path==='rpc/blog_mcp_exchange')return { expires_in:3600 }; return null; };
  const handler=createOAuthHandler(db,async () => requestId);
  let res=response();await handler({ method:'GET',url:'/api/blog-oauth?action=metadata',headers:{} },res);
  assert.equal(res.body.issuer,configuration().origin);assert.deepEqual(res.body.code_challenge_methods_supported,['S256']);
  res=response();await handler({ method:'GET',url:'/api/blog-oauth?action=authorize&'+new URLSearchParams(authorization),headers:{} },res);
  assert.equal(res.statusCode,302);assert.match(res.headers.Location,/^\/admin\/blog-connection\?/);
  res=response();await handler({ method:'POST',url:'/api/blog-oauth?action=consent',headers:{ origin:configuration().origin },body:{ ...authorization,approved:true } },res);
  assert.equal(res.statusCode,200);const redirect=new URL(res.body.redirect);const code=redirect.searchParams.get('code');
  assert.equal(redirect.searchParams.get('state'),'test-state');assert.equal(calls[1].body.code_hash,hash(code));assert.ok(!JSON.stringify(calls).includes(code));
  res=response();await handler({ method:'POST',url:'/api/blog-oauth?action=token',headers:{},body:{ grant_type:'authorization_code',code,code_verifier:verifier,redirect_uri:authorization.redirect_uri,client_id:'test-client',client_secret:'wrong' } },res);
  assert.equal(res.statusCode,401);assert.equal(res.body.error,'invalid_client');
  res=response();await handler({ method:'POST',url:'/api/blog-oauth?action=token',headers:{},body:{ grant_type:'authorization_code',code,code_verifier:verifier,redirect_uri:authorization.redirect_uri,client_id:'test-client',client_secret:configuration().clientSecret } },res);
  assert.equal(res.statusCode,200);assert.equal(res.body.expires_in,3600);assert.equal(calls.at(-1).body.p_challenge,challenge(verifier));assert.equal(calls.at(-1).body.p_access,hash(res.body.access_token));
  res=response();await handler({ method:'POST',url:'/api/blog-oauth?action=consent',headers:{ origin:'https://evil.example' },body:{ ...authorization,approved:true } },res);assert.equal(res.statusCode,403);
});
test('MCP rejects unauthenticated requests and advertises OAuth discovery',async () => {
  const res=response();await mcpHandler({ method:'POST',headers:{},body:{} },res);
  assert.equal(res.statusCode,401);assert.match(res.headers['WWW-Authenticate'],/oauth-protected-resource\/api\/mcp/);
});
test('official MCP client discovers tools, creates a draft and enforces publish confirmation',async () => {
  const calls=[];
  const server=createPublisher('unused',async (name,args) => {
    calls.push({ name,args });
    if(name==='publish')throw new PublisherError(400,'post_changed');
    return { ...normalizePost(post),id:requestId,is_published:false,updated_at:'2026-10-02T12:00:00.000Z' };
  });
  const [clientTransport,serverTransport]=InMemoryTransport.createLinkedPair();
  const client=new Client({ name:'publisher-test',version:'1' });
  await server.connect(serverTransport);await client.connect(clientTransport);
  try {
    const tools=(await client.listTools()).tools;assert.equal(tools.length,5);
    assert.equal(tools.find(t => t.name==='publish_blog_post').annotations.destructiveHint,true);
    const saved=await client.callTool({ name:'create_blog_draft',arguments:{ request_id:requestId,post } });
    assert.equal(saved.isError,undefined);assert.equal(calls[0].name,'create');assert.equal(JSON.parse(saved.content[0].text).visibility,'draft');
    const invalid=await client.callTool({ name:'publish_blog_post',arguments:{ request_id:requestId,id:requestId,expected_updated_at:'2026-10-02T12:00:00.000Z',confirmed:false } });
    assert.equal(invalid.isError,true);assert.equal(calls.length,1);
    const stale=await client.callTool({ name:'publish_blog_post',arguments:{ request_id:requestId,id:requestId,expected_updated_at:'2026-10-02T12:00:00.000Z',confirmed:true } });
    assert.equal(stale.isError,true);assert.match(stale.content[0].text,/post_changed/);
  } finally { await client.close();await server.close(); }
});
