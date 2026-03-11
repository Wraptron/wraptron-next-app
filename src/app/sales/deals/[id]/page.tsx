"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useCurrency } from "@/contexts/currency-context";
import { dealsApi, type Deal } from "@/lib/api";
import { usePageTitle } from "@/contexts/page-title-context";
import { ArrowLeft, Edit, Loader2, Trash2 } from "lucide-react";

const getStageColor = (stage?: string) => {
  const key = stage?.toLowerCase() || "";
  const colors: Record<string, string> = {
    "new lead": "bg-gray-100 text-gray-800",
    qualified: "bg-blue-100 text-blue-800",
    "requirement gathered": "bg-slate-100 text-slate-800",
    "solution proposed": "bg-yellow-100 text-yellow-800",
    "negotiation/objection handling": "bg-orange-100 text-orange-800",
    "proposal accepted": "bg-emerald-100 text-emerald-800",
    "project implementation": "bg-sky-100 text-sky-800",
    "next step - project implementation": "bg-sky-100 text-sky-800",
    "maintenance - project delivered": "bg-green-100 text-green-800",
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

const formatDate = (dateString?: string) => {
  if (!dateString) return "Not set";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function DealDetailPage() {
  const params = useParams();
  const { setTitle } = usePageTitle();
  const { formatCurrency } = useCurrency();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const id = typeof params.id === "string" ? parseInt(params.id, 10) : NaN;

  const fetchDeal = () => {
    if (Number.isNaN(id)) return;
    setLoading(true);
    setError(null);
    dealsApi
      .getById(id)
      .then(setDeal)
      .catch(() => setError("Failed to load deal"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (Number.isNaN(id)) {
      setError("Invalid deal ID");
      setLoading(false);
      return;
    }
    fetchDeal();
  }, [id]);

  useEffect(() => {
    if (deal) {
      setTitle(deal.title || deal.client_name || deal.client_company_name || "Deal");
    } else {
      setTitle(null);
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-red-600 mb-4">{error || "Deal not found"}</p>
            <Link href="/sales/deals">
              <Button variant="outline">Back to Deals</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/sales/deals">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Deals
            </Button>
          </Link>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge className={getStageColor(deal.stage)}>
                {deal.stage || "—"}
              </Badge>
              <Badge className={getStatusColor(deal.status)}>
                {deal.status || "—"}
              </Badge>
              <span className="text-sm text-gray-500">
                Created {formatDate(deal.created_at)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSheetOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Deal
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Deal name</p>
                    <p className="text-sm mt-1">{deal.title || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Stage</p>
                    <p className="text-sm mt-1">{deal.stage || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="text-sm mt-1">{deal.status || "—"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Customer / Client</p>
                    <p className="text-sm mt-1">
                      {deal.client_company_name || deal.client_name || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Contact</p>
                    <p className="text-sm mt-1">{deal.contact_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Probability</p>
                    <p className="text-sm mt-1">{deal.probability != null ? `${deal.probability}%` : "—"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Deal value</p>
                    <p className="text-sm mt-1">
                      {deal.value != null
                        ? formatCurrency(deal.value, deal.currency)
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Expected close date</p>
                    <p className="text-sm mt-1">{formatDate(deal.expected_close_date) || "—"}</p>
                  </div>
                </div>
                {deal.description && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm bg-gray-50 p-4 rounded">
                        {deal.description}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
