"use client";

import type { ScopeScaleOption } from "@/lib/pricing-calculator";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type ScopeScaleSliderProps = {
  label: string;
  options: ScopeScaleOption[];
  valueIndex: number;
  onValueIndexChange: (index: number) => void;
  className?: string;
  /** When true, shows only min/max labels and the current count instead of every option label */
  numeric?: boolean;
};

export function ScopeScaleSlider({
  label,
  options,
  valueIndex,
  onValueIndexChange,
  className,
  numeric,
}: ScopeScaleSliderProps) {
  const selected = options[valueIndex] ?? options[0];
  const maxIndex = Math.max(0, options.length - 1);
  const isNumeric = numeric ?? options.length > 10;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <Label>{label}</Label>
        <span className="shrink-0 text-sm font-medium tabular-nums text-primary">
          {isNumeric ? selected.count : `~${selected.count}`}
        </span>
      </div>

      <div className="rounded-lg border bg-muted/20 p-4">
        {!isNumeric && (
          <>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <p className="font-medium">{selected.label}</p>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              {selected.description}
            </p>
          </>
        )}

        <Slider
          min={0}
          max={maxIndex}
          step={1}
          value={[valueIndex]}
          onValueChange={(values) => onValueIndexChange(values[0] ?? 0)}
          aria-label={label}
        />

        {isNumeric ? (
          <div className="mt-3 flex justify-between gap-1">
            <span className="text-xs text-muted-foreground">{options[0]?.count ?? 1}</span>
            <span className="text-xs text-muted-foreground">{options[maxIndex]?.count}</span>
          </div>
        ) : (
          <div className="mt-3 flex justify-between gap-1">
            {options.map((option, index) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onValueIndexChange(index)}
                className={cn(
                  "flex-1 truncate text-center text-[10px] leading-tight transition-colors sm:text-xs",
                  index === valueIndex
                    ? "font-semibold text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                title={option.description}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
