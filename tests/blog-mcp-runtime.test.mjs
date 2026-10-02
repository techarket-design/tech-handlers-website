import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

test('Vercel compatibility: both entrypoints boot with require(ESM) disabled', () => {
  const output = execFileSync(process.execPath, ['--no-experimental-require-module', '--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    const { default:mcp }=await import('./api/mcp.mjs');
    const { default:oauth }=await import('./api/blog-oauth.mjs');
    const { normalizePost }=await import('./server/blog-mcp.mjs');
    const post=normalizePost({ title:'Safe title',slug:'safe-title',excerpt:'Excerpt',content:'<p>Safe text</p><script>evil()</script>' });
    assert.equal(post.content,'<p>Safe text</p>');
    process.env.MCP_PUBLIC_ORIGIN='https://www.techhandlers.in';
    process.env.MCP_OAUTH_CLIENT_ID='test-client';
    process.env.MCP_OAUTH_CLIENT_SECRET='s'.repeat(43);
    process.env.MCP_OAUTH_REDIRECT_URIS='https://gemini.google.com/test-callback';
    const response=()=>({statusCode:200,setHeader(){},status(n){this.statusCode=n;return this;},json(v){this.body=v;return this;}});
    let res=response();await mcp({ method:'GET',headers:{} },res);assert.equal(res.statusCode,401);
    res=response();await oauth({ method:'GET',url:'/api/blog-oauth?action=metadata',headers:{} },res);
    assert.equal(res.statusCode,200);assert.equal(res.body.issuer,'https://www.techhandlers.in');
    console.log('boot-and-sanitization-ok');
  `], { cwd:new URL('..',import.meta.url), encoding:'utf8',timeout:15000 });
  assert.match(output,/boot-and-sanitization-ok/);
});
