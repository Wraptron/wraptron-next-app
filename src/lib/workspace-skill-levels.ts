/** Standard proficiency levels for workspace skills (aligned with Settings → Workspace skills). */
export const WORKSPACE_SKILL_LEVELS = [
  { value: 1, label: "L1", description: "New or intermediate" },
  { value: 2, label: "L2", description: "Can work with supervision" },
  { value: 3, label: "L3", description: "Can perform tasks independently" },
  { value: 4, label: "L4", description: "Can train other employees" },
] as const;

export function workspaceSkillLevelDescription(level: number): string {
  const row = WORKSPACE_SKILL_LEVELS.find((l) => l.value === level);
  return row ? `${row.label}: ${row.description}` : `Level ${level}`;
}
