"use client";

import { useEffect } from "react";

/** Escape key dismiss for open drawers. Backdrop click is handled on the wrapper. */
export function useDrawerDismiss(onClose: () => void, open = true) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (document.querySelector('[data-app-floating-menu="true"]')) return;
      onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);
}
