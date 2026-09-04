import { useState, useEffect, useCallback, useRef } from "react";

const isStorageAvailable = () => typeof window !== "undefined";

const readStoredDraft = <T extends Record<string, any>>(
  storageKey: string,
  defaultValues: T
): T => {
  if (!isStorageAvailable()) {
    return { ...defaultValues };
  }

  try {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) {
      return { ...defaultValues };
    }

    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object") {
      return { ...defaultValues };
    }

    return { ...defaultValues, ...parsed };
  } catch {
    return { ...defaultValues };
  }
};

const hasMeaningfulDraft = <T extends Record<string, any>>(
  form: T,
  defaultValues: T
) =>
  (Object.keys(defaultValues) as Array<keyof T>).some(
    key => JSON.stringify(form[key]) !== JSON.stringify(defaultValues[key])
  );

/**
 * Persists form state to localStorage so drafts survive tab switches.
 * Clears automatically on successful submit via `clearDraft()`.
 */
export function useDraftPersistence<T extends Record<string, any>>(
  key: string,
  defaultValues: T
): {
  form: T;
  setForm: React.Dispatch<React.SetStateAction<T>>;
  update: (field: keyof T, value: T[keyof T]) => void;
  clearDraft: () => void;
  hasDraft: boolean;
} {
  const storageKey = `crm_draft_${key}`;
  const defaultsRef = useRef(defaultValues);
  const initialForm = readStoredDraft(storageKey, defaultValues);

  const [form, setFormState] = useState<T>(initialForm);
  const formRef = useRef(form);
  const [hasDraft, setHasDraft] = useState(() =>
    hasMeaningfulDraft(initialForm, defaultValues)
  );

  useEffect(() => {
    defaultsRef.current = defaultValues;
    setHasDraft(hasMeaningfulDraft(formRef.current, defaultValues));
  }, [defaultValues]);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  const persistDraft = useCallback(
    (nextForm: T) => {
      formRef.current = nextForm;

      const draftExists = hasMeaningfulDraft(nextForm, defaultsRef.current);
      setHasDraft(draftExists);

      if (!isStorageAvailable()) {
        return;
      }

      try {
        if (draftExists) {
          window.localStorage.setItem(storageKey, JSON.stringify(nextForm));
        } else {
          window.localStorage.removeItem(storageKey);
        }
      } catch {}
    },
    [storageKey]
  );

  const loadDraft = useCallback(() => {
    const nextForm = readStoredDraft(storageKey, defaultsRef.current);
    formRef.current = nextForm;
    setFormState(nextForm);
    setHasDraft(hasMeaningfulDraft(nextForm, defaultsRef.current));
  }, [storageKey]);

  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  useEffect(() => {
    if (!isStorageAvailable()) {
      return;
    }

    const flushDraft = () => persistDraft(formRef.current);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushDraft();
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey) {
        loadDraft();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", flushDraft);
    window.addEventListener("beforeunload", flushDraft);
    window.addEventListener("storage", handleStorage);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", flushDraft);
      window.removeEventListener("beforeunload", flushDraft);
      window.removeEventListener("storage", handleStorage);
    };
  }, [loadDraft, persistDraft, storageKey]);

  const setForm = useCallback<React.Dispatch<React.SetStateAction<T>>>(
    value => {
      const previous = formRef.current;
      const nextForm =
        typeof value === "function"
          ? (value as (prevState: T) => T)(previous)
          : value;

      formRef.current = nextForm;
      setFormState(nextForm);
      persistDraft(nextForm);
    },
    [persistDraft]
  );

  const update = useCallback(
    (field: keyof T, value: T[keyof T]) =>
      setForm(prev => ({ ...prev, [field]: value })),
    [setForm]
  );

  const clearDraft = useCallback(() => {
    const resetForm = { ...defaultsRef.current };
    formRef.current = resetForm;
    setFormState(resetForm);
    setHasDraft(false);

    if (!isStorageAvailable()) {
      return;
    }

    try {
      window.localStorage.removeItem(storageKey);
    } catch {}
  }, [storageKey]);

  return { form, setForm, update, clearDraft, hasDraft };
}
