"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import "@uiw/react-md-editor/markdown-editor.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[320px] h-full rounded-md border bg-muted/40 animate-pulse" />
  ),
});

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  /** Pixel height passed to MDEditor; use "100%" with a sized parent via CSS. */
  height?: number | string;
};

export function MarkdownEditor({
  value,
  onChange,
  disabled,
  className,
  id,
  height = "100%",
}: MarkdownEditorProps) {
  return (
    <div
      data-color-mode="light"
      className={cn(
        "requirements-md-editor flex h-full min-h-[360px] w-full flex-col",
        className,
      )}
    >
      <MDEditor
        value={value}
        preview="edit"
        hideToolbar={false}
        visibleDragbar={false}
        height={height}
        className="!h-full flex-1"
        textareaProps={{
          id,
          disabled,
          "aria-label": "Requirements markdown",
          placeholder: "Write your project requirements in Markdown…",
        }}
        onChange={(next) => onChange(next ?? "")}
      />
    </div>
  );
}
