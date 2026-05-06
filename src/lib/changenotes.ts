export type ChangelogSection = {
  /** Full heading line after `##`, e.g. `0.1.2 — 2026-05-03` */
  heading: string;
  items: string[];
};

/**
 * Parse developer-maintained `changenotes.md`: each `## heading` starts a section;
 * following lines starting with `- ` are bullet items until the next `##`.
 */
export function parseChangenotesMarkdown(md: string): ChangelogSection[] {
  const lines = md.split(/\r?\n/);
  const sections: ChangelogSection[] = [];
  let current: ChangelogSection | null = null;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (current !== null) {
        sections.push(current);
      }
      current = { heading: line.slice(3).trim(), items: [] };
    } else if (current !== null && /^\s*-\s+/.test(line)) {
      current.items.push(line.replace(/^\s*-\s+/, "").trim());
    }
  }
  if (current !== null) {
    sections.push(current);
  }
  return sections;
}
