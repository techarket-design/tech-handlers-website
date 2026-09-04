# Tech Handlers — Self-Hosted API

Express + PostgreSQL backend that replaces Legacy Cloud (Supabase) for `techhandlers.in`.
The React frontend stays the same; it talks to this API through a drop-in `supabase` shim
(`migration/frontend-shim/client.ts`).

## Quick start (local dev)

```bash
cd server
cp .env.example .env        # edit DB_URL, JWT secrets
npm install
npm run dev                 # http://localhost:3000/health
```

## Production deploy (Ubuntu 22.04 VPS)

### 1. Install system packages

```bash
apt update && apt upgrade -y
apt install -y nginx postgresql-15 git ufw certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm i -g pm2
ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw enable
```

### 2. Create the database

```bash
sudo -u postgres psql <<SQL
CREATE USER techhandlers WITH PASSWORD 'CHANGE_ME';
CREATE DATABASE techhandlers OWNER techhandlers;
\c techhandlers
CREATE EXTENSION IF NOT EXISTS pgcrypto;
SQL
```

### 3. Run the migration

On any machine that can reach the Legacy Cloud DB:

```bash
export SUPABASE_DB_URL="postgres://postgres:<pwd>@db.<ref>.supabase.co:5432/postgres"
export SUPABASE_URL="https://<ref>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="..."
bash migration/export.sh
scp -r migration/ user@vps:/home/user/
```

On the VPS:

```bash
cd ~/migration
export PG_URL="postgres://techhandlers:CHANGE_ME@localhost:5432/techhandlers"
export MEDIA_DIR="/var/www/techhandlers/uploads"
bash import.sh
```

### 4. Run the API

```bash
cd ~/app/server
cp .env.example .env        # set DB_URL, JWT secrets, COOKIE_DOMAIN, FORMSPREE_URL
npm ci
pm2 start src/index.js --name th-api
pm2 startup && pm2 save
```

### 5. Build & host the frontend

After cutover, swap the Supabase client:

```bash
cp migration/frontend-shim/client.ts src/integrations/supabase/client.ts
rm src/integrations/supabase/types.ts
```

Then build:

```bash
cat > .env.production <<EOF
VITE_API_URL=https://techhandlers.in/api
VITE_UPLOAD_URL=https://techhandlers.in/uploads
EOF
npm ci && npm run build
sudo mkdir -p /var/www/techhandlers
sudo cp -r dist/* /var/www/techhandlers/
```

### 6. Nginx

`/etc/nginx/sites-available/techhandlers`:

```nginx
server {
  server_name techhandlers.in www.techhandlers.in;
  root /var/www/techhandlers;
  index index.html;
  client_max_body_size 25M;

  location /api/      { proxy_pass http://127.0.0.1:3000/; proxy_set_header Host $host; }
  location /uploads/  { alias /var/www/techhandlers/uploads/; access_log off; expires 30d; }
  location /          { try_files $uri /index.html; }
}
```

```bash
ln -s /etc/nginx/sites-available/techhandlers /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d techhandlers.in -d www.techhandlers.in
```

### 7. Backups (cron)

```bash
# /etc/cron.daily/th-backup
#!/bin/bash
pg_dump techhandlers | gzip > /backups/$(date +%F).sql.gz
find /backups -name '*.sql.gz' -mtime +30 -delete
```

## API surface

| Method | Path | Notes |
|---|---|---|
| POST | /auth/login | bcrypt-verified |
| POST | /auth/refresh | httpOnly `rt` cookie |
| POST | /auth/logout | clears cookie |
| GET | /auth/me | requires Bearer |
| GET | /table/:name | filters via `?col=val&order=col.asc&limit=100` |
| POST | /table/:name | insert (row or array) |
| PUT | /table/:name | upsert |
| PATCH | /table/:name/:id | update |
| DELETE | /table/:name/:id | delete |
| POST | /rpc/next_invoice_number | |
| POST | /rpc/has_role / has_permission | |
| GET | /team/members | admin or team |
| POST | /team/members | admin only |
| POST | /team/change-password | self or admin |
| POST | /storage/upload | multipart `file` |
| DELETE | /storage/file/:name | |
| POST | /leads | public lead capture |

Per-table access rules in `src/routes/table.js` mirror the original Supabase RLS policies
(public-read CMS, admin-only CRM, permission-gated billing/customers/tasks, per-user
notifications/personal_*).

## Updating

```bash
cd ~/app && git pull
(cd server && npm ci) && pm2 reload th-api
npm ci && npm run build && sudo cp -r dist/* /var/www/techhandlers/
```
