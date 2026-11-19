"use client";

import dynamic from "next/dynamic";
import type { Task } from "@/lib/api";
import { cn } from "@/lib/utils";

const TaskGantt = dynamic(
  () => import("./TaskGantt").then((mod) => mod.TaskGantt),
  {
    ssr: false,
    loading: () => (
      <div
        className="min-h-[320px] animate-pulse rounded-lg border border-border bg-muted/40"
        aria-hidden
      />
    ),
  },
);

type TaskGanttLoaderProps = {
  tasks: Task[];
  projectId: number;
  onTaskUpdate: (taskUpdate?: Task) => void;
  className?: string;
};

export function TaskGanttLoader({
  tasks,
  projectId,
  onTaskUpdate,
  className,
}: TaskGanttLoaderProps) {
  return (
    <div className={cn(className)}>
      <TaskGantt
        tasks={tasks}
        projectId={projectId}
        onTaskUpdate={onTaskUpdate}
      />
    </div>
  );
}
