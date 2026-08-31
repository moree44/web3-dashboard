import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type RouteLoadingVariant = "dashboard" | "table" | "board" | "cards" | "settings";

type RouteLoadingProps = {
  titleWidth?: string;
  variant?: RouteLoadingVariant;
};

export function RouteLoading({ titleWidth = "w-56", variant = "table" }: RouteLoadingProps) {
  return (
    <div className="px-4 py-3 sm:px-5 lg:px-6 lg:py-4" aria-label="Loading page">
      <div className="space-y-2">
        <Skeleton className="h-3 w-36" />
        <Skeleton className={cn("h-7", titleWidth)} />
        <Skeleton className="h-3 w-72 max-w-full" />
      </div>
      <div className="mt-3">
        {variant === "dashboard" ? <DashboardSkeleton /> : null}
        {variant === "table" ? <TableSkeleton /> : null}
        {variant === "board" ? <BoardSkeleton /> : null}
        {variant === "cards" ? <CardsSkeleton /> : null}
        {variant === "settings" ? <SettingsSkeleton /> : null}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-3">
      <div className="soft-panel rounded-xl border border-white/[0.06] bg-card p-2">
        <div className="soft-inset flex items-center gap-3 rounded-lg border border-white/[0.055] bg-input px-3 py-2.5">
          <Skeleton className="size-4 shrink-0 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_350px] 2xl:grid-cols-[minmax(420px,1fr)_minmax(340px,0.82fr)_350px]">
        {Array.from({ length: 5 }, (_, index) => (
          <PanelSkeleton key={index} className={index === 2 ? "xl:row-span-2" : ""} rows={index === 2 ? 6 : 4} />
        ))}
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="soft-panel overflow-hidden rounded-xl bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.045] px-3 py-3">
        <Skeleton className="h-8 w-56 max-w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>
      <div className="divide-y divide-white/[0.045]">
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index} className="grid grid-cols-[minmax(0,1fr)_120px_96px_80px] items-center gap-3 px-4 py-3">
            <div className="min-w-0 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-7 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="grid gap-3 xl:grid-cols-3">
      {Array.from({ length: 3 }, (_, columnIndex) => (
        <div key={columnIndex} className="soft-panel rounded-xl border border-white/[0.055] bg-card p-3">
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="size-7" />
          </div>
          <div className="space-y-2.5">
            {Array.from({ length: 4 }, (_, itemIndex) => (
              <div key={itemIndex} className="rounded-lg border border-white/[0.045] bg-white/[0.02] p-3">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="mt-2 h-3 w-1/2" />
                <div className="mt-3 flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CardsSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="soft-panel rounded-xl border border-white/[0.055] bg-card p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="size-10 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="mt-4 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-4/5" />
        </div>
      ))}
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.6fr)]">
      <PanelSkeleton rows={5} />
      <PanelSkeleton rows={4} />
    </div>
  );
}

function PanelSkeleton({ rows = 4, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={cn("soft-panel rounded-xl bg-card p-3", className)}>
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="h-5 w-36" />
      </div>
      <div className="mt-3 space-y-2">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} className={cn("h-4", index % 2 === 0 ? "w-full" : "w-4/5")} />
        ))}
      </div>
    </div>
  );
}
