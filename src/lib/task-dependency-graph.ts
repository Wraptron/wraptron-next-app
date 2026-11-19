/**
 * Client-side dependency graph helpers (finish-to-start).
 * Edges: taskId depends on dependsOnId.
 */

export function wouldCreateDependencyCycle(
  taskId: number,
  proposedDependsOnIds: number[],
  /** Existing edges for other tasks: taskId -> predecessor ids */
  depsByTaskId: Map<number, number[]>,
): boolean {
  if (proposedDependsOnIds.includes(taskId)) return true;

  const adj = new Map<number, number[]>();
  for (const [id, deps] of depsByTaskId) {
    if (id === taskId) continue;
    adj.set(id, [...deps]);
  }
  adj.set(taskId, [...proposedDependsOnIds]);

  const visiting = new Set<number>();
  const visited = new Set<number>();

  const dfs = (node: number): boolean => {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    for (const next of adj.get(node) ?? []) {
      if (dfs(next)) return true;
    }
    visiting.delete(node);
    visited.add(node);
    return false;
  };

  for (const node of adj.keys()) {
    if (dfs(node)) return true;
  }
  return false;
}

/** Ids that can be selected as predecessors without creating a cycle. */
export function allowedDependencyTargets(
  taskId: number,
  allTaskIds: number[],
  depsByTaskId: Map<number, number[]>,
): number[] {
  return allTaskIds.filter((candidate) => {
    if (candidate === taskId) return false;
    const current = depsByTaskId.get(taskId) ?? [];
    const next = current.includes(candidate)
      ? current
      : [...current, candidate];
    return !wouldCreateDependencyCycle(taskId, next, depsByTaskId);
  });
}

/**
 * True when this task's start is before any known predecessor's end
 * (schedule conflict; library does not auto-reschedule).
 */
export function findPredecessorScheduleConflicts(opts: {
  taskId: string;
  start: Date;
  /** Predecessor ids as strings (Gantt ids). */
  dependencyIds: string[];
  tasksById: Map<
    string,
    { id: string; name: string; start: Date; end: Date }
  >;
}): { predecessorId: string; predecessorName: string }[] {
  const conflicts: { predecessorId: string; predecessorName: string }[] = [];
  for (const depId of opts.dependencyIds) {
    const pred = opts.tasksById.get(depId);
    if (!pred) continue;
    if (opts.start.getTime() < pred.end.getTime()) {
      conflicts.push({
        predecessorId: pred.id,
        predecessorName: pred.name,
      });
    }
  }
  return conflicts;
}
