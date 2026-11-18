import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { openSans } from "@/fonts/open-sans";
import { REQUIREMENTS_PRINT_CSS } from "@/lib/requirements-print-css";

export type BuildRequirementsPrintHtmlOptions = {
  markdown: string;
  /** Used only for the document title (`<project>-requirements`). */
  projectName: string;
  documentTitle?: string;
};

const printSanitizeSchema = {
  ...defaultSchema,
  tagNames: (defaultSchema.tagNames ?? []).filter(
    (tag) =>
      tag !== "img" &&
      tag !== "picture" &&
      tag !== "source" &&
      tag !== "video" &&
      tag !== "audio" &&
      tag !== "iframe",
  ),
  attributes: {
    ...defaultSchema.attributes,
    img: undefined,
  },
};

/** True when the draft has exportable content. */
export function canExportRequirementsPdf(markdown: string): boolean {
  return markdown.trim().length > 0;
}

/** Safe base name for the saved PDF (`<project>-requirements`). */
export function requirementsPdfDocumentTitle(projectName: string): string {
  const slug =
    projectName
      .trim()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "project";
  return `${slug}-requirements`;
}

/** Render markdown with the same GFM + sanitize pipeline as the preview (images stripped). */
export function markdownToPrintBodyHtml(markdown: string): string {
  if (!markdown.trim()) return "";

  const file = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    // unified overloads struggle with rehype-sanitize options; runtime is fine.
    .use(rehypeSanitize, printSanitizeSchema as never)
    .use(rehypeStringify)
    .processSync(markdown);

  return `<div class="requirements-print-body">${String(file)}</div>`;
}

export function buildRequirementsPrintCss(): string {
  return REQUIREMENTS_PRINT_CSS;
}

/**
 * CSS tweaks for html2canvas (screen render): A4 width + page margins as padding.
 * `@page` rules are ignored by canvas capture.
 */
function buildRequirementsDownloadCss(): string {
  return `${buildRequirementsPrintCss()}

.requirements-pdf-root {
  width: 210mm;
  box-sizing: border-box;
  padding: 18mm 15mm;
  background: #fff;
  color: #111;
  font-family: var(--font-open-sans), system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.45;
}
`;
}

/** Full HTML document used for debug preview (markdown only, no title block). */
export function buildRequirementsPrintHtml(
  options: BuildRequirementsPrintHtmlOptions,
): string {
  if (!canExportRequirementsPdf(options.markdown)) {
    throw new Error("Nothing to export");
  }

  const title =
    options.documentTitle ?? requirementsPdfDocumentTitle(options.projectName);
  const css = buildRequirementsPrintCss();
  const body = markdownToPrintBodyHtml(options.markdown);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>${css}</style>
</head>
<body class="${openSans.variable}">
${body}
</body>
</html>`;
}

export type DownloadRequirementsPdfResult =
  | { ok: true }
  | { ok: false; reason: "empty" | "blocked" | "error"; message: string };

/** @deprecated Use DownloadRequirementsPdfResult */
export type PrintRequirementsPdfResult = DownloadRequirementsPdfResult;

/**
 * Generate a PDF from the current requirements draft and trigger a file download.
 * Caller should flush autosave first when the user can edit.
 */
export async function downloadRequirementsPdf(
  options: BuildRequirementsPrintHtmlOptions,
): Promise<DownloadRequirementsPdfResult> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return {
      ok: false,
      reason: "error",
      message: "PDF download is only available in the browser.",
    };
  }

  if (!canExportRequirementsPdf(options.markdown)) {
    return { ok: false, reason: "empty", message: "Nothing to export" };
  }

  let host: HTMLDivElement | null = null;

  try {
    const documentTitle =
      options.documentTitle ??
      requirementsPdfDocumentTitle(options.projectName);
    const css = buildRequirementsDownloadCss();
    const body = markdownToPrintBodyHtml(options.markdown);

    host = document.createElement("div");
    host.setAttribute("aria-hidden", "true");
    host.className = `${openSans.className} ${openSans.variable}`;
    host.style.position = "fixed";
    host.style.left = "-10000px";
    host.style.top = "0";
    host.style.width = "210mm";
    host.style.background = "#fff";
    host.style.pointerEvents = "none";
    host.style.zIndex = "-1";
    host.innerHTML = `<style>${css}</style><div class="requirements-pdf-root">${body}</div>`;
    document.body.appendChild(host);

    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const target =
      host.querySelector<HTMLElement>(".requirements-pdf-root") ?? host;
    const html2pdf = (await import("html2pdf.js")).default;
    const filename = `${documentTitle}.pdf`;
    const blob: Blob = await html2pdf()
      .set({
        margin: 0,
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      })
      .from(target)
      .toPdf()
      .outputPdf("blob");

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);

    cleanupHost(host);
    host = null;
    return { ok: true };
  } catch (err) {
    if (host) cleanupHost(host);
    return {
      ok: false,
      reason: "error",
      message:
        err instanceof Error ? err.message : "Failed to prepare the PDF export.",
    };
  }
}

/**
 * @deprecated Prefer downloadRequirementsPdf — kept for older call sites.
 */
export async function printRequirementsPdf(
  options: BuildRequirementsPrintHtmlOptions,
): Promise<DownloadRequirementsPdfResult> {
  return downloadRequirementsPdf(options);
}

function cleanupHost(host: HTMLDivElement | null): void {
  if (!host) return;
  try {
    host.remove();
  } catch {
    // ignore
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
