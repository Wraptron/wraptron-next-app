"use client";

import React, { useState } from "react";
import { Loader2, Star } from "lucide-react";
import { cn } from "@/lib/utils";

type ProductFeaturedToggleProps = {
  productId: number;
  isFeatured: boolean;
  onToggle: (productId: number, nextFeatured: boolean) => Promise<void>;
  className?: string;
  size?: "sm" | "md";
};

export function ProductFeaturedToggle({
  productId,
  isFeatured,
  onToggle,
  className,
  size = "md",
}: ProductFeaturedToggleProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (loading) return;

    setLoading(true);
    try {
      await onToggle(productId, !isFeatured);
    } finally {
      setLoading(false);
    }
  };

  const iconClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={isFeatured ? "Remove from featured" : "Mark as featured"}
      title={isFeatured ? "Remove from featured" : "Mark as featured"}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md p-1 transition-colors",
        "hover:bg-amber-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      {loading ? (
        <Loader2 className={cn(iconClass, "animate-spin text-muted-foreground")} />
      ) : (
        <Star
          className={cn(
            iconClass,
            isFeatured
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground hover:text-amber-400",
          )}
        />
      )}
    </button>
  );
}
