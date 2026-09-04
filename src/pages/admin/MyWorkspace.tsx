import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CheckSquare, StickyNote, Bookmark, Plus, Trash2, Pin, PinOff,
  ExternalLink, Calendar, Clock, Play, Pause, RotateCcw,
} from "lucide-react";
import { useEffect, useRef } from "react";

/* ───────────── TODOS ───────────── */
function PersonalTodos() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");

  const { data: todos = [], isLoading } = useQuery({
    queryKey: ["personal_todos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("personal_todos")
        .select("*").order("is_done").order("sort_order").order("created_at");
      if (error) throw error;
      return data || [];
    },
  });

  const add = async () => {
    if (!title.trim() || !user) return;
    const { error } = await supabase.from("personal_todos").insert({
      user_id: user.id, title: title.trim(), priority,
      due_date: dueDate || null,
    });
    if (error) return toast.error(error.message);
    setTitle(""); setDueDate("");
    qc.invalidateQueries({ queryKey: ["personal_todos"] });
  };

  const toggle = async (id: string, done: boolean) => {
    await supabase.from("personal_todos").update({ is_done: !done }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["personal_todos"] });
  };

  const remove = async (id: string) => {
    await supabase.from("personal_todos").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["personal_todos"] });
  };

  const pColor = (p: string) =>
    p === "high" ? "destructive" : p === "low" ? "secondary" : "default";

  const open = todos.filter((t: any) => !t.is_done);
  const done = todos.filter((t: any) => t.is_done);

  return (
    <div className="space-y-4">
      <div className="bg-surface-white border border-border rounded-xl p-4">
        <div className="grid sm:grid-cols-[1fr_140px_160px_auto] gap-2">
          <Input placeholder="What needs doing?" value={title} onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()} />
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High priority</SelectItem>
              <SelectItem value="medium">Medium priority</SelectItem>
              <SelectItem value="low">Low priority</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <Button onClick={add}><Plus className="h-4 w-4 mr-1" />Add</Button>
        </div>
      </div>

      <div className="bg-surface-white border border-border rounded-xl">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-sm">Open ({open.length})</h3>
        </div>
        <div className="divide-y divide-border">
          {isLoading && <div className="p-6 text-center text-sm text-muted-foreground">Loading...</div>}
          {!isLoading && open.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">All caught up 🎉</div>
          )}
          {open.map((t: any) => (
            <div key={t.id} className="flex items-center gap-3 p-3 hover:bg-muted/30">
              <Checkbox checked={t.is_done} onCheckedChange={() => toggle(t.id, t.is_done)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{t.title}</p>
                {t.due_date && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3 w-3" /> {new Date(t.due_date).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Badge variant={pColor(t.priority) as any} className="capitalize text-xs">{t.priority}</Badge>
              <Button size="icon" variant="ghost" onClick={() => remove(t.id)} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {done.length > 0 && (
        <div className="bg-surface-white border border-border rounded-xl">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-sm text-muted-foreground">Done ({done.length})</h3>
          </div>
          <div className="divide-y divide-border">
            {done.map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 p-3 opacity-60">
                <Checkbox checked onCheckedChange={() => toggle(t.id, t.is_done)} />
                <p className="text-sm flex-1 line-through truncate">{t.title}</p>
                <Button size="icon" variant="ghost" onClick={() => remove(t.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────── NOTES ───────────── */
const NOTE_COLORS: Record<string, string> = {
  yellow: "bg-yellow-100 border-yellow-300 dark:bg-yellow-950/40 dark:border-yellow-900",
  blue: "bg-blue-100 border-blue-300 dark:bg-blue-950/40 dark:border-blue-900",
  green: "bg-green-100 border-green-300 dark:bg-green-950/40 dark:border-green-900",
  pink: "bg-pink-100 border-pink-300 dark:bg-pink-950/40 dark:border-pink-900",
  purple: "bg-purple-100 border-purple-300 dark:bg-purple-950/40 dark:border-purple-900",
};

function PersonalNotes() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["personal_notes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("personal_notes")
        .select("*").order("is_pinned", { ascending: false }).order("updated_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const addNote = async () => {
    if (!user) return;
    const { error } = await supabase.from("personal_notes").insert({
      user_id: user.id, title: "Untitled", content: "", color: "yellow",
    });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["personal_notes"] });
  };

  const update = async (id: string, patch: any) => {
    await supabase.from("personal_notes").update(patch).eq("id", id);
    qc.invalidateQueries({ queryKey: ["personal_notes"] });
  };

  const remove = async (id: string) => {
    await supabase.from("personal_notes").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["personal_notes"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{notes.length} note{notes.length !== 1 ? "s" : ""}</p>
        <Button onClick={addNote}><Plus className="h-4 w-4 mr-1" />New Note</Button>
      </div>

      {isLoading && <div className="text-center py-8 text-muted-foreground">Loading...</div>}
      {!isLoading && notes.length === 0 && (
        <div className="text-center py-12 bg-surface-white border border-dashed border-border rounded-xl">
          <StickyNote className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No notes yet. Click "New Note" to start jotting.</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.map((n: any) => (
          <div key={n.id} className={`rounded-xl border-2 p-3 ${NOTE_COLORS[n.color] || NOTE_COLORS.yellow}`}>
            <div className="flex items-start gap-1 mb-2">
              <Input
                defaultValue={n.title}
                onBlur={(e) => e.target.value !== n.title && update(n.id, { title: e.target.value })}
                className="border-0 bg-transparent font-semibold text-sm h-7 px-1 focus-visible:ring-1"
              />
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => update(n.id, { is_pinned: !n.is_pinned })}>
                {n.is_pinned ? <Pin className="h-4 w-4 fill-current" /> : <PinOff className="h-4 w-4" />}
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => remove(n.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              defaultValue={n.content || ""}
              onBlur={(e) => e.target.value !== (n.content || "") && update(n.id, { content: e.target.value })}
              placeholder="Write something..."
              className="border-0 bg-transparent resize-none min-h-[120px] text-sm focus-visible:ring-1"
            />
            <div className="flex items-center gap-1 mt-2">
              {Object.keys(NOTE_COLORS).map((c) => (
                <button
                  key={c}
                  onClick={() => update(n.id, { color: c })}
                  className={`w-4 h-4 rounded-full border ${NOTE_COLORS[c]} ${n.color === c ? "ring-2 ring-foreground/40" : ""}`}
                  aria-label={c}
                />
              ))}
              <span className="ml-auto text-[10px] text-muted-foreground">
                {new Date(n.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────── BOOKMARKS ───────────── */
function PersonalBookmarks() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("general");

  const { data: bookmarks = [] } = useQuery({
    queryKey: ["personal_bookmarks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("personal_bookmarks")
        .select("*").order("category").order("sort_order").order("created_at");
      if (error) throw error;
      return data || [];
    },
  });

  const add = async () => {
    if (!title.trim() || !url.trim() || !user) return;
    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) normalized = "https://" + normalized;
    const { error } = await supabase.from("personal_bookmarks").insert({
      user_id: user.id, title: title.trim(), url: normalized, category: category.trim() || "general",
    });
    if (error) return toast.error(error.message);
    setTitle(""); setUrl("");
    qc.invalidateQueries({ queryKey: ["personal_bookmarks"] });
  };

  const remove = async (id: string) => {
    await supabase.from("personal_bookmarks").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["personal_bookmarks"] });
  };

  const grouped = bookmarks.reduce((acc: any, b: any) => {
    (acc[b.category] = acc[b.category] || []).push(b);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-4">
      <div className="bg-surface-white border border-border rounded-xl p-4">
        <div className="grid sm:grid-cols-[1fr_1.5fr_140px_auto] gap-2">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()} />
          <Input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
          <Button onClick={add}><Plus className="h-4 w-4 mr-1" />Save</Button>
        </div>
      </div>

      {Object.keys(grouped).length === 0 && (
        <div className="text-center py-12 bg-surface-white border border-dashed border-border rounded-xl">
          <Bookmark className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No bookmarks yet.</p>
        </div>
      )}

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="bg-surface-white border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-muted/30">
            <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">{cat}</h3>
          </div>
          <div className="divide-y divide-border">
            {(items as any[]).map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-3 hover:bg-muted/30">
                <a href={b.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 group">
                  <p className="text-sm font-medium text-lead group-hover:text-primary truncate flex items-center gap-1">
                    {b.title} <ExternalLink className="h-3 w-3 opacity-50" />
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{b.url}</p>
                </a>
                <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => remove(b.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────────── POMODORO ───────────── */
function Pomodoro() {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          const next = mode === "focus" ? "break" : "focus";
          setMode(next);
          toast.success(`${mode === "focus" ? "Focus" : "Break"} complete!`);
          return next === "focus" ? 25 * 60 : 5 * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, mode]);

  const reset = () => {
    setRunning(false);
    setSeconds(mode === "focus" ? 25 * 60 : 5 * 60);
  };

  const switchMode = (m: "focus" | "break") => {
    setRunning(false); setMode(m);
    setSeconds(m === "focus" ? 25 * 60 : 5 * 60);
  };

  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");

  return (
    <div className="bg-surface-white border border-border rounded-xl p-8 text-center max-w-md mx-auto">
      <div className="flex justify-center gap-2 mb-6">
        <Button size="sm" variant={mode === "focus" ? "default" : "outline"} onClick={() => switchMode("focus")}>Focus 25m</Button>
        <Button size="sm" variant={mode === "break" ? "default" : "outline"} onClick={() => switchMode("break")}>Break 5m</Button>
      </div>
      <div className="text-7xl font-display font-bold text-lead tabular-nums mb-6">{m}:{s}</div>
      <div className="flex justify-center gap-2">
        <Button size="lg" onClick={() => setRunning(!running)}>
          {running ? <><Pause className="h-5 w-5 mr-2" />Pause</> : <><Play className="h-5 w-5 mr-2" />Start</>}
        </Button>
        <Button size="lg" variant="outline" onClick={reset}><RotateCcw className="h-5 w-5" /></Button>
      </div>
      <p className="text-xs text-muted-foreground mt-6">
        Stay focused. Auto-switches between focus and break sessions.
      </p>
    </div>
  );
}

/* ───────────── PAGE ───────────── */
export default function MyWorkspace() {
  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-lead mb-1">My Workspace</h1>
      <p className="text-sm text-muted-foreground mb-6">Personal todos, notes, bookmarks, and focus timer — visible only to you.</p>

      <Tabs defaultValue="todos">
        <TabsList>
          <TabsTrigger value="todos"><CheckSquare className="h-4 w-4 mr-1.5" />To-do</TabsTrigger>
          <TabsTrigger value="notes"><StickyNote className="h-4 w-4 mr-1.5" />Notes</TabsTrigger>
          <TabsTrigger value="bookmarks"><Bookmark className="h-4 w-4 mr-1.5" />Bookmarks</TabsTrigger>
          <TabsTrigger value="focus"><Clock className="h-4 w-4 mr-1.5" />Focus</TabsTrigger>
        </TabsList>
        <TabsContent value="todos" className="mt-4"><PersonalTodos /></TabsContent>
        <TabsContent value="notes" className="mt-4"><PersonalNotes /></TabsContent>
        <TabsContent value="bookmarks" className="mt-4"><PersonalBookmarks /></TabsContent>
        <TabsContent value="focus" className="mt-4"><Pomodoro /></TabsContent>
      </Tabs>
    </div>
  );
}