import { useState, useCallback, useEffect, useRef } from "react";
import { useEditingDraft } from "@/hooks/useEditingDraft";
import { usePersistentState } from "@/hooks/usePersistentState";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Eye, EyeOff, Upload, Search, Globe, Image, Code2, X } from "lucide-react";
import { useAdminBlogPosts, useUpsertRow, useDeleteRow } from "@/hooks/useData";
import { supabase } from "@/integrations/supabase/client";
import EditorToolbar from "@/components/admin/EditorToolbar";
import { countWords, readingTime } from "@/lib/seo/schema";

const SCHEMA_TYPES = ["BlogPosting", "Article", "NewsArticle", "TechArticle", "Report"];

const BLOG_DRAFT_KEY = "crm_draft_blog_post";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function BlogPosts() {
  const { data: posts, isLoading } = useAdminBlogPosts();
  const upsert = useUpsertRow("blog_posts");
  const remove = useDeleteRow("blog_posts");
  const [editing, setEditing] = useEditingDraft<any>("blog_posts");
  const [showForm, setShowForm] = usePersistentState<boolean>("crm_show_form_blog_posts", false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasDraft, setHasDraft] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [customSchemaText, setCustomSchemaText] = useState("");
  const [customSchemaError, setCustomSchemaError] = useState("");

  const blank = {
    title: "", slug: "", excerpt: "", content: "",
    author_name: "Tech Handlers Team", category: "",
    is_published: false, meta_title: "", meta_description: "",
    featured_image_url: "", tags: [] as string[],
    focus_keyword: "", secondary_keywords: [] as string[],
    canonical_url: "", noindex: false, schema_type: "BlogPosting",
    faq_schema: [] as { question: string; answer: string }[],
    how_to_schema: [] as { question: string; answer: string }[],
    custom_schema: null as any, og_image_url: "", image_alt: "",
  };
  const [tagInput, setTagInput] = useState("");

  // Check for saved draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(BLOG_DRAFT_KEY);
      if (saved) setHasDraft(true);
    } catch {}
  }, []);

  // Auto-save editing state to localStorage
  useEffect(() => {
    if (editing && showForm) {
      try {
        localStorage.setItem(BLOG_DRAFT_KEY, JSON.stringify(editing));
      } catch {}
    }
  }, [editing, showForm]);

  const clearBlogDraft = () => {
    try { localStorage.removeItem(BLOG_DRAFT_KEY); } catch {}
    setHasDraft(false);
  };

  const restoreDraft = () => {
    try {
      const saved = localStorage.getItem(BLOG_DRAFT_KEY);
      if (saved) {
        setEditing(JSON.parse(saved));
        setShowForm(true);
        setHasDraft(false);
      }
    } catch {}
  };

  const openNew = () => { setEditing(blank); setTagInput(""); setCustomSchemaText(""); setShowForm(true); };
  const openEdit = (p: any) => {
    setEditing({ ...blank, ...p });
    setTagInput("");
    setCustomSchemaText(p.custom_schema ? JSON.stringify(p.custom_schema, null, 2) : "");
    setShowForm(true);
  };
  const close = () => { setEditing(null); setShowForm(false); clearBlogDraft(); };

  const handleTitleChange = (title: string) => {
    const updates: any = { ...editing, title };
    if (!editing.id) updates.slug = slugify(title);
    if (!editing.meta_title) updates.meta_title = title;
    setEditing(updates);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !editing.tags?.includes(tag)) {
      setEditing({ ...editing, tags: [...(editing.tags || []), tag] });
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setEditing({ ...editing, tags: editing.tags?.filter((t: string) => t !== tag) });
  };

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !editing.secondary_keywords?.includes(kw)) {
      setEditing({ ...editing, secondary_keywords: [...(editing.secondary_keywords || []), kw] });
    }
    setKeywordInput("");
  };

  const updateSchemaList = (field: "faq_schema" | "how_to_schema", index: number, key: "question" | "answer", val: string) => {
    const list = [...(editing[field] || [])];
    list[index] = { ...list[index], [key]: val };
    setEditing({ ...editing, [field]: list });
  };

  const addSchemaItem = (field: "faq_schema" | "how_to_schema") =>
    setEditing({ ...editing, [field]: [...(editing[field] || []), { question: "", answer: "" }] });

  const removeSchemaItem = (field: "faq_schema" | "how_to_schema", index: number) =>
    setEditing({ ...editing, [field]: (editing[field] || []).filter((_: any, i: number) => i !== index) });

  const applyCustomSchema = (text: string) => {
    setCustomSchemaText(text);
    if (!text.trim()) { setCustomSchemaError(""); setEditing((prev: any) => ({ ...prev, custom_schema: null })); return; }
    try {
      const parsed = JSON.parse(text);
      setCustomSchemaError("");
      setEditing((prev: any) => ({ ...prev, custom_schema: parsed }));
    } catch (e: any) {
      setCustomSchemaError(e.message || "Invalid JSON");
    }
  };

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB");

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `blog/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
    setEditing((prev: any) => ({ ...prev, featured_image_url: urlData.publicUrl }));
    setUploading(false);
    toast.success("Image uploaded");
  }, []);

  const save = async () => {
    if (!editing.title || !editing.slug) return toast.error("Title and slug are required");
    if (!editing.excerpt) return toast.error("Excerpt is required for SEO");
    if (customSchemaError) return toast.error("Fix the custom schema JSON before saving");
    const payload = { ...editing };
    if (!payload.meta_title) payload.meta_title = payload.title;
    if (!payload.meta_description) payload.meta_description = payload.excerpt;
    payload.faq_schema = (payload.faq_schema || []).filter((f: any) => f.question?.trim() && f.answer?.trim());
    payload.how_to_schema = (payload.how_to_schema || []).filter((s: any) => s.question?.trim());
    payload.reading_time_minutes = readingTime(payload.content || "");
    if (payload.is_published && !payload.published_at) payload.published_at = new Date().toISOString();
    await upsert.mutateAsync(payload);
    toast.success("Blog post saved");
    clearBlogDraft();
    close();
  };

  const filteredPosts = posts?.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded-xl" />;

  const seoScore = editing ? [
    editing.meta_title?.length > 10,
    editing.meta_description?.length > 50,
    editing.excerpt?.length > 30,
    editing.slug?.length > 3,
    editing.featured_image_url,
    editing.tags?.length > 0,
    editing.content?.length > 200,
  ].filter(Boolean).length : 0;

  const plain = (editing?.content || "").replace(/<[^>]*>/g, " ").toLowerCase();
  const kw = (editing?.focus_keyword || "").trim().toLowerCase();
  const kwCount = kw ? (plain.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length : 0;
  const words = countWords(editing?.content || "");
  const density = words ? ((kwCount * kw.split(" ").length) / words) * 100 : 0;
  const kwChecks = editing ? [
    { ok: !!kw, label: "Focus keyword set" },
    { ok: !!kw && (editing.meta_title || editing.title || "").toLowerCase().includes(kw), label: "Keyword in title" },
    { ok: !!kw && (editing.meta_description || "").toLowerCase().includes(kw), label: "Keyword in meta description" },
    { ok: !!kw && (editing.slug || "").toLowerCase().includes(kw.replace(/\s+/g, "-")), label: "Keyword in slug" },
    { ok: !!kw && plain.slice(0, 600).includes(kw), label: "Keyword in opening paragraph" },
    { ok: /<h2[\s>]/i.test(editing.content || ""), label: "Content uses H2 subheadings" },
    { ok: words >= 600, label: `Article is 600+ words (${words})` },
    { ok: !!editing.image_alt, label: "Featured image alt text set" },
    { ok: (editing.faq_schema || []).length > 0, label: "FAQ schema added (rich results)" },
  ] : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-lead">Blog Posts</h1>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search posts…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 w-52" />
          </div>
          <Button onClick={openNew} className="gradient-primary-accent text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" /> New Post
          </Button>
        </div>
      </div>

      {hasDraft && !showForm && (
        <div className="text-sm bg-muted/50 rounded-lg px-4 py-3 mb-4 flex items-center justify-between border border-border">
          <span>📝 You have an unsaved blog post draft</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={clearBlogDraft}>Discard</Button>
            <Button size="sm" className="h-7 text-xs" onClick={restoreDraft}>Resume Editing</Button>
          </div>
        </div>
      )}

      {showForm && editing && (
        <div className="bg-surface-white rounded-xl border border-border p-6 mb-6">
          <Tabs defaultValue="content">
            <TabsList className="mb-4">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="seo">SEO & Meta</TabsTrigger>
              <TabsTrigger value="schema">Schema Markup</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Title *</Label>
                  <Input value={editing.title} onChange={e => handleTitleChange(e.target.value)} className="mt-1" placeholder="Your blog post title" />
                </div>
                <div>
                  <Label>Slug *</Label>
                  <Input value={editing.slug} onChange={e => setEditing({ ...editing, slug: e.target.value })} className="mt-1" placeholder="url-friendly-slug" />
                </div>
                <div>
                  <Label>Author</Label>
                  <Input value={editing.author_name || ""} onChange={e => setEditing({ ...editing, author_name: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input value={editing.category || ""} onChange={e => setEditing({ ...editing, category: e.target.value })} className="mt-1" placeholder="e.g. Digital Marketing" />
                </div>
              </div>

              <div>
                <Label>Featured Image</Label>
                <div className="mt-1 flex items-center gap-3">
                  {editing.featured_image_url && (
                    <img src={editing.featured_image_url} alt="Featured" className="h-20 w-32 object-cover rounded-lg border" />
                  )}
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                    <Upload className="h-4 w-4" />
                    {uploading ? "Uploading…" : "Upload Image"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                  {editing.featured_image_url && (
                    <Input value={editing.featured_image_url} onChange={e => setEditing({ ...editing, featured_image_url: e.target.value })} className="flex-1" placeholder="Or paste URL" />
                  )}
                </div>
              </div>

              <div>
                <Label>Excerpt * <span className="text-muted-foreground text-xs">(shown in blog listing & SEO)</span></Label>
                <Textarea value={editing.excerpt || ""} onChange={e => setEditing({ ...editing, excerpt: e.target.value })} rows={2} className="mt-1" placeholder="A compelling 1-2 sentence summary…" />
                <p className="text-xs text-muted-foreground mt-1">{(editing.excerpt || "").length}/160 chars</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Content * <span className="text-muted-foreground text-xs">(supports HTML)</span></Label>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 border border-dashed rounded-lg text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                    <Image className="h-3.5 w-3.5" />
                    Insert Image
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB");
                      const ext = file.name.split(".").pop();
                      const path = `blog/${Date.now()}-inline.${ext}`;
                      const { error } = await supabase.storage.from("media").upload(path, file);
                      if (error) return toast.error("Upload failed");
                      const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
                      const imgTag = `\n<img src="${urlData.publicUrl}" alt="${file.name}" style="max-width:100%;border-radius:8px;margin:16px 0" />\n`;
                      setEditing((prev: any) => ({ ...prev, content: (prev.content || "") + imgTag }));
                      toast.success("Image inserted into content");
                      e.target.value = "";
                    }} />
                  </label>
                </div>
                <EditorToolbar
                  textareaRef={contentRef}
                  value={editing.content || ""}
                  onChange={(next) => setEditing({ ...editing, content: next })}
                />
                <Textarea ref={contentRef} value={editing.content || ""} onChange={e => setEditing({ ...editing, content: e.target.value })} rows={14} className="mt-1 font-mono text-sm" placeholder="Write your blog post content here. HTML tags are supported." />
                <p className="text-xs text-muted-foreground mt-1">
                  {words} words · ~{readingTime(editing.content || "")} min read
                </p>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="Add tag & press Enter" className="flex-1" />
                  <Button type="button" variant="outline" size="sm" onClick={addTag}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {editing.tags?.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input type="checkbox" checked={editing.is_published} onChange={e => setEditing({ ...editing, is_published: e.target.checked })} />
                <span className="text-sm font-medium">Publish immediately</span>
              </label>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-5 w-5 text-primary" />
                <span className="font-semibold">SEO Score: {seoScore}/7</span>
                <div className="flex gap-1 ml-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className={`h-2 w-6 rounded-full ${i < seoScore ? "bg-green-500" : "bg-muted"}`} />
                  ))}
                </div>
              </div>

              <div>
                <Label>Meta Title <span className="text-muted-foreground text-xs">(recommended 50-60 chars)</span></Label>
                <Input value={editing.meta_title || ""} onChange={e => setEditing({ ...editing, meta_title: e.target.value })} className="mt-1" placeholder={editing.title || "SEO title"} />
                <p className="text-xs text-muted-foreground mt-1">{(editing.meta_title || "").length}/60 chars</p>
              </div>

              <div>
                <Label>Meta Description <span className="text-muted-foreground text-xs">(recommended 120-160 chars)</span></Label>
                <Textarea value={editing.meta_description || ""} onChange={e => setEditing({ ...editing, meta_description: e.target.value })} rows={3} className="mt-1" placeholder={editing.excerpt || "SEO description"} />
                <p className="text-xs text-muted-foreground mt-1">{(editing.meta_description || "").length}/160 chars</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Focus Keyword</Label>
                  <Input value={editing.focus_keyword || ""} onChange={e => setEditing({ ...editing, focus_keyword: e.target.value })} className="mt-1" placeholder="e.g. seo services gurgaon" />
                  {kw && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Used {kwCount}× · density {density.toFixed(1)}%{density > 3 ? " (too high)" : density < 0.5 ? " (too low)" : " (good)"}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Featured Image Alt Text</Label>
                  <Input value={editing.image_alt || ""} onChange={e => setEditing({ ...editing, image_alt: e.target.value })} className="mt-1" placeholder="Describe the image for search & screen readers" />
                </div>
                <div>
                  <Label>Canonical URL <span className="text-muted-foreground text-xs">(leave blank for default)</span></Label>
                  <Input value={editing.canonical_url || ""} onChange={e => setEditing({ ...editing, canonical_url: e.target.value })} className="mt-1" placeholder={`https://techhandlers.in/blog/${editing.slug || "slug"}`} />
                </div>
                <div>
                  <Label>Social Share Image URL <span className="text-muted-foreground text-xs">(1200×630)</span></Label>
                  <Input value={editing.og_image_url || ""} onChange={e => setEditing({ ...editing, og_image_url: e.target.value })} className="mt-1" placeholder="Defaults to featured image" />
                </div>
              </div>

              <div>
                <Label>Secondary Keywords</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={keywordInput} onChange={e => setKeywordInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addKeyword())} placeholder="Add keyword & press Enter" className="flex-1" />
                  <Button type="button" variant="outline" size="sm" onClick={addKeyword}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(editing.secondary_keywords || []).map((k: string) => (
                    <Badge key={k} variant="secondary" className="cursor-pointer" onClick={() => setEditing({ ...editing, secondary_keywords: editing.secondary_keywords.filter((x: string) => x !== k) })}>
                      {k} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!editing.noindex} onChange={e => setEditing({ ...editing, noindex: e.target.checked })} />
                <span className="text-sm font-medium">Hide this post from search engines (noindex)</span>
              </label>

              <div className="bg-muted/50 rounded-lg p-4 border">
                <p className="text-xs text-muted-foreground mb-1">Google Search Preview</p>
                <p className="text-blue-600 text-lg font-medium truncate">{editing.meta_title || editing.title || "Blog Post Title"}</p>
                <p className="text-green-700 text-sm truncate">techhandlers.in/blog/{editing.slug || "post-slug"}</p>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{editing.meta_description || editing.excerpt || "Post description will appear here…"}</p>
              </div>

              <div className="text-sm space-y-1">
                <p className="font-medium">SEO Checklist:</p>
                <p className={editing.meta_title?.length >= 10 ? "text-green-600" : "text-muted-foreground"}>
                  {editing.meta_title?.length >= 10 ? "✓" : "○"} Meta title is set ({editing.meta_title?.length || 0} chars)
                </p>
                <p className={editing.meta_description?.length >= 50 ? "text-green-600" : "text-muted-foreground"}>
                  {editing.meta_description?.length >= 50 ? "✓" : "○"} Meta description is 50+ chars ({editing.meta_description?.length || 0} chars)
                </p>
                <p className={editing.excerpt?.length >= 30 ? "text-green-600" : "text-muted-foreground"}>
                  {editing.excerpt?.length >= 30 ? "✓" : "○"} Excerpt is set
                </p>
                <p className={editing.featured_image_url ? "text-green-600" : "text-muted-foreground"}>
                  {editing.featured_image_url ? "✓" : "○"} Featured image added
                </p>
                <p className={editing.tags?.length > 0 ? "text-green-600" : "text-muted-foreground"}>
                  {editing.tags?.length > 0 ? "✓" : "○"} Tags added
                </p>
                <p className={editing.content?.length >= 200 ? "text-green-600" : "text-muted-foreground"}>
                  {editing.content?.length >= 200 ? "✓" : "○"} Content is 200+ chars ({editing.content?.length || 0} chars)
                </p>
              </div>

              <div className="text-sm space-y-1 pt-2 border-t">
                <p className="font-medium">Keyword & Rich Result Analysis:</p>
                {kwChecks.map(c => (
                  <p key={c.label} className={c.ok ? "text-green-600" : "text-muted-foreground"}>
                    {c.ok ? "✓" : "○"} {c.label}
                  </p>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="schema" className="space-y-6">
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-primary" />
                <span className="font-semibold">Structured Data (JSON-LD)</span>
              </div>

              <div className="sm:max-w-xs">
                <Label>Article Schema Type</Label>
                <select
                  value={editing.schema_type || "BlogPosting"}
                  onChange={e => setEditing({ ...editing, schema_type: e.target.value })}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {SCHEMA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <p className="text-xs text-muted-foreground mt-1">Article, breadcrumb and publisher schema are generated automatically.</p>
              </div>

              {(["faq_schema", "how_to_schema"] as const).map(field => (
                <div key={field}>
                  <div className="flex items-center justify-between mb-2">
                    <Label>{field === "faq_schema" ? "FAQ Schema (FAQ rich results)" : "How-To Schema (step-by-step rich results)"}</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => addSchemaItem(field)}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add {field === "faq_schema" ? "question" : "step"}
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {(editing[field] || []).map((item: any, i: number) => (
                      <div key={i} className="rounded-lg border border-border p-3 space-y-2 bg-muted/30">
                        <div className="flex gap-2">
                          <Input
                            value={item.question || ""}
                            onChange={e => updateSchemaList(field, i, "question", e.target.value)}
                            placeholder={field === "faq_schema" ? "Question" : "Step title"}
                          />
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeSchemaItem(field, i)} aria-label="Remove entry">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Textarea
                          value={item.answer || ""}
                          onChange={e => updateSchemaList(field, i, "answer", e.target.value)}
                          rows={2}
                          placeholder={field === "faq_schema" ? "Answer" : "Step description"}
                        />
                      </div>
                    ))}
                    {!(editing[field] || []).length && (
                      <p className="text-xs text-muted-foreground">None added yet.</p>
                    )}
                  </div>
                </div>
              ))}

              <div>
                <Label>Custom JSON-LD <span className="text-muted-foreground text-xs">(advanced — any schema.org type)</span></Label>
                <Textarea
                  value={customSchemaText}
                  onChange={e => applyCustomSchema(e.target.value)}
                  rows={8}
                  className="mt-1 font-mono text-xs"
                  placeholder='{"@context":"https://schema.org","@type":"Course","name":"…"}'
                />
                {customSchemaError
                  ? <p className="text-xs text-destructive mt-1">Invalid JSON: {customSchemaError}</p>
                  : customSchemaText.trim() && <p className="text-xs text-green-600 mt-1">✓ Valid JSON-LD</p>}
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="bg-background rounded-lg p-6 border max-w-2xl mx-auto">
                {editing.featured_image_url && (
                  <img src={editing.featured_image_url} alt={editing.title} className="w-full h-48 object-cover rounded-lg mb-4" />
                )}
                {editing.category && <Badge variant="secondary" className="mb-2">{editing.category}</Badge>}
                <h1 className="text-2xl font-bold mb-2">{editing.title || "Untitled Post"}</h1>
                <p className="text-sm text-muted-foreground mb-4">By {editing.author_name || "Author"}</p>
                <p className="text-muted-foreground italic mb-4">{editing.excerpt}</p>
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: editing.content || "<p>No content yet…</p>" }} />
                {editing.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-4 pt-4 border-t">
                    {editing.tags.map((t: string) => <Badge key={t} variant="outline">{t}</Badge>)}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 mt-4 pt-4 border-t">
            <Button onClick={save} disabled={upsert.isPending}>{upsert.isPending ? "Saving…" : "Save Post"}</Button>
            <Button variant="outline" onClick={close}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="bg-surface-white rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Post</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPosts?.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {p.featured_image_url && <img src={p.featured_image_url} alt="" className="h-10 w-16 object-cover rounded" />}
                    <div>
                      <p className="font-medium">{p.title}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-xs">{p.excerpt || "No excerpt"}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{p.category || "—"}</TableCell>
                <TableCell>
                  {p.is_published
                    ? <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold"><Eye className="h-3 w-3" />Published</span>
                    : <span className="inline-flex items-center gap-1 text-muted-foreground text-xs"><EyeOff className="h-3 w-3" />Draft</span>}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this post?")) remove.mutateAsync(p.id).then(() => toast.success("Deleted")); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!filteredPosts?.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {searchQuery ? "No matching posts" : "No blog posts yet — create your first one!"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
