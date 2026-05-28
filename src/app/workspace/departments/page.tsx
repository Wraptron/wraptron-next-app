"use client";

import React, { useEffect } from "react";
import { usePageTitle } from "@/contexts/page-title-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MoreHorizontal, Plus, Users } from "lucide-react";

const DEPARTMENTS = [
  {
    id: 1,
    name: "Engineering",
    head: "John Doe",
    employeeCount: 12,
    budget: "$1.2M",
    status: "Active",
  },
  {
    id: 2,
    name: "Product",
    head: "Jane Smith",
    employeeCount: 8,
    budget: "$800k",
    status: "Active",
  },
  {
    id: 3,
    name: "Design",
    head: "Mike Johnson",
    employeeCount: 5,
    budget: "$500k",
    status: "Active",
  },
  {
    id: 4,
    name: "Sales",
    head: "Sarah Wilson",
    employeeCount: 20,
    budget: "$2.0M",
    status: "Active",
  },
  {
    id: 5,
    name: "Marketing",
    head: "Tom Brown",
    employeeCount: 6,
    budget: "$600k",
    status: "Active",
  },
];

export default function DepartmentsPage() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Departments");
    return () => setTitle(null);
  }, [setTitle]);

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Departments</h1>
            <p className="text-muted-foreground mt-1">Manage organizational departments and teams</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Department
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {DEPARTMENTS.map((dept) => (
            <Card key={dept.id} className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">{dept.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">Head: {dept.head}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex flex-col gap-1 rounded-md bg-muted/50 p-3">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" /> Employees
                    </span>
                    <span className="text-lg font-semibold text-foreground">{dept.employeeCount}</span>
                  </div>
                  <div className="flex flex-col gap-1 rounded-md bg-muted/50 p-3">
                    <span className="text-xs font-medium text-muted-foreground">Budget</span>
                    <span className="text-lg font-semibold text-foreground">{dept.budget}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
