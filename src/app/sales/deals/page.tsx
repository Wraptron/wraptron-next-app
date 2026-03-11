"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  dealsApi,
  salesStagesApi,
  type Deal,
  type SalesStage,
} from "@/lib/api";
import { usePageTitle } from "@/contexts/page-title-context";
import { useCurrency } from "@/contexts/currency-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DealFormSheet } from "@/components/deal-form-sheet";
import {
  RefreshCw,
  Plus,
  Menu,
  LayoutGrid,
  Columns3,
  Edit,
  Trash2,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  TouchSensor,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type ViewMode = "list" | "card" | "kanban";

const sentenceCase = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;

const DealCard = ({
  deal,
  onEdit,
  onDelete,
}: {
  deal: Deal;
  onEdit?: () => void;
  onDelete?: () => void;
}) => (
  <div className="group block relative">
    <Link href={`/sales/deals/${deal.id}`} className="block no-underline">
    <Card className="hover:shadow-md transition-shadow">
    <CardHeader>
      <div className="flex justify-between items-start">
        <div className="min-w-0 flex-1">
          <CardTitle className="text-lg">
            {deal.title || deal.client_name || deal.client_company_name || "Deal"}
          </CardTitle>
          {(deal.client_id && (deal.client_company_name || deal.client_name)) && (
            <p className="text-sm text-gray-500 mt-0.5 truncate">
              Customer: {[deal.client_company_name, deal.client_name].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <Badge variant="outline">{deal.stage || "No stage"}</Badge>
        <Badge variant="outline">{deal.status || "No status"}</Badge>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Contact:</span>
          <span>{deal.contact_name || "N/A"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Probability:</span>
          <span>{deal.probability}%</span>
        </div>
      </div>
    </CardContent>
  </Card>
  </Link>
  <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
    {onEdit && (
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
        <Edit className="h-4 w-4" />
      </Button>
    )}
    {onDelete && (
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
        <Trash2 className="h-4 w-4" />
      </Button>
    )}
  </div>
  </div>
);

const DealKanbanCard = ({
  deal,
  onEdit,
  onDelete,
}: {
  deal: Deal;
  onEdit?: () => void;
  onDelete?: () => void;
}) => (
  <Card className="border-[0.5px] border-gray-200 shadow-none cursor-grab active:cursor-grabbing bg-white">
    <CardContent className="p-3">
      <div className="flex justify-between items-start mb-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-sm line-clamp-2">
            {deal.title || deal.client_name || deal.client_company_name || "Deal"}
          </h4>
          {(deal.client_id && (deal.client_company_name || deal.client_name)) && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
              Customer: {[deal.client_company_name, deal.client_name].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <div className="flex gap-1 ml-2 shrink-0">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="h-6 w-6 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="h-6 w-6 p-0"
            >
              <Trash2 className="h-3 w-3 text-red-600" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex justify-between items-center mb-2">
        <Badge variant="outline" className="text-[10px] px-1 py-0">
          {deal.status}
        </Badge>
      </div>
      <div className="text-xs text-gray-500">
        <div className="truncate">{deal.contact_name || "No contact"}</div>
        <div className="mt-1">{deal.probability}% probability</div>
      </div>
    </CardContent>
  </Card>
);

// Sortable Wrapper for Kanban Card
const SortableDealCard = ({
  deal,
  onEdit,
  onDelete,
}: {
  deal: Deal;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link
        href={`/sales/deals/${deal.id}`}
        className="block no-underline text-inherit"
      >
        <DealKanbanCard deal={deal} onEdit={onEdit} onDelete={onDelete} />
      </Link>
    </div>
  );
};

// Droppable Column Component
const KanbanColumn = ({
  id,
  label,
  deals,
  stageSubtext,
  onEdit,
  onDelete,
}: {
  id: string;
  label: string;
  deals: Deal[];
  stageSubtext: string;
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
}) => {
  const { setNodeRef } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      className="flex-shrink-0 w-72 border-[0.5px] border-gray-200 bg-white rounded-none h-full overflow-y-auto flex flex-col"
    >
      <div className="border-b border-gray-200 px-3 py-2 flex-shrink-0">
        <h3 className="font-medium text-sm text-gray-900">{label}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{stageSubtext}</p>
      </div>
      <div className="flex-1 p-2 min-h-0 overflow-y-auto">
        <SortableContext
          id={id}
          items={deals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 min-h-[80px]">
            {deals.map((deal) => (
              <SortableDealCard
                key={deal.id}
                deal={deal}
                onEdit={() => onEdit(deal)}
                onDelete={() => onDelete(deal)}
              />
            ))}
            {deals.length === 0 && (
              <div className="text-sm text-gray-400 text-center py-6 italic border border-dashed border-gray-200">
                Drop here
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

export default function DealsPage() {
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const { formatCurrency } = useCurrency();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);
  const [activeDragDeal, setActiveDragDeal] = useState<Deal | null>(null);
  const [stages, setStages] = useState<SalesStage[]>([]);
  const [selectedDeals, setSelectedDeals] = useState<number[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const defaultStageNames = [
    "new lead",
    "qualified",
    "requirement gathered",
    "solution proposed",
    "negotiation/objection handling",
    "proposal accepted",
    "project implementation",
    "maintenance - project delivered",
  ];
  const stageNames =
    stages.length > 0
      ? stages.map((s) => s.name.toLowerCase())
      : defaultStageNames;

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("deals_view_mode");
      if (saved === "list" || saved === "card" || saved === "kanban") {
        return saved as ViewMode;
      }
    }
    return "card";
  });

  const toggleDealSelection = (dealId: number) => {
    setSelectedDeals((prev) =>
      prev.includes(dealId) ? prev.filter((id) => id !== dealId) : [...prev, dealId],
    );
  };

  const toggleAllDeals = () => {
    if (selectedDeals.length === deals.length) {
      setSelectedDeals([]);
    } else {
      setSelectedDeals(deals.map((d) => d.id));
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await Promise.all(selectedDeals.map((id) => dealsApi.delete(id)));
      setDeals((prev) => prev.filter((d) => !selectedDeals.includes(d.id)));
      setSelectedDeals([]);
      setBulkDeleteOpen(false);
    } catch (err) {
      console.error("Failed to delete deals:", err);
      fetchDeals();
      alert("Failed to delete some deals. Please try again.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor),
  );

  const fetchDeals = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dealsApi.getAll();
      setDeals(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch deals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  useEffect(() => {
    salesStagesApi
      .getAll()
      .then((res) => setStages(res.data ?? []))
      .catch(() => setStages([]));
  }, []);

  useEffect(() => {
    setTitle("Deals");
    return () => setTitle(null);
  }, [setTitle]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("deals_view_mode", viewMode);
    }
  }, [viewMode]);

  const getDealsByStage = () => {
    const grouped: Record<string, Deal[]> = { other: [] };
    stageNames.forEach((name) => {
      grouped[name] = [];
    });

    deals.forEach((deal) => {
      const stage = deal.stage?.toLowerCase() || "other";
      if (grouped[stage]) {
        grouped[stage].push(deal);
      } else {
        grouped.other.push(deal);
      }
    });

    return grouped;
  };

  const getStageSubtext = (stageDeals: Deal[]) => {
    const count = stageDeals.length;
    const total = stageDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);
    const currency = stageDeals[0]?.currency ?? "USD";
    const valueStr = formatCurrency(total, currency);
    return `${count} deal${count !== 1 ? "s" : ""} · ${valueStr}`;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const deal = deals.find((d) => d.id === active.id);
    if (deal) {
      setActiveDragDeal(deal);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragDeal(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id; // This could be a deal ID or a column ID

    // Find the deal being dragged
    const deal = deals.find((d) => d.id === activeId);
    if (!deal) return;

    // Determine target stage
    let newStage = "";

    // Check if dropping on a column directly
    if (stageNames.includes(String(overId))) {
      newStage = String(overId);
    } else {
      // Dropping on another deal? Find that deal's stage
      const overDeal = deals.find((d) => d.id === overId);
      if (overDeal) {
        newStage = overDeal.stage?.toLowerCase() || "other";
      } else {
        // Fallback
        return;
      }
    }

    // If stage hasn't changed, just return (reordering not implemented persisted yet)
    if (newStage === deal.stage?.toLowerCase()) {
      return;
    }

    // Optimistic update
    const oldStage = deal.stage;
    const updatedDeals = deals.map((d) =>
      d.id === deal.id ? { ...d, stage: newStage } : d,
    );
    setDeals(updatedDeals);

    try {
      await dealsApi.update(Number(deal.id), { stage: newStage });
    } catch (error) {
      // Revert
      setDeals(
        deals.map((d) => (d.id === deal.id ? { ...d, stage: oldStage } : d)),
      );
      console.error("Failed to update deal stage", error);
    }
  };

  const renderDeals = () => {
    if (viewMode === "list") {
      return (
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={deals.length > 0 && selectedDeals.length === deals.length}
                    onChange={toggleAllDeals}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableHead>
                <TableHead className="w-[300px]">Deal name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Probability</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No deals found.
                  </TableCell>
                </TableRow>
              ) : (
                deals.map((deal) => (
                  <TableRow
                    key={deal.id}
                    className={`cursor-pointer hover:bg-gray-50 ${
                      selectedDeals.includes(deal.id) ? "bg-blue-50" : ""
                    }`}
                    onClick={() => router.push(`/sales/deals/${deal.id}`)}
                  >
                    <TableCell
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDealSelection(deal.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={selectedDeals.includes(deal.id)}
                        onChange={() => {}}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/sales/deals/${deal.id}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {deal.title || deal.client_name || deal.client_company_name || "Deal"}
                      </Link>
                    </TableCell>
                    <TableCell>{deal.contact_name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{deal.stage || "N/A"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{deal.status || "N/A"}</Badge>
                    </TableCell>
                    <TableCell>{deal.probability}%</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      );
    }

    if (viewMode === "kanban") {
      const grouped = getDealsByStage();
      const columns =
        stages.length > 0
          ? stages.map((s) => ({
              key: s.name.toLowerCase(),
              label: s.name,
            }))
          : stageNames.map((key) => ({
              key,
              label: sentenceCase(key),
            }));
      if ((grouped.other?.length ?? 0) > 0) {
        columns.push({ key: "other", label: "Other" });
      }

      return (
        <div className="h-[calc(100vh-200px)] border-[0.5px] border-gray-200 bg-white overflow-hidden flex flex-col">
          <div className="flex flex-1 min-h-0 overflow-x-auto border-t">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex h-full py-0">
                {columns.map((column) => {
                  const stageDeals = grouped[column.key] || [];
                  return (
                    <KanbanColumn
                      key={column.key}
                      id={column.key}
                      label={column.label}
                      deals={stageDeals}
                      stageSubtext={getStageSubtext(stageDeals)}
                      onEdit={(deal) => router.push(`/sales/deals/${deal.id}`)}
                      onDelete={handleDelete}
                    />
                  );
                })}
              </div>
              <DragOverlay>
                {activeDragDeal ? (
                  <DealKanbanCard deal={activeDragDeal} />
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      );
    }

    // Card View
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            onEdit={() => handleEdit(deal)}
            onDelete={() => handleDelete(deal)}
          />
        ))}
      </div>
    );
  };

  const handleCreateNew = () => {
    setEditingDeal(undefined);
    setSheetOpen(true);
  };

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setSheetOpen(true);
  };

  const handleDelete = (deal: Deal) => {
    setDealToDelete(deal);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!dealToDelete) return;
    try {
      await dealsApi.delete(dealToDelete.id);
      setDeals(deals.filter((d) => d.id !== dealToDelete.id));
      setDeleteDialogOpen(false);
      setDealToDelete(null);
    } catch (error) {
      console.error("Error deleting deal:", error);
      alert("Failed to delete deal. Please try again.");
    }
  };

  const handleFormSuccess = () => {
    setSheetOpen(false);
    setEditingDeal(undefined);
    fetchDeals();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-gray-600">{deals.length} deals</p>
          </div>
          <div className="flex items-center gap-2">
            <ButtonGroup orientation="horizontal">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                aria-label="List view"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "card" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("card")}
                aria-label="Card view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("kanban")}
                aria-label="Kanban view"
              >
                <Columns3 className="h-4 w-4" />
              </Button>
            </ButtonGroup>
            <Button onClick={fetchDeals} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-1" /> New Deal
            </Button>
          </div>
        </div>

        {selectedDeals.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md mb-6 flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedDeals.length} item{selectedDeals.length === 1 ? "" : "s"} selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isBulkDeleting}
                className="bg-white hover:bg-blue-50 text-red-600 border-red-200 hover:border-red-300"
                onClick={() => setBulkDeleteOpen(true)}
              >
                Delete Selected
              </Button>
            </div>
          </div>
        )}

        <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete deals</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedDeals.length} selected deal
                {selectedDeals.length === 1 ? "" : "s"}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkDeleteOpen(false)} disabled={isBulkDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleBulkDelete} disabled={isBulkDeleting}>
                {isBulkDeleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {loading && <div className="text-center py-8">Loading...</div>}
        {error && <div className="text-red-600 text-center py-8">{error}</div>}

        {!loading &&
          !error &&
          (deals.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-xl mb-2">No deals yet</h3>
              <p className="text-gray-600">Create your first deal above.</p>
            </div>
          ) : (
            renderDeals()
          ))}

        <DealFormSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onSuccess={handleFormSuccess}
          deal={editingDeal ?? null}
        />

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete deal</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this deal? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
