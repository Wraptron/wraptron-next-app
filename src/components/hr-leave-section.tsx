"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  Loader2,
  Plane,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getApiErrorMessage,
  leavesApi,
  type LeaveRequest,
  type LeaveStatus,
  type LeaveType,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

const LEAVE_TYPE_OPTIONS: { value: LeaveType; label: string }[] = [
  { value: "casual", label: "Casual leave" },
  { value: "sick", label: "Sick leave" },
  { value: "earned", label: "Earned / privilege" },
  { value: "unpaid", label: "Unpaid leave" },
  { value: "compensatory", label: "Compensatory off" },
];

function leaveTypeLabel(value: string): string {
  return LEAVE_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function statusBadgeClass(status: LeaveStatus): string {
  if (status === "approved") {
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
  }
  if (status === "pending") {
    return "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30";
  }
  if (status === "rejected") {
    return "bg-destructive/10 text-destructive border-destructive/20";
  }
  return "bg-muted text-muted-foreground border-border";
}

interface HrLeaveSectionProps {
  year: number;
  leaves: LeaveRequest[];
  loading: boolean;
  isAdmin: boolean;
  /** Where this section is shown — HR reviews, workspace applies. */
  mode?: "hr" | "workspace";
  applyOpen?: boolean;
  defaultStartDate?: string;
  defaultEndDate?: string;
  onApplyOpenChange?: (open: boolean) => void;
  onChanged: () => Promise<void> | void;
}

export function HrLeaveSection({
  year,
  leaves,
  loading,
  isAdmin,
  mode = "workspace",
  applyOpen = false,
  defaultStartDate = "",
  defaultEndDate = "",
  onApplyOpenChange,
  onChanged,
}: HrLeaveSectionProps) {
  const { user } = useAuth();
  const canReview = mode === "hr" && isAdmin;
  const canApply = mode === "workspace";
  const showEmployeeColumn = mode === "hr" || isAdmin;

  const [leaveType, setLeaveType] = useState<LeaveType>("casual");
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  useEffect(() => {
    if (!canApply || !applyOpen) return;
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate || defaultStartDate);
    setFormError(null);
  }, [applyOpen, defaultStartDate, defaultEndDate, canApply]);

  const visibleLeaves = useMemo(() => {
    if (mode === "workspace") {
      // Employees see their own requests (pending + approved + rejected).
      // Approved leave from the team is also useful for admins browsing workspace.
      if (isAdmin) {
        return leaves.filter(
          (leave) =>
            leave.status === "approved" ||
            leave.status === "pending" ||
            leave.user_id === user?.id,
        );
      }
      return leaves;
    }
    return leaves;
  }, [leaves, mode, isAdmin, user?.id]);

  const pendingLeaves = useMemo(
    () => visibleLeaves.filter((leave) => leave.status === "pending"),
    [visibleLeaves],
  );

  const handleApply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!startDate || !endDate) {
      setFormError("Start date and end date are required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await leavesApi.apply({
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim() || undefined,
      });
      setReason("");
      onApplyOpenChange?.(false);
      await onChanged();
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Failed to apply for leave."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (leave: LeaveRequest) => {
    if (!confirm("Cancel this leave request?")) return;
    try {
      await leavesApi.cancel(leave.id);
      await onChanged();
    } catch (err) {
      alert(getApiErrorMessage(err, "Failed to cancel leave request."));
    }
  };

  const handleApprove = async (leave: LeaveRequest) => {
    setReviewingId(leave.id);
    try {
      await leavesApi.review(leave.id, { status: "approved" });
      await onChanged();
    } catch (err) {
      alert(getApiErrorMessage(err, "Failed to approve leave."));
    } finally {
      setReviewingId(null);
    }
  };

  const handleReject = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!rejectTarget) return;
    setReviewingId(rejectTarget.id);
    try {
      await leavesApi.review(rejectTarget.id, {
        status: "rejected",
        comment: rejectComment.trim() || undefined,
      });
      setRejectTarget(null);
      setRejectComment("");
      await onChanged();
    } catch (err) {
      alert(getApiErrorMessage(err, "Failed to reject leave."));
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <>
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-muted/20 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Plane className="h-4 w-4 text-violet-600" />
                Leave requests ({year})
              </CardTitle>
              <CardDescription className="text-xs">
                {mode === "hr"
                  ? canReview
                    ? "Approve or reject pending leave requests from your team."
                    : "Leave requests for this organization."
                  : "Your leave requests. Approved leave appears here after HR review."}
              </CardDescription>
            </div>
            {canReview && pendingLeaves.length > 0 ? (
              <Badge className="bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">
                {pendingLeaves.length} pending
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Loading leave requests…
            </div>
          ) : visibleLeaves.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground space-y-2">
              <Plane className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="font-medium text-foreground">No leave requests for {year}</p>
              <p className="text-xs">
                {mode === "hr"
                  ? "Employee leave requests from Workspace will appear here for review."
                  : "Click Apply leave or a working day on the calendar to submit a request."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  {showEmployeeColumn ? (
                    <TableHead className="font-semibold text-foreground">Employee</TableHead>
                  ) : null}
                  <TableHead className="font-semibold text-foreground">Type</TableHead>
                  <TableHead className="font-semibold text-foreground">Dates</TableHead>
                  <TableHead className="font-semibold text-foreground">Days</TableHead>
                  <TableHead className="font-semibold text-foreground">Reason</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                  <TableHead className="text-right font-semibold text-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleLeaves.map((leave) => {
                  const isOwn = user?.id === leave.user_id;
                  const busy = reviewingId === leave.id;
                  return (
                    <TableRow key={leave.id} className="hover:bg-muted/30">
                      {showEmployeeColumn ? (
                        <TableCell className="font-semibold text-foreground">
                          {leave.employee_name}
                          {leave.employee_email ? (
                            <p className="text-[11px] font-normal text-muted-foreground">
                              {leave.employee_email}
                            </p>
                          ) : null}
                        </TableCell>
                      ) : null}
                      <TableCell className="text-sm capitalize">
                        {leaveTypeLabel(String(leave.leave_type))}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-foreground whitespace-nowrap">
                        {leave.start_date === leave.end_date
                          ? leave.start_date
                          : `${leave.start_date} → ${leave.end_date}`}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{leave.days}</TableCell>
                      <TableCell className="text-muted-foreground text-xs max-w-[220px]">
                        <span className="line-clamp-2">{leave.reason || "—"}</span>
                        {leave.review_comment ? (
                          <p className="mt-1 text-[11px] text-muted-foreground/80">
                            Admin: {leave.review_comment}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase tracking-wide ${statusBadgeClass(leave.status)}`}
                        >
                          {leave.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {canReview && leave.status === "pending" ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs gap-1 border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10"
                                disabled={busy}
                                onClick={() => void handleApprove(leave)}
                              >
                                {busy ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                                disabled={busy}
                                onClick={() => {
                                  setRejectComment("");
                                  setRejectTarget(leave);
                                }}
                              >
                                <X className="h-3 w-3" />
                                Reject
                              </Button>
                            </>
                          ) : null}
                          {canApply && isOwn && leave.status === "pending" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-muted-foreground"
                              onClick={() => void handleCancel(leave)}
                            >
                              Cancel
                            </Button>
                          ) : null}
                          {!canReview &&
                          !(canApply && isOwn && leave.status === "pending") ? (
                            <span className="text-[11px] text-muted-foreground px-1">—</span>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {canApply ? (
      <Dialog open={applyOpen} onOpenChange={onApplyOpenChange}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Apply for leave</DialogTitle>
            <DialogDescription>
              Submit a leave request. An admin will approve or reject it from HR → Calendar.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleApply} className="space-y-4 pt-2">
            {formError ? (
              <div className="p-3 text-xs bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                {formError}
              </div>
            ) : null}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Leave type
              </label>
              <Select
                value={leaveType}
                onValueChange={(value) => setLeaveType(value as LeaveType)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  From
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(event) => {
                    setStartDate(event.target.value);
                    if (event.target.value && endDate && event.target.value > endDate) {
                      setEndDate(event.target.value);
                    }
                  }}
                  required
                  className="bg-background font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  To
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  required
                  className="bg-background font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Reason (optional)
              </label>
              <Input
                type="text"
                placeholder="Short note for admin"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="bg-background"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onApplyOpenChange?.(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="gap-1.5">
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plane className="h-4 w-4" />
                )}
                Submit leave request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      ) : null}

      <Dialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Reject leave</DialogTitle>
            <DialogDescription>
              {rejectTarget
                ? `Reject ${rejectTarget.employee_name}'s request for ${rejectTarget.start_date}.`
                : "Add an optional comment."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReject} className="space-y-4 pt-2">
            <Textarea
              placeholder="Optional comment for the employee"
              value={rejectComment}
              onChange={(event) => setRejectComment(event.target.value)}
              className="bg-background min-h-20"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectTarget(null)}
                disabled={reviewingId != null}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={reviewingId != null}
                className="gap-1.5"
              >
                {reviewingId != null ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                Reject leave
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
