"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

export type AppSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
  meta?: ReactNode;
};

export function AppSelect({
  value,
  options,
  onChange,
  ariaLabel,
  label,
  placeholder = "Select",
  menuHint,
  className,
  triggerClassName,
  menuClassName,
  size = "sm",
  disabled = false,
}: {
  value: string;
  options: AppSelectOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  label?: string;
  placeholder?: string;
  menuHint?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  size?: "xs" | "sm";
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);
  const selectedLabel = selected?.label ?? placeholder;

  useEffect(() => {
    if (!open || !buttonRef.current) {
      setMenuRect(null);
      return;
    }

    function updateRect() {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const width = Math.max(rect.width, 168);
      const viewportPadding = 12;
      const menuHeight = Math.min(240, 8 + options.length * 32 + (menuHint ? 24 : 0));
      const fitsBelow = rect.bottom + 6 + menuHeight <= window.innerHeight - viewportPadding;
      const top = fitsBelow
        ? rect.bottom + 6
        : Math.max(viewportPadding, rect.top - menuHeight - 6);
      setMenuRect({
        top,
        left: Math.min(Math.max(rect.left, viewportPadding), window.innerWidth - width - viewportPadding),
        width,
      });
    }

    function close() {
      setOpen(false);
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      close();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      close();
      window.requestAnimationFrame(() => buttonRef.current?.focus());
    }

    updateRect();
    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [menuHint, open, options.length]);

  function selectValue(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
  }

  const menu = open && menuRect && typeof document !== "undefined"
    ? createPortal(
        <div
          ref={menuRef}
          data-app-floating-menu="true"
          role="listbox"
          aria-label={ariaLabel ?? label ?? placeholder}
          className={cn(
            "fixed z-[120] max-h-60 overflow-y-auto rounded-xl bg-[#18181a]/[0.98] p-1 text-left shadow-2xl shadow-black/45 ring-1 ring-white/[0.055] backdrop-blur scrollbar-subtle",
            menuClassName,
          )}
          style={{ top: menuRect.top, left: menuRect.left, width: menuRect.width }}
        >
          {menuHint ? <div className="px-2 py-1 text-[10px] text-muted-foreground">{menuHint}</div> : null}
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                onClick={() => selectValue(option.value)}
                className={cn(
                  "flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs transition-colors hover:bg-white/[0.055] disabled:cursor-not-allowed disabled:opacity-40",
                  isSelected ? "text-foreground" : "text-[#aeb5bf]",
                )}
              >
                {option.meta ? <span className="grid size-4 shrink-0 place-items-center">{option.meta}</span> : null}
                <span className="min-w-0 flex-1 truncate font-medium">{option.label}</span>
                {isSelected ? <Check className="size-4 shrink-0 text-muted-foreground" /> : null}
              </button>
            );
          })}
        </div>,
        document.body,
      )
    : null;

  return (
    <div className={cn("min-w-0", className)}>
      {label ? <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</span> : null}
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel ?? label ?? placeholder}
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-full bg-white/[0.035] text-left text-muted-foreground outline-none ring-1 ring-white/[0.055] transition-colors hover:bg-white/[0.055] hover:text-foreground focus-visible:ring-white/[0.16] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45",
          size === "xs" ? "h-7 px-2.5 text-[11px]" : "h-8 px-3 text-xs",
          open ? "bg-white/[0.055] text-foreground ring-white/[0.12]" : "",
          label ? "mt-1.5" : "",
          triggerClassName,
        )}
      >
        <span className="min-w-0 truncate font-medium">{selectedLabel}</span>
        <ChevronDown className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", open ? "rotate-180" : "")} />
      </button>
      {menu}
    </div>
  );
}
