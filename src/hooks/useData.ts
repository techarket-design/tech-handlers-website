import { useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { captureAttribution, emitLeadConversion } from "@/lib/measurement";
import { enqueue } from "@/lib/mutationQueue";

type Tables = Database["public"]["Tables"];

// Generic fetchers
function useTable<T extends keyof Tables>(
  table: T,
  options?: { filter?: Record<string, unknown>; orderBy?: string; ascending?: boolean; enabled?: boolean }
) {
  return useQuery({
    queryKey: [table, options?.filter],
    queryFn: async () => {
      let q = supabase.from(table).select("*");
      if (options?.filter) {
        Object.entries(options.filter).forEach(([k, v]) => {
          q = q.eq(k as any, v as any);
        });
      }
      q = q.order(options?.orderBy || "created_at" as any, { ascending: options?.ascending ?? true });
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: options?.enabled !== false,
  });
}

// Generic table hook for non-typed tables
export function useGenericTable(
  table: string,
  options?: { filter?: Record<string, unknown>; orderBy?: string; ascending?: boolean; enabled?: boolean }
) {
  return useQuery({
    queryKey: [table, options?.filter],
    queryFn: async () => {
      let q = supabase.from(table as any).select("*");
      if (options?.filter) {
        Object.entries(options.filter).forEach(([k, v]) => {
          q = q.eq(k, v as any);
        });
      }
      q = q.order(options?.orderBy || "created_at", { ascending: options?.ascending ?? true });
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: options?.enabled !== false,
  });
}

// Public data hooks (frontend)
const SITE_SETTINGS_DEFAULTS = {
  site_name: "Tech Handlers",
  tagline: "Your Digital Growth Partner. Worldwide.",
  hero_badge_text: "India-based. Working across markets.",
  hero_subtitle: "We're a data-driven digital marketing & web development agency helping businesses scale globally. From SEO to full-stack websites — we handle the tech so you can focus on growth.",
  cta_heading: "Ready to Scale Your Business?",
  cta_description: "Get a comprehensive audit of your digital presence with actionable insights. No strings attached.",
  cta_button_text: "Claim Your Free Audit",
  cta_badge_text: "Start with a conversation",
  contact_section_heading: "Let's Build Your Digital Presence",
  contact_form_heading: "Get Your Free Growth Audit",
  footer_description: "India's results-driven digital marketing & web development agency. Turning clicks into customers and code into revenue.",
  metrics_heading: "Numbers That Speak Louder Than Promises",
  metrics_subheading: "Real results for real businesses across India and beyond",
  services_heading: "Services Built for Revenue, Not Vanity",
  services_subheading: "Every service is engineered to move your bottom line.",
  testimonials_heading: "Trusted by Leaders Across Industries",
  faq_heading: "Questions We Get Asked a Lot",
  process_heading: "A Clear Process from Discovery to Delivery",
  process_subheading: "Align goals, agree the scope, deliver and review performance.",
  why_us_heading: "Built Different. Proven Results.",
  why_us_subheading: "Here's why the smartest brands choose us",
  platform_expertise_heading: "Experts Across Leading Marketing Platforms",
};

export const useSiteSettings = () =>
  useQuery({
    queryKey: ["site_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
    placeholderData: SITE_SETTINGS_DEFAULTS as any,
    retry: 1,
    retryDelay: 1000,
  });

export const useHeroSlides = () =>
  useTable("hero_slides", { filter: { is_active: true }, orderBy: "sort_order" });

export const useServices = (activeOnly = true) =>
  useTable("services", { filter: activeOnly ? { is_active: true } : undefined, orderBy: "sort_order" });

export const usePortfolio = (activeOnly = true) =>
  useTable("portfolio", { filter: activeOnly ? { is_active: true } : undefined, orderBy: "sort_order" });

export const useBrands = () =>
  useTable("brands", { filter: { is_active: true }, orderBy: "sort_order" });

export const useTestimonials = () =>
  useTable("testimonials", { filter: { is_active: true }, orderBy: "sort_order" });

export const useFaqs = () =>
  useTable("faqs", { filter: { is_active: true }, orderBy: "sort_order" });

export const useMetrics = () =>
  useTable("metrics", { filter: { is_active: true }, orderBy: "sort_order" });

export const useTrackingScripts = () =>
  useTable("tracking_scripts", { filter: { is_active: true } });

export const useBlogPosts = (publishedOnly = true) => useQuery({
  queryKey: ["blog_posts", publishedOnly ? { is_published: true } : undefined],
  queryFn: async () => {
    const fields = "id,title,slug,excerpt,featured_image_url,author_name,category,tags,meta_title,meta_description,published_at,created_at,updated_at,is_published";
    let query = supabase.from("blog_posts").select(fields).order("created_at", { ascending: false }).limit(100);
    if (publishedOnly) query = query.eq("is_published", true);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
});

export const useBlogPost = (slug?: string) => useQuery({
  queryKey: ["blog_post", slug],
  enabled: !!slug,
  queryFn: async () => {
    const { data, error } = await supabase.from("blog_posts").select("*").eq("slug", slug!).eq("is_published", true).maybeSingle();
    if (error) throw error;
    return data;
  },
});

export const useProcessSteps = () =>
  useGenericTable("process_steps", { filter: { is_active: true }, orderBy: "sort_order" });

export const useWhyUsReasons = () =>
  useGenericTable("why_us_reasons", { filter: { is_active: true }, orderBy: "sort_order" });

export const useNavLinks = () =>
  useGenericTable("nav_links", { filter: { is_active: true }, orderBy: "sort_order" });

export const useFooterLinks = () =>
  useGenericTable("footer_links", { filter: { is_active: true }, orderBy: "sort_order" });

export const useRevenueEngineSegments = () =>
  useGenericTable("revenue_engine_segments", { filter: { is_active: true }, orderBy: "sort_order" });

export const useHomepageSections = () =>
  useGenericTable("homepage_sections", { orderBy: "sort_order", ascending: true });

// Admin data hooks (all records)
export const useAdminHeroSlides = () => useTable("hero_slides", { orderBy: "sort_order" });
export const useAdminServices = () => useTable("services", { orderBy: "sort_order" });
export const useAdminPortfolio = () => useTable("portfolio", { orderBy: "sort_order" });
export const useAdminBrands = () => useTable("brands", { orderBy: "sort_order" });
export const useAdminTestimonials = () => useTable("testimonials", { orderBy: "sort_order" });
export const useAdminFaqs = () => useTable("faqs", { orderBy: "sort_order" });
export const useAdminMetrics = () => useTable("metrics", { orderBy: "sort_order" });
export const useAdminTrackingScripts = () => useTable("tracking_scripts");
export const useAdminBlogPosts = () => useTable("blog_posts", { orderBy: "created_at", ascending: false });
export const useAdminLeads = () => useTable("leads", { orderBy: "created_at", ascending: false });

// Team members for salesperson assignment
export type TeamMember = { user_id: string; role: string; email: string; name?: string };
export const useTeamMembers = () =>
  useQuery({
    queryKey: ["team_members"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("list-team-members");
      if (error) throw error;
      return (data || []) as TeamMember[];
    },
  });

// Multi-assignees for leads
export const useLeadAssignees = (leadId?: string) =>
  useQuery({
    queryKey: ["lead_assignees", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_assignees" as any)
        .select("user_id")
        .eq("lead_id", leadId!);
      if (error) throw error;
      return ((data || []) as any[]).map((r) => r.user_id as string);
    },
    enabled: !!leadId,
  });

export async function syncLeadAssignees(leadId: string, userIds: string[]) {
  const { data: existing } = await supabase
    .from("lead_assignees" as any)
    .select("user_id")
    .eq("lead_id", leadId);
  const have = new Set(((existing || []) as any[]).map((r) => r.user_id));
  const want = new Set(userIds);
  const toAdd = userIds.filter((id) => !have.has(id));
  const toRemove = Array.from(have).filter((id) => !want.has(id as string));
  if (toAdd.length) {
    await supabase.from("lead_assignees" as any).insert(toAdd.map((uid) => ({ lead_id: leadId, user_id: uid })));
  }
  if (toRemove.length) {
    await supabase.from("lead_assignees" as any).delete().eq("lead_id", leadId).in("user_id", toRemove as string[]);
  }
}

// Lead activities for CRM
export const useLeadActivities = (leadId?: string) =>
  useQuery({
    queryKey: ["lead_activities", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_activities" as any)
        .select("*")
        .eq("lead_id", leadId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!leadId,
  });

export function useCreateLeadActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (activity: { lead_id: string; activity_type: string; description?: string; scheduled_at?: string; created_by?: string }) => {
      const { error } = await supabase.from("lead_activities" as any).insert(activity);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["lead_activities", vars.lead_id] });
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}
export const useAdminProcessSteps = () => useGenericTable("process_steps", { orderBy: "sort_order" });
export const useAdminWhyUsReasons = () => useGenericTable("why_us_reasons", { orderBy: "sort_order" });
export const useAdminNavLinks = () => useGenericTable("nav_links", { orderBy: "sort_order" });
export const useAdminFooterLinks = () => useGenericTable("footer_links", { orderBy: "sort_order" });
export const useAdminRevenueEngineSegments = () => useGenericTable("revenue_engine_segments", { orderBy: "sort_order" });
export const useAdminHomepageSections = () => useGenericTable("homepage_sections", { orderBy: "sort_order", ascending: true });

// All public forms use one validated, idempotent server endpoint.
export const useSubmitLead = () => {
  const pendingRef = useRef<{ body: string; id: string }>();
  return useMutation({
    retry: false,
    mutationFn: async (lead: Tables["leads"]["Insert"]) => {
      const body = JSON.stringify(lead);
      if (!pendingRef.current || pendingRef.current.body !== body) pendingRef.current = { body, id: crypto.randomUUID() };
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lead, request_id: pendingRef.current.id, attribution: captureAttribution() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to submit inquiry");
      emitLeadConversion(result.id, lead.source || "website", lead.service_interest || "");
      pendingRef.current = undefined;
      return result;
    },
  });
};

function invalidatePublicDetails(qc: ReturnType<typeof useQueryClient>, table: string) {
  if (table === "blog_posts") void qc.invalidateQueries({ queryKey: ["blog_post"] });
  if (table === "portfolio") {
    void qc.invalidateQueries({ queryKey: ["case_study"] });
    void qc.invalidateQueries({ queryKey: ["case_studies_related"] });
  }
}
// Generic CRUD mutations for admin
export function useUpsertRow<T extends keyof Tables>(table: T) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Tables[T]["Insert"] | Tables[T]["Update"] & { id?: string }) => {
      const { data, error } = await supabase.from(table).upsert(row as any).select().maybeSingle();
      if (error) throw error;
      return data as any;
    },
    onSuccess: () => { invalidatePublicDetails(qc, table); return qc.invalidateQueries({ queryKey: [table] }); },
  });
}

// Update an existing row by id (partial update, no NOT NULL issues)
export function useUpdateRow<T extends keyof Tables>(table: T) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, any>) => {
      const { error } = await supabase.from(table).update(updates as any).eq("id" as any, id);
      if (error) throw error;
    },
    // Optimistic patch — reflect instantly, roll back if the server rejects.
    onMutate: async ({ id, ...updates }: any) => {
      await qc.cancelQueries({ queryKey: [table] });
      const snapshots = qc.getQueriesData({ queryKey: [table] });
      qc.setQueriesData({ queryKey: [table] }, (old: any) => {
        if (Array.isArray(old)) return old.map((r: any) => r?.id === id ? { ...r, ...updates } : r);
        if (old && typeof old === "object" && old.id === id) return { ...old, ...updates };
        return old;
      });
      return { snapshots };
    },
    onError: (err: any, vars, ctx) => {
      // Restore cache, then queue the write so the change isn't lost.
      ctx?.snapshots?.forEach(([key, data]: any) => qc.setQueryData(key, data));
      const { id, ...patch } = vars as any;
      enqueue({ kind: "update", table: table as string, rowId: id, patch });
    },
    onSettled: () => { invalidatePublicDetails(qc, table); return qc.invalidateQueries({ queryKey: [table] }); },
  });
}

