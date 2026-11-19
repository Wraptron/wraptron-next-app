"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { cn } from "@/lib/utils";

type MarkdownPreviewProps = {
  markdown: string;
  className?: string;
  labelledBy?: string;
  /** Debounce rendering for large drafts (ms). 0 = immediate. */
  debounceMs?: number;
};

export function MarkdownPreview({
  markdown,
  className,
  labelledBy,
  debounceMs = 150,
}: MarkdownPreviewProps) {
  const [rendered, setRendered] = useState(markdown);

  useEffect(() => {
    if (debounceMs <= 0) {
      setRendered(markdown);
      return;
    }
    const t = window.setTimeout(() => setRendered(markdown), debounceMs);
    return () => window.clearTimeout(t);
  }, [markdown, debounceMs]);

  return (
    <div
      className={cn(
        "requirements-preview prose prose-sm dark:prose-invert max-w-none text-foreground",
        "prose-headings:scroll-mt-4",
        className,
      )}
      role="region"
      aria-labelledby={labelledBy}
    >
      {rendered.trim() ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSanitize]}
          components={{
            table: ({ children }) => (
              <div className="my-3 w-full max-w-full overflow-x-auto rounded-md border">
                <table className="w-full border-collapse text-sm">{children}</table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border-b bg-muted px-3 py-2 text-left font-semibold whitespace-nowrap">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border-b px-3 py-2 align-top whitespace-nowrap">
                {children}
              </td>
            ),
          }}
        >
          {rendered}
        </ReactMarkdown>
      ) : (
        <p className="text-muted-foreground italic">Nothing to preview yet.</p>
      )}
    </div>
  );
}
