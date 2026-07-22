import { ArrowUpRight, BellRing, CheckCircle2, Clock3, Flame, Radio } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const focusItems = [
  { project: "Soundness", title: "Proof due today", meta: "Submit role proof before reset", tone: "danger", icon: Flame },
  { project: "Huddle01", title: "Eligibility recheck", meta: "Check waitlist response on Wdym", tone: "warning", icon: BellRing },
  { project: "NexusHQ", title: "Prover still running", meta: "Monitor node status for Moree", tone: "info", icon: Radio },
  { project: "Linera", title: "Daily farm not done", meta: "Galxe and interaction left", tone: "warning", icon: Clock3 },
  { project: "Edel Finance", title: "Healthy streak", meta: "Daily interaction completed", tone: "success", icon: CheckCircle2 },
];

export function TaskPreview() {
  return (
    <section className="soft-panel overflow-hidden rounded-xl border soft-divider bg-card">
      <div className="flex items-center justify-between gap-3 border-b soft-divider px-4 py-3">
        <div><h2 className="text-sm font-semibold">Today focus</h2><p className="mt-0.5 text-[11px] text-muted-foreground">Signals before opening Daily</p></div>
        <button className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">Open Daily<ArrowUpRight aria-hidden="true" className="size-3.5" /></button>
      </div>
      <div className="divide-y divide-border">
        {focusItems.map((item) => <FocusRow key={item.project + item.title} item={item} />)}
      </div>
    </section>
  );
}

type FocusItem = (typeof focusItems)[number];

function FocusRow({ item }: { item: FocusItem }) {
  const Icon = item.icon;
  return (
    <button className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 text-left hover:bg-accent/35">
      <span className={cn("grid size-8 place-items-center rounded-lg border", toneClass(item.tone))}><Icon className="size-4" /></span>
      <span className="min-w-0">
        <span className="flex min-w-0 items-center gap-2"><span className="truncate text-[13px] font-medium">{item.title}</span><span className="hidden text-[11px] text-muted-foreground sm:inline">· {item.meta}</span></span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground sm:hidden">{item.meta}</span>
      </span>
      <Badge variant={badgeVariant(item.tone)}>{item.project}</Badge>
    </button>
  );
}

function toneClass(tone: FocusItem["tone"]) {
  if (tone === "danger") return "border-destructive/30 bg-destructive/10 text-destructive";
  if (tone === "warning") return "border-warning/30 bg-warning/10 text-warning";
  if (tone === "info") return "border-info/30 bg-info/10 text-info";
  return "border-success/30 bg-success/10 text-success";
}

function badgeVariant(tone: FocusItem["tone"]) {
  if (tone === "danger") return "destructive" as const;
  if (tone === "warning") return "warning" as const;
  if (tone === "info") return "info" as const;
  return "success" as const;
}
