"use client";

import { CalendarClock, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function AppDatePicker({
  value,
  onChange,
  label,
  ariaLabel,
  placeholder = "Select date",
  className,
  triggerClassName,
  size = "sm",
  timeZone,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  size?: "xs" | "sm";
  timeZone?: string;
}) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => parseDateValue(value || getTodayDateValue(timeZone)));
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const days = getCalendarDays(visibleMonth);
  const todayValue = getTodayDateValue(timeZone);

  useEffect(() => {
    if (!value) return;
    setVisibleMonth(parseDateValue(value));
  }, [value]);

  useEffect(() => {
    if (!open || !buttonRef.current) {
      setMenuRect(null);
      return;
    }

    function updateRect() {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const width = 252;
      const viewportPadding = 12;
      const gap = 6;
      const top = Math.min(rect.bottom + gap, window.innerHeight - 300);
      setMenuRect({
        top: Math.max(viewportPadding, top),
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
  }, [open]);

  function selectDate(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
  }

  const menu = open && menuRect && typeof document !== "undefined"
    ? createPortal(
        <div
          ref={menuRef}
          data-app-floating-menu="true"
          className="popup-in fixed z-[120] overflow-hidden rounded-xl bg-[#18181a]/[0.98] p-2 text-left shadow-2xl shadow-black/45 ring-1 ring-white/[0.055] backdrop-blur"
          style={{ top: menuRect.top, left: menuRect.left, width: menuRect.width }}
        >
          <div className="flex items-center justify-between gap-2 px-1 pb-2">
            <button type="button" onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))} className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-white/[0.055] hover:text-foreground" aria-label="Previous month">‹</button>
            <div className="text-xs font-semibold text-foreground">{formatMonthLabel(visibleMonth)}</div>
            <button type="button" onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))} className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-white/[0.055] hover:text-foreground" aria-label="Next month">›</button>
          </div>

          <div className="grid grid-cols-7 gap-1 px-1 pb-1 text-center text-[10px] font-medium text-muted-foreground">
            {weekDays.map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dateValue = formatDateValue(day.date);
              const selected = value === dateValue;
              const isToday = todayValue === dateValue;
              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => selectDate(dateValue)}
                  className={cn(
                    "grid size-7 place-items-center rounded-lg text-[11px] font-medium transition-colors",
                    day.inMonth ? "text-foreground hover:bg-white/[0.065]" : "text-muted-foreground/45 hover:bg-white/[0.04]",
                    selected ? "bg-white/[0.12] text-foreground shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]" : "",
                    !selected && isToday ? "text-info" : "",
                  )}
                >
                  {day.date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-white/[0.055] px-1 pt-2">
            <button type="button" onClick={() => selectDate("")} className="rounded-lg px-2 py-1 text-[11px] text-muted-foreground hover:bg-white/[0.055] hover:text-foreground">Clear</button>
            <button type="button" onClick={() => { setVisibleMonth(parseDateValue(todayValue)); selectDate(todayValue); }} className="rounded-lg px-2 py-1 text-[11px] font-medium text-foreground hover:bg-white/[0.055]">Today</button>
          </div>
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
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-full bg-white/[0.035] text-left text-muted-foreground outline-none ring-1 ring-white/[0.055] transition-colors hover:bg-white/[0.055] hover:text-foreground focus-visible:ring-white/[0.16] active:scale-[0.99]",
          size === "xs" ? "h-7 px-2.5 text-[11px]" : "h-8 px-3 text-xs",
          open ? "bg-white/[0.055] text-foreground ring-white/[0.12]" : "",
          label ? "mt-1.5" : "",
          triggerClassName,
        )}
      >
        <CalendarClock className="size-3.5 shrink-0 text-muted-foreground" />
        <span className={cn("min-w-0 flex-1 truncate font-medium", value ? "text-foreground" : "text-muted-foreground")}>{value ? formatShortDate(value) : placeholder}</span>
        <ChevronDown className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", open ? "rotate-180" : "")} />
      </button>
      {menu}
    </div>
  );
}

function parseDateValue(value: string) {
  if (!value) return new Date();
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function getTodayDateValue(timeZone?: string) {
  if (timeZone) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;
    if (year && month && day) return year + "-" + month + "-" + day;
  }
  return formatDateValue(new Date());
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit" }).format(parseDateValue(value));
}

function getCalendarDays(monthDate: Date) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      key: date.toISOString(),
      inMonth: date.getMonth() === monthDate.getMonth(),
    };
  });
}
