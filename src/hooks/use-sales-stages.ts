"use client";

import { useEffect, useMemo, useState } from "react";
import { salesStagesApi, type SalesStage } from "@/lib/api";

/** Used only when no stages are configured in Settings yet. */
export const DEFAULT_DEAL_STAGES = [
  "New Lead",
  "Qualified",
  "Requirement gathered",
  "Solution proposed",
  "Negotiation/Objection handling",
  "Proposal Accepted",
  "Closed Won",
  "Project Implementation",
  "Maintenance - Project Delivered",
];

export function useSalesStages(enabled = true) {
  const [stages, setStages] = useState<SalesStage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    salesStagesApi
      .getAll()
      .then((res) => {
        if (!cancelled) setStages(res.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setStages([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const stagesSorted = useMemo(() => {
    return [...stages].sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.id - b.id;
    });
  }, [stages]);

  const stageNames = useMemo(
    () =>
      stagesSorted.length > 0
        ? stagesSorted.map((s) => s.name)
        : DEFAULT_DEAL_STAGES,
    [stagesSorted],
  );

  const defaultStageName = stageNames[0] ?? DEFAULT_DEAL_STAGES[0];

  return { stages, stagesSorted, stageNames, defaultStageName, loading };
}
