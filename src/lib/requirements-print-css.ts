/** Stylesheet for requirements PDF export (single source of truth). */
export const REQUIREMENTS_PRINT_CSS = `@page {
  size: A4;
  margin: 18mm 15mm;
}

@page {
  @bottom-center {
    content: counter(page) " / " counter(pages);
    font-family: var(--font-open-sans), system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
    font-size: 9pt;
    color: #444;
  }
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  color: #111;
  background: #fff;
  font-family: var(--font-open-sans), system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.45;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.requirements-print-body {
  margin: 0;
  padding: 0;
}

.requirements-print-body > :first-child {
  margin-top: 0;
}

.requirements-print-body h1 {
  font-size: 16pt;
  font-weight: 700;
  margin: 1.1em 0 0.4em;
}

.requirements-print-body h2 {
  font-size: 13.5pt;
  font-weight: 600;
  margin: 1em 0 0.35em;
}

.requirements-print-body h3 {
  font-size: 12pt;
  font-weight: 600;
  margin: 0.9em 0 0.3em;
}

.requirements-print-body h1,
.requirements-print-body h2,
.requirements-print-body h3 {
  break-after: avoid;
  page-break-after: avoid;
}

.requirements-print-body p,
.requirements-print-body ul,
.requirements-print-body ol {
  margin: 0 0 0.7em;
}

.requirements-print-body a {
  color: inherit;
  text-decoration: underline;
}

.requirements-print-body pre,
.requirements-print-body blockquote,
.requirements-print-body img,
.requirements-print-body tr {
  break-inside: avoid;
  page-break-inside: avoid;
}

.requirements-print-body pre {
  white-space: pre-wrap;
  word-break: break-word;
  background: #f5f5f5;
  border: 1px solid #ddd;
  padding: 0.6em 0.75em;
  font-size: 9.5pt;
  font-family: ui-monospace, "SF Mono", Consolas, monospace;
}

.requirements-print-body blockquote {
  margin: 0 0 0.8em;
  padding: 0.2em 0 0.2em 0.8em;
  border-left: 3px solid #ccc;
  color: #333;
}

.requirements-print-body thead {
  display: table-header-group;
}

.requirements-print-body table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
  margin: 0.6em 0 1em;
  font-size: 9pt;
  word-break: break-word;
}

.requirements-print-body th,
.requirements-print-body td {
  border: 1px solid #bbb;
  padding: 0.35em 0.45em;
  vertical-align: top;
  text-align: left;
}

.requirements-print-body th {
  background: #eee;
  font-weight: 700;
}

.requirements-print-body code {
  font-family: ui-monospace, "SF Mono", Consolas, monospace;
  font-size: 0.92em;
}

.requirements-print-body em,
.requirements-print-body i {
  font-style: italic;
}

.requirements-print-body strong,
.requirements-print-body b {
  font-weight: 700;
}
`;
