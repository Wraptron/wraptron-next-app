"use client";

import { PageShell } from "@/components/page-shell";
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
import { DealActivities } from "@/components/deal-activities";
import { useCurrency } from "@/contexts/currency-context";
import { dealsApi, type Deal } from "@/lib/api";
import { usePageTitle } from "@/contexts/page-title-context";
import { ArrowLeft, Edit, Loader2, Trash2 } from "lucide-react";
import {
  dealStageBadgeClass,
  dealStatusBadgeClass,
} from "@/lib/status-colors";

const formatDate = (dateString?: string) => {
  if (!dateString) return "Not set";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const telHref = (phone: string) =>
  `tel:${phone.replace(/[^\d+]/g, "") || phone.trim()}`;

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
      setTitle(
        deal.title || deal.client_name || deal.client_company_name || "Deal",
      );
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-destructive mb-4">{error || "Deal not found"}</p>
            <Link href="/sales/deals">
              <Button variant="outline">Back to Deals</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PageShell fill className="bg-background text-foreground">
      <div className="mb-6">
        <Link href="/sales/deals">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Deals
          </Button>
        </Link>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge className={dealStageBadgeClass(deal.stage)}>
              {deal.stage || "—"}
            </Badge>
            <Badge className={dealStatusBadgeClass(deal.status)}>
              {deal.status || "—"}
            </Badge>
            <span className="text-sm text-muted-foreground">
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
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
          <TabsTrigger value="qualification">Qualification</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deal information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-violet-200/90 bg-gradient-to-br from-violet-50 via-white to-sky-50/40 px-4 py-3.5 shadow-sm ring-1 ring-violet-100/70 dark:border-violet-800/40 dark:from-violet-950/40 dark:via-card dark:to-sky-950/20 dark:ring-violet-900/30">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-800/85 dark:text-violet-300/85">
                  Deal name
                </p>
                <p className="mt-1.5 text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-snug">
                  {deal.title?.trim() || "Untitled deal"}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Stage</p>
                  <p className="text-sm mt-1 font-semibold text-foreground">
                    {deal.stage || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="text-sm mt-1 font-semibold text-foreground">
                    {deal.status || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Customer / Client
                  </p>
                  <p className="text-sm mt-1">
                    {deal.client_company_name || deal.client_name || "—"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contact</p>
                  {deal.contact_id && deal.contact_name ? (
                    <Link
                      href={`/contacts/${deal.contact_id}`}
                      className="text-sm mt-1 text-primary hover:underline inline-block"
                    >
                      {deal.contact_name}
                    </Link>
                  ) : (
                    <p className="text-sm mt-1">{deal.contact_name || "—"}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  {deal.contact_phone ? (
                    <a
                      href={telHref(deal.contact_phone)}
                      className="text-sm mt-1 hover:underline inline-block"
                    >
                      {deal.contact_phone}
                    </a>
                  ) : (
                    <p className="text-sm mt-1">—</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Probability
                  </p>
                  <p className="text-sm mt-1 font-semibold text-foreground">
                    {deal.probability != null ? `${deal.probability}%` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Deal value
                  </p>
                  <p className="text-sm mt-1 font-semibold text-foreground">
                    {deal.value != null
                      ? formatCurrency(deal.value, deal.currency)
                      : "—"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Expected close date
                  </p>
                  <p className="text-sm mt-1">
                    {formatDate(deal.expected_close_date) || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Closed date
                  </p>
                  <p className="text-sm mt-1">
                    {formatDate(deal.actual_close_date) || "—"}
                  </p>
                </div>
              </div>
              {deal.description && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Description
                  </p>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm bg-muted text-foreground p-4 rounded">
                      {deal.description}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qualification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Qualification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Current stage
                  </p>
                  <p className="text-sm mt-1 font-semibold text-foreground">
                    {deal.stage || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Probability
                  </p>
                  <p className="text-sm mt-1 font-semibold text-foreground">
                    {deal.probability != null ? `${deal.probability}%` : "—"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Primary contact
                  </p>
                  {deal.contact_id && deal.contact_name ? (
                    <Link
                      href={`/contacts/${deal.contact_id}`}
                      className="text-sm mt-1 text-primary hover:underline inline-block"
                    >
                      {deal.contact_name}
                    </Link>
                  ) : (
                    <p className="text-sm mt-1">{deal.contact_name || "—"}</p>
                  )}
                  {deal.contact_phone && (
                    <a
                      href={telHref(deal.contact_phone)}
                      className="text-sm mt-1 text-muted-foreground hover:underline block"
                    >
                      {deal.contact_phone}
                    </a>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Customer / client
                  </p>
                  <p className="text-sm mt-1">
                    {deal.client_company_name || deal.client_name || "—"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Target close date
                </p>
                <p className="text-sm mt-1">
                  {formatDate(deal.expected_close_date)}
                </p>
              </div>

              <div className="rounded-md border border-border bg-muted p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Notes for qualification
                </p>
                <p className="text-sm mt-2 text-foreground">
                  {deal.description?.trim() ||
                    "No qualification notes added yet."}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <DealActivities deal={deal} />
        </TabsContent>
      </Tabs>

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
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
