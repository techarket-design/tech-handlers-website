# Search and AI discovery: launch and the next eight weeks

The site uses the existing React/Vite SSR, Supabase CMS and Vercel architecture. Public posts are rendered into the initial HTML. Publication does not require a rebuild. Indexing, search position, AI citations and leads are decisions made by external platforms and buyers; none is guaranteed by these changes.

## What runs automatically after deployment

- `/sitemap.xml` is a live sitemap index. `/sitemap-pages.xml` covers core pages and published legal pages. Blogs, projects and locations have separate 500-record shards that expand with the CMS. Counts come from Supabase; shard reads are bounded and ordered by stable IDs. Sitemap updates have a maximum 30-second CDN cache window.
- Only published/active records are included. Blog `noindex` entries and external/different canonical URLs are excluded. Drafts never appear. Real stored modification timestamps are used; no artificial daily freshness or unsupported priority/change-frequency signals.
- Project/blog images are included where available, and `/feed.xml` supplies the latest 50 published, indexable articles. The HTML advertises this RSS feed.
- Search and AI crawlers may read public pages through the existing wildcard robots rule. Admin, OAuth and API routes are excluded. CDN/WAF restrictions must also allow legitimate crawlers. Never use user-agent cloaking.
- Article, breadcrumb and case-study schema already appear in initial HTML. Preview directives allow large images and full snippets on indexable pages. These support eligibility, not guaranteed enhanced results.

## Required production setup

1. Deploy the code to Vercel. Verify canonical `https://www.techhandlers.in` HTTPS and the existing non-www redirect. Check there is no production password protection or broad bot challenge. Preview environments should be protected/noindexed through Vercel settings.
2. Verify domain ownership in Google Search Console and Bing Webmaster Tools. Submit `/sitemap.xml` in both. Inspect one new article, one updated article and one case study with JavaScript rendering disabled and URL Inspection. Track indexing exclusions and response codes.
3. Set server-only `INDEXNOW_KEY` (8–128 alphanumeric/hyphen characters) and a separate random `CONTENT_WEBHOOK_SECRET` in Vercel. The key is intentionally public proof of ownership at `/indexnow-key.txt`; the webhook secret must stay private. Redeploy after configuring environment variables.
4. In Supabase Database Webhooks, create INSERT/UPDATE/DELETE webhooks for `public.blog_posts`, `public.portfolio` and `public.city_pages`. POST to `https://www.techhandlers.in/api/content-discovery` with `Authorization: Bearer <CONTENT_WEBHOOK_SECRET>` and JSON content type. The handler expects the standard Supabase envelope with `schema`, `table`, `type`, `record`, `old_record`. It ignores drafts and unrelated tables, submits both old and new URLs on slug changes, and submits the old published URL when unpublishing/deleting.
5. Verify Supabase webhook old records contain `slug`, publication flag and `noindex`. Full old-record delivery can require `ALTER TABLE public.blog_posts REPLICA IDENTITY FULL;` (and the equivalent for portfolio and city_pages); review the database's webhook behavior and replication cost before enabling. Ensure existing update triggers maintain `updated_at` when substantive content changes. Do not bump it solely to signal freshness.
6. Test a real publication on the deployed domain. HTTP 200/202 from IndexNow means accepted notification, not indexed content. Monitor Supabase webhook delivery logs and Vercel function errors, replay failed notifications after configuration/network issues, and check Bing URL status. The live sitemap remains discovery fallback; the webhook has no durable retry queue. No requests to IndexNow are sent by the local tests.
7. Verify the existing GA4 lead event only fires after successful form submission. Establish country, landing page, source and qualified-lead reporting. Confirm analytics consent settings, and classify actual enquiries as qualified/unqualified in the CRM. Search Console measures search demand; the CRM measures business value.

## Publishing standard for overseas buyers

Every article should answer one concrete buyer question early, explain tradeoffs and scope, name its author, use accurate publication/update dates, cite primary evidence where needed, and link to a relevant service and genuine case study. Add a descriptive image and alt text. Keep important answers as visible HTML text, not embedded in animations or images. Use original examples and implementation detail that demonstrates experience. Avoid mass-produced city/country pages and invented overseas offices, reviews or results.

For each case study, add the client-approved project image, market/industry, original problem, your actual work, measurement period and evidence for the result. Link the case study from the relevant service and two genuinely related articles. Remove unverified fallback performance claims before production.

AI discovery uses the same public content foundation. Special AI files or fabricated schema do not guarantee mentions. Clear, attributable explanations and corroborated expertise are more useful than keyword repetition. Do not use Google's restricted Indexing API for ordinary agency articles and do not use deprecated sitemap ping endpoints.

## Eight-week acquisition plan

Choose two markets and one niche from actual delivery experience and buyer demand rather than targeting every country at once. Initial hypotheses: UK/Australian businesses buying remote website development or SEO, subject to keyword and competitor research. Validate these before committing the content calendar.

| Period | Deliverables | Measure |
| --- | --- | --- |
| Week 1 | Deploy, configure webhooks and webmaster properties; inspect technical eligibility; document baseline and current lead quality | Indexed URLs, errors, international impressions, qualified enquiries |
| Week 2 | Strengthen the two most relevant service pages with scope, process, ownership, communication/time-zone expectations and an enquiry CTA; publish one evidenced case study | Service engagement and enquiry completion |
| Weeks 3–4 | Publish four original buying guides: hiring a remote agency, website project scope/cost drivers, SEO engagement expectations, and agency handover/ownership | Queries, target-country impressions and relevant landing-page clicks |
| Weeks 5–6 | Publish two further real case studies and two niche-specific comparisons; earn relevant references via client/partner portfolios and expert contributions | Referring domains, assisted enquiries and case-study engagement |
| Weeks 7–8 | Update pages from Search Console queries; improve weak titles and CTA clarity; consolidate overlapping pages; follow up on qualified enquiries | Qualified international leads, calls booked, proposals and pipeline |

Success target: improving international discovery and a measurable qualified-enquiry pipeline by week eight. Establish numerical targets from the week-one baseline; technical work alone cannot promise leads. Editorial content, evidence, competitive differentiation and relevant independent references remain essential.

## Validation

Run `node scripts/test-discovery.mjs`, TypeScript and `npm run build`. After deployment, GET the index and every child sitemap, parse XML, inspect image URLs, verify new content without JS, and confirm unpublished URLs return 404. The local preview handles the sitemaps and feed; ownership/webhook verification requires the deployed domain.

References: [Google AI search guidance](https://developers.google.com/search/docs/appearance/ai-features), [sitemap documentation](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [IndexNow protocol](https://www.indexnow.org/documentation), [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots).
