import { useCallback, useState } from "react";
import { useEditingDraft } from "@/hooks/useEditingDraft";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Plus, Pencil, Trash2, Upload, Image as ImageIcon, Star, ExternalLink,
  GripVertical, ArrowUp, ArrowDown, Type, Heading2, Quote, BarChart3, Images,
} from "lucide-react";
import { useAdminPortfolio, useUpsertRow, useDeleteRow } from "@/hooks/useData";
import { supabase } from "@/integrations/supabase/client";

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

type Block =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "image"; url: string; caption?: string }
  | { type: "quote"; text: string; author?: string }
  | { type: "stat"; value: string; label: string };

const BLOCK_TYPES: { value: Block["type"]; label: string; icon: any }[] = [
  { value: "heading", label: "Heading", icon: Heading2 },
  { value: "paragraph", label: "Paragraph", icon: Type },
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "quote", label: "Pull quote", icon: Quote },
  { value: "stat", label: "Stat", icon: BarChart3 },
];

const blank = {
  title: "", slug: "", client_name: "", category: "", industry: "", duration: "",
  short_description: "", full_description: "", hero_image_url: "", image_url: "",
  meta_title: "", meta_description: "",
  is_active: true, is_featured: false, sort_order: 0,
  results: [] as { value: string; label: string; period?: string }[],
  gallery: [] as { url: string; caption?: string }[],
  body_blocks: [] as Block[],
  technologies: [] as string[],
  testimonial_quote: "",
};

async function uploadMedia(file: File, folder: string): Promise<string | null> {
  if (file.size > 8 * 1024 * 1024) { toast.error("Image must be under 8MB"); return null; }
  const ext = file.name.split(".").pop();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file);
  if (error) { toast.error(error.message); return null; }
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

