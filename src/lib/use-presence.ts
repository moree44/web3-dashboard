"use client";

import { useEffect, useState } from "react";

/**
 * Keeps an overlay mounted for `exitMs` after `open` flips to false so the exit
 * animation can play, then unmounts it. Returns `mounted` (render nothing when
 * false) and `closing` (swap the `-in` classes for `-out`).
 */
export function usePresence(open: boolean, exitMs: number) {
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    if (!mounted) return;
    const timeout = window.setTimeout(() => setMounted(false), exitMs);
    return () => window.clearTimeout(timeout);
  }, [open, exitMs, mounted]);

  return { mounted, closing: !open && mounted };
}
