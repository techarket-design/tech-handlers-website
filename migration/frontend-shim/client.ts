// Drop-in replacement for src/integrations/supabase/client.ts
// After cutover, replace the original file with this one and delete
// src/integrations/supabase/types.ts (no longer auto-generated).
//
// It re-implements the small subset of supabase-js that this app uses:
//   - auth.signInWithPassword / signOut / getSession / onAuthStateChange / getUser
//   - from(table).select/insert/update/upsert/delete + .eq/.order/.limit/.maybeSingle/.single
//   - rpc('has_role'|'has_permission'|'next_invoice_number')
//   - functions.invoke('list-team-members'|'admin-create-user'|'admin-change-password')
//   - storage.from('media').upload/getPublicUrl/remove

const API = (import.meta as any).env.VITE_API_URL || "/api";

/* ---------- token store ---------- */
const TKEY = "th_access_token";
const getToken = () => localStorage.getItem(TKEY);
const setToken = (t: string | null) => t ? localStorage.setItem(TKEY, t) : localStorage.removeItem(TKEY);

async function http(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");
  const t = getToken();
  if (t) headers.set("Authorization", `Bearer ${t}`);
  const r = await fetch(`${API}${path}`, { ...init, headers, credentials: "include" });
  const text = await r.text();
  const data = text ? JSON.parse(text) : null;
  if (!r.ok) throw Object.assign(new Error(data?.error || r.statusText), { status: r.status });
  return data;
}

/* ---------- auth listeners ---------- */
type Session = { access_token: string; user: { id: string; email: string } } | null;
let currentSession: Session = null;
const listeners = new Set<(event: string, s: Session) => void>();
const emit = (event: string) => listeners.forEach(l => l(event, currentSession));

async function refreshMe() {
  if (!getToken()) { currentSession = null; return null; }
  try {
    const me = await http("/auth/me");
    currentSession = { access_token: getToken()!, user: me.user };
    return currentSession;
  } catch {
    setToken(null); currentSession = null; return null;
  }
}

/* ---------- query builder ---------- */
class QB {
  private filters: Record<string, any> = {};
  private _order?: string;
  private _limit?: number;
  private _single = false;
  private _maybe = false;
  constructor(private table: string, private mode: "select"|"insert"|"update"|"upsert"|"delete", private payload?: any) {}

  eq(col: string, val: any) { this.filters[col] = val; return this; }
  order(col: string, opts?: { ascending?: boolean }) {
    this._order = `${col}.${opts?.ascending === false ? "desc" : "asc"}`; return this;
  }
  limit(n: number) { this._limit = n; return this; }
  single() { this._single = true; return this.exec(); }
  maybeSingle() { this._maybe = true; return this.exec(); }
  select(_cols?: string) { return this; }   // ignored — server returns *

  then<T>(res: (v: any) => T, rej?: (e: any) => any) { return this.exec().then(res, rej); }

  private async exec(): Promise<{ data: any; error: any }> {
    try {
      let data: any;
      if (this.mode === "select") {
        const qs = new URLSearchParams();
        for (const [k, v] of Object.entries(this.filters)) qs.set(k, String(v));
        if (this._order) qs.set("order", this._order);
        if (this._limit) qs.set("limit", String(this._limit));
        data = await http(`/table/${this.table}?${qs}`);
        if (this._single) data = data[0] ?? (() => { throw new Error("No rows"); })();
        else if (this._maybe) data = data[0] ?? null;
      } else if (this.mode === "insert") {
        data = await http(`/table/${this.table}`, { method: "POST", body: JSON.stringify(this.payload) });
      } else if (this.mode === "upsert") {
        data = await http(`/table/${this.table}`, { method: "PUT", body: JSON.stringify(this.payload) });
      } else if (this.mode === "update") {
        const id = this.filters.id;
        if (!id) throw new Error("update requires .eq('id', ...)");
        data = await http(`/table/${this.table}/${id}`, { method: "PATCH", body: JSON.stringify(this.payload) });
      } else if (this.mode === "delete") {
        const id = this.filters.id;
        if (!id) throw new Error("delete requires .eq('id', ...)");
        await http(`/table/${this.table}/${id}`, { method: "DELETE" });
        data = null;
      }
      return { data, error: null };
    } catch (error: any) { return { data: null, error }; }
  }
}

