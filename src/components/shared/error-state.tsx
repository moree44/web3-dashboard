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
    <div className={cn("flex min-h-64 flex-col items-center justify-center rounded-xl border border-destructive/25 bg-destructive/5 px-6 py-12 text-center", className)} role="alert">
      <CircleAlert aria-hidden="true" className="size-6 text-destructive" />
      <h2 className="mt-4 font-medium text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {onRetry ? <Button className="mt-5" variant="outline" onClick={onRetry}>Try again</Button> : null}
    </div>
  );
}
