"use client";

import React from "react";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PreviewToolbarProps {
  mode: "desktop" | "mobile" | "tablet";
  onModeChange: (mode: "desktop" | "mobile" | "tablet") => void;
}

export function PreviewToolbar({ mode, onModeChange }: PreviewToolbarProps) {
  return (
    <div className="border-b bg-white px-4 py-2 flex items-center justify-center gap-2">
      <Button
        variant={mode === "desktop" ? "default" : "ghost"}
        size="sm"
        onClick={() => onModeChange("desktop")}
        className="gap-2"
      >
        <Monitor className="h-4 w-4" />
        Desktop
      </Button>
      <Button
        variant={mode === "tablet" ? "default" : "ghost"}
        size="sm"
        onClick={() => onModeChange("tablet")}
        className="gap-2"
      >
        <Tablet className="h-4 w-4" />
        Tablet
      </Button>
      <Button
        variant={mode === "mobile" ? "default" : "ghost"}
        size="sm"
        onClick={() => onModeChange("mobile")}
        className="gap-2"
      >
        <Smartphone className="h-4 w-4" />
        Mobile
      </Button>
    </div>
  );
}
