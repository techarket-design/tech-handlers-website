import { useCallback, useEffect, useRef, useState } from "react";

const isStorageAvailable = () => typeof window !== "undefined";

const areEqual = (left: unknown, right: unknown) =>
  JSON.stringify(left) === JSON.stringify(right);

const readStoredValue = <T,>(storageKey: string, initialValue: T): T => {
  if (!isStorageAvailable()) {
    return initialValue;
  }

  try {
    const saved = window.localStorage.getItem(storageKey);
    return saved ? (JSON.parse(saved) as T) : initialValue;
  } catch {
    return initialValue;
  }
};

export function usePersistentState<T>(
  storageKey: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  const initialValueRef = useRef(initialValue);
  const [state, setState] = useState<T>(() =>
    readStoredValue(storageKey, initialValueRef.current)
  );

  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [initialValue]);

  const persistValue = useCallback(
    (nextValue: T) => {
      if (!isStorageAvailable()) {
        return;
      }

      try {
        if (areEqual(nextValue, initialValueRef.current)) {
          window.localStorage.removeItem(storageKey);
        } else {
          window.localStorage.setItem(storageKey, JSON.stringify(nextValue));
        }
      } catch {}
    },
    [storageKey]
  );

  const setPersistentState = useCallback<React.Dispatch<React.SetStateAction<T>>>(
    value => {
      setState(previous => {
        const nextValue =
          typeof value === "function"
            ? (value as (previousState: T) => T)(previous)
            : value;

        persistValue(nextValue);
        return nextValue;
      });
    },
    [persistValue]
  );

  const clearPersistentState = useCallback(() => {
    const resetValue = initialValueRef.current;
    setState(resetValue);

    if (!isStorageAvailable()) {
      return;
    }

    try {
      window.localStorage.removeItem(storageKey);
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    if (!isStorageAvailable()) {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) {
        return;
      }

      setState(readStoredValue(storageKey, initialValueRef.current));
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [storageKey]);

  return [state, setPersistentState, clearPersistentState];
}