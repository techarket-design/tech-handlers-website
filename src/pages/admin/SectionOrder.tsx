import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAdminHomepageSections, useUpsertGenericRow } from "@/hooks/useData";
import { ArrowUp, ArrowDown, GripVertical, Save } from "lucide-react";

export default function AdminSectionOrder() {
  const { data: dbSections, isLoading } = useAdminHomepageSections();
  const upsert = useUpsertGenericRow("homepage_sections");
  const [sections, setSections] = useState<any[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (dbSections) setSections([...(dbSections as any[])].sort((a, b) => a.sort_order - b.sort_order));
  }, [dbSections]);

  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= sections.length) return;
    const updated = [...sections];
    [updated[index], updated[next]] = [updated[next], updated[index]];
    updated.forEach((s, i) => (s.sort_order = i));
    setSections(updated);
    setDirty(true);
  };

  const toggleVisibility = (index: number) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], is_visible: !updated[index].is_visible };
    setSections(updated);
    setDirty(true);
  };

  const saveAll = async () => {
    try {
      for (const s of sections) {
        await upsert.mutateAsync({ id: s.id, section_key: s.section_key, label: s.label, sort_order: s.sort_order, is_visible: s.is_visible });
      }
      toast.success("Section order saved");
      setDirty(false);
    } catch {
      toast.error("Failed to save");
    }
  };

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded-xl" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-lead">Homepage Section Order</h1>
        {dirty && (
          <Button onClick={saveAll} className="gradient-primary-accent text-primary-foreground" disabled={upsert.isPending}>
            <Save className="mr-2 h-4 w-4" /> {upsert.isPending ? "Saving..." : "Save Order"}
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Reorder sections using the arrows. Toggle visibility to show/hide sections on the homepage.
      </p>

      <div className="space-y-2">
        {sections.map((section, index) => (
          <div
            key={section.id}
            className={`bg-surface-white rounded-xl border p-4 flex items-center gap-4 transition-colors ${
              section.is_visible ? "border-border" : "border-border/50 opacity-60"
            }`}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs font-mono text-muted-foreground w-6">{index}</span>
            <span className="font-semibold text-lead flex-1">{section.label}</span>
            <span className="text-xs text-muted-foreground font-mono">{section.section_key}</span>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => move(index, -1)} disabled={index === 0}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => move(index, 1)} disabled={index === sections.length - 1}>
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
            <Switch
              checked={section.is_visible}
              onCheckedChange={() => toggleVisibility(index)}
            />
          </div>
        ))}
      </div>

      {!sections.length && <p className="text-muted-foreground text-center py-8">No sections configured</p>}
    </div>
  );
}
