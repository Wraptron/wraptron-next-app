"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePageTitle } from "@/contexts/page-title-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Plus,
  Mail,
  Phone,
  MoreHorizontal,
  RefreshCw,
  Menu,
  LayoutGrid,
  Columns3,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { employeesApi, type Employee } from "@/lib/api";
import { EmployeeFormSheet } from "@/components/employee-form-sheet";
import { useAuth } from "@/contexts/auth-context";

function displayName(e: Employee) {
  const parts = [e.first_name, e.middle_name, e.last_name].filter(Boolean);
  return parts.join(" ") || "—";
}

type ViewMode = "list" | "card" | "kanban";

function EmployeeKanbanCard({ employee }: { employee: Employee }) {
  return (
    <Card className="border-[0.5px] border-gray-200 shadow-none bg-white">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName(employee))}&background=random`}
            />
            <AvatarFallback>{employee.first_name?.charAt(0) ?? "?"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm line-clamp-1">
              {displayName(employee)}
            </div>
            <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">
              {employee.designation || employee.role || "—"}
              {employee.department ? ` · ${employee.department}` : ""}
            </div>
            {(employee.email || employee.phone) && (
              <div className="text-xs text-gray-500 mt-2 space-y-1">
                {employee.email && (
                  <div className="flex items-center gap-1 truncate">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{employee.email}</span>
                  </div>
                )}
                {employee.phone && (
                  <div className="flex items-center gap-1 truncate">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{employee.phone}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EmployeesPage() {
  const { setTitle } = usePageTitle();
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("employees_view_mode");
      if (saved === "list" || saved === "card" || saved === "kanban") {
        return saved as ViewMode;
      }
    }
    return "card";
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await employeesApi.getAll({ limit: 500 });
      setEmployees(res.data);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTitle("Employees");
    return () => setTitle(null);
  }, [setTitle]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("employees_view_mode", viewMode);
    }
  }, [viewMode]);

  const openAdd = () => {
    setEditingEmployee(null);
    setSheetOpen(true);
  };

  const openEdit = (e: Employee) => {
    setEditingEmployee(e);
    setSheetOpen(true);
  };

  const handleDelete = async (employee: Employee) => {
    if (
      !confirm(
        `Remove ${displayName(employee)} from the directory? They will be hidden from all employee lists.`,
      )
    ) {
      return;
    }
    try {
      await employeesApi.delete(employee.id);
      await fetchEmployees();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete employee";
      alert(message);
    }
  };

  const statusClass = (status?: string) => {
    const s = (status ?? "").toLowerCase();
    if (s === "active") return "bg-green-100 text-green-800";
    if (s === "candidate" || s === "offered") return "bg-blue-100 text-blue-800";
    if (s === "pre_onboarding") return "bg-indigo-100 text-indigo-800";
    if (s === "notice_period") return "bg-amber-100 text-amber-800";
    if (s === "exited") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  const statusLabel = (status?: string) => {
    const s = (status ?? "").toLowerCase();
    const map: Record<string, string> = {
      candidate: "Candidate",
      offered: "Offered",
      pre_onboarding: "Pre-Onboarding",
      active: "Active",
      notice_period: "Notice Period",
      exited: "Exited",
    };
    return map[s] ?? status ?? "—";
  };

  const statusKeys = [
    "candidate",
    "offered",
    "pre_onboarding",
    "active",
    "notice_period",
    "exited",
  ];

  const getEmployeesByStatus = () => {
    const grouped: Record<string, Employee[]> = { other: [] };
    statusKeys.forEach((k) => {
      grouped[k] = [];
    });
    employees.forEach((e) => {
      const key = (e.employment_status ?? "").toLowerCase() || "other";
      if (grouped[key]) grouped[key].push(e);
      else grouped.other.push(e);
    });
    return grouped;
  };

  const getStatusSubtext = (items: Employee[]) => {
    const count = items.length;
    return `${count} employee${count !== 1 ? "s" : ""}`;
  };

  const renderEmployees = () => {
    if (viewMode === "list") {
      return (
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[320px]">Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contact</TableHead>
                {isAdmin && (
                  <TableHead className="w-[72px] text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 5 : 4}
                    className="h-24 text-center"
                  >
                    No employees found.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee) => (
                  <TableRow
                    key={employee.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() =>
                      (window.location.href = `/workspace/employees/${employee.id}`)
                    }
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName(employee))}&background=random`}
                          />
                          <AvatarFallback>
                            {employee.first_name?.charAt(0) ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate">
                            <Link
                              href={`/workspace/employees/${employee.id}`}
                              className="hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {displayName(employee)}
                            </Link>
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {employee.designation || employee.role || "—"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.department || "—"}</TableCell>
                    <TableCell>
                      <Badge className={statusClass(employee.employment_status)}>
                        {statusLabel(employee.employment_status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {employee.email || employee.phone || "—"}
                      </div>
                    </TableCell>
                    {isAdmin && (
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Employee actions"
                            >
                              <MoreHorizontal className="w-4 h-4 text-gray-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/workspace/employees/${employee.id}`}
                              >
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openEdit(employee)}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(employee)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      );
    }

    if (viewMode === "kanban") {
      const grouped = getEmployeesByStatus();
      const columns = statusKeys.map((k) => ({
        key: k,
        label: statusLabel(k),
      }));
      if ((grouped.other?.length ?? 0) > 0) {
        columns.push({ key: "other", label: "Other" });
      }

      return (
        <div className="h-[calc(100vh-200px)] border-[0.5px] border-gray-200 bg-white overflow-hidden flex flex-col">
          <div className="flex flex-1 min-h-0 overflow-x-auto border-t">
            <div className="flex h-full py-0">
              {columns.map((col) => {
                const items = grouped[col.key] || [];
                return (
                  <div
                    key={col.key}
                    className="flex-shrink-0 w-72 border-[0.5px] border-gray-200 bg-white rounded-none h-full overflow-y-auto flex flex-col"
                  >
                    <div className="border-b border-gray-200 px-3 py-2 flex-shrink-0">
                      <h3 className="font-medium text-sm text-gray-900">
                        {col.label}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {getStatusSubtext(items)}
                      </p>
                    </div>
                    <div className="flex-1 p-2 min-h-0 overflow-y-auto">
                      <div className="space-y-2 min-h-[80px]">
                        {items.map((employee) => (
                          <div key={employee.id} className="relative">
                            <Link
                              href={`/workspace/employees/${employee.id}`}
                              className="block no-underline text-inherit"
                            >
                              <EmployeeKanbanCard employee={employee} />
                            </Link>
                            {isAdmin && (
                              <div className="absolute top-2 right-2 z-10">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      size="icon"
                                      className="h-8 w-8 shadow-sm bg-white/95"
                                      aria-label="Employee actions"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link
                                        href={`/workspace/employees/${employee.id}`}
                                      >
                                        View
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => openEdit(employee)}
                                    >
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => handleDelete(employee)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </div>
                        ))}
                        {items.length === 0 && (
                          <div className="text-sm text-gray-400 text-center py-6 italic border border-dashed border-gray-200">
                            Drop here
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // Card view (default)
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {employees.map((employee) => (
          <Link
            key={employee.id}
            href={`/workspace/employees/${employee.id}`}
            className="block"
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName(employee))}&background=random`}
                      />
                      <AvatarFallback>
                        {employee.first_name?.charAt(0) ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {displayName(employee)}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {employee.designation || employee.role || "—"}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/workspace/employees/${employee.id}`}>
                          View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          openEdit(employee);
                        }}
                      >
                        Edit
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.preventDefault();
                              handleDelete(employee);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2 mt-4">
                  {(employee.email || employee.phone) && (
                    <div className="flex items-center text-sm text-gray-600 gap-2 flex-wrap">
                      {employee.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {employee.email}
                        </span>
                      )}
                      {employee.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {employee.phone}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t flex-wrap gap-2">
                    {employee.department && (
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {employee.department}
                      </span>
                    )}
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusClass(
                        employee.employment_status,
                      )}`}
                    >
                      {statusLabel(employee.employment_status)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-gray-600">{employees.length} employees</p>
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
            <Button onClick={fetchEmployees} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4 mr-1" /> Add Employee
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : employees.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-xl mb-2">No employees yet</h3>
            <p className="text-gray-600">Create your first employee above.</p>
          </div>
        ) : (
          renderEmployees()
        )}
      </div>

      <EmployeeFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSuccess={fetchEmployees}
        employee={editingEmployee ?? undefined}
      />
    </div>
  );
}
