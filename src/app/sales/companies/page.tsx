"use client";

import React, { useState, useEffect, useMemo } from "react";
import { companiesApi, type Company } from "@/lib/api";
import { usePageTitle } from "@/contexts/page-title-context";
import {
  CollectionView,
  type CollectionColumn,
  type CollectionItem,
} from "@/components/collection-view";
import {
  CollectionKanbanView,
  type CollectionKanbanColumn,
} from "@/components/collection-kanban-view";
import {
  CollectionPageToolbar,
  useCollectionViewMode,
  type CollectionViewMode,
} from "@/components/collection-page-toolbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RefreshCw, Plus, Edit, Trash2 } from "lucide-react";
import { CompanyForm } from "@/components/company-form";

const KANBAN_COLUMNS: CollectionKanbanColumn[] = [
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "prospect", label: "Prospect" },
  { id: "customer", label: "Customer" },
  { id: "other", label: "Other" },
];

const KANBAN_COLUMN_IDS = new Set(KANBAN_COLUMNS.map((c) => c.id));

const getStatusColor = (status?: string) => {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
    prospect: "bg-yellow-100 text-yellow-800",
    customer: "bg-blue-100 text-blue-800",
  };
  return colors[status?.toLowerCase() || ""] || "bg-gray-100 text-gray-800";
};

function companyKanbanColumnId(company: Company) {
  const key = company.status?.toLowerCase() ?? "other";
  return KANBAN_COLUMN_IDS.has(key) ? key : "other";
}

function companyToCollectionItem(company: Company): CollectionItem {
  return {
    id: company.company_id,
    title: company.company_name || company.name,
    description: company.email || company.phone || undefined,
    meta: company.industry,
  };
}

