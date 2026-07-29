"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import type { DeadlineOptions } from "../actions";
import { DeadlineDialog } from "./deadline-dialog";

export function DeadlineCreateButton({
  options,
  disabled = false,
}: {
  options: DeadlineOptions;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  function close() {
    setOpen(false);
    window.requestAnimationFrame(() => buttonRef.current?.focus());
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        title={disabled ? "Database connection required" : "Add deadline"}
        className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium text-muted-foreground transition-[background-color,color,transform] duration-150 ease-out hover:bg-white/[0.045] hover:text-foreground active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-colors motion-reduce:active:scale-100"
      >
        <Plus className="size-3.5" />
        Add
      </button>
      <DeadlineDialog
        open={open}
        onClose={close}
        options={options}
        onSaved={() => router.refresh()}
      />
    </>
  );
}
