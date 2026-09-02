"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, type ReactNode } from "react";

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
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="fixed bottom-4 right-4 z-50 w-[min(calc(100vw-2rem),360px)] rounded-lg border border-white/[0.085] bg-popover/95 p-3 text-sm text-foreground shadow-2xl shadow-black/45 backdrop-blur sm:bottom-5 sm:right-5"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border border-white/[0.08] bg-white/[0.04] text-foreground/85">
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">{notice.title}</p>
              {notice.message ? <p className="mt-0.5 line-clamp-2 break-words text-xs leading-5 text-muted-foreground">{notice.message}</p> : null}
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
