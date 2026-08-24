"use client";

import * as React from "react";
import { Clock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TimePickerProps {
  value?: string; // 24-hour format "HH:MM" e.g. "09:20" or "18:00"
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

// Convert "HH:MM" (24h) to { hour12: number, minute: number, period: "AM" | "PM" }
function parseTime24(timeStr?: string) {
  if (!timeStr || !timeStr.includes(":")) {
    return { hour12: 9, minute: 0, period: "AM" as const };
  }
  const [hStr, mStr] = timeStr.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h)) h = 9;
  const period = h >= 12 ? ("PM" as const) : ("AM" as const);
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute: isNaN(m) ? 0 : m, period };
}

// Convert { hour12, minute, period } to "HH:MM" 24-hour format
function formatTime24(hour12: number, minute: number, period: "AM" | "PM") {
  let h24 = hour12 % 12;
  if (period === "PM") {
    h24 += 12;
  }
  const hh = h24.toString().padStart(2, "0");
  const mm = minute.toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

// Format 12-hour display string for button
function formatDisplayTime(hour12: number, minute: number, period: "AM" | "PM") {
  const hh = hour12.toString().padStart(2, "0");
  const mm = minute.toString().padStart(2, "0");
  return `${hh}:${mm} ${period}`;
}

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1 to 12
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const QUICK_PRESETS_MORNING = [
  { label: "09:00 AM", value: "09:00" },
  { label: "09:15 AM", value: "09:15" },
  { label: "09:20 AM", value: "09:20" },
  { label: "09:30 AM", value: "09:30" },
  { label: "10:00 AM", value: "10:00" },
];

const QUICK_PRESETS_EVENING = [
  { label: "05:00 PM", value: "17:00" },
  { label: "05:30 PM", value: "17:30" },
  { label: "06:00 PM", value: "18:00" },
  { label: "06:30 PM", value: "18:30" },
  { label: "07:00 PM", value: "19:00" },
];

export function TimePicker({
  value = "09:00",
  onChange,
  className,
  disabled = false,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const { hour12, minute, period } = parseTime24(value);

  const handleSelectHour = (newHour: number) => {
    onChange(formatTime24(newHour, minute, period));
  };

  const handleSelectMinute = (newMinute: number) => {
    onChange(formatTime24(hour12, newMinute, period));
  };

  const handleSelectPeriod = (newPeriod: "AM" | "PM") => {
    onChange(formatTime24(hour12, minute, newPeriod));
  };

  const handlePresetSelect = (presetVal: string) => {
    onChange(presetVal);
  };

  const displayString = formatDisplayTime(hour12, minute, period);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-[145px] h-9 px-3 justify-between font-medium text-xs rounded-md border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-xs transition-colors",
            className
          )}
        >
          <span className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-primary opacity-80" />
            <span>{displayString}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 p-3 bg-popover border border-border/80 shadow-xl rounded-xl"
      >
        {/* Header Preview */}
        <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-border/60">
          <span className="text-xs font-semibold text-muted-foreground">Select Time</span>
          <div className="px-2.5 py-1 bg-primary/10 text-primary font-semibold text-xs rounded-md tracking-wide">
            {displayString}
          </div>
        </div>

        {/* Quick Presets */}
        <div className="space-y-1.5 mb-3">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Quick Presets
          </span>
          <div className="flex flex-wrap gap-1">
            {[...QUICK_PRESETS_MORNING, ...QUICK_PRESETS_EVENING].map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => handlePresetSelect(preset.value)}
                className={cn(
                  "px-2 py-0.5 text-[11px] rounded-md transition-colors font-medium border",
                  value === preset.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 hover:bg-muted text-foreground border-transparent"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Time Columns Selector */}
        <div className="pt-2 border-t border-border/60">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-2">
            Custom Time
          </span>
          <div className="grid grid-cols-3 gap-2">
            {/* Hours Column */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-medium text-muted-foreground mb-1">Hour</span>
              <ScrollArea className="h-36 w-full rounded-md border border-border/50 p-1">
                <div className="space-y-1">
                  {HOURS_12.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleSelectHour(h)}
                      className={cn(
                        "w-full py-1 text-xs rounded-md transition-colors font-medium text-center",
                        hour12 === h
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "hover:bg-accent hover:text-accent-foreground text-foreground"
                      )}
                    >
                      {h.toString().padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Minutes Column */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-medium text-muted-foreground mb-1">Minute</span>
              <ScrollArea className="h-36 w-full rounded-md border border-border/50 p-1">
                <div className="space-y-1">
                  {MINUTES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectMinute(m)}
                      className={cn(
                        "w-full py-1 text-xs rounded-md transition-colors font-medium text-center",
                        minute === m
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "hover:bg-accent hover:text-accent-foreground text-foreground"
                      )}
                    >
                      {m.toString().padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* AM/PM Toggle */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-medium text-muted-foreground mb-1">Period</span>
              <div className="flex flex-col gap-1 w-full pt-1">
                <button
                  type="button"
                  onClick={() => handleSelectPeriod("AM")}
                  className={cn(
                    "w-full py-2 text-xs rounded-md transition-colors font-semibold text-center border",
                    period === "AM"
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-background hover:bg-accent border-border text-foreground"
                  )}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPeriod("PM")}
                  className={cn(
                    "w-full py-2 text-xs rounded-md transition-colors font-semibold text-center border",
                    period === "PM"
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-background hover:bg-accent border-border text-foreground"
                  )}
                >
                  PM
                </button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
