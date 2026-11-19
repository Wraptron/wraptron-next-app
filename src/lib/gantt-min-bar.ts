import { ViewMode } from "gantt-task-react";
import { GANTT_MIN_BAR_PX } from "@/lib/gantt-bar-colors";

/**
 * Returns a display-only end Date so the bar is at least GANTT_MIN_BAR_PX wide.
 * Never persist this end unless the user explicitly resizes/drags the bar.
 */
export function ensureMinDisplayBarEnd(
  start: Date,
  end: Date,
  viewMode: ViewMode,
  columnWidth: number,
  minPx: number = GANTT_MIN_BAR_PX,
): Date {
  let displayEnd =
    end.getTime() > start.getTime()
      ? new Date(end.getTime())
      : new Date(start.getTime() + 24 * 60 * 60 * 1000);

  const msPerColumn =
    viewMode === ViewMode.Month
      ? 30 * 24 * 60 * 60 * 1000
      : viewMode === ViewMode.Week
        ? 7 * 24 * 60 * 60 * 1000
        : 24 * 60 * 60 * 1000;

  const msPerPx = msPerColumn / Math.max(columnWidth, 1);
  const widthPx = (displayEnd.getTime() - start.getTime()) / msPerPx;
  if (widthPx < minPx) {
    displayEnd = new Date(start.getTime() + minPx * msPerPx);
  }
  return displayEnd;
}