export default function CaseStudies() {
  const { data: items, isLoading } = useAdminPortfolio();
  const upsert = useUpsertRow("portfolio");
  const remove = useDeleteRow("portfolio");
  const [editing, setEditing] = useEditingDraft<any>("case_studies");
  const [showForm, setShowForm] = usePersistentState<boolean>("crm_show_form_case_studies", false);
  const [techInput, setTechInput] = useState("");

  const openNew = () => { setEditing({ ...blank }); setShowForm(true); };
  const openEdit = (s: any) => {
    setEditing({
      ...blank, ...s,
      results: Array.isArray(s.results) ? s.results : [],
      gallery: Array.isArray(s.gallery) ? s.gallery : [],
      body_blocks: Array.isArray(s.body_blocks) ? s.body_blocks : [],
      technologies: Array.isArray(s.technologies) ? s.technologies : [],
    });
    setShowForm(true);
  };
  const close = () => { setEditing(null); setShowForm(false); setTechInput(""); };

  const save = async () => {
    if (!editing.title || !editing.slug) return toast.error("Title and slug are required");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(editing.slug) || editing.slug.length > 180) return toast.error("Use a short lowercase slug with words separated by hyphens");
    const payload = { ...editing };
    if (!payload.meta_title) payload.meta_title = payload.title;
    if (!payload.meta_description) payload.meta_description = payload.short_description || "";
    if (payload.is_active && !payload.published_at) payload.published_at = new Date().toISOString();
    await upsert.mutateAsync(payload);
    toast.success("Case study saved. Public pages refresh within 30 seconds.");
    close();
  };

  const onHero = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadMedia(file, "case-studies/hero");
    if (url) setEditing((p: any) => ({ ...p, hero_image_url: url, image_url: p.image_url || url }));
  }, []);

  const addGalleryImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const url = await uploadMedia(file, "case-studies/gallery");
      if (url) setEditing((p: any) => ({ ...p, gallery: [...p.gallery, { url, caption: "" }] }));
    }
    e.target.value = "";
  };

  const addBlock = (type: Block["type"]) => {
    const block: Block =
      type === "heading" ? { type, text: "" } :
      type === "paragraph" ? { type, text: "" } :
      type === "image" ? { type, url: "", caption: "" } :
      type === "quote" ? { type, text: "", author: "" } :
      { type, value: "", label: "" };
    setEditing((p: any) => ({ ...p, body_blocks: [...p.body_blocks, block] }));
  };

  const updateBlock = (i: number, patch: Partial<Block>) =>
    setEditing((p: any) => ({
      ...p,
      body_blocks: p.body_blocks.map((b: Block, idx: number) => idx === i ? { ...b, ...patch } as Block : b),
    }));

  const moveBlock = (i: number, dir: -1 | 1) =>
    setEditing((p: any) => {
      const arr = [...p.body_blocks];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return p;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...p, body_blocks: arr };
    });

  const removeBlock = (i: number) =>
    setEditing((p: any) => ({ ...p, body_blocks: p.body_blocks.filter((_: any, idx: number) => idx !== i) }));

  const onBlockImage = async (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadMedia(file, "case-studies/body");
    if (url) updateBlock(i, { url } as any);
  };

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded-xl" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-lead">Case Studies</h1>
          <p className="text-sm text-muted-foreground">Build rich, graphical case studies that appear on your site</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> New Case Study</Button>
      </div>

      {showForm && editing && (
        <div className="bg-surface-white rounded-xl border border-border p-6 mb-6 space-y-6">
          {/* Hero */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-lead uppercase tracking-wide">Hero</h2>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm"><Switch checked={editing.is_featured} onCheckedChange={(v) => setEditing({ ...editing, is_featured: v })} />Featured</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />Published</label>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Title *</Label>
                <Input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value, slug: editing.slug || slugify(e.target.value) })} className="mt-1" />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input value={editing.slug} onChange={e => setEditing({ ...editing, slug: slugify(e.target.value) })} className="mt-1" />
              </div>
              <div><Label>Client name</Label><Input value={editing.client_name || ""} onChange={e => setEditing({ ...editing, client_name: e.target.value })} className="mt-1" /></div>
              <div><Label>Category</Label><Input value={editing.category || ""} onChange={e => setEditing({ ...editing, category: e.target.value })} className="mt-1" placeholder="e.g. SEO Growth" /></div>
              <div><Label>Industry</Label><Input value={editing.industry || ""} onChange={e => setEditing({ ...editing, industry: e.target.value })} className="mt-1" placeholder="e.g. SaaS" /></div>
              <div><Label>Project duration</Label><Input value={editing.duration || ""} onChange={e => setEditing({ ...editing, duration: e.target.value })} className="mt-1" placeholder="e.g. 6 months" /></div>
            </div>
            <div className="mt-4">
              <Label>Short description (used on cards & meta)</Label>
              <Textarea value={editing.short_description || ""} onChange={e => setEditing({ ...editing, short_description: e.target.value })} rows={2} className="mt-1" />
            </div>
            <div className="mt-4">
              <Label>Hero image</Label>
              <div className="flex items-center gap-3 mt-1">
                <Button asChild variant="outline" size="sm">
                  <label className="cursor-pointer"><Upload className="h-4 w-4 mr-2" /> Upload<input type="file" accept="image/*" onChange={onHero} className="hidden" /></label>
                </Button>
                <Input value={editing.hero_image_url || ""} onChange={e => setEditing({ ...editing, hero_image_url: e.target.value })} placeholder="or paste URL" />
              </div>
              {editing.hero_image_url && (
                <img src={editing.hero_image_url} alt="Hero preview" className="mt-3 max-h-48 rounded-lg border border-border object-cover" />
              )}
            </div>
          </section>

          {/* Results / KPIs */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-lead uppercase tracking-wide">Headline results</h2>
              <Button size="sm" variant="outline" onClick={() => setEditing({ ...editing, results: [...editing.results, { value: "", label: "", period: "" }] })}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add result
              </Button>
            </div>
            <div className="space-y-2">
              {editing.results.map((r: any, i: number) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                  <Input placeholder="+85%" value={r.value} onChange={e => {
                    const arr = [...editing.results]; arr[i] = { ...r, value: e.target.value }; setEditing({ ...editing, results: arr });
                  }} />
                  <Input placeholder="Organic Traffic" value={r.label} onChange={e => {
                    const arr = [...editing.results]; arr[i] = { ...r, label: e.target.value }; setEditing({ ...editing, results: arr });
                  }} />
                  <Input placeholder="4 months" value={r.period || ""} onChange={e => {
                    const arr = [...editing.results]; arr[i] = { ...r, period: e.target.value }; setEditing({ ...editing, results: arr });
                  }} />
                  <Button size="icon" variant="ghost" onClick={() => setEditing({ ...editing, results: editing.results.filter((_: any, idx: number) => idx !== i) })}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {!editing.results.length && <p className="text-xs text-muted-foreground">No results yet — add headline KPIs</p>}
            </div>
          </section>

          {/* Body blocks */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-lead uppercase tracking-wide">Story content</h2>
              <div className="flex flex-wrap gap-1">
                {BLOCK_TYPES.map(bt => (
                  <Button key={bt.value} size="sm" variant="outline" onClick={() => addBlock(bt.value)}>
                    <bt.icon className="h-3.5 w-3.5 mr-1" /> {bt.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {editing.body_blocks.map((b: Block, i: number) => (
                <div key={i} className="border border-border rounded-lg p-3 bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-[10px] uppercase">{b.type}</Badge>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => moveBlock(i, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => moveBlock(i, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => removeBlock(i)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </div>
                  {b.type === "heading" && (
                    <Input value={b.text} onChange={e => updateBlock(i, { text: e.target.value })} placeholder="Section heading" className="text-lg font-semibold" />
                  )}
                  {b.type === "paragraph" && (
                    <Textarea value={b.text} onChange={e => updateBlock(i, { text: e.target.value })} rows={4} placeholder="Tell the story…" />
                  )}
                  {b.type === "quote" && (
                    <div className="space-y-2">
                      <Textarea value={b.text} onChange={e => updateBlock(i, { text: e.target.value })} rows={2} placeholder="Quote text" />
                      <Input value={b.author || ""} onChange={e => updateBlock(i, { author: e.target.value })} placeholder="— Attribution" />
                    </div>
                  )}
                  {b.type === "image" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                          <label className="cursor-pointer"><Upload className="h-3.5 w-3.5 mr-1" /> Upload<input type="file" accept="image/*" onChange={(e) => onBlockImage(i, e)} className="hidden" /></label>
                        </Button>
                        <Input value={b.url} onChange={e => updateBlock(i, { url: e.target.value })} placeholder="Image URL" />
                      </div>
                      <Input value={b.caption || ""} onChange={e => updateBlock(i, { caption: e.target.value })} placeholder="Caption (optional)" />
                      {b.url && <img src={b.url} alt={b.caption || ""} className="max-h-48 rounded-md border border-border" />}
                    </div>
                  )}
                  {b.type === "stat" && (
                    <div className="grid grid-cols-2 gap-2">
                      <Input value={b.value} onChange={e => updateBlock(i, { value: e.target.value })} placeholder="3.2x" className="text-lg font-bold" />
                      <Input value={b.label} onChange={e => updateBlock(i, { label: e.target.value })} placeholder="ROAS achieved" />
                    </div>
                  )}
                </div>
              ))}
              {!editing.body_blocks.length && (
                <div className="text-center py-8 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground">
                  Add headings, paragraphs, images, quotes & stats to craft your story
                </div>
              )}
            </div>
          </section>

          {/* Gallery */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-lead uppercase tracking-wide flex items-center gap-2"><Images className="h-4 w-4" /> Gallery</h2>
              <Button asChild variant="outline" size="sm">
                <label className="cursor-pointer"><Upload className="h-3.5 w-3.5 mr-1" /> Add images<input type="file" accept="image/*" multiple onChange={addGalleryImage} className="hidden" /></label>
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {editing.gallery.map((g: any, i: number) => (
                <div key={i} className="relative group">
                  <img src={g.url} alt={g.caption || ""} className="w-full h-32 object-cover rounded-md border border-border" />
                  <Input
                    value={g.caption || ""}
                    onChange={e => {
                      const arr = [...editing.gallery]; arr[i] = { ...g, caption: e.target.value }; setEditing({ ...editing, gallery: arr });
                    }}
                    placeholder="Caption"
                    className="mt-1 h-7 text-xs"
                  />
                  <Button size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setEditing({ ...editing, gallery: editing.gallery.filter((_: any, idx: number) => idx !== i) })}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </section>

          {/* Technologies & testimonial */}
          <section className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Technologies / platforms used</Label>
              <div className="flex gap-2 mt-1">
                <Input value={techInput} onChange={e => setTechInput(e.target.value)} placeholder="Add tag and press Enter"
                  onKeyDown={e => {
                    if (e.key === "Enter" && techInput.trim()) {
                      e.preventDefault();
                      setEditing({ ...editing, technologies: [...editing.technologies, techInput.trim()] });
                      setTechInput("");
                    }
                  }} />
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {editing.technologies.map((t: string, i: number) => (
                  <Badge key={i} variant="secondary" className="cursor-pointer"
                    onClick={() => setEditing({ ...editing, technologies: editing.technologies.filter((_: any, idx: number) => idx !== i) })}>
                    {t} ×
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label>Client testimonial (optional)</Label>
              <Textarea value={editing.testimonial_quote || ""} onChange={e => setEditing({ ...editing, testimonial_quote: e.target.value })} rows={3} className="mt-1" placeholder="What did the client say?" />
            </div>
          </section>

          {/* SEO */}
          <section>
            <h2 className="text-sm font-semibold text-lead uppercase tracking-wide mb-3">SEO</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Meta title <span className="text-xs text-muted-foreground">({(editing.meta_title || editing.title || "").length}/60)</span></Label>
                <Input value={editing.meta_title || ""} onChange={e => setEditing({ ...editing, meta_title: e.target.value })} placeholder="Defaults to title" className="mt-1" />
              </div>
              <div>
                <Label>Sort order</Label>
                <Input type="number" value={editing.sort_order} onChange={e => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })} className="mt-1" />
              </div>
              <div className="sm:col-span-2">
                <Label>Meta description <span className="text-xs text-muted-foreground">({(editing.meta_description || editing.short_description || "").length}/160)</span></Label>
                <Textarea value={editing.meta_description || ""} onChange={e => setEditing({ ...editing, meta_description: e.target.value })} rows={2} className="mt-1" placeholder="Defaults to short description" />
              </div>
            </div>
          </section>

          <div className="flex gap-2 pt-2 border-t border-border">
            <Button onClick={save} disabled={upsert.isPending}>{upsert.isPending ? "Saving…" : "Save case study"}</Button>
            <Button variant="outline" onClick={close}>Cancel</Button>
            {editing.slug && (
              <Button variant="ghost" asChild className="ml-auto">
                <Link to={`/case-studies/${editing.slug}`} target="_blank"><ExternalLink className="h-4 w-4 mr-1" /> Preview</Link>
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="bg-surface-white rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Title</TableHead><TableHead>Client</TableHead><TableHead>Category</TableHead>
            <TableHead>Status</TableHead><TableHead className="w-32">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {items?.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {p.is_featured && <Star className="h-3.5 w-3.5 text-accent fill-accent" />}
                    {p.title}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{p.client_name || "—"}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{p.category || "—"}</TableCell>
                <TableCell>{p.is_active ? <Badge className="bg-success/15 text-success border-0">Published</Badge> : <Badge variant="secondary">Draft</Badge>}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {p.is_active && (
                      <Button size="icon" variant="ghost" asChild>
                        <Link to={`/case-studies/${p.slug}`} target="_blank"><ExternalLink className="h-4 w-4" /></Link>
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this case study?")) remove.mutateAsync(p.id).then(() => toast.success("Deleted")); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!items?.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No case studies yet — click "New Case Study" to start</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}