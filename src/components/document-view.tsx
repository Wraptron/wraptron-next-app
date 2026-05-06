import React from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DocumentField = {
  key: string;
  label: React.ReactNode;
  value: React.ReactNode;
  valueClassName?: string;
};

interface DocumentViewProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  fields: DocumentField[];
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function DocumentView({
  title,
  description,
  actions,
  fields,
  footer,
  className,
  contentClassName,
}: DocumentViewProps) {
  return (
    <Card className={className}>
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {actions && <CardAction>{actions}</CardAction>}
      </CardHeader>

      <CardContent className={cn("space-y-4", contentClassName)}>
        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">No details available.</p>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.key} className="space-y-1">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {field.label}
                </dt>
                <dd className={cn("text-sm", field.valueClassName)}>{field.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>

      {footer && <div className="border-t px-6 pt-4 pb-1">{footer}</div>}
    </Card>
  );
}
