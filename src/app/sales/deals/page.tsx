"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { dealsApi, type Deal } from "@/lib/api";
import { usePageTitle } from "@/contexts/page-title-context";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DealFormSheet } from "@/components/deal-form-sheet";
import { RefreshCw, Plus, Menu, LayoutGrid, Columns3, Edit, Trash2 } from "lucide-react";
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

const getStageColor = (stage?: string) => {
  const colors: Record<string, string> = {
    lead: "bg-gray-100 text-gray-800",
    qualified: "bg-blue-100 text-blue-800",
    proposal: "bg-yellow-100 text-yellow-800",
    negotiation: "bg-orange-100 text-orange-800",
    won: "bg-green-100 text-green-800",
    lost: "bg-red-100 text-red-800",
  };
  return colors[stage?.toLowerCase() || ""] || "bg-gray-100 text-gray-800";
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

const DealCard = ({ deal, onClick, onEdit, onDelete }: { deal: Deal; onClick?: () => void; onEdit?: () => void; onDelete?: () => void }) => (
  <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
    <CardHeader>
      <div className="flex justify-between items-start">
        <CardTitle className="text-lg">{deal.client_name || deal.client_company_name || "Deal"}</CardTitle>
        <div className="flex gap-1">
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <Badge className={getStageColor(deal.stage)}>{deal.stage || "No stage"}</Badge>
        <Badge className={getStatusColor(deal.status)}>{deal.status || "No status"}</Badge>
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
);

const DealKanbanCard = ({ deal, onEdit, onDelete }: { deal: Deal; onEdit?: () => void; onDelete?: () => void }) => (
  <Card className="hover:shadow-md transition-shadow mb-3 bg-white cursor-grab active:cursor-grabbing">
    <CardContent className="p-3">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-sm line-clamp-2 flex-1">
          {deal.client_name || deal.client_company_name || "Deal"}
        </h4>
        <div className="flex gap-1 ml-2">
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(); }} className="h-6 w-6 p-0">
              <Edit className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="h-6 w-6 p-0">
              <Trash2 className="h-3 w-3 text-red-600" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex justify-between items-center mb-2">
        <Badge className={`text-[10px] px-1 py-0 ${getStatusColor(deal.status)}`}>{deal.status}</Badge>
      </div>
      <div className="text-xs text-gray-500">
        <div className="truncate">{deal.contact_name || "No contact"}</div>
        <div className="mt-1">{deal.probability}% probability</div>
      </div>
    </CardContent>
  </Card>
);

// Sortable Wrapper for Kanban Card
const SortableDealCard = ({ deal, onEdit, onDelete }: { deal: Deal; onEdit: () => void; onDelete: () => void }) => {
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
      <DealKanbanCard deal={deal} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
};

