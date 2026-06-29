"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { usePageTitle } from "@/contexts/page-title-context";
import { billsApi, type Bill } from "@/lib/api";
import { BillPreview } from "@/components/bill-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CloudUpload, Loader2, Trash2 } from "lucide-react";

export default function BillDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const id = typeof params.id === "string" ? parseInt(params.id, 10) : NaN;

  useEffect(() => {
    if (Number.isNaN(id)) {
      setError("Invalid bill ID");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    billsApi
      .getById(id)
      .then(setBill)
      .catch(() => setError("Failed to load bill"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (bill) {
      setTitle(`Bill ${bill.bill_number}`);
    } else {
      setTitle(null);
    }
    return () => setTitle(null);
  }, [bill, setTitle]);

  const handleDelete = async () => {
    if (!bill) return;
    setDeleting(true);
    try {
      await billsApi.delete(bill.id);
      router.push("/accounts/bills");
    } catch {
      setError("Failed to delete bill");
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const handlePushToZoho = async () => {
    if (!bill) return;
    setSyncing(true);
    setSyncError(null);
    try {
      const result = await billsApi.pushToZoho(bill.id);
      setBill(result);
      if (!result.zoho_sync?.synced && result.zoho_sync?.error) {
        setSyncError(result.zoho_sync.error);
      }
    } catch (e) {
      setSyncError(
        e instanceof Error ? e.message : "Failed to sync bill to Zoho Books",
      );
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="mb-4 text-destructive">{error || "Bill not found"}</p>
            <Link href="/accounts/bills">
              <Button variant="outline">Back to bills</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Link href="/accounts/bills">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to bills
            </Button>
          </Link>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{bill.bill_number}</h1>
                {bill.zoho_bill_id ? (
                  <Badge className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                    Synced to Zoho
                  </Badge>
                ) : (
                  <Badge variant="outline">Not synced to Zoho</Badge>
                )}
              </div>
              <p className="mt-1 text-muted-foreground">{bill.vendor_name}</p>
            </div>
            <div className="flex gap-2">
              {!bill.zoho_bill_id ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePushToZoho}
                  disabled={syncing}
                >
                  {syncing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CloudUpload className="mr-2 h-4 w-4" />
                  )}
                  Sync to Zoho
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {syncError ? (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {syncError}
          </div>
        ) : null}

        <Card>
          <CardContent className="pt-6">
            <BillPreview bill={bill} />
          </CardContent>
        </Card>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete bill</DialogTitle>
            <DialogDescription>
              Remove {bill.bill_number} from Wraptron? The bill will remain in
              Zoho Books and reappear on the next sync.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
