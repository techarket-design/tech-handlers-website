# Route rendering, publishing and lead measurement

The application remains React/Vite, Supabase and Vercel. The admin panel still writes blogs, case studies, location pages and site settings directly to Supabase. Public requests now run through a Vercel Node function that reads published content, renders the same React components, and sends their title, canonical, structured data and body in the initial HTML. The browser hydrates that HTML with the same query data.

## Deploy in this order

1. Apply `supabase/migrations/20261002090000_website_lead_measurement.sql` to the existing Supabase project. It creates the lead-saving RPC, attribution column, rate limits, delivery outbox and content indexes. It removes unrestricted anonymous lead inserts while preserving staff CRM insertion policies. Back up and test in a staging Supabase project first.
2. Review and apply `supabase/migrations/20261002091000_international_positioning.sql`. This updates only the observed regional homepage defaults; newer custom admin edits are preserved. All fields remain editable in Settings. Review the proposed remote delivery process against your actual operations.
3. Set the Vercel variables below for Preview and Production. Server secrets must never have a `VITE_` prefix.
4. Deploy a preview using the included `vercel.json`, `npm ci` and `npm run build`. Confirm the function includes `dist-server/**`; the build creates this directory and the matching HTML template. Retain the existing Vercel redirect from the apex domain to `www.techhandlers.in`.
5. Complete the acceptance checks below in Preview before promoting to Production. The local changes have not been deployed and the live database has not been modified.

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Existing public project URL; required at build time |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Existing anonymous/public key; required at build time |
| `SUPABASE_URL` | Server project URL; can fall back to `VITE_SUPABASE_URL` |
| `SUPABASE_ANON_KEY` | Server public-content key; can fall back to the Vite public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for validated lead writes and email retries |
| `LEAD_RATE_LIMIT_SALT` | Random server-only secret to hash visitor IPs; use at least 32 random bytes |
| `FORMSPREE_ENDPOINT` | Your verified Formspree URL. The previous client used `https://formspree.io/f/xlgoqgqy`; verify that it still belongs to your agency |
| `CRON_SECRET` | Random server-only secret that authenticates Vercel notification retries |
| `LEAD_ALLOWED_ORIGIN` | Optional explicit preview/custom origin when it differs from `VERCEL_URL` |

Use Node 22 or newer. For local development, copy public settings to an ignored `.env.local`. `npm run dev` remains the Vite component-development server; lead APIs and SSR require a built preview (`npm run build && npm run preview`) or `vercel dev`. Local form submissions are rejected unless the server settings and exact `LEAD_ALLOWED_ORIGIN`, such as `http://127.0.0.1:4173`, are configured. Never point a local test form at production without intending to create a real enquiry.

## Publishing behavior

Published details and listings are rendered from Supabase at request time. Vercel caches successful HTML and sitemap responses for 30 seconds, with revalidation after expiry. A published edit, new URL or unpublish operation appears in new requests within that cache window; no deployment or snapshot generation is needed. An already-open tab is not automatically pushed new content. Public query data is fresh for 30 seconds and expires from memory after five minutes. Admin saves invalidate affected detail queries too.

Draft/unpublished details and unknown routes return HTTP 404 with noindex. Data-provider failures return HTTP 503 with no-store rather than caching an empty article. Legal aliases redirect permanently to their canonical pages. The canonical host is `www.techhandlers.in`. The sitemap reads only published/active items and omits blog noindex entries and external canonical duplicates. Sitemap reads paginate in batches of 500; split into a sitemap index before a collection reaches 15,000 URLs. Blog and case-study listing reads are bounded at 100 items; add paginated archive pages before growing beyond that limit. Home content reads are bounded at 30 items per section.

The old checked-in snapshots and prerender helpers remain as historical files, but the build no longer copies them. Do not run `scripts/apply-snapshots.mjs` on the new output. `npm run build:dev` produces only a SPA development bundle; use `npm run build` for Vercel.

## Lead delivery and analytics

All public forms call `/api/leads`. The server validates input, limits accepted enquiries to five per hashed IP per hour, and atomically saves a lead plus an email outbox job. A repeated submission ID returns the same lead. Retries of an unchanged form retain that ID while the form remains mounted. New edits or a page reload start a new submission. A saved lead is successful even if email delivery is temporarily unavailable.

Email delivery is attempted immediately. Failed jobs retry through `/api/lead-notifications`, scheduled daily at 04:00 UTC to work with Vercel Hobby cron scheduling. Administrators can also retry due jobs from Form Submissions; failed jobs become due after one hour. On higher traffic/paid Vercel plans, increase the cron frequency. Each cron invocation processes due jobs for up to roughly 30 seconds, bounded to 100 jobs. Monitor backlog in the admin screen and Vercel logs. Notification delivery is at least once: a provider success followed by an interrupted database acknowledgement can produce a duplicate email. The CRM lead remains deduplicated.

Form Submissions now includes hero/contact/service enquiries and displays attribution. Request path and time zone accompany an enquiry. First/last touch campaign values and referrer origin are captured only after optional analytics consent; raw query strings and referrer paths are not saved. Rejecting consent clears stored campaign attribution. Email, phone and name are never included in the analytics event.

`generate_lead` fires only after a successful save, once per returned lead ID in the page session. `virtual_page_view` identifies SPA navigation using the path only. The code supports direct GA4 (`gtag`) and GTM custom events. Tracking snippets from the admin now execute as actual script elements after consent, and remain disabled on admin routes.

For GTM, add a Custom Event trigger named `generate_lead`, connect it to a GA4 event of that name, and pass `form_source` and `service_interest` as parameters. Mark `generate_lead` as a key event in GA4. Add a `virtual_page_view` trigger if you want manual SPA page views, and avoid also enabling duplicate automatic/history page views. For direct GA4, map `virtual_page_view` as needed in your reporting setup. Consent rejection intentionally prevents analytics events; CRM enquiry counts therefore remain the operational source of truth. Use CRM qualified and converted stages to judge lead quality, not form submissions alone.

## Preview acceptance checks

- Open homepage, every service, About, blog index/detail, case-study index/detail and location pages with JavaScript disabled. Confirm content, unique titles/canonicals and structured data are present in View Source.
- Publish a test blog and case study from admin. Visit their new URLs and sitemap after 30 seconds. Edit their title/body, then unpublish: verify updated initial HTML, then HTTP 404 and sitemap removal. Check another route still works.
- Submit a clearly labeled test enquiry in Preview. Check the CRM record, source/currency/attribution, email delivery and GA4/GTM debug event. Retry a failed request with the same ID and confirm one CRM record. Use rejected consent to verify a saved enquiry without analytics or campaign attribution.
- Verify `/admin/login` and protected admin navigation still work and admin responses are noindex. Review existing staff permissions.
- Verify unknown URLs return 404, Supabase failures return 503/no-store, and fresh asset URLs resolve. Check desktop/mobile and reduced-motion preferences for visible headings and usable forms.
- Check Vercel cache headers and publish freshness in the actual deployment; local preview does not emulate the CDN or Vercel rewrite engine.

## Local verification performed

Production client + server build, TypeScript, focused server tests, live read-only published-content rendering checks, desktop/mobile hydration checks, and a temporary local PostgreSQL-compatible integration test for the lead migration. No real lead was submitted and no production database write was made. Complete the deployed publishing and real email/GA4 checks above after credentials and a Preview deployment are available.

The repository's locked dependencies have existing advisories reported by `npm audit`; this change does not perform a broad dependency upgrade. Handle those separately with an upgrade and regression review before treating the whole application as production-hardened.
