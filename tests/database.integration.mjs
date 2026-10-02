// Optional local integration check: npm install --no-save --package-lock=false @electric-sql/pglite
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role;
create schema auth; create function auth.uid() returns uuid language sql as 'select null::uuid';
create function public.has_role(uuid,text) returns boolean language sql as 'select false';
create table public.leads(id uuid primary key default gen_random_uuid(),name text not null,email text not null,phone text,company text,website_url text,service_interest text,message text,budget text,source text,status text default 'new');
alter table public.leads enable row level security;
create policy "Anyone can submit a lead" on public.leads for insert with check (true);
create table public.blog_posts(slug text,is_published boolean); create table public.portfolio(slug text,is_active boolean); create table public.city_pages(slug text,is_published boolean);`);
await db.exec(await readFile("supabase/migrations/20261002090000_website_lead_measurement.sql", "utf8"));
const lead={request_id:"12345678-1234-4123-8123-123456789012",name:"Test buyer",email:"buyer@example.com",source:"contact_form",budget:"USD 2000",attribution:{submission_path:"/",first_touch:{utm_source:"google"}}};
const submit=async input=>(await db.query("select public.submit_website_lead($1::jsonb,$2) as result",[JSON.stringify(input),"hashed-test-ip"])).rows[0].result;
const saved=await submit(lead); assert.equal(saved.duplicate,false);
assert.deepEqual(await submit(lead),{...saved,duplicate:true});
assert.equal((await db.query("select count(*)::int n from leads")).rows[0].n,1);
assert.equal((await db.query("select count(*)::int n from lead_notification_outbox")).rows[0].n,1);
assert.equal((await db.query("select attribution->'first_touch'->>'utm_source' source from leads")).rows[0].source,"google");
const claim=(await db.query("select * from claim_lead_notifications($1)",[saved.id])).rows[0];
assert.ok(claim.claim_token);
assert.equal((await db.query("select * from claim_lead_notifications($1)",[saved.id])).rows.length,0);
await db.query("select complete_lead_notification($1,$2,false,'provider unavailable')",[claim.id,claim.claim_token]);
assert.equal((await db.query("select status,last_error from lead_notification_outbox")).rows[0].status,"pending");
await db.exec("update lead_notification_outbox set next_attempt_at=now()-interval '1 minute'");
const retry=(await db.query("select * from claim_lead_notifications($1)",[saved.id])).rows[0];
await db.query("select complete_lead_notification($1,$2,true,null)",[retry.id,retry.claim_token]);
assert.equal((await db.query("select status from lead_notification_outbox")).rows[0].status,"sent");
for(let i=0;i<4;i++)await submit({...lead,request_id:`12345678-1234-4123-8123-12345678901${i+3}`});
await assert.rejects(submit({...lead,request_id:"12345678-1234-4123-8123-123456789019"}),/lead_rate_limit/);
assert.equal((await db.query("select count(*)::int n from leads")).rows[0].n,5);
for(const role of ["anon","authenticated"]) {
 await db.exec(`set role ${role}`);
 await assert.rejects(submit(lead),/permission denied/);
 await db.exec("reset role");
}
await db.close();
console.log("Migration verified: atomic save/outbox, idempotency, claim locking, retry, rate limit and RPC permissions");
