import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Persists an `editing` form-state object to localStorage so admins can switch
 * tabs / refresh without losing the row they were creating or editing.
 *
 * Pattern this replaces:
 *   const [editing, setEditing] = useState<any>(null);
 *
 * Usage:
 *   const [editing, setEditing] = useEditingDraft<any>("brands");
 *
 * Behavior:
 * - When `setEditing(obj)` is called, the object is written to
 *   `localStorage["crm_editing_<scope>"]`.
 * - When `setEditing(null)` is called (typical on save/cancel), the entry is
 *   removed.
 * - On mount, any saved value is restored — so the editor panel re-opens with
 *   the half-filled form. If you don't want auto-reopen on every visit, pair
 *   this with a "Restore draft?" UI; for now we always restore because the
 *   product spec is "info should still retain on whatever me or my team is
 *   working upon".
 * - A `storage` event listener keeps multiple tabs in sync.
 */
export function useEditingDraft<T>(
  scope: string,
  initial: T | null = null
): [T | null, (next: T | null | ((prev: T | null) => T | null)) => void] {
  const storageKey = `crm_editing_${scope}`;
  const isBrowser = typeof window !== "undefined";

  const read = useCallback((): T | null => {
    if (!isBrowser) return initial;
    try {
      const raw = window.localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  }, [isBrowser, storageKey, initial]);

  const [state, setState] = useState<T | null>(read);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const persist = useCallback(
    (value: T | null) => {
      if (!isBrowser) return;
      try {
        if (value == null) window.localStorage.removeItem(storageKey);
        else window.localStorage.setItem(storageKey, JSON.stringify(value));
      } catch {}
    },
    [isBrowser, storageKey]
  );

  const setEditing = useCallback(
    (next: T | null | ((prev: T | null) => T | null)) => {
      setState(prev => {
        const value =
          typeof next === "function"
            ? (next as (p: T | null) => T | null)(prev)
            : next;
        persist(value);
        return value;
      });
    },
    [persist]
  );

  // Cross-tab sync + flush on hide
  useEffect(() => {
    if (!isBrowser) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey) return;
      setState(read());
    };
    const flush = () => persist(stateRef.current);
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [isBrowser, persist, read, storageKey]);

  return [state, setEditing];
}
