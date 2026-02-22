"use client";

import React, { useEffect } from "react";
import { usePageTitle } from "@/contexts/page-title-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Users, Mail, Phone, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const EMPLOYEES = [
  {
    id: 1,
    name: "John Doe",
    role: "Software Engineer",
    email: "john@example.com",
    department: "Engineering",
    status: "Active",
  },
  {
    id: 2,
    name: "Jane Smith",
    role: "Product Manager",
    email: "jane@example.com",
    department: "Product",
    status: "Active",
  },
  {
    id: 3,
    name: "Mike Johnson",
    role: "Designer",
    email: "mike@example.com",
    department: "Design",
    status: "On Leave",
  },
];

export default function EmployeesPage() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Employees");
    return () => setTitle(null);
  }, [setTitle]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
            <p className="text-gray-600 mt-1">Manage your team members</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {EMPLOYEES.map((employee) => (
            <Card key={employee.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`https://ui-avatars.com/api/?name=${employee.name}&background=random`} />
                      <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                      <p className="text-sm text-gray-500">{employee.role}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                  </Button>
                </div>
                
                <div className="space-y-2 mt-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    {employee.email}
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {employee.department}
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      employee.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {employee.status}
                    </span>
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
