"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/contexts/page-title-context";
import { EmployeeFormSheet } from "@/components/employee-form-sheet";

export default function NewEmployeePage() {
  const router = useRouter();
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Add Employee");
    return () => setTitle(null);
  }, [setTitle]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <EmployeeFormSheet
        open
        onOpenChange={(next) => {
          if (!next) router.push("/workspace/employees");
        }}
        onSuccess={() => router.push("/workspace/employees")}
      />
    </div>
  );
}

