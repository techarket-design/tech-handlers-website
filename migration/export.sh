#!/usr/bin/env bash
# Export everything from the current Legacy Platform Cloud (Supabase) project.
# Run this from a machine that has psql + curl installed.
#
# REQUIRED env vars (get from Legacy Platform: Cloud → Settings):
#   SUPABASE_DB_URL          postgres://postgres:<pwd>@db.<ref>.supabase.co:5432/postgres
#   SUPABASE_URL             https://<ref>.supabase.co
#   SUPABASE_SERVICE_ROLE_KEY  service_role JWT (NEVER commit)
#
# Output: ./export/  (data.sql, auth_users.json, media/)

set -euo pipefail
: "${SUPABASE_DB_URL:?required}"
: "${SUPABASE_URL:?required}"
: "${SUPABASE_SERVICE_ROLE_KEY:?required}"

OUT="$(dirname "$0")/export"
mkdir -p "$OUT/media"

TABLES=(
  site_settings hero_slides services portfolio brands testimonials faqs metrics
  process_steps why_us_reasons nav_links footer_links revenue_engine_segments
  homepage_sections platform_logos blog_posts tracking_scripts
  leads lead_activities
  customers invoices invoice_line_items payments
  task_projects tasks task_assignees task_comments task_activities
  notifications personal_notes personal_todos personal_bookmarks
  customer_team_allocations
  user_roles user_permissions
)

echo "==> dumping public-schema data only (no schema, no owners)"
pg_dump "$SUPABASE_DB_URL" \
  --data-only --no-owner --no-privileges --column-inserts \
  $(printf -- '-t public.%s ' "${TABLES[@]}") \
  > "$OUT/data.sql"

echo "==> exporting auth users (id, email, encrypted_password, metadata)"
psql "$SUPABASE_DB_URL" -At -F $'\t' -c "
  SELECT json_agg(row_to_json(u)) FROM (
    SELECT id, email, encrypted_password,
           COALESCE(raw_user_meta_data,'{}'::jsonb) AS metadata,
           created_at
    FROM auth.users
  ) u
" > "$OUT/auth_users.json"

echo "==> downloading media bucket files"
# list every object in the media bucket (one path per line)
psql "$SUPABASE_DB_URL" -At -c "
  SELECT name FROM storage.objects WHERE bucket_id='media' ORDER BY name
" > "$OUT/media_files.txt"

while IFS= read -r path; do
  [ -z "$path" ] && continue
  dest="$OUT/media/$path"
  mkdir -p "$(dirname "$dest")"
  url="$SUPABASE_URL/storage/v1/object/public/media/$path"
  echo "  - $path"
  curl -sfL "$url" -o "$dest" || echo "    !! failed: $path"
done < "$OUT/media_files.txt"

echo
echo "DONE. Export written to: $OUT"
echo "Next: copy $OUT to your new server and run import.sh"
