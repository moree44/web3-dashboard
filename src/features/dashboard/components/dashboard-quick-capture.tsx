"use client";

import { useCallback, useState, useTransition } from "react";
import { Check, Loader2, Plus } from "lucide-react";

import { CornerToast, type CornerToastNotice } from "@/components/shared/corner-toast";
import { createInboxItem } from "@/features/inbox/actions";
import { createWatchlistItem } from "@/features/watchlist/actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const intents = [
  { id: "project", label: "Project" },
  { id: "watchlist", label: "Watchlist" },
  { id: "note", label: "Note" },
  { id: "inbox", label: "Inbox" },
] as const;

type CaptureIntent = (typeof intents)[number]["id"];

export function DashboardQuickCapture({ developmentPreview = false }: { developmentPreview?: boolean }) {
  const [intent, setIntent] = useState<CaptureIntent>("inbox");
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState<CornerToastNotice | null>(null);
  const [isPending, startTransition] = useTransition();

  const clearNotice = useCallback(() => {
    setNotice(null);
  }, []);

  function showNotice(tone: CornerToastNotice["tone"], title: string, message?: string) {
    setNotice({ id: Date.now(), tone, title, message });
  }

  function submit() {
    const title = value.trim();
    if (!title || developmentPreview) return;
    clearNotice();
    startTransition(async () => {
      try {
        let destination = "Inbox";
        if (intent === "watchlist") {
          await createWatchlistItem({ xUrl: title });
          destination = "Watchlist";
        } else {
          await createInboxItem({
            title,
            content: `${intents.find((item) => item.id === intent)?.label ?? "Inbox"} capture from Dashboard`,
            priority: "medium",
          });
        }
        setValue("");
        setSaved(true);
        showNotice("success", "Capture saved", `Saved to ${destination}`);
        window.setTimeout(() => setSaved(false), 2200);
      } catch (captureError) {
        showNotice("error", "Action failed", captureError instanceof Error ? captureError.message : "Could not save capture");
      }
    });
  }

  return (
    <section className="soft-panel mt-3 grid gap-2 rounded-xl border border-white/[0.06] bg-card p-2 xl:grid-cols-[minmax(0,1fr)_auto]">
      <CornerToast notice={notice} onClose={clearNotice} />
      <form
        onSubmit={(event) => { event.preventDefault(); submit(); }}
        className="soft-inset flex min-w-0 items-center gap-3 rounded-lg border border-white/[0.055] bg-input px-3 py-2.5"
      >
        {saved ? <Check className="size-4 shrink-0 text-emerald-400" /> : isPending ? <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" /> : <Plus className="size-4 shrink-0 text-muted-foreground" />}
        <input
          value={value}
          onChange={(event) => { setValue(event.target.value); setSaved(false); clearNotice(); }}
          placeholder={intent === "watchlist" ? "Paste an X project profile..." : "Capture project link, note, or inbox item..."}
          disabled={developmentPreview || isPending}
          className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          aria-label="Quick capture"
        />
        {saved ? <span className="shrink-0 text-[11px] text-success">Saved</span> : null}
      </form>
      <div className="grid grid-cols-4 gap-2 xl:flex">
        {intents.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setIntent(item.id)}
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "soft-control", intent === item.id && "bg-white/[0.1] text-foreground")}
            aria-pressed={intent === item.id}
          >
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
}
