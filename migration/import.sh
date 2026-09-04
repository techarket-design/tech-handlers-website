#!/usr/bin/env bash
# Import the export bundle into a fresh local PostgreSQL database.
#
# REQUIRED env vars:
#   PG_URL    postgres://techhandlers:<pwd>@localhost:5432/techhandlers
#   MEDIA_DIR absolute path where uploaded files should live (e.g. /var/www/techhandlers/uploads)

set -euo pipefail
: "${PG_URL:?required}"
: "${MEDIA_DIR:?required}"

HERE="$(cd "$(dirname "$0")" && pwd)"
EXPORT="$HERE/export"

echo "==> applying schema.sql"
psql "$PG_URL" -v ON_ERROR_STOP=1 -f "$HERE/schema.sql"

echo "==> importing app_users from auth_users.json"
# Supabase stores bcrypt hashes; copy them as-is so existing passwords keep working.
node "$HERE/import-users.mjs" "$EXPORT/auth_users.json" "$PG_URL"

echo "==> importing public-schema data"
# Supabase data dump references public schema directly; safe to apply to ours.
psql "$PG_URL" -v ON_ERROR_STOP=1 -f "$EXPORT/data.sql"

echo "==> copying media files into $MEDIA_DIR"
mkdir -p "$MEDIA_DIR"
if [ -d "$EXPORT/media" ]; then
  cp -R "$EXPORT/media/." "$MEDIA_DIR/"
fi

echo
echo "==> verifying row counts"
psql "$PG_URL" -c "
  SELECT 'app_users' AS table, COUNT(*) FROM app_users
  UNION ALL SELECT 'leads', COUNT(*) FROM leads
  UNION ALL SELECT 'customers', COUNT(*) FROM customers
  UNION ALL SELECT 'invoices', COUNT(*) FROM invoices
  UNION ALL SELECT 'blog_posts', COUNT(*) FROM blog_posts
  UNION ALL SELECT 'portfolio', COUNT(*) FROM portfolio;
"
echo "DONE."