// Droppable Column Component
const KanbanColumn = ({
    id,
    label,
    color,
    deals,
    onEdit,
    onDelete,
}: {
    id: string;
    label: string;
    color: string;
    deals: Deal[];
    onEdit: (deal: Deal) => void;
    onDelete: (deal: Deal) => void;
}) => {
    const { setNodeRef } = useSortable({ id });

    return (
        <div ref={setNodeRef} className={`flex-shrink-0 w-72 ${color} rounded-lg p-3 h-full overflow-y-auto`}>
            <div className="mb-3">
                <h3 className="font-semibold text-sm uppercase flex justify-between">
                    {label}
                    <span className="text-gray-500 text-xs bg-white px-2 py-0.5 rounded-full border">
                        {deals.length}
                    </span>
                </h3>
            </div>
             <SortableContext 
                id={id}
                items={deals.map(d => d.id)} 
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-3 min-h-[100px]">
                    {deals.map((deal) => (
                        <SortableDealCard
                            key={deal.id}
                            deal={deal}
                            onEdit={() => onEdit(deal)}
                            onDelete={() => onDelete(deal)}
                        />
                    ))}
                    {deals.length === 0 && (
                        <div className="text-sm text-gray-400 text-center py-8 italic border-2 border-dashed border-gray-200 rounded-lg">
                            Drop here
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    );
}

export default function DealsPage() {
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);
  const [activeDragDeal, setActiveDragDeal] = useState<Deal | null>(null);
  
  // Default to kanban
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
        const saved = localStorage.getItem("deals_view_mode");
        if (saved === "list" || saved === "card" || saved === "kanban") {
            return saved as ViewMode;
        }
    }
    return "kanban";
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8,
        },
    }),
    useSensor(TouchSensor)
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
    setTitle("Deals");
    return () => setTitle(null);
  }, [setTitle]);

  useEffect(() => {
    if (typeof window !== "undefined") {
        localStorage.setItem("deals_view_mode", viewMode);
    }
  }, [viewMode]);

  const getDealsByStage = () => {
    const grouped: Record<string, Deal[]> = {
      lead: [],
      qualified: [],
      proposal: [],
      negotiation: [],
      won: [],
      lost: [],
      other: [],
    };

    deals.forEach((deal) => {
      const stage = deal.stage?.toLowerCase() || "other";
      if (Array.isArray(grouped[stage])) {
        grouped[stage].push(deal);
      } else {
        grouped.other.push(deal);
      }
    });

    return grouped;
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
    const columns = ["lead", "qualified", "proposal", "negotiation", "won", "lost"];
    if (columns.includes(String(overId))) {
        newStage = String(overId);
    } else {
        // Dropping on another deal? Find that deal's stage
        const overDeal = deals.find(d => d.id === overId);
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
    const updatedDeals = deals.map(d => 
        d.id === deal.id ? { ...d, stage: newStage } : d
    );
    setDeals(updatedDeals);

    try {
        await dealsApi.update(Number(deal.id), { stage: newStage });
    } catch (error) {
        // Revert
        setDeals(deals.map(d => d.id === deal.id ? { ...d, stage: oldStage } : d));
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
                  <TableHead className="w-[220px]">Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Probability</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
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
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/sales/deals/${deal.id}`)}
                    >
                      <TableCell className="font-medium">
                        {deal.client_name || deal.client_company_name || "—"}
                      </TableCell>
                      <TableCell>{deal.contact_name || "—"}</TableCell>
                      <TableCell>
                        <Badge className={getStageColor(deal.stage)}>{deal.stage || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(deal.status)}>{deal.status || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>{deal.probability}%</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/sales/deals/${deal.id}`);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(deal);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
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
        const columns = [
            { key: "lead", label: "Lead", color: "bg-gray-50" },
            { key: "qualified", label: "Qualified", color: "bg-blue-50" },
            { key: "proposal", label: "Proposal", color: "bg-yellow-50" },
            { key: "negotiation", label: "Negotiation", color: "bg-orange-50" },
            { key: "won", label: "Won", color: "bg-green-50" },
            { key: "lost", label: "Lost", color: "bg-red-50" },
        ];

        return (
            <div className="h-[calc(100vh-200px)]">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex gap-4 overflow-x-auto pb-4 h-full">
                        {columns.map((column) => (
                            <KanbanColumn
                                key={column.key}
                                id={column.key}
                                label={column.label}
                                color={column.color}
                                deals={grouped[column.key] || []}
                                onEdit={(deal) => router.push(`/sales/deals/${deal.id}`)}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                    <DragOverlay>
                        {activeDragDeal ? (
                            <DealKanbanCard deal={activeDragDeal} />
                        ) : null}
                    </DragOverlay>
                </DndContext>
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
                  onClick={() => router.push(`/sales/deals/${deal.id}`)}
                  onEdit={() => router.push(`/sales/deals/${deal.id}`)}
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
            <p className="text-gray-600 mt-1">{deals.length} deals in pipeline</p>
          </div>
          <div className="flex items-center gap-2">
            <ButtonGroup orientation="horizontal">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                aria-label="List view"
                className="px-3"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "card" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("card")}
                aria-label="Card view"
                className="px-3"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("kanban")}
                aria-label="Kanban view"
                className="px-3"
              >
                <Columns3 className="h-4 w-4" />
              </Button>
            </ButtonGroup>

            <Button onClick={fetchDeals} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="default" size="sm" onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-1" /> New Deal
            </Button>
          </div>
        </div>

        {loading && <div className="text-center py-8">Loading...</div>}
        {error && <div className="text-red-600 text-center py-8">{error}</div>}

        {!loading && !error && (
            deals.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg border border-dashed">
                  <h3 className="text-xl font-medium mb-2">No deals in the pipeline</h3>
                  <p className="text-gray-500 mb-6">Create your first deal to get started.</p>
                  <Button variant="default" onClick={handleCreateNew}>
                     <Plus className="h-4 w-4 mr-2" /> Create Deal
                  </Button>
                </div>
            ) : (
                renderDeals()
            )
        )}

        <DealFormSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onSuccess={handleFormSuccess}
          deal={editingDeal ?? null}
        />

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Deal</DialogTitle>
            </DialogHeader>
            <p className="py-4">
              Are you sure you want to delete this deal? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
