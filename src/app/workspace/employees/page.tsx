"use client";

import React, { useEffect, useState } from "react";
import { usePageTitle } from "@/contexts/page-title-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Mail, Phone, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { employeesApi, type Employee } from "@/lib/api";
import { EmployeeFormSheet } from "@/components/employee-form-sheet";

function displayName(e: Employee) {
  const parts = [e.first_name, e.middle_name, e.last_name].filter(Boolean);
  return parts.join(" ") || "—";
}

export default function EmployeesPage() {
  const { setTitle } = usePageTitle();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const fetchEmployees = async () => {
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

  const openAdd = () => {
    setEditingEmployee(null);
    setSheetOpen(true);
  };

  const openEdit = (e: Employee) => {
    setEditingEmployee(e);
    setSheetOpen(true);
  };

  const statusClass = (status?: string) => {
    const s = (status ?? "").toLowerCase();
    if (s === "active") return "bg-green-100 text-green-800";
    if (s === "on_leave") return "bg-yellow-100 text-yellow-800";
    if (s === "terminated" || s === "resigned") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
            <p className="text-gray-600 mt-1">Manage your team members</p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : employees.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No employees yet. Click &quot;Add Employee&quot; to add one.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {employees.map((employee) => (
              <Card
                key={employee.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openEdit(employee)}
              >
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
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {displayName(employee)}
                        </h3>
                        <p className="text-sm text-gray-500">
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
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-4 h-4 text-gray-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(employee);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2 mt-4">
                    {(employee.email || employee.phone) && (
                      <div className="flex items-center text-sm text-gray-600 gap-2">
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
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusClass(employee.employment_status)}`}
                      >
                        {employee.employment_status ?? "—"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
