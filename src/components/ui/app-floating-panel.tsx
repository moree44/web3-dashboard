"use client";

import type { ReactNode, RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type FloatingPanelPlacement = {
  top: number;
  left: number;
  width: number;
};

export function AppFloatingPanel({
  open,
  onOpenChange,
  trigger,
  children,
  ariaLabel,
  width = 176,
  align = "end",
  panelClassName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: (props: {
    ref: RefObject<HTMLButtonElement | null>;
    open: boolean;
    toggle: () => void;
  }) => ReactNode;
  children: ReactNode;
  ariaLabel: string;
  width?: number;
  align?: "start" | "end";
  panelClassName?: string;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<FloatingPanelPlacement | null>(null);

  const updatePlacement = useCallback(() => {
    const triggerElement = triggerRef.current;
    if (!triggerElement) return;

    const rect = triggerElement.getBoundingClientRect();
    const panelWidth = Math.max(width, rect.width);
    const panelHeight = Math.min(panelRef.current?.offsetHeight ?? 240, window.innerHeight - 24);
    const viewportPadding = 12;
    const gap = 6;
    const left = align === "start" ? rect.left : rect.right - panelWidth;
    const top = rect.bottom + gap + panelHeight <= window.innerHeight - viewportPadding
      ? rect.bottom + gap
      : Math.max(viewportPadding, rect.top - panelHeight - gap);

    setPlacement({
      top,
      left: Math.min(Math.max(left, viewportPadding), window.innerWidth - panelWidth - viewportPadding),
      width: panelWidth,
    });
  }, [align, width]);

  useEffect(() => {
    if (!open) {
      setPlacement(null);
      return;
    }

    updatePlacement();

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (target instanceof Element && target.closest('[data-app-floating-menu="true"]')) return;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      onOpenChange(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      onOpenChange(false);
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }

    function handleScroll(event: Event) {
      const target = event.target;
      if (target instanceof Element && target.closest('[data-app-floating-menu="true"]')) return;
      if (target instanceof Node && panelRef.current?.contains(target)) return;
      onOpenChange(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [onOpenChange, open, updatePlacement]);

  const panel = open && typeof document !== "undefined"
    ? createPortal(
        <div
          ref={panelRef}
          data-app-floating-menu="true"
          role="menu"
          aria-label={ariaLabel}
          className={cn(
            "popup-in fixed z-[120] rounded-xl bg-[#18181a]/[0.98] p-1 text-left shadow-2xl shadow-black/45 ring-1 ring-white/[0.055] backdrop-blur",
            panelClassName,
          )}
          style={{
            top: placement?.top ?? -999,
            left: placement?.left ?? -999,
            width: placement?.width ?? width,
            visibility: placement ? "visible" : "hidden",
          }}
          onClick={(event) => event.stopPropagation()}
        >
          {children}
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      {trigger({ ref: triggerRef, open, toggle: () => onOpenChange(!open) })}
      {panel}
    </>
  );
}
