import { ArrowUpRight } from "lucide-react";

const accounts = [
  { name: "Moree", initials: "M", done: 6, total: 10 },
  { name: "Wdym", initials: "W", done: 3, total: 7 },
  { name: "Wayss", initials: "WA", done: 0, total: 4 },
];

export function DailyProgress() {
  return (
    <section className="soft-panel rounded-xl border soft-divider bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div><h2 className="text-sm font-semibold">Account workload</h2><p className="mt-0.5 text-[11px] text-muted-foreground">11 of 24 daily tasks complete</p></div>
        <button className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">Daily<ArrowUpRight aria-hidden="true" className="size-3.5" /></button>
      </div>

      <div className="mt-4 space-y-3">
        {accounts.map((account) => {
          const percentage = Math.round((account.done / account.total) * 100);
          return (
            <button key={account.name} className="group w-full text-left">
              <span className="mb-1.5 flex items-center gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-elevated text-[10px] font-semibold">{account.initials}</span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium">{account.name}</span>
                <span className="text-[11px] tabular-nums text-muted-foreground">{account.done}/{account.total}</span>
              </span>
              <span className="soft-inset block h-1.5 overflow-hidden rounded-full bg-background"><span className="block h-full rounded-full bg-white/60" style={{ width: percentage + "%" }} /></span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