function buildCompanyTableColumns(
  companies: Company[],
  onEdit: (company: Company) => void,
  onDelete: (company: Company) => void,
): CollectionColumn[] {
  const byId = new Map(companies.map((c) => [c.company_id, c]));

  return [
    {
      id: "company_name",
      header: "Company Name",
      headerClassName: "w-[250px]",
      sortValue: (item) => {
        const c = byId.get(Number(item.id));
        return c?.company_name || c?.name || "";
      },
      cell: (item) => {
        const c = byId.get(Number(item.id));
        return <span className="font-medium">{c?.company_name || c?.name || "—"}</span>;
      },
    },
    {
      id: "contact_name",
      header: "Contact Name",
      sortValue: (item) => byId.get(Number(item.id))?.name ?? "",
      cell: (item) => byId.get(Number(item.id))?.name || "—",
    },
    {
      id: "email",
      header: "Email",
      sortValue: (item) => byId.get(Number(item.id))?.email ?? "",
      cell: (item) => byId.get(Number(item.id))?.email || "—",
    },
    {
      id: "phone",
      header: "Phone",
      sortValue: (item) => byId.get(Number(item.id))?.phone ?? "",
      cell: (item) => byId.get(Number(item.id))?.phone || "—",
    },
    {
      id: "industry",
      header: "Industry",
      sortValue: (item) => byId.get(Number(item.id))?.industry ?? "",
      cell: (item) => byId.get(Number(item.id))?.industry || "—",
    },
    {
      id: "company_size",
      header: "Company Size",
      sortValue: (item) => byId.get(Number(item.id))?.company_size ?? "",
      cell: (item) => byId.get(Number(item.id))?.company_size || "—",
    },
    {
      id: "status",
      header: "Status",
      sortValue: (item) => byId.get(Number(item.id))?.status ?? "",
      cell: (item) => {
        const c = byId.get(Number(item.id));
        if (!c?.status) return "—";
        return (
          <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      headerClassName: "w-[100px]",
      sortable: false,
      cell: (item) => {
        const c = byId.get(Number(item.id));
        if (!c) return null;
        return (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" onClick={() => onEdit(c)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(c)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        );
      },
    },
  ];
}

const CompanyCard = ({
  company,
  onEdit,
  onDelete,
}: {
  company: Company;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <Card className="transition-shadow hover:shadow-md">
    <CardHeader>
      <div className="flex items-start justify-between">
        <div>
          <CardTitle className="text-lg">
            {company.company_name || company.name}
          </CardTitle>
          {company.name && company.name !== company.company_name && (
            <p className="mt-1 text-sm text-muted-foreground">{company.name}</p>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-2 text-sm">
        {company.email && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email:</span>
            <span>{company.email}</span>
          </div>
        )}
        {company.phone && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phone:</span>
            <span>{company.phone}</span>
          </div>
        )}
        {company.industry && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Industry:</span>
            <span>{company.industry}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status:</span>
          <Badge className={getStatusColor(company.status)}>
            {company.status || "N/A"}
          </Badge>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function CompaniesPage() {
  const { setTitle } = usePageTitle();
  const [viewMode, setViewMode] = useCollectionViewMode("companies_view_mode", "list");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([]);

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await companiesApi.getAll();
      setCompanies(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    setTitle("Companies");
    return () => setTitle(null);
  }, [setTitle]);

  const handleCreate = () => {
    setEditingCompany(undefined);
    setFormDialogOpen(true);
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormDialogOpen(true);
  };

  const handleDelete = (company: Company) => {
    setCompanyToDelete(company);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!companyToDelete) return;
    try {
      await companiesApi.delete(companyToDelete.company_id);
      setCompanies(
        companies.filter((c) => c.company_id !== companyToDelete.company_id),
      );
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    } catch (err) {
      console.error("Error deleting company:", err);
      alert("Failed to delete company. Please try again.");
    }
  };

  const handleFormSuccess = () => {
    setFormDialogOpen(false);
    setEditingCompany(undefined);
    fetchCompanies();
  };

  const collectionItems = useMemo(
    () => companies.map(companyToCollectionItem),
    [companies],
  );

  const companyById = useMemo(
    () => new Map(companies.map((c) => [c.company_id, c])),
    [companies],
  );

  const companyTableColumns = useMemo(
    () => buildCompanyTableColumns(companies, handleEdit, handleDelete),
    [companies],
  );

  const handleCompanyKanbanMove = async (
    item: CollectionItem,
    toColumnId: string,
  ) => {
    const id = Number(item.id);
    const company = companyById.get(id);
    if (!company) return;

    const previousStatus = company.status;
    setCompanies((prev) =>
      prev.map((c) =>
        c.company_id === id ? { ...c, status: toColumnId } : c,
      ),
    );

    try {
      await companiesApi.update(id, { status: toColumnId });
    } catch (err) {
      setCompanies((prev) =>
        prev.map((c) =>
          c.company_id === id ? { ...c, status: previousStatus } : c,
        ),
      );
      console.error("Failed to update company status:", err);
    }
  };

  const renderCompanies = (mode: CollectionViewMode) => {
    if (mode === "list") {
      return (
        <CollectionView
          loading={loading}
          items={collectionItems}
          columns={companyTableColumns}
          primaryColumnId="company_name"
          selectable
          selectedIds={selectedCompanyIds}
          onSelectedIdsChange={(ids) =>
            setSelectedCompanyIds(ids.map((id) => Number(id)))
          }
          emptyMessage="No companies found."
          loadingMessage="Loading companies…"
        />
      );
    }

    if (mode === "kanban") {
      return (
        <CollectionKanbanView
          loading={loading}
          items={collectionItems}
          columns={KANBAN_COLUMNS}
          groupBy={(item) => {
            const company = companyById.get(Number(item.id));
            return company ? companyKanbanColumnId(company) : "other";
          }}
          getColumnSubtext={(_columnId, columnItems) => {
            const count = columnItems.length;
            return `${count} compan${count !== 1 ? "ies" : "y"}`;
          }}
          onItemMove={handleCompanyKanbanMove}
          emptyMessage="No companies found."
          loadingMessage="Loading companies…"
        />
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => (
          <CompanyCard
            key={company.company_id}
            company={company}
            onEdit={() => handleEdit(company)}
            onDelete={() => handleDelete(company)}
          />
        ))}
      </div>
    );
  };

  const showEmpty = !loading && !error && companies.length === 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Companies</h1>
            <p className="mt-1 text-muted-foreground">
              {companies.length} companies
            </p>
          </div>
          <CollectionPageToolbar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            newAction={{
              label: "New Company",
              onClick: handleCreate,
            }}
          >
            <Button
              onClick={fetchCompanies}
              variant="outline"
              size="sm"
              disabled={loading}
              aria-label="Refresh companies"
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </CollectionPageToolbar>
        </div>

        {error && (
          <div className="mb-4 py-8 text-center text-destructive">{error}</div>
        )}

        {viewMode === "list" && !error && renderCompanies("list")}
        {viewMode === "kanban" && !error && renderCompanies("kanban")}

        {viewMode === "card" && loading && companies.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">Loading…</div>
        )}

        {viewMode === "card" && showEmpty && (
          <div className="rounded-lg border border-dashed py-16 text-center">
            <h3 className="text-xl font-medium">No companies yet</h3>
            <p className="mt-2 text-muted-foreground">
              Create your first company to get started.
            </p>
            <Button variant="default" className="mt-6" onClick={handleCreate}>
              <Plus className="mr-2 size-4" />
              Create Company
            </Button>
          </div>
        )}

        {viewMode === "card" &&
          !showEmpty &&
          !error &&
          companies.length > 0 &&
          renderCompanies("card")}

        <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCompany ? "Edit Company" : "New Company"}
              </DialogTitle>
            </DialogHeader>
            <CompanyForm
              company={editingCompany}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setFormDialogOpen(false);
                setEditingCompany(undefined);
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Company</DialogTitle>
            </DialogHeader>
            <p className="py-4">
              Are you sure you want to delete{" "}
              {companyToDelete?.company_name || companyToDelete?.name}? This
              action cannot be undone.
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
