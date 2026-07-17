"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = sessionStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota / private mode — ignore
  }
}

/**
 * useState that survives leaving a page and coming back (same browser tab).
 * Stored in sessionStorage under `key` — cleared when the tab closes.
 *
 * Use for tabs, open dialogs, filters, expansions, draft form fields, etc.
 */
export function usePersistedState<T>(
  key: string,
  initial: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const storageKey = `wewash:ui:${key}`;
  const [state, setState] = useState<T>(() => readStorage(storageKey, initial));
  const hydrated = useRef(false);

  // After mount, re-read once (SSR safety) and mark ready
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const stored = readStorage(storageKey, initial);
    setState(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on key mount
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated.current) return;
    writeStorage(storageKey, state);
  }, [storageKey, state]);

  return [state, setState];
}

/**
 * Persist window scroll position per path so returning to a page restores place.
 */
export function useScrollRestoration(pathKey: string) {
  const key = `wewash:scroll:${pathKey}`;

  useEffect(() => {
    const saved = sessionStorage.getItem(key);
    if (saved != null) {
      const y = Number(saved);
      if (Number.isFinite(y)) {
        // After paint / data load
        requestAnimationFrame(() => {
          window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
        });
        // Second pass after layout settles (tables, cards)
        const t = window.setTimeout(() => {
          window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
        }, 50);
        return () => {
          window.clearTimeout(t);
          sessionStorage.setItem(key, String(window.scrollY));
        };
      }
    }

    return () => {
      sessionStorage.setItem(key, String(window.scrollY));
    };
  }, [key]);
}

/**
 * Persist scroll while navigating; call from shell with current pathname.
 */
export function useRouteScrollMemory(pathname: string) {
  const prev = useRef(pathname);

  useEffect(() => {
    // Leaving previous route — save its scroll
    if (prev.current && prev.current !== pathname) {
      sessionStorage.setItem(
        `wewash:scroll:${prev.current}`,
        String(window.scrollY)
      );
    }
    prev.current = pathname;

    // Entering this route — restore
    const saved = sessionStorage.getItem(`wewash:scroll:${pathname}`);
    const y = saved != null ? Number(saved) : 0;
    const restore = () => {
      if (Number.isFinite(y)) {
        window.scrollTo({ top: y, left: 0, behavior: "instant" as ScrollBehavior });
      }
    };
    restore();
    const t = window.setTimeout(restore, 80);
    const t2 = window.setTimeout(restore, 300);

    return () => {
      window.clearTimeout(t);
      window.clearTimeout(t2);
      sessionStorage.setItem(
        `wewash:scroll:${pathname}`,
        String(window.scrollY)
      );
    };
  }, [pathname]);
}
