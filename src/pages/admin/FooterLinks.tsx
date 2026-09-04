import { useState } from "react";
import { useEditingDraft } from "@/hooks/useEditingDraft";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAdminFooterLinks, useUpsertGenericRow, useDeleteGenericRow } from "@/hooks/useData";
import { Plus, Trash2 } from "lucide-react";

export default function AdminFooterLinks() {
  const { data: links, isLoading } = useAdminFooterLinks();
  const upsert = useUpsertGenericRow("footer_links");
  const remove = useDeleteGenericRow("footer_links");
  const [editing, setEditing] = useEditingDraft<any>("footer_links");

  const blank = { label: "", url: "#", category: "Company", sort_order: 0, is_active: true };

  const save = async () => {
    if (!editing?.label) return toast.error("Label required");
    await upsert.mutateAsync(editing);
    toast.success("Saved");
    setEditing(null);
  };

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded-xl" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-lead">Footer Links</h1>
        <Button onClick={() => setEditing(blank)} className="gradient-primary-accent text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" /> Add Link
        </Button>
      </div>

      {editing && (
        <div className="bg-surface-white rounded-xl border border-border p-6 mb-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Label</Label><Input value={editing.label} onChange={e => setEditing({ ...editing, label: e.target.value })} className="mt-1" /></div>
            <div><Label>URL</Label><Input value={editing.url} onChange={e => setEditing({ ...editing, url: e.target.value })} className="mt-1" /></div>
            <div><Label>Category</Label><Input value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} className="mt-1" placeholder="Company, Locations, etc." /></div>
            <div><Label>Sort Order</Label><Input type="number" value={editing.sort_order} onChange={e => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })} className="mt-1" /></div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={editing.is_active} onCheckedChange={v => setEditing({ ...editing, is_active: v })} /><Label>Active</Label>
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={upsert.isPending}>{upsert.isPending ? "Saving..." : "Save"}</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {(links as any[])?.map((link: any) => (
          <div key={link.id} className="bg-surface-white rounded-xl border border-border p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-primary mr-2">{link.category}</span>
              <span className="font-semibold text-lead">{link.label}</span>
              {!link.is_active && <span className="ml-2 text-xs text-muted-foreground">(inactive)</span>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing({ ...link })}>Edit</Button>
              <Button size="sm" variant="ghost" onClick={async () => { await remove.mutateAsync(link.id); toast.success("Deleted"); }}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        {!(links as any[])?.length && <p className="text-muted-foreground text-center py-8">No footer links yet — using defaults</p>}
      </div>
    </div>
  );
}
