"use client";

import { useCurrency } from "@/contexts/currency-context";
import {
  formatTimelineHoursAndWeeks,
  type PricingEstimate,
} from "@/lib/pricing-calculator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calculator, Clock } from "lucide-react";

type PricingEstimateSummaryProps = {
  estimate: PricingEstimate;
  projectLabel?: string;
};

export function PricingEstimateSummary({
  estimate,
  projectLabel,
}: PricingEstimateSummaryProps) {
  const { formatCurrency } = useCurrency();
  const { timeline } = estimate;
  const maxPhaseHours = Math.max(...timeline.phases.map((p) => p.hours), 1);

  return (
    <div className="sticky top-6 space-y-4">
      <Card className="border-primary/20 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5 text-primary" />
            Estimate
          </CardTitle>
          {projectLabel ? (
            <CardDescription>{projectLabel}</CardDescription>
          ) : (
            <CardDescription>
              Live estimate based on scope, tech stack, and support.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {estimate.lineItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Configure scope to see a breakdown.
              </p>
            ) : (
              estimate.lineItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium leading-tight">{item.label}</p>
                    {item.detail ? (
                      <p className="text-xs text-muted-foreground">
                        {item.detail}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 tabular-nums">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))
            )}
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Development</span>
              <span className="tabular-nums">
                {formatCurrency(estimate.developmentSubtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Support</span>
              <span className="tabular-nums">
                {formatCurrency(estimate.supportTotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contingency</span>
              <span className="tabular-nums">
                {formatCurrency(estimate.contingency)}
              </span>
            </div>
          </div>

          <Separator />

          <div className="flex items-baseline justify-between">
            <span className="text-base font-semibold">Total estimate</span>
            <span className="text-2xl font-bold tabular-nums text-primary">
              {formatCurrency(estimate.total)}
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            Indicative pricing only. Final quotes may vary after discovery and
            technical review.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" />
            Timeline
          </CardTitle>
          <CardDescription>{timeline.displayLabel}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {timeline.phases.map((phase) => (
              <div key={phase.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate font-medium">
                    {phase.label}
                  </span>
                  <span className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                    {formatTimelineHoursAndWeeks(phase.hours)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/80 transition-all"
                    style={{
                      width: `${Math.max(8, (phase.hours / maxPhaseHours) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex items-baseline justify-between text-sm">
            <span className="font-semibold">Total duration</span>
            <span className="font-semibold tabular-nums text-primary">
              {timeline.displayLabel}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
