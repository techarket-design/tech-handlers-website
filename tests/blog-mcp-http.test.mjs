import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createMcpHandler } from '../api/mcp.mjs';
import { PublisherError } from '../server/blog-mcp.mjs';

process.env.MCP_PUBLIC_ORIGIN='https://www.techhandlers.in';
process.env.MCP_OAUTH_CLIENT_ID='test-client';
process.env.MCP_OAUTH_CLIENT_SECRET='test-only-client-secret-with-at-least-32-characters';
process.env.MCP_OAUTH_REDIRECT_URIS='https://gemini.google.com/test-callback';
test('stateless HTTP accepts official SDK handshake and tool calls and denies revoked access',async () => {
  const token='a'.repeat(43);let revoked=false;
  const handler=createMcpHandler(async (credential,name) => {
    if(credential!==token || revoked)throw new PublisherError(401,'invalid_token');
    return name==='list' ? { posts:[] } : { user_id:'test-user' };
  });
  const app=http.createServer(async (req,res) => {
    res.status=code => { res.statusCode=code;return res; };
    res.json=value => { res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));return res; };
    let body='';for await(const chunk of req)body+=chunk;
    req.body=body;
    await handler(req,res);
  });
  app.listen(0,'127.0.0.1');await once(app,'listening');
  const endpoint=new URL(`http://127.0.0.1:${app.address().port}/api/mcp`);
  const client=new Client({ name:'http-test',version:'1' });
  const transport=new StreamableHTTPClientTransport(endpoint,{ requestInit:{ headers:{ Authorization:`Bearer ${token}` } } });
  try {
    await client.connect(transport);
    assert.equal((await client.listTools()).tools.length,5);
    const result=await client.callTool({ name:'list_blog_posts',arguments:{ limit:10,offset:0 } });
    assert.deepEqual(JSON.parse(result.content[0].text),{ posts:[] });
    const denied=await fetch(endpoint,{ method:'POST',headers:{ Authorization:`Bearer ${token}`,Origin:'https://evil.example','Content-Type':'application/json' },body:'{}' });
    assert.equal(denied.status,403);
    const noStream=await fetch(endpoint,{ headers:{ Authorization:`Bearer ${token}` } });assert.equal(noStream.status,405);
    revoked=true;
    const invalid=await fetch(endpoint,{ method:'POST',headers:{ Authorization:`Bearer ${token}`,'Content-Type':'application/json' },body:'{}' });
    assert.equal(invalid.status,401);assert.match(invalid.headers.get('www-authenticate'),/resource_metadata/);
  } finally {
    await client.close();app.closeAllConnections();await new Promise(resolve => app.close(resolve));
  }
});
