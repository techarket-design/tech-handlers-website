import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { challenge,hash,normalizePost } from '../server/blog-mcp.mjs';

test('PostgreSQL: PKCE, one-use codes, refresh rotation, scoped blog writes, retries and revocation',async () => {
  const db=new PGlite();
  const user=randomUUID(),resource='https://www.techhandlers.in/api/mcp';
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
      CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
      CREATE TYPE public.app_role AS ENUM ('admin','user');
      CREATE TABLE public.user_roles(user_id uuid,role public.app_role);
      CREATE FUNCTION public.has_role(uuid,public.app_role) RETURNS boolean LANGUAGE sql AS
        'SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=$1 AND role=$2)';
      CREATE TABLE public.blog_posts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),title text NOT NULL,slug text NOT NULL UNIQUE,
        content text,excerpt text,author_name text,category text,tags text[],featured_image_url text,image_alt text,
        meta_title text,meta_description text,focus_keyword text,secondary_keywords text[],reading_time_minutes int,
        is_published boolean NOT NULL DEFAULT false,published_at timestamptz,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());`);
    await db.query('INSERT INTO auth.users VALUES ($1)',[user]);
    await db.query("INSERT INTO public.user_roles VALUES ($1,'admin')",[user]);
    await db.exec(await readFile(new URL('../supabase/migrations/20261002120000_blog_mcp.sql',import.meta.url),'utf8'));
    const grant=(await db.query("INSERT INTO public.blog_mcp_grants(user_id,client_id,resource) VALUES($1,'test',$2) RETURNING id",[user,resource])).rows[0].id;
    const verifier='a'.repeat(43);
    await db.query('INSERT INTO public.blog_mcp_codes(code_hash,grant_id,redirect_uri,challenge) VALUES($1,$2,$3,$4)',[hash('code'),grant,'https://gemini.google.com/callback',challenge(verifier)]);
    const exchange=(kind,credential,access,refresh,pkce=challenge(verifier),client='test',audience=resource) => db.query(
      'SELECT public.blog_mcp_exchange($1,$2,$3,$4,$5,$6,$7,$8) AS result',[kind,hash(credential),client,audience,'https://gemini.google.com/callback',pkce,hash(access),hash(refresh)]);
    await assert.rejects(exchange('authorization_code','code','access','refresh','wrong'),/invalid_grant/);
    await assert.rejects(exchange('authorization_code','code','access','refresh',challenge(verifier),'other'),/invalid_grant/);
    await assert.rejects(exchange('authorization_code','code','access','refresh',challenge(verifier),'test','https://evil.example/mcp'),/invalid_grant/);
    assert.equal((await exchange('authorization_code','code','access','refresh')).rows[0].result.expires_in,3600);
    await assert.rejects(exchange('authorization_code','code','access2','refresh2'),/invalid_grant/);
    await exchange('refresh_token','refresh','access2','refresh2');
    await assert.rejects(exchange('refresh_token','refresh','access3','refresh3'),/invalid_grant/);
    const call=async (name,args,token='access2',audience=resource) => (await db.query(
      'SELECT public.blog_mcp_action($1,$2,$3,$4::jsonb) AS result',[hash(token),audience,name,JSON.stringify(args)])).rows[0].result;
    await assert.rejects(call('verify',{},'wrong'),/invalid_token/);
    await assert.rejects(call('verify',{},'access2','https://evil.example/mcp'),/invalid_token/);
    const args={ request_id:randomUUID(),post:normalizePost({ title:'Integration test',slug:'integration-test',excerpt:'An example.',content:'<p>Safe article body.</p>' }) };
    const draft=await call('create',args);assert.equal(draft.is_published,false);
    assert.deepEqual(await call('create',args),draft);
    await assert.rejects(call('create',{ ...args,post:{ ...args.post,title:'Changed payload' } }),/request_id_reused/);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM public.blog_posts')).rows[0].n,1);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM public.blog_mcp_audit')).rows[0].n,1);
    await assert.rejects(call('create',{ request_id:randomUUID(),post:args.post }),/duplicate key/);
    const update={ id:draft.id,request_id:randomUUID(),expected_updated_at:draft.updated_at,post:{ ...args.post,title:'Reviewed article' } };
    const edited=await call('update',update);assert.equal(edited.title,'Reviewed article');
    await assert.rejects(call('publish',{ id:draft.id,request_id:randomUUID(),expected_updated_at:draft.updated_at,confirmed:true }),/post_changed/);
    await assert.rejects(call('publish',{ id:draft.id,request_id:randomUUID(),expected_updated_at:edited.updated_at,confirmed:false }),/confirmation_required/);
    const publish={ id:draft.id,request_id:randomUUID(),expected_updated_at:edited.updated_at,confirmed:true };
    const published=await call('publish',publish);assert.equal(published.is_published,true);assert.ok(published.published_at);
    assert.deepEqual(await call('publish',publish),published);
    await assert.rejects(call('update',{ ...update,request_id:randomUUID(),expected_updated_at:published.updated_at }),/edit_drafts_only/);
    assert.equal((await call('list',{ limit:10,offset:0 })).posts.length,1);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM public.blog_mcp_audit')).rows[0].n,3);
    await db.query('DELETE FROM public.user_roles WHERE user_id=$1',[user]);
    await assert.rejects(call('verify',{}),/invalid_token/);
    await db.query("INSERT INTO public.user_roles VALUES ($1,'admin')",[user]);
    await db.query('UPDATE public.blog_mcp_tokens SET expires_at=now()-interval \'1 second\' WHERE token_hash=$1',[hash('access2')]);
    await assert.rejects(call('verify',{}),/invalid_token/);
    await exchange('refresh_token','refresh2','access3','refresh3');
    await db.query('UPDATE public.blog_mcp_grants SET revoked_at=now() WHERE id=$1',[grant]);
    await assert.rejects(call('verify',{},'access3'),/invalid_token/);
    await assert.rejects(exchange('refresh_token','refresh3','access4','refresh4'),/invalid_grant/);
    for(const role of ['anon','authenticated']) {
      await db.exec(`SET ROLE ${role}`);
      await assert.rejects(call('verify',{}),/permission denied/);
      await assert.rejects(db.query('SELECT * FROM public.blog_mcp_tokens'),/permission denied/);
      await db.exec('RESET ROLE');
    }
  } finally { await db.close(); }
});
