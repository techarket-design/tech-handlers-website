import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Resilient upload for the `media` bucket.
 *
 * Persists the File blob in IndexedDB so that switching tabs mid-upload
 * (even reloading the page) never loses the file — on return, `pendingUploads`
 * lists in-flight items and `resume(id)` retries them.
 *
 * Backing storage: Supabase `media` bucket with `upsert: true` — safe to retry.
 */

type PendingRecord = {
  id: string;
  path: string;
  bucket: string;
  fileName: string;
  size: number;
  mime: string;
  status: "queued" | "uploading" | "error" | "done";
  error?: string;
  createdAt: number;
  meta?: Record<string, any>;
};

const DB_NAME = "lovable_uploads";
const STORE = "files";
const META = "meta";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbPut(store: string, key: string, value: any) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGet<T = any>(store: string, key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const r = tx.objectStore(store).get(key);
    r.onsuccess = () => resolve(r.result as T);
    r.onerror = () => reject(r.error);
  });
}
async function idbDel(store: string, key: string) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function idbAllMeta(): Promise<PendingRecord[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META, "readonly");
    const store = tx.objectStore(META);
    const results: PendingRecord[] = [];
    const cursorReq = store.openCursor();
    cursorReq.onsuccess = () => {
      const c = cursorReq.result;
      if (c) { results.push(c.value as PendingRecord); c.continue(); }
      else resolve(results);
    };
    cursorReq.onerror = () => reject(cursorReq.error);
  });
}

type OnDone = (rec: PendingRecord) => Promise<void> | void;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach(fn => fn());

export function usePendingUploads() {
  const [items, setItems] = useState<PendingRecord[]>([]);
  const refresh = useCallback(async () => {
    setItems((await idbAllMeta()).filter(r => r.status !== "done"));
  }, []);
  useEffect(() => {
    refresh();
    listeners.add(refresh);
    return () => { listeners.delete(refresh); };
  }, [refresh]);
  return { items, refresh };
}

export async function queueAndUpload(opts: {
  file: File;
  bucket?: string;
  path: string;
  meta?: Record<string, any>;
  onDone?: OnDone;
}): Promise<PendingRecord> {
  const id = crypto.randomUUID();
  const rec: PendingRecord = {
    id,
    path: opts.path,
    bucket: opts.bucket ?? "media",
    fileName: opts.file.name,
    size: opts.file.size,
    mime: opts.file.type || "application/octet-stream",
    status: "queued",
    createdAt: Date.now(),
    meta: opts.meta,
  };
  await idbPut(STORE, id, opts.file);
  await idbPut(META, id, rec);
  notify();
  await performUpload(id, opts.onDone);
  return rec;
}

async function performUpload(id: string, onDone?: OnDone) {
  const rec = await idbGet<PendingRecord>(META, id);
  const file = await idbGet<File>(STORE, id);
  if (!rec || !file) return;
  rec.status = "uploading"; rec.error = undefined;
  await idbPut(META, id, rec); notify();
  const { error } = await supabase.storage.from(rec.bucket).upload(rec.path, file, {
    contentType: rec.mime, upsert: true,
  });
  if (error) {
    rec.status = "error"; rec.error = error.message;
    await idbPut(META, id, rec); notify();
    return;
  }
  rec.status = "done";
  await idbPut(META, id, rec);
  if (onDone) await onDone(rec);
  await idbDel(STORE, id);
  await idbDel(META, id);
  notify();
}

export async function resumeUpload(id: string, onDone?: OnDone) {
  await performUpload(id, onDone);
}

export async function cancelUpload(id: string) {
  await idbDel(STORE, id);
  await idbDel(META, id);
  notify();
}