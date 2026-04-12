"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageTitle } from "@/contexts/page-title-context";
import { EmployeeFormSheet } from "@/components/employee-form-sheet";
import { employeesApi, type Employee } from "@/lib/api";

function displayName(e: Employee) {
  const parts = [e.first_name, e.middle_name, e.last_name].filter(Boolean);
  return parts.join(" ") || "—";
}

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  const id = params?.id as string | undefined;

  useEffect(() => {
    if (!id) return;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      router.push("/workspace/employees");
      return;
    }
    employeesApi
      .getById(numId)
      .then((data) => {
        setEmployee(data);
        setTitle(`Edit ${displayName(data)}`);
      })
      .catch(() => router.push("/workspace/employees"))
      .finally(() => setLoading(false));
    return () => setTitle(null);
  }, [id, router, setTitle]);

  if (loading) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeFormSheet
        open
        employee={employee ?? undefined}
        onOpenChange={(next) => {
          if (!next) router.push(employee ? `/workspace/employees/${employee.id}` : "/workspace/employees");
        }}
        onSuccess={() =>
          router.push(employee ? `/workspace/employees/${employee.id}` : "/workspace/employees")
        }
      />
    </div>
  );
}

