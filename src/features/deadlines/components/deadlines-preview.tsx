"use client";

import {
  Ban,
  CalendarClock,
  CheckCircle2,
  Clock3,
  ListChecks,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import type {
  DeadlineOptions,
  DeadlineWithContext,
} from "../actions";
import {
  compareDeadlineDates,
  formatDeadlineDueLabel,
  formatDeadlineTime,
  getDeadlineDayDifference,
} from "../deadline-utils";
import { DeadlineDialog } from "./deadline-dialog";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DeadlineView = "upcoming" | "done" | "cancelled";

type DisplayDeadline = {
  id: string;
  title: string;
  context: string;
  dueDate: string;
  dueTime: string | null;
  status: DeadlineView;
  record?: DeadlineWithContext;
};

export function DeadlinesPreview({
  initialDeadlines,
  options,
  canPersist = true,
}: {
  initialDeadlines: DeadlineWithContext[];
  options: DeadlineOptions;
  canPersist?: boolean;
}) {
  const [deadlines, setDeadlines] = useState(initialDeadlines);
  const [view, setView] = useState<DeadlineView>("upcoming");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<DeadlineWithContext | null>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const displayItems = useMemo(() => {
    const standalone: DisplayDeadline[] = deadlines
      .filter((deadline) => deadline.status === view)
      .map((deadline) => ({
        id: deadline.id,
        title: deadline.title,
        context: deadline.linkedTaskTitle ?? deadline.linkedProjectName ?? deadline.notes ?? "Standalone deadline",
        dueDate: deadline.dueDate,
        dueTime: deadline.dueTime,
        status: deadline.status,
        record: deadline,
      }));

    return standalone.sort(compareDeadlineDates);
  }, [deadlines, view]);

  const counts = {
    upcoming: deadlines.filter((deadline) => deadline.status === "upcoming").length,
    done: deadlines.filter((deadline) => deadline.status === "done").length,
    cancelled: deadlines.filter((deadline) => deadline.status === "cancelled").length,
  };

  function openCreate() {
    setSelected(null);
    setDialogOpen(true);
  }

  function openEdit(deadline: DeadlineWithContext) {
    setSelected(deadline);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    if (!selected) window.requestAnimationFrame(() => addButtonRef.current?.focus());
  }

  function handleSaved(saved: DeadlineWithContext) {
    setDeadlines((current) => {
      const exists = current.some((item) => item.id === saved.id);
      return exists
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [saved, ...current];
    });
    setView(saved.status);
    router.refresh();
  }

  function handleDeleted(id: string) {
    setDeadlines((current) => current.filter((item) => item.id !== id));
    router.refresh();
  }

  return (
    <div className="min-w-0 py-5 lg:py-7">
      <header className="flex flex-col gap-4 border-b px-4 pb-5 soft-divider sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div>
          <p className="text-xs text-muted-foreground">Dashboard companion</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">Deadlines</h1>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
            Project, Task, and standalone reminders in one chronological view.
          </p>
        </div>
        <Button ref={addButtonRef} size="sm" onClick={openCreate} disabled={!canPersist} title={canPersist ? "Add deadline" : "Database connection required"}>
          <Plus className="size-4" />
          Add deadline
        </Button>
      </header>

      <div className="border-b px-4 soft-divider sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 overflow-x-auto py-2.5 scrollbar-subtle">
          {([
            ["upcoming", "Upcoming", Clock3],
            ["done", "Done", CheckCircle2],
            ["cancelled", "Cancelled", Ban],
          ] as const).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => setView(value)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                view === value
                  ? "bg-accent text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
                  : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {label}
              <span className="text-[10px] opacity-60">{counts[value]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 lg:px-8">
        <section className="soft-panel overflow-hidden rounded-xl bg-card">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-muted-foreground">
                <CalendarClock className="size-4" />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold">{view === "upcoming" ? "Upcoming timeline" : view === "done" ? "Completed deadlines" : "Cancelled deadlines"}</h2>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{displayItems.length} item{displayItems.length === 1 ? "" : "s"}</p>
              </div>
            </div>
          </div>

          {displayItems.length > 0 ? (
            <div className="divide-y divide-white/[0.045]">
              {displayItems.map((item) => (
                <DeadlineListRow
                  key={item.id}
                  item={item}
                  onOpen={item.record ? () => openEdit(item.record as DeadlineWithContext) : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="px-4 py-14 text-center">
              <CalendarClock className="mx-auto size-5 text-muted-foreground/60" />
              <p className="mt-2 text-sm font-medium">No {view} deadlines</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {view === "upcoming" ? "Add a date-sensitive reminder when you need one." : "Items moved here remain available for reference."}
              </p>
            </div>
          )}
        </section>
      </div>

      <DeadlineDialog
        open={dialogOpen}
        onClose={closeDialog}
        options={options}
        deadline={selected}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </div>
  );
}

function DeadlineListRow({ item, onOpen }: { item: DisplayDeadline; onOpen?: () => void }) {
  const dueLabel = formatDeadlineDueLabel(item.dueDate);
  const dueTime = formatDeadlineTime(item.dueTime);
  const overdue = getDeadlineDayDifference(item.dueDate) < 0 && item.status === "upcoming";
  const content = (
    <>
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.035] text-muted-foreground">
        {item.record?.linkedTaskId ? <ListChecks className="size-4" /> : <CalendarClock className="size-4" />}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[13px] font-medium text-foreground">{item.title}</span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{item.context}</span>
      </span>
      <Badge variant="secondary" className="hidden text-[10px] sm:inline-flex">
        {item.record?.linkedTaskId ? "Task" : item.record?.linkedProjectId ? "Project" : "Deadline"}
      </Badge>
      <span className="w-24 shrink-0 text-right">
        <span className={cn("block text-[11px] font-medium tabular-nums", overdue ? "text-destructive" : dueLabel === "Today" ? "text-warning" : "text-muted-foreground")}>{dueLabel}</span>
        {dueTime ? <span className="mt-0.5 block text-[10px] text-muted-foreground">{dueTime} WIB</span> : null}
      </span>
    </>
  );

  const className = "grid w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring";

  return <button type="button" onClick={onOpen} className={className}>{content}</button>;
}
