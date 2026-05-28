"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  contactActivitiesApi,
  type Contact,
  type ContactActivity,
  type CreateContactActivityInput,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckSquare,
  Loader2,
  MessageCircle,
  Phone,
  Trash2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

function contactWhatsAppNumber(c: Contact): string | null {
  const raw = (c.mobile || c.phone || "").trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  return digits || null;
}

function formatActivityWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function activityTypeLabel(type: ContactActivity["type"]) {
  switch (type) {
    case "task":
      return "Task";
    case "call":
      return "Call";
    case "whatsapp":
      return "WhatsApp";
    default:
      return type;
  }
}

function activityIcon(type: ContactActivity["type"]) {
  switch (type) {
    case "task":
      return CheckSquare;
    case "call":
      return Phone;
    case "whatsapp":
      return MessageCircle;
  }
}

function statusBadgeClass(status: string) {
  const s = status.toLowerCase();
  if (s === "completed") {
    return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300";
  }
  if (s === "scheduled") {
    return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
  }
  if (s === "cancelled") {
    return "bg-muted text-muted-foreground";
  }
  return "bg-muted text-muted-foreground";
}

type DialogKind = "task" | "call" | "whatsapp" | null;

export function ContactActivities({ contact }: { contact: Contact }) {
  const [activities, setActivities] = useState<ContactActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [saving, setSaving] = useState(false);

  const [taskSubject, setTaskSubject] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");

  const [callSubject, setCallSubject] = useState("");
  const [callOutcome, setCallOutcome] = useState("");
  const [callDuration, setCallDuration] = useState("");
  const [callNotes, setCallNotes] = useState("");

  const [whatsappMessage, setWhatsappMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await contactActivitiesApi.list(contact.id);
      setActivities(res.data ?? []);
    } catch {
      setError("Failed to load activities");
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [contact.id]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForms = () => {
    setTaskSubject("");
    setTaskDescription("");
    setTaskDueDate("");
    setCallSubject("");
    setCallOutcome("");
    setCallDuration("");
    setCallNotes("");
    setWhatsappMessage("");
  };

  const closeDialog = () => {
    setDialog(null);
    resetForms();
  };

  const submitActivity = async (payload: CreateContactActivityInput) => {
    setSaving(true);
    setError(null);
    try {
      await contactActivitiesApi.create(contact.id, payload);
      closeDialog();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save activity");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTask = () =>
    submitActivity({
      type: "task",
      subject: taskSubject.trim() || "Follow up",
      description: taskDescription.trim() || undefined,
      due_date: taskDueDate ? new Date(taskDueDate).toISOString() : undefined,
      status: "scheduled",
    });

  const handleLogCall = () =>
    submitActivity({
      type: "call",
      subject: callSubject.trim() || "Phone call",
      description: callNotes.trim() || undefined,
      outcome: callOutcome.trim() || undefined,
      duration_minutes: callDuration ? parseInt(callDuration, 10) : undefined,
      status: "completed",
    });

  const handleWhatsApp = async () => {
    const digits = contactWhatsAppNumber(contact);
    if (!digits) {
      setError("This contact has no phone number for WhatsApp.");
      return;
    }
    await submitActivity({
      type: "whatsapp",
      subject: "WhatsApp message",
      description: whatsappMessage.trim() || undefined,
      status: "completed",
    });
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(whatsappMessage.trim())}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const toggleTaskComplete = async (activity: ContactActivity) => {
    const next =
      activity.status === "completed" ? "scheduled" : "completed";
    try {
      await contactActivitiesApi.update(contact.id, activity.id, {
        status: next,
      });
      await load();
    } catch {
      setError("Failed to update task");
    }
  };

  const deleteActivity = async (activityId: number) => {
    if (!confirm("Delete this activity?")) return;
    try {
      await contactActivitiesApi.delete(contact.id, activityId);
      await load();
    } catch {
      setError("Failed to delete activity");
    }
  };

  const waDigits = contactWhatsAppNumber(contact);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">Activities</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDialog("call")}
            >
              <Phone className="h-4 w-4 mr-1.5" />
              Log call
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDialog("task")}
            >
              <CheckSquare className="h-4 w-4 mr-1.5" />
              Add task
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!waDigits}
              title={
                waDigits
                  ? "Log message and open WhatsApp"
                  : "Add a mobile or phone number first"
              }
              onClick={() => setDialog("whatsapp")}
            >
              <MessageCircle className="h-4 w-4 mr-1.5" />
              WhatsApp
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading activities…
          </div>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No activities yet. Log a call, schedule a task, or send a WhatsApp
            message.
          </p>
        ) : (
          <ul className="space-y-3">
            {activities.map((activity) => {
              const Icon = activityIcon(activity.type);
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
                        <p className="font-medium text-sm">
                          {activity.subject || activityTypeLabel(activity.type)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatActivityWhen(activity.activity_date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px]", statusBadgeClass(activity.status))}
                        >
                          {activity.status}
                        </Badge>
                        {activity.type === "task" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title={
                              activity.status === "completed"
                                ? "Mark incomplete"
                                : "Mark complete"
                            }
                            onClick={() => toggleTaskComplete(activity)}
                          >
                            <Check
                              className={cn(
                                "h-4 w-4",
                                activity.status === "completed" &&
                                  "text-green-600 dark:text-green-400",
                              )}
                            />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteActivity(activity.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {activity.description}
                      </p>
                    )}
                    {activity.type === "call" && (
                      <p className="text-xs text-muted-foreground">
                        {activity.duration_minutes != null &&
                          `${activity.duration_minutes} min`}
                        {activity.duration_minutes != null &&
                          activity.outcome &&
                          " · "}
                        {activity.outcome}
                      </p>
                    )}
                    {activity.type === "task" && activity.due_date && (
                      <p className="text-xs text-muted-foreground">
                        Due: {formatActivityWhen(activity.due_date)}
                      </p>
                    )}
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
            <DialogTitle>Add task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="task-subject">Title</Label>
              <Input
                id="task-subject"
                placeholder="e.g. Send proposal"
                value={taskSubject}
                onChange={(e) => setTaskSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-desc">Notes</Label>
              <Textarea
                id="task-desc"
                rows={3}
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">Due date</Label>
              <Input
                id="task-due"
                type="datetime-local"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask} disabled={saving}>
              {saving ? "Saving…" : "Create task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "call"} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log call</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="call-subject">Subject</Label>
              <Input
                id="call-subject"
                placeholder="e.g. Discovery call"
                value={callSubject}
                onChange={(e) => setCallSubject(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="call-duration">Duration (minutes)</Label>
                <Input
                  id="call-duration"
                  type="number"
                  min={0}
                  value={callDuration}
                  onChange={(e) => setCallDuration(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="call-outcome">Outcome</Label>
                <Select value={callOutcome} onValueChange={setCallOutcome}>
                  <SelectTrigger id="call-outcome">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="connected">Connected</SelectItem>
                    <SelectItem value="no_answer">No answer</SelectItem>
                    <SelectItem value="voicemail">Voicemail</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="call-notes">Notes</Label>
              <Textarea
                id="call-notes"
                rows={3}
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleLogCall} disabled={saving}>
              {saving ? "Saving…" : "Save call"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog === "whatsapp"}
        onOpenChange={(o) => !o && closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send WhatsApp message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Your message will be saved as an activity and WhatsApp will open
              with this contact&apos;s number prefilled.
            </p>
            <div className="space-y-2">
              <Label htmlFor="wa-message">Message</Label>
              <Textarea
                id="wa-message"
                rows={4}
                placeholder="Hi, following up on…"
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleWhatsApp}
              disabled={saving || !whatsappMessage.trim()}
            >
              {saving ? "Saving…" : "Log & open WhatsApp"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
