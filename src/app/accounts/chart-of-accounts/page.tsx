"use client";

import { PageShell } from "@/components/page-shell";
import React, { useState, useEffect } from "react";
import { usePageTitle } from "@/contexts/page-title-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus } from "lucide-react";

export default function ChartOfAccountsPage() {
  const { setTitle } = usePageTitle();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTitle("Chart of Accounts");
    return () => setTitle(null);
  }, [setTitle]);

  return (
    <PageShell fill className="bg-background text-foreground">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
            <p className="text-gray-600 mt-1">Manage your accounting structure</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={loading}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="default" size="sm">
              <Plus className="h-4 w-4 mr-1" /> New Account
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Chart of Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">
                Chart of accounts management is coming soon.
              </p>
              <p className="text-sm text-gray-500">
                This page will allow you to manage your chart of accounts and accounting structure.
              </p>
            </div>
          </CardContent>
        </Card>
      </PageShell>
  );
}
