"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Inline two-step delete button. First click arms the destructive state
 * (label swaps to `confirmLabel`), auto-disarms after ~2.5s, second click
 * calls `onConfirm`. Used inside row/menu popovers in place of native confirm().
 */
export function ConfirmDelete({
  onConfirm,
  label = "Delete",
  confirmLabel = "Confirm delete",
  className,
  disabled = false,
  children,
}: {
  onConfirm: () => void;
  label?: string;
  confirmLabel?: string;
  className?: string;
  disabled?: boolean;
  children?: ReactNode;
}) {
  const [armed, setArmed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleClick() {
    if (disabled) return;
    if (!armed) {
      setArmed(true);
      timeoutRef.current = setTimeout(() => setArmed(false), 2500);
      return;
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setArmed(false);
    onConfirm();
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        // Keep delete labels white/foreground — red text on dark menus reads harsh
        // and inconsistent with the rest of the OS. Danger is carried by wording
        // + a soft armed background, not a red label.
        "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-foreground transition-colors",
        armed
          ? "bg-white/[0.08] font-semibold hover:bg-white/[0.12]"
          : "hover:bg-white/[0.055]",
        disabled ? "cursor-not-allowed opacity-45" : "",
        className,
      )}
    >
      {children}
      {armed ? confirmLabel : label}
    </button>
  );
}
