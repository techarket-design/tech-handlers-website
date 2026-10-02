# TH Blog Publisher for Gemini

This integration lets Gemini write HTML articles into the existing Supabase `blog_posts` table, then publish a reviewed draft. It uses the official MCP SDK with stateless Streamable HTTP, suitable for Vercel functions. The public website and admin editor continue to use the same blog records.

## Deployment setup

1. Apply `supabase/migrations/20261002120000_blog_mcp.sql` to a staging Supabase project. It adds four private tables and two service-only RPCs. Existing blog content and policies are preserved. Run `npm run test:server` and `npm run build`.
2. Configure the existing Supabase URL, public key and **server-only** service-role key in Vercel. The service-role key must never appear in a Gemini link or any `VITE_` variable.
3. Set these server-only environment variables in each deployment environment:

   | Variable | Value |
   | --- | --- |
   | `MCP_PUBLIC_ORIGIN` | Exact deployment origin, e.g. `https://www.techhandlers.in`, without a trailing slash |
   | `MCP_OAUTH_CLIENT_ID` | `th-gemini-blog` or another identifier containing letters, digits, hyphens or underscores |
   | `MCP_OAUTH_CLIENT_SECRET` | At least 32 random characters; generate with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"` |
   | `MCP_OAUTH_REDIRECT_URIS` | Exact HTTPS OAuth callback URI supplied by Gemini; separate multiple URIs with commas |

4. Deploy a Vercel Preview and verify OAuth discovery, consent, token exchange, draft creation, publishing and disconnection with staging data. Then apply the migration to production and deploy production. The repository alone cannot confirm the currently deployed website's publish/cache behavior.
5. In Gemini web, open **Settings → Connected Apps → Custom apps**. Add `https://www.techhandlers.in/api/mcp`. Expand **Advanced features** and enter the configured client ID and client secret. This implementation uses a preregistered confidential OAuth client; it deliberately does not offer public dynamic client registration.
6. Sign in using your existing TH **admin** account on the connection page and click **Connect blog publisher**. Gemini receives scoped opaque access and refresh tokens, not your password or Supabase key.

The callback URL must come from Gemini's actual account-linking flow; do not assume a path or allow wildcard Google domains. If Gemini does not disclose it beforehand, use a staging deployment with an inert registered callback such as `https://www.techhandlers.in/oauth-callback-not-configured`, start linking with Advanced features, and inspect the `redirect_uri` in the resulting `/api/blog-oauth?action=authorize` browser URL. That request is rejected. Set the exact observed callback and restart linking. Do not share the full authorization URL, client secret or issued tokens in chat.

Google currently documents custom apps as requiring a personal account, age 18+, US availability, English and Keep Activity enabled. It also documents manual confirmation for write actions. Check actual account availability before deploying: [Google custom-app documentation](https://support.google.com/gemini/answer/17209137?hl=en-SM).

## Tools and workflow

- `list_blog_posts`: list draft and published titles, with bounded pagination.
- `get_blog_post`: read a complete post and its `updated_at` version.
- `create_blog_draft`: write a new unpublished article with SEO fields.
- `update_blog_draft`: edit an unpublished draft with a version check.
- `publish_blog_post`: publish the exact reviewed version, with `confirmed: true`.

Example Gemini prompt:

> Use TH Blog Publisher to write a practical article about how service businesses can improve lead quality. Read existing posts first to avoid duplication. Save an unpublished draft with a title, excerpt, HTML body, SEO title and description. Show me the full draft and ask for approval before publishing. Do not invent statistics, testimonials or claims about Tech Handlers.

Publication is a separate write tool, marked destructive, so Gemini can present its write confirmation. The boolean `confirmed` is an assertion supplied by the client; the server cannot independently verify a human's chat approval. This workflow relies on Gemini's confirmation UX plus the explicit server version check. It does not provide unattended publishing or a second approval screen on TH.

Use a new UUID `request_id` for each write. An identical retry returns the original result; reusing a request ID with different arguments fails. Slug collisions fail instead of overwriting articles. After a timeout during an edit, retry the same request with the original fields; if the admin has edited that draft meanwhile, read and review it again using a new request ID.

Blog content is sanitized with an HTML allowlist. Article fields cannot change CRM data, tracking scripts, site settings, schemas or publish status through draft tools. Featured images use existing HTTPS URLs; generating/uploading new image files is outside this integration. Published articles remain editable using the existing TH admin editor.

## Connections and revocation

Open `/admin/blog-connection`, also linked from the admin sidebar, to list and disconnect your connections. Grants expire after 30 days; access tokens expire after at most one hour. Refresh tokens rotate once per exchange. Every MCP operation checks current grant status, expiry, exact resource and current admin role. Revoking a connection or removing the user's admin role blocks existing tokens immediately on subsequent requests.

Authorization codes and tokens are stored as SHA-256 hashes; codes expire after five minutes and are consumed once using row locks. Writes and audit results commit atomically. `blog_mcp_audit` retains the post version returned for each mutation to support exact retries; it is private and accessible only to the server. Set an operational retention policy for older audit/grant records if volume grows. Expired codes/tokens are cleaned on token exchange.

## Verification and local preview

`npm run test:server` covers OAuth validation and discovery, secret authentication, sanitization, official MCP client/tool discovery, and a local PostgreSQL-compatible database test of PKCE, single-use codes, refresh rotation, draft writes, publication, stale versions, idempotency, expiry, role removal and revoked grants. No production database is used by these tests.

For local preview, configure a staging database and `MCP_PUBLIC_ORIGIN=http://127.0.0.1:4173`, then run `npm run build` and `npm run preview`. The preview server routes MCP and OAuth requests. A local URL cannot be used as Gemini's remotely accessible custom app; real account linking requires an HTTPS deployment.

Production acceptance: complete one Gemini linking flow, save a labeled draft, approve publication, verify article metadata/body and sitemap after the existing cache window, disconnect from TH, and confirm Gemini's subsequent tool call is denied. Live connection compatibility and CDN behavior remain unverified until these checks pass.

Local verification on 2 October 2026: all 13 server tests passed, including an official MCP client over a real local HTTP connection; TypeScript and focused lint checks passed; the production client/server build and output verification passed. The connection page renders correctly while signed out and links to the existing admin login. No production migration, deployment or blog write has been performed.

## Vercel startup compatibility

If Vercel reports `ERR_REQUIRE_ESM` for `sanitize-html` requiring `htmlparser2`, deploy the compatibility fix in this repository. The build now bundles the current sanitizer and parser together into `dist-server/blog-sanitizer.cjs`, and both publishing functions explicitly include that artifact. Do not downgrade the sanitizer or change database settings to work around this startup crash.

Push all changed files, including `scripts/build-blog-sanitizer.mjs`, `package.json`, `package-lock.json`, `server/blog-mcp.mjs`, `scripts/verify-build.mjs` and `vercel.json`. Deploy that new Git commit using `npm run build`; rebuilding an older commit will not include the fix. The build log must contain `Blog sanitizer and parser bundled for the server runtime.`

An unauthenticated browser visit to `/api/mcp` should return HTTP 401 with `Authentication required` and OAuth discovery headers. It is a machine endpoint, not an HTML page. `/.well-known/oauth-authorization-server` should return metadata JSON. A regression test starts both functions with Node's `require(ESM)` support disabled, reproducing the runtime restriction that caused the original failure.
