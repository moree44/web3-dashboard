"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type CornerToastNotice = {
  id: number;
  tone: "error" | "success" | "info";
  title: string;
  message?: string;
  action?: ReactNode;
};

export function CornerToast({
  notice,
  onClose,
  duration = 4200,
}: {
  notice: CornerToastNotice | null;
  onClose: () => void;
  duration?: number;
}) {
  useEffect(() => {
    if (!notice || notice.action) return;
    const timeout = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timeout);
  }, [duration, notice, onClose]);

  const Icon = notice?.tone === "success" ? CheckCircle2 : notice?.tone === "info" ? Info : XCircle;

  return (
    <AnimatePresence>
      {notice ? (
        <motion.div
          key={notice.id}
          role="alert"
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="fixed right-4 top-4 z-50 w-[min(calc(100vw-2rem),360px)] rounded-xl border border-white/[0.075] bg-popover/95 p-3 text-sm text-foreground shadow-2xl shadow-black/45 backdrop-blur sm:right-5 sm:top-5"
        >
          <div className={cn(
            "absolute inset-y-3 left-0 w-1 rounded-r-full",
            notice.tone === "error" ? "bg-destructive/75" : notice.tone === "success" ? "bg-success/75" : "bg-info/75",
          )} />
          <div className="flex items-start gap-3 pl-1">
            <span className={cn(
              "mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border",
              notice.tone === "error" ? "border-destructive/20 bg-destructive/10 text-destructive" : notice.tone === "success" ? "border-success/20 bg-success/10 text-success" : "border-info/20 bg-info/10 text-info",
            )}>
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold">{notice.title}</p>
              {notice.message ? <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">{notice.message}</p> : null}
              {notice.action ? <div className="mt-2">{notice.action}</div> : null}
            </div>
            <button type="button" onClick={onClose} className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground" aria-label="Close notification">
              <X className="size-3.5" />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