export function useUpsertGenericRow(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: any) => {
      const { error } = await supabase.from(table as any).upsert(row);
      if (error) throw error;
    },
    onError: (_e, row: any) => {
      enqueue({ kind: "upsert", table, row });
    },
    onSettled: () => { invalidatePublicDetails(qc, table); return qc.invalidateQueries({ queryKey: [table] }); },
  });
}

export function useDeleteRow<T extends keyof Tables>(table: T) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id" as any, id);
      if (error) throw error;
    },
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: [table] });
      const snapshots = qc.getQueriesData({ queryKey: [table] });
      qc.setQueriesData({ queryKey: [table] }, (old: any) =>
        Array.isArray(old) ? old.filter((r: any) => r?.id !== id) : old
      );
      return { snapshots };
    },
    onError: (_e, id, ctx) => {
      ctx?.snapshots?.forEach(([key, data]: any) => qc.setQueryData(key, data));
      enqueue({ kind: "delete", table: table as string, rowId: id });
    },
    onSettled: () => { invalidatePublicDetails(qc, table); return qc.invalidateQueries({ queryKey: [table] }); },
  });
}

export function useDeleteGenericRow(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table as any).delete().eq("id", id);
      if (error) throw error;
    },
    onError: (_e, id: string) => enqueue({ kind: "delete", table, rowId: id }),
    onSettled: () => { invalidatePublicDetails(qc, table); return qc.invalidateQueries({ queryKey: [table] }); },
  });
}

export function useUpdateSiteSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: any) => {
      const { data: existing, error: findError } = await supabase
        .from("site_settings")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (findError) throw findError;

      if (existing?.id) {
        const { error } = await supabase.from("site_settings").update(settings).eq("id", existing.id);
        if (error) throw error;
        return;
      }

      const { error: insertError } = await supabase.from("site_settings").insert({
        site_name: settings?.site_name || "Tech Handlers",
        ...settings,
      });

      if (insertError) throw insertError;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site_settings"] }),
  });
}
