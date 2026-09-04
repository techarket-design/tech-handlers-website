#!/usr/bin/env node
// Import auth.users JSON dump into app_users.
// Usage: node import-users.mjs <auth_users.json> <PG_URL>
import fs from "node:fs";
import pg from "pg";

const [, , file, url] = process.argv;
if (!file || !url) {
  console.error("usage: import-users.mjs <auth_users.json> <PG_URL>");
  process.exit(1);
}
const users = JSON.parse(fs.readFileSync(file, "utf8")) || [];
const client = new pg.Client({ connectionString: url });
await client.connect();
let ok = 0;
for (const u of users) {
  if (!u.email || !u.encrypted_password) continue;
  const name = u.metadata?.name || u.metadata?.full_name || null;
  await client.query(
    `INSERT INTO app_users (id, email, encrypted_password, name, metadata, created_at)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       encrypted_password = EXCLUDED.encrypted_password,
       name = EXCLUDED.name,
       metadata = EXCLUDED.metadata`,
    [u.id, u.email, u.encrypted_password, name, u.metadata || {}, u.created_at]
  );
  ok++;
}
await client.end();
console.log(`imported ${ok} users`);