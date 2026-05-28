"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  dealActivitiesApi,
  type CreateDealActivityInput,
  type Deal,
  type DealActivity,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, CheckSquare, Loader2, Phone, StickyNote, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogKind = "task" | "call" | "note" | null;

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

function typeIcon(type: DealActivity["type"]) {
  switch (type) {
    case "task":
      return CheckSquare;
    case "call":
      return Phone;
    default:
      return StickyNote;
  }
}

function typeLabel(type: DealActivity["type"]) {
  switch (type) {
    case "task":
      return "Task";
    case "call":
      return "Call";
    case "note":
      return "Note";
    case "meeting":
      return "Meeting";
    case "whatsapp":
      return "WhatsApp";
    default:
      return type;
  }
}

function statusClass(status: string) {
  const key = status.toLowerCase();
  if (key === "completed") {
    return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300";
  }
  if (key === "scheduled") {
    return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
  }
  return "bg-muted text-muted-foreground";
}

export function DealActivities({ deal }: { deal: Deal }) {
  const [activities, setActivities] = useState<DealActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [saving, setSaving] = useState(false);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskNotes, setTaskNotes] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [callSummary, setCallSummary] = useState("");
  const [callOutcome, setCallOutcome] = useState("");
  const [callDuration, setCallDuration] = useState("");
  const [noteText, setNoteText] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dealActivitiesApi.list(deal.id);
      setActivities(res.data ?? []);
    } catch {
      setError("Failed to load activities");
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [deal.id]);

  useEffect(() => {
    load();
  }, [load]);

  const reset = () => {
    setTaskTitle("");
    setTaskNotes("");
    setTaskDue("");
    setCallSummary("");
    setCallOutcome("");
    setCallDuration("");
    setNoteText("");
  };

  const closeDialog = () => {
    setDialog(null);
    reset();
  };

  const submit = async (payload: CreateDealActivityInput) => {
    setSaving(true);
    setError(null);
    try {
      await dealActivitiesApi.create(deal.id, payload);
      closeDialog();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save activity");
    } finally {
      setSaving(false);
    }
  };

  const addTask = () =>
    submit({
      type: "task",
      subject: taskTitle.trim() || "Follow up",
      description: taskNotes.trim() || undefined,
      due_date: taskDue ? new Date(taskDue).toISOString() : undefined,
      status: "scheduled",
      contact_id: deal.contact_id,
    });

  const addCall = () =>
    submit({
      type: "call",
      subject: callSummary.trim() || "Call",
      description: callOutcome.trim() || undefined,
      duration_minutes: callDuration ? parseInt(callDuration, 10) : undefined,
      status: "completed",
      contact_id: deal.contact_id,
    });

  const addNote = () =>
    submit({
      type: "note",
      subject: "Deal note",
      description: noteText.trim() || undefined,
      status: "completed",
      contact_id: deal.contact_id,
    });

  const toggleTaskDone = async (activity: DealActivity) => {
    try {
      await dealActivitiesApi.update(deal.id, activity.id, {
        status: activity.status === "completed" ? "scheduled" : "completed",
      });
      await load();
    } catch {
      setError("Failed to update task");
    }
  };

  const remove = async (activityId: number) => {
    if (!confirm("Delete this activity?")) return;
    try {
      await dealActivitiesApi.delete(deal.id, activityId);
      await load();
    } catch {
      setError("Failed to delete activity");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">Activities</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialog("call")}>
              <Phone className="mr-1.5 h-4 w-4" />
              Log call
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDialog("task")}>
              <CheckSquare className="mr-1.5 h-4 w-4" />
              Add task
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDialog("note")}>
              <StickyNote className="mr-1.5 h-4 w-4" />
              Add note
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading activities…
          </div>
        ) : activities.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No activities yet for this deal.
          </p>
        ) : (
          <ul className="space-y-3">
            {activities.map((activity) => {
              const Icon = typeIcon(activity.type);
              return (
                <li
                  key={activity.id}
                  className="flex gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">
                          {activity.subject || typeLabel(activity.type)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatWhen(activity.activity_date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px]", statusClass(activity.status))}
                        >
                          {activity.status}
                        </Badge>
                        {activity.type === "task" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleTaskDone(activity)}
                            title={
                              activity.status === "completed"
                                ? "Mark incomplete"
                                : "Mark complete"
                            }
                          >
                            <Check
                              className={cn(
                                "h-4 w-4",
                                activity.status === "completed"
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-muted-foreground",
                              )}
                            />
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => remove(activity.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {activity.description ? (
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                    ) : null}
                    {activity.type === "task" && activity.due_date ? (
                      <p className="text-xs text-muted-foreground">
                        Due: {formatWhen(activity.due_date)}
                      </p>
                    ) : null}
                    {activity.type === "call" && activity.duration_minutes != null ? (
                      <p className="text-xs text-muted-foreground">
                        Duration: {activity.duration_minutes} min
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      <Dialog open={dialog === "task"} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add task activity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="deal-task-title">Title</Label>
              <Input
                id="deal-task-title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Share proposal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal-task-notes">Notes</Label>
              <Textarea
                id="deal-task-notes"
                rows={3}
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal-task-due">Due date</Label>
              <Input
                id="deal-task-due"
                type="datetime-local"
                value={taskDue}
                onChange={(e) => setTaskDue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={addTask} disabled={saving}>
              {saving ? "Saving…" : "Create task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "call"} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log call activity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="deal-call-summary">Summary</Label>
              <Input
                id="deal-call-summary"
                value={callSummary}
                onChange={(e) => setCallSummary(e.target.value)}
                placeholder="e.g. Qualification call"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal-call-duration">Duration (minutes)</Label>
              <Input
                id="deal-call-duration"
                type="number"
                min={0}
                value={callDuration}
                onChange={(e) => setCallDuration(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal-call-outcome">Outcome / notes</Label>
              <Textarea
                id="deal-call-outcome"
                rows={3}
                value={callOutcome}
                onChange={(e) => setCallOutcome(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={addCall} disabled={saving}>
              {saving ? "Saving…" : "Save call"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "note"} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add note</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="deal-note">Note</Label>
            <Textarea
              id="deal-note"
              rows={4}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add context for this deal..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={addNote} disabled={saving || !noteText.trim()}>
              {saving ? "Saving…" : "Save note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

