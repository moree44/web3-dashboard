"use client";

import { CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({ title = "Something went wrong", description = "We could not load this section. Try again in a moment.", onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn("flex min-h-48 flex-col items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025] px-5 py-8 text-center", className)} role="alert">
      <span className="grid size-8 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.035] text-muted-foreground">
        <CircleAlert aria-hidden="true" className="size-4" />
      </span>
      <h2 className="mt-3 text-sm font-medium text-foreground">{title}</h2>
      <p className="mt-1.5 max-w-md text-xs leading-5 text-muted-foreground">{description}</p>
      {onRetry ? <Button className="mt-4" size="sm" variant="outline" onClick={onRetry}>Try again</Button> : null}
    </div>
  );
}
