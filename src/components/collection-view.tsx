import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CollectionItem = {
  id: string | number;
  title: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
};

interface CollectionViewProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  items: CollectionItem[];
  emptyTitle?: React.ReactNode;
  emptyDescription?: React.ReactNode;
  loading?: boolean;
  className?: string;
  contentClassName?: string;
}

export function CollectionView({
  title,
  description,
  items,
  emptyTitle = "No items yet",
  emptyDescription = "Create a new item to get started.",
  loading = false,
  className,
  contentClassName,
}: CollectionViewProps) {
  return (
    <Card className={cn("gap-0", className)}>
      {(title || description) && (
        <CardHeader className="border-b">
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}

      <CardContent className={cn("p-0", contentClassName)}>
        {loading ? (
          <div className="px-6 py-10 text-sm text-muted-foreground">Loading items...</div>
        ) : items.length === 0 ? (
          <div className="px-6 py-10">
            <p className="text-sm font-medium">{emptyTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-4 px-6 py-4 transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}
                  {item.meta && <div className="text-xs text-muted-foreground">{item.meta}</div>}
                </div>
                {item.actions && <div className="shrink-0">{item.actions}</div>}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
