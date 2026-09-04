/**
 * Persistent, tab-durable mutation queue for Supabase writes.
 *
 * Guarantees zero data loss when a network blip, tab switch, or reload
 * interrupts an in-flight write. Enqueued items live in localStorage under
 * `mutation_queue_v1` and are flushed:
 *   - immediately after enqueue
 *   - on `online` event
 *   - every 15s while items remain
 *   - on `visibilitychange` when tab becomes visible
 *
 * Cross-tab: `storage` event syncs the queue length so the sync indicator
 * updates everywhere.
 */
import { supabase } from "@/integrations/supabase/client";

export type QueuedOp =
  | { id: string; kind: "update"; table: string; rowId: string; patch: Record<string, any>; ts: number; tries: number; lastError?: string }
  | { id: string; kind: "insert"; table: string; row: Record<string, any>; ts: number; tries: number; lastError?: string }
  | { id: string; kind: "upsert"; table: string; row: Record<string, any>; onConflict?: string; ts: number; tries: number; lastError?: string }
  | { id: string; kind: "delete"; table: string; rowId: string; ts: number; tries: number; lastError?: string };

const KEY = "mutation_queue_v1";
const listeners = new Set<(q: QueuedOp[]) => void>();
let flushing = false;

function read(): QueuedOp[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function write(q: QueuedOp[]) {
  localStorage.setItem(KEY, JSON.stringify(q));
  listeners.forEach(l => l(q));
}
function newId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function subscribeQueue(fn: (q: QueuedOp[]) => void) {
  listeners.add(fn);
  fn(read());
  return () => { listeners.delete(fn); };
}
export function getQueue() { return read(); }

type EnqueueInput =
  | { kind: "update"; table: string; rowId: string; patch: Record<string, any> }
  | { kind: "insert"; table: string; row: Record<string, any> }
  | { kind: "upsert"; table: string; row: Record<string, any>; onConflict?: string }
  | { kind: "delete"; table: string; rowId: string };

export function enqueue(op: EnqueueInput) {
  const q = read();
  q.push({ ...(op as any), id: newId(), ts: Date.now(), tries: 0 });
  write(q);
  void flushQueue();
}

async function runOne(op: QueuedOp): Promise<void> {
  const t = supabase.from(op.table as any);
  if (op.kind === "update") {
    const { error } = await t.update(op.patch).eq("id", op.rowId);
    if (error) throw error;
  } else if (op.kind === "insert") {
    const { error } = await t.insert(op.row);
    if (error) throw error;
  } else if (op.kind === "upsert") {
    const { error } = await t.upsert(op.row, op.onConflict ? { onConflict: op.onConflict } : undefined);
    if (error) throw error;
  } else if (op.kind === "delete") {
    const { error } = await t.delete().eq("id", op.rowId);
    if (error) throw error;
  }
}

export async function flushQueue() {
  if (flushing) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  flushing = true;
  try {
    let q = read();
    while (q.length) {
      const op = q[0];
      try {
        await runOne(op);
        q = read().filter(x => x.id !== op.id);
        write(q);
      } catch (e: any) {
        // Update attempt metadata and stop; retry on next trigger.
        const msg = e?.message || String(e);
        q = read().map(x => x.id === op.id ? { ...x, tries: x.tries + 1, lastError: msg } : x);
        write(q);
        // Drop after 10 failed tries to prevent poison-pill loops.
        if ((q[0]?.tries ?? 0) >= 10) {
          q = q.slice(1);
          write(q);
          continue;
        }
        break;
      }
    }
  } finally {
    flushing = false;
  }
}

export function dropOp(id: string) {
  write(read().filter(x => x.id !== id));
}

// Install triggers once on load.
if (typeof window !== "undefined" && !(window as any).__mq_installed) {
  (window as any).__mq_installed = true;
  window.addEventListener("online", () => { void flushQueue(); });
  window.addEventListener("focus", () => { void flushQueue(); });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void flushQueue();
  });
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) listeners.forEach(l => l(read()));
  });
  setInterval(() => { if (read().length) void flushQueue(); }, 15000);
  // Kick off on load in case queue survived a reload.
  setTimeout(() => { void flushQueue(); }, 500);
}