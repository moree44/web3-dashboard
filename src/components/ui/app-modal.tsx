"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { useDrawerDismiss } from "@/lib/use-drawer-dismiss";
import { usePresence } from "@/lib/use-presence";

export function AppModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  labelledBy,
  closeDisabled = false,
  panelClassName,
  bodyClassName,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  labelledBy?: string;
  closeDisabled?: boolean;
  panelClassName?: string;
  bodyClassName?: string;
}) {
  useDrawerDismiss(onClose, open && !closeDisabled);

  const { mounted, closing } = usePresence(open, 160);
  const titleId = labelledBy ?? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!mounted) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] grid place-items-center bg-black/45 px-4 py-5 backdrop-blur-[2px]",
        closing ? "modal-backdrop-out" : "modal-backdrop-in",
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !closeDisabled) onClose();
      }}
    >
      <section
        className={cn(
          "soft-panel flex max-h-[calc(100vh-40px)] w-full max-w-sm flex-col overflow-hidden rounded-xl border border-white/[0.065] bg-card shadow-2xl shadow-black/45",
          closing ? "modal-card-out" : "modal-card-in",
          panelClassName,
        )}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b soft-divider px-4 py-3">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-sm font-semibold text-foreground">
              {title}
            </h2>
            {description ? <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-muted-foreground">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.055] hover:text-foreground disabled:opacity-45"
            aria-label={"Close " + title}
          >
            <X className="size-4" />
          </button>
        </div>
        <div className={cn("scrollbar-subtle min-h-0 flex-1 overflow-y-auto px-4 py-3", bodyClassName)}>
          {children}
        </div>
        {footer ? <div className="flex items-center justify-end gap-2 border-t soft-divider bg-card/95 px-4 py-3 backdrop-blur">{footer}</div> : null}
      </section>
    </div>
  );
}