/* ---------- public API ---------- */
export const supabase = {
  from(table: string) {
    return {
      select: (cols?: string) => new QB(table, "select").select(cols),
      insert: (row: any)      => new QB(table, "insert", row),
      update: (row: any)      => new QB(table, "update", row),
      upsert: (row: any)      => new QB(table, "upsert", row),
      delete: ()              => new QB(table, "delete"),
    };
  },

  auth: {
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      try {
        const r = await http("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
        setToken(r.access_token);
        currentSession = { access_token: r.access_token, user: r.user };
        emit("SIGNED_IN");
        return { data: { session: currentSession, user: r.user }, error: null };
      } catch (error: any) { return { data: { session: null, user: null }, error }; }
    },
    async signOut() {
      try { await http("/auth/logout", { method: "POST" }); } catch {}
      setToken(null); currentSession = null; emit("SIGNED_OUT");
      return { error: null };
    },
    async getSession() {
      if (!currentSession) await refreshMe();
      return { data: { session: currentSession }, error: null };
    },
    async getUser() {
      const s = await this.getSession();
      return { data: { user: s.data.session?.user || null }, error: null };
    },
    onAuthStateChange(cb: (event: string, s: Session) => void) {
      listeners.add(cb);
      // emit current state asynchronously to mimic supabase behaviour
      Promise.resolve().then(() => cb(currentSession ? "SIGNED_IN" : "INITIAL_SESSION", currentSession));
      return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
    },
  },

  async rpc(name: string, args?: any) {
    try { const data = await http(`/rpc/${name}`, { method: "POST", body: JSON.stringify(args || {}) });
      return { data, error: null };
    } catch (error: any) { return { data: null, error }; }
  },

  functions: {
    async invoke(name: string, opts?: { body?: any }) {
      const map: Record<string, { method: string; path: string }> = {
        "list-team-members":   { method: "GET",  path: "/team/members" },
        "admin-create-user":   { method: "POST", path: "/team/members" },
        "admin-change-password": { method: "POST", path: "/team/change-password" },
      };
      const route = map[name];
      if (!route) return { data: null, error: new Error(`Unknown function ${name}`) };
      try {
        const data = await http(route.path, {
          method: route.method,
          body: route.method === "GET" ? undefined : JSON.stringify(opts?.body || {}),
        });
        return { data, error: null };
      } catch (error: any) { return { data: null, error }; }
    },
  },

  storage: {
    from(_bucket: string) {
      return {
        async upload(path: string, file: File) {
          const fd = new FormData(); fd.append("file", file, path);
          const headers = new Headers(); const t = getToken();
          if (t) headers.set("Authorization", `Bearer ${t}`);
          const r = await fetch(`${API}/storage/upload`, { method: "POST", body: fd, headers, credentials: "include" });
          const data = await r.json();
          if (!r.ok) return { data: null, error: new Error(data?.error || "Upload failed") };
          return { data: { path: data.path, public_url: data.public_url }, error: null };
        },
        getPublicUrl(p: string) {
          const base = (import.meta as any).env.VITE_UPLOAD_URL || "/uploads";
          return { data: { publicUrl: `${base.replace(/\/$/, "")}/${p}` } };
        },
        async remove(paths: string[]) {
          for (const p of paths) await http(`/storage/file/${encodeURIComponent(p)}`, { method: "DELETE" });
          return { data: null, error: null };
        },
      };
    },
  },
};

// kick off initial session refresh
void refreshMe();