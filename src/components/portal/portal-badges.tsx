"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  InvoiceStatus,
  ProjectStatus,
  TicketStatus,
  TicketType,
} from "@/lib/portal-data";

const PROJECT_STATUS_STYLES: Record<ProjectStatus, string> = {
  Live: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  "In Progress": "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  Review: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  Paused: "bg-muted text-muted-foreground border-border",
};

const TICKET_TYPE_STYLES: Record<TicketType, string> = {
  Bug: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  Change: "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30",
};

const TICKET_STATUS_STYLES: Record<TicketStatus, string> = {
  Open: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  "In Progress": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  Resolved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  Closed: "bg-muted text-muted-foreground",
};

const INVOICE_STATUS_STYLES: Record<InvoiceStatus, string> = {
  Paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  Due: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  Overdue: "bg-red-500/15 text-red-700 dark:text-red-400",
};

function StatusBadge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <Badge variant="outline" className={cn("font-medium", className)}>
      {label}
    </Badge>
  );
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <StatusBadge label={status} className={PROJECT_STATUS_STYLES[status]} />;
}

export function TicketTypeBadge({ type }: { type: TicketType }) {
  return <StatusBadge label={type} className={TICKET_TYPE_STYLES[type]} />;
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return <StatusBadge label={status} className={TICKET_STATUS_STYLES[status]} />;
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <StatusBadge label={status} className={INVOICE_STATUS_STYLES[status]} />;
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
