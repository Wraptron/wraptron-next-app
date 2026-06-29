"use client";

import { useEffect } from "react";
import { usePageTitle } from "@/contexts/page-title-context";
import { AccountsDashboard } from "@/components/accounts-dashboard";

export default function AccountsDashboardPage() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Accounts dashboard");
    return () => setTitle(null);
  }, [setTitle]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-background text-foreground">
      <AccountsDashboard />
    </div>
  );
}
