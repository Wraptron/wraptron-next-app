"use client";

import { useCallback, useEffect, useState } from "react";
import { projectsApi, type TaskChange } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { History, Loader2 } from "lucide-react";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function formatValue(value: string | null | undefined) {
  if (value == null || value === "") return "—";
  return value;
}

export function TaskChangeHistory({
  projectId,
  taskId,
  refreshKey = 0,
}: {
  projectId: number;
  taskId: number;
  refreshKey?: number;
}) {
  const [changes, setChanges] = useState<TaskChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await projectsApi.getTaskChanges(projectId, taskId);
      setChanges(res.data ?? []);
    } catch {
      setError("Failed to load change history");
      setChanges([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, taskId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          Change Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : changes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No changes recorded for this task yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Person</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {changes.map((change) => (
                  <TableRow key={change.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatWhen(change.created_at)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {change.changed_by_name || "System"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{change.field_label || change.field_name}</span>
                        {change.change_type === "created" ? (
                          <Badge variant="outline" className="text-xs">
                            Created
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {formatValue(change.old_display_value ?? change.old_value)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {formatValue(change.new_display_value ?? change.new_value)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
