"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { EmployeeFormSheet } from "@/components/employee-form-sheet";
import { EMPLOYEES_BASE_PATH } from "@/lib/employee-routes";
import { usePageTitle } from "@/contexts/page-title-context";

export default function HrNewEmployeePage() {
  const router = useRouter();
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("New employee");
    return () => setTitle(null);
  }, [setTitle]);

  return (
    <EmployeeFormSheet
      open
      employee={null}
      onOpenChange={(next) => {
        if (!next) router.push(EMPLOYEES_BASE_PATH);
      }}
      onSuccess={() => router.push(EMPLOYEES_BASE_PATH)}
    />
  );
}
