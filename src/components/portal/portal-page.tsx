"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface PortalPageProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PortalPage({
  title,
  description,
  actions,
  children,
  className,
}: PortalPageProps) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto bg-background text-foreground",
        className,
      )}
    >
      <div className="w-full px-4 py-6 md:px-6 md:py-8 lg:px-8 xl:px-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description ? (
              <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="shrink-0 flex flex-wrap gap-2">{actions}</div>
          ) : null}
        </header>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
