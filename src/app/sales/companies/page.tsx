"use client";

import React, { useState, useEffect } from "react";
import { companiesApi, type Company } from "@/lib/api";
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
import { RefreshCw, Plus, Menu, LayoutGrid, Columns3, Edit, Trash2 } from "lucide-react";
import { CompanyForm } from "@/components/company-form";

type ViewMode = "list" | "card" | "kanban";

const getStatusColor = (status?: string) => {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
    prospect: "bg-yellow-100 text-yellow-800",
    customer: "bg-blue-100 text-blue-800",
  };
  return colors[status?.toLowerCase() || ""] || "bg-gray-100 text-gray-800";
};

const CompanyCard = ({ company, onEdit, onDelete }: { company: Company; onEdit: () => void; onDelete: () => void }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardHeader>
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="text-lg">{company.company_name || company.name}</CardTitle>
          {company.name && company.name !== company.company_name && (
            <p className="text-sm text-gray-600 mt-1">{company.name}</p>
          )}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-2 text-sm">
        {company.email && (
          <div className="flex justify-between">
            <span className="text-gray-500">Email:</span>
            <span>{company.email}</span>
          </div>
        )}
        {company.phone && (
          <div className="flex justify-between">
            <span className="text-gray-500">Phone:</span>
            <span>{company.phone}</span>
          </div>
        )}
        {company.industry && (
          <div className="flex justify-between">
            <span className="text-gray-500">Industry:</span>
            <span>{company.industry}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-500">Status:</span>
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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("companies_view_mode");
      if (saved === "list" || saved === "card" || saved === "kanban") {
        return saved as ViewMode;
      }
    }
    return "list";
  });
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("companies_view_mode", viewMode);
    }
  }, [viewMode]);

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
      setCompanies(companies.filter((c) => c.company_id !== companyToDelete.company_id));
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    } catch (error) {
      console.error("Error deleting company:", error);
      alert("Failed to delete company. Please try again.");
    }
  };

  const handleFormSuccess = () => {
    setFormDialogOpen(false);
    setEditingCompany(undefined);
    fetchCompanies();
  };

  const renderCompanies = () => {
    if (viewMode === "list") {
      return (
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Company Name</TableHead>
                <TableHead>Contact Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Company Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No companies found.
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((company) => (
                  <TableRow key={company.company_id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {company.company_name || company.name}
                    </TableCell>
                    <TableCell>{company.name || "N/A"}</TableCell>
                    <TableCell>{company.email || "N/A"}</TableCell>
                    <TableCell>{company.phone || "N/A"}</TableCell>
                    <TableCell>{company.industry || "N/A"}</TableCell>
                    <TableCell>{company.company_size || "N/A"}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(company.status)}>
                        {company.status || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(company)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(company)}>
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
      const grouped: Record<string, Company[]> = {
        active: [],
        inactive: [],
        prospect: [],
        customer: [],
        other: [],
      };

      companies.forEach((company) => {
        const status = company.status?.toLowerCase() || "other";
        if (grouped[status]) {
          grouped[status].push(company);
        } else {
          grouped.other.push(company);
        }
      });

      const columns = [
        { key: "active", label: "Active", color: "bg-green-50" },
        { key: "inactive", label: "Inactive", color: "bg-gray-50" },
        { key: "prospect", label: "Prospect", color: "bg-yellow-50" },
        { key: "customer", label: "Customer", color: "bg-blue-50" },
        { key: "other", label: "Other", color: "bg-purple-50" },
      ];

      return (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <div
              key={column.key}
              className={`flex-shrink-0 w-72 ${column.color} rounded-lg p-3`}
            >
              <h3 className="font-semibold mb-3 text-sm uppercase">
                {column.label} ({grouped[column.key]?.length || 0})
              </h3>
              <div className="space-y-2">
                {grouped[column.key]?.map((company) => (
                  <Card key={company.company_id} className="mb-2">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-sm">
                          {company.company_name || company.name}
                        </h4>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(company)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(company)}>
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">{company.email || "No email"}</p>
                      {company.phone && <p className="text-xs text-gray-600">{company.phone}</p>}
                    </CardContent>
                  </Card>
                ))}
                {(!grouped[column.key] || grouped[column.key].length === 0) && (
                  <div className="text-sm text-gray-500 text-center py-4">No companies</div>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Card view
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
            <p className="text-gray-600 mt-1">{companies.length} companies</p>
          </div>
          <div className="flex items-center gap-2">
            <ButtonGroup orientation="horizontal">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "card" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("card")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("kanban")}
              >
                <Columns3 className="h-4 w-4" />
              </Button>
            </ButtonGroup>
            <Button onClick={fetchCompanies} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="default" size="sm" onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-1" /> New Company
            </Button>
          </div>
        </div>

        {loading && <div className="text-center py-8">Loading...</div>}
        {error && <div className="text-red-600 text-center py-8">{error}</div>}

        {!loading && !error && (
          companies.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-dashed">
              <h3 className="text-xl font-medium mb-2">No companies yet</h3>
              <p className="text-gray-500 mb-6">Create your first company to get started.</p>
              <Button variant="default" onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" /> Create Company
              </Button>
            </div>
          ) : (
            renderCompanies()
          )
        )}

        <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCompany ? "Edit Company" : "New Company"}</DialogTitle>
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
              Are you sure you want to delete {companyToDelete?.company_name || companyToDelete?.name}? This action cannot be undone.
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
