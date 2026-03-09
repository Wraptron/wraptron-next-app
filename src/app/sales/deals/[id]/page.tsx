"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { dealsApi, type Deal } from "@/lib/api";
import { usePageTitle } from "@/contexts/page-title-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DealFormSheet } from "@/components/deal-form-sheet";
import { ArrowLeft, Edit, Loader2, Trash2 } from "lucide-react";

const getStageColor = (stage?: string) => {
  const key = stage?.toLowerCase() || "";
  const colors: Record<string, string> = {
    lead: "bg-gray-100 text-gray-800",
    qualified: "bg-blue-100 text-blue-800",
    "requirement gathered": "bg-slate-100 text-slate-800",
    "solution proposed": "bg-yellow-100 text-yellow-800",
    "negotiation/objection handling": "bg-orange-100 text-orange-800",
    acceptance: "bg-emerald-100 text-emerald-800",
    "project delivered - ready for resell": "bg-green-100 text-green-800",
    "referral or testimonial": "bg-violet-100 text-violet-800",
  };
  return colors[key] || "bg-gray-100 text-gray-800";
};

const getStatusColor = (status?: string) => {
  const colors: Record<string, string> = {
    open: "bg-green-100 text-green-800",
    won: "bg-blue-100 text-blue-800",
    lost: "bg-red-100 text-red-800",
    closed: "bg-gray-100 text-gray-800",
  };
  return colors[status?.toLowerCase() || ""] || "bg-gray-100 text-gray-800";
};

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}

export default function DealDetailPage() {
  const params = useParams();
  const { setTitle } = usePageTitle();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const id = typeof params.id === "string" ? parseInt(params.id, 10) : NaN;

  const fetchDeal = () => {
    if (isNaN(id)) return;
    setLoading(true);
    setError(null);
    dealsApi
      .getById(id)
      .then(setDeal)
      .catch(() => setError("Failed to load deal"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isNaN(id)) {
      setError("Invalid deal ID");
      setLoading(false);
      return;
    }
    fetchDeal();
  }, [id]);

  useEffect(() => {
    if (deal) {
      setTitle(deal.client_name || deal.client_company_name || "Deal");
    }
    return () => setTitle(null);
  }, [deal, setTitle]);

  const handleFormSuccess = () => {
    setSheetOpen(false);
    fetchDeal();
  };

  const handleDelete = async () => {
    if (!deal) return;
    try {
      await dealsApi.delete(deal.id);
      window.location.href = "/sales/deals";
    } catch (err) {
      console.error("Error deleting deal:", err);
      alert("Failed to delete deal. Please try again.");
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-red-600">{error || "Deal not found"}</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/sales/deals">Back to Deals</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/sales/deals">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Deals
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSheetOpen(true)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-xl">Deal details</CardTitle>
              <div className="flex gap-2">
                <Badge className={getStageColor(deal.stage)}>{deal.stage || "—"}</Badge>
                <Badge className={getStatusColor(deal.status)}>{deal.status || "—"}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow label="Client" value={deal.client_name || deal.client_company_name} />
            <DetailRow label="Contact" value={deal.contact_name} />
            <DetailRow label="Stage" value={deal.stage} />
            <DetailRow label="Status" value={deal.status} />
            <DetailRow label="Probability" value={deal.probability != null ? `${deal.probability}%` : null} />
          </CardContent>
        </Card>
      </div>

      <DealFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSuccess={handleFormSuccess}
        deal={deal}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete deal</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this deal? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
