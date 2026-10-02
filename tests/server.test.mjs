import test from "node:test";
import assert from "node:assert/strict";
import { loadPage, routeInfo, safeJson, sitemap } from "../server/content.mjs";
import { validateLead, deliverNotifications } from "../server/leads.mjs";
const request = { request_id: "12345678-1234-4123-8123-123456789012", name: "Example Buyer", email: "buyer@example.com", source: "contact_form" };
test("routes restrict slugs and do not treat missing routes as home", () => {
  assert.equal(routeInfo("/blog/new-post").slug, "new-post");
  for (const path of ["/does-not-exist", "/blog/%2F", "/blog/%ZZ"]) assert.equal(routeInfo(path).kind, "missing");
});
test("published CMS details seed the exact client query and missing details return 404", async () => {
  let published = true;
  const read = async (table, params) => {
    if (table === "blog_posts" && params.slug) { assert.equal(params.is_published, "eq.true"); return published ? [{ slug: "new-post", content: "Updated article body" }] : []; }
    return [];
  };
  const page = await loadPage("/blog/new-post", read);
  assert.equal(page.status, 200);
  assert.equal(page.seed.find(s => s.key[0] === "blog_post").data.content, "Updated article body");
  published = false;
  assert.equal((await loadPage("/blog/new-post", read)).status, 404);
  assert.equal((await loadPage("/unknown", read)).status, 404);
});
test("embedded CMS data cannot close its JSON script element", () => {
  const value = { content: '</script><script>alert("x")</script>\u2028' };
  const encoded = safeJson(value);
  assert.ok(!encoded.includes("<"));
  assert.deepEqual(JSON.parse(encoded), value);
});
test("sitemap includes published content and excludes noindex and canonical duplicates", async () => {
  const output = await sitemap(async table => table === "blog_posts" ? [{ slug: "public", updated_at: "2026-10-02", noindex: false }, { slug: "hidden", noindex: true }, { slug: "duplicate", canonical_url: "https://example.com/original" }] : []);
  assert.ok(output.includes("https://www.techhandlers.in/blog/public"));
  assert.ok(!output.includes("/blog/hidden")); assert.ok(!output.includes("/blog/duplicate"));
});
test("lead validation rejects missing data and drops client-controlled CRM fields and raw URLs", () => {
  assert.throws(() => validateLead({ ...request, email: "invalid" }), /valid email/);
  assert.throws(() => validateLead({ ...request, request_id: "fake" }), /submission ID/);
  assert.throws(() => validateLead({ ...request, website_url: "javascript:alert(1)" }), /website URL/);
  const result = validateLead({ ...request, status: "converted", assigned_to: "admin", attribution: { submission_path: "/?email=private", first_touch: { utm_campaign: "buyer@example.com", referrer_origin: "https://search.example/path?private=1" } } });
  assert.equal(result.status, undefined); assert.equal(result.attribution.submission_path, undefined);
  assert.equal(result.attribution.first_touch.utm_campaign, undefined);
  assert.equal(result.attribution.first_touch.referrer_origin, "https://search.example");
});
test("provider failure returns the durable job to retry rather than losing the lead", async () => {
  const calls = [];
  process.env.FORMSPREE_ENDPOINT = "https://formspree.io/f/example";
  const db = async (path, options) => {
    calls.push([path, options]);
    if (path === "rpc/claim_lead_notifications") return [{ id: "job", lead_id: "lead", claim_token: "claim" }];
    if (path.startsWith("leads?")) return [{ name: "Example", email: "buyer@example.com" }];
  };
  const result = await deliverNotifications("lead", db, async () => ({ ok: false, status: 503 }));
  assert.deepEqual(result, { processed: 1, sent: 0 });
  assert.equal(calls.at(-1)[1].body.p_sent, false); assert.equal(calls.at(-1)[1].body.p_token, "claim");
});
