import { useState } from "react";
import { useGenericTable, useUpsertGenericRow } from "@/hooks/useData";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";

type Row = { id: string; slug: string; title: string; meta_description: string | null; content_markdown: string; is_published: boolean };

export default function LegalPagesAdmin() {
  const { data, isLoading } = useGenericTable("legal_pages", { orderBy: "slug", ascending: true });
  const upsert = useUpsertGenericRow("legal_pages");
  const rows = (data as unknown as Row[]) || [];
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Row>>({});

  const current = rows.find((r) => r.id === selected) || rows[0];
  const merged = current ? { ...current, ...draft } : null;

  const save = async () => {
    if (!merged) return;
    try {
      await upsert.mutateAsync(merged);
      toast.success("Saved");
      setDraft({});
    } catch (e: any) { toast.error(e.message || "Save failed"); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Legal Pages</h1>
        <p className="text-sm text-muted-foreground mt-1">Markdown-edited Privacy, Terms, Refund, and Cookie pages.</p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        <div className="space-y-1">
          {rows.map((r) => (
            <button
              key={r.id}
              onClick={() => { setSelected(r.id); setDraft({}); }}
              className={`w-full text-left px-3 py-2 rounded-md text-sm border ${
                (selected ?? rows[0]?.id) === r.id ? "bg-primary/10 border-primary/30 text-primary" : "bg-surface-white border-border hover:bg-muted/40"
              }`}
            >
              <div className="font-semibold">{r.title}</div>
              <div className="text-[11px] text-muted-foreground">/{r.slug}</div>
            </button>
          ))}
        </div>

        {merged && (
          <div className="space-y-4 bg-surface-white border border-border rounded-xl p-5">
            <div className="flex items-center justify-between gap-2">
              <a href={`/${merged.slug}`} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                View live <ExternalLink className="h-3 w-3" />
              </a>
              <Button size="sm" disabled={!Object.keys(draft).length || upsert.isPending} onClick={save}>Save changes</Button>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Title</label>
              <Input value={merged.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Meta description (SEO)</label>
              <Input value={merged.meta_description || ""} onChange={(e) => setDraft((d) => ({ ...d, meta_description: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Content (Markdown)</label>
              <Textarea
                value={merged.content_markdown}
                onChange={(e) => setDraft((d) => ({ ...d, content_markdown: e.target.value }))}
                className="font-mono text-xs min-h-[480px]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
