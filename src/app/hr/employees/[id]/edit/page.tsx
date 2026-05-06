"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { EmployeeFormSheet } from "@/components/employee-form-sheet";
import { Button } from "@/components/ui/button";
import { employeesApi, type Employee } from "@/lib/api";
import { EMPLOYEES_BASE_PATH } from "@/lib/employee-routes";
import { usePageTitle } from "@/contexts/page-title-context";

export default function HrEditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const id = Number(params?.id);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setError("Invalid employee");
      setLoading(false);
      return;
    }
    employeesApi
      .getById(id)
      .then(setEmployee)
      .catch(() => setError("Employee not found"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!employee) return;
    const name = [employee.first_name, employee.last_name].filter(Boolean).join(" ");
    setTitle(name ? `Edit — ${name}` : "Edit employee");
    return () => setTitle(null);
  }, [employee, setTitle]);

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  if (error || !employee) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive mb-4">{error ?? "Not found"}</p>
        <Button asChild variant="outline">
          <Link href={EMPLOYEES_BASE_PATH}>Back to employees</Link>
        </Button>
      </div>
    );
  }

  return (
    <EmployeeFormSheet
      open
      employee={employee}
      onOpenChange={(next) => {
        if (!next) router.push(`${EMPLOYEES_BASE_PATH}/${employee.id}`);
      }}
      onSuccess={() => router.push(`${EMPLOYEES_BASE_PATH}/${employee.id}`)}
    />
  );
}
