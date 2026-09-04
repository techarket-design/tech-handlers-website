import { useEditingDraft } from "@/hooks/useEditingDraft";
import { usePersistentState } from "@/hooks/usePersistentState";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { useGenericTable, useUpsertGenericRow, useDeleteGenericRow } from "@/hooks/useData";

const blank = {
  slug: "",
  city: "",
  service: "",
  service_slug: "",
  h1: "",
  hero_subtitle: "",
  meta_title: "",
  meta_description: "",
  hero_image_url: "",
  intro: "",
  why_us: "",
  process: "",
  faqs: [] as Array<{ q: string; a: string }>,
  cta_heading: "",
  cta_description: "",
  is_published: true,
  sort_order: 0,
};

export default function AdminCityPages() {
  const { data: items, isLoading } = useGenericTable("city_pages", { orderBy: "sort_order" });
  const upsert = useUpsertGenericRow("city_pages");
  const remove = useDeleteGenericRow("city_pages");
  const [editing, setEditing] = useEditingDraft<any>("city_pages");
  const [showForm, setShowForm] = usePersistentState<boolean>("crm_show_form_city_pages", false);

  const openNew = () => { setEditing({ ...blank }); setShowForm(true); };
  const openEdit = (p: any) => { setEditing({ ...p, faqs: Array.isArray(p.faqs) ? p.faqs : [] }); setShowForm(true); };
  const close = () => { setEditing(null); setShowForm(false); };

  const save = async () => {
    if (!editing.slug || !editing.city || !editing.service || !editing.h1) {
      return toast.error("Slug, city, service and H1 are required");
    }
    await upsert.mutateAsync(editing);
    toast.success("City page saved");
    close();
  };

  const addFaq = () => setEditing({ ...editing, faqs: [...(editing.faqs || []), { q: "", a: "" }] });
  const updateFaq = (i: number, key: "q" | "a", val: string) => {
    const next = [...(editing.faqs || [])];
    next[i] = { ...next[i], [key]: val };
    setEditing({ ...editing, faqs: next });
  };
  const removeFaq = (i: number) => setEditing({ ...editing, faqs: (editing.faqs || []).filter((_: any, idx: number) => idx !== i) });

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded-xl" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-lead">City Landing Pages</h1>
          <p className="text-sm text-muted-foreground mt-1">SEO landing pages for city × service combinations (e.g. /locations/seo-services-gurgaon)</p>
        </div>
        <Button onClick={openNew} className="gradient-primary-accent text-primary-foreground"><Plus className="mr-2 h-4 w-4" /> Add City Page</Button>
      </div>

      {showForm && editing && (
        <div className="bg-surface-white rounded-xl border border-border p-6 mb-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Slug *</Label><Input value={editing.slug} onChange={e => setEditing({ ...editing, slug: e.target.value })} placeholder="seo-services-gurgaon" className="mt-1" /></div>
            <div><Label>Sort Order</Label><Input type="number" value={editing.sort_order} onChange={e => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })} className="mt-1" /></div>
            <div><Label>City *</Label><Input value={editing.city} onChange={e => setEditing({ ...editing, city: e.target.value })} placeholder="Gurgaon" className="mt-1" /></div>
            <div><Label>Service *</Label><Input value={editing.service} onChange={e => setEditing({ ...editing, service: e.target.value })} placeholder="SEO Services" className="mt-1" /></div>
            <div><Label>Service slug (for internal link)</Label><Input value={editing.service_slug || ""} onChange={e => setEditing({ ...editing, service_slug: e.target.value })} placeholder="seo" className="mt-1" /></div>
            <div><Label>Hero image URL</Label><Input value={editing.hero_image_url || ""} onChange={e => setEditing({ ...editing, hero_image_url: e.target.value })} className="mt-1" /></div>
          </div>
          <div><Label>H1 *</Label><Input value={editing.h1} onChange={e => setEditing({ ...editing, h1: e.target.value })} className="mt-1" /></div>
          <div><Label>Hero subtitle</Label><Textarea rows={2} value={editing.hero_subtitle || ""} onChange={e => setEditing({ ...editing, hero_subtitle: e.target.value })} className="mt-1" /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Meta title</Label><Input value={editing.meta_title || ""} onChange={e => setEditing({ ...editing, meta_title: e.target.value })} className="mt-1" /></div>
            <div><Label>Meta description</Label><Input value={editing.meta_description || ""} onChange={e => setEditing({ ...editing, meta_description: e.target.value })} className="mt-1" /></div>
          </div>
          <div><Label>Intro (supports **bold**, - bullets, 1. steps)</Label><Textarea rows={4} value={editing.intro || ""} onChange={e => setEditing({ ...editing, intro: e.target.value })} className="mt-1 font-mono text-sm" /></div>
          <div><Label>Why us</Label><Textarea rows={5} value={editing.why_us || ""} onChange={e => setEditing({ ...editing, why_us: e.target.value })} className="mt-1 font-mono text-sm" /></div>
          <div><Label>Process</Label><Textarea rows={5} value={editing.process || ""} onChange={e => setEditing({ ...editing, process: e.target.value })} className="mt-1 font-mono text-sm" /></div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>FAQs</Label>
              <Button type="button" size="sm" variant="outline" onClick={addFaq}><Plus className="h-3 w-3 mr-1" /> Add FAQ</Button>
            </div>
            <div className="space-y-3">
              {(editing.faqs || []).map((f: any, i: number) => (
                <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                  <Input value={f.q} onChange={e => updateFaq(i, "q", e.target.value)} placeholder="Question" />
                  <Textarea rows={2} value={f.a} onChange={e => updateFaq(i, "a", e.target.value)} placeholder="Answer" />
                  <Button type="button" size="sm" variant="ghost" onClick={() => removeFaq(i)} className="text-destructive"><Trash2 className="h-3 w-3 mr-1" /> Remove</Button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>CTA heading</Label><Input value={editing.cta_heading || ""} onChange={e => setEditing({ ...editing, cta_heading: e.target.value })} className="mt-1" /></div>
            <div><Label>CTA description</Label><Input value={editing.cta_description || ""} onChange={e => setEditing({ ...editing, cta_description: e.target.value })} className="mt-1" /></div>
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={editing.is_published} onChange={e => setEditing({ ...editing, is_published: e.target.checked })} /><span className="text-sm">Published</span></label>
          <div className="flex gap-2"><Button onClick={save} disabled={upsert.isPending}>Save</Button><Button variant="outline" onClick={close}>Cancel</Button></div>
        </div>
      )}

      <div className="bg-surface-white rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>City × Service</TableHead><TableHead>Slug</TableHead><TableHead>Published</TableHead><TableHead className="w-32">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {items?.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.service} — {p.city}</TableCell>
                <TableCell className="text-muted-foreground text-sm font-mono">/locations/{p.slug}</TableCell>
                <TableCell>{p.is_published ? <span className="text-success text-xs font-bold">Live</span> : <span className="text-muted-foreground text-xs">Draft</span>}</TableCell>
                <TableCell><div className="flex gap-1">
                  <a href={`/locations/${p.slug}`} target="_blank" rel="noreferrer"><Button size="icon" variant="ghost"><ExternalLink className="h-4 w-4" /></Button></a>
                  <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete?")) remove.mutateAsync(p.id).then(() => toast.success("Deleted")); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div></TableCell>
              </TableRow>
            ))}
            {!items?.length && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No city pages yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}