"use client";

import { getProjectTaskCompletion } from "@/lib/project-completion";
import type { Task } from "@/lib/api";
import { cn } from "@/lib/utils";

type ProjectTaskCompletionProps = {
  tasks?: Task[] | null;
  className?: string;
  /** Compact single-line layout for cards and table cells */
  variant?: "default" | "compact";
};

export function ProjectTaskCompletion({
  tasks,
  className,
  variant = "default",
}: ProjectTaskCompletionProps) {
  const { total, completed, percent } = getProjectTaskCompletion(tasks);

  if (total === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        No tasks yet
      </p>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("space-y-1", className)}>
        <p className="text-sm font-medium">{percent}% complete</p>
        <p className="text-xs text-muted-foreground">
          {completed} of {total} tasks done
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">{percent}% complete</span>
        <span className="text-muted-foreground">
          {completed} of {total} tasks completed
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${percent}% of tasks completed`}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
