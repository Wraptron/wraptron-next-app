"use client";

import React, { useState, useEffect } from "react";
import { usePageTitle } from "@/contexts/page-title-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus } from "lucide-react";

export default function PaymentsReceivedPage() {
  const { setTitle } = usePageTitle();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTitle("Payments Received");
    return () => setTitle(null);
  }, [setTitle]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payments Received</h1>
            <p className="text-gray-600 mt-1">Track incoming payments</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={loading}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="default" size="sm">
              <Plus className="h-4 w-4 mr-1" /> Record Payment
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payments Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">
                Payment tracking is coming soon.
              </p>
              <p className="text-sm text-gray-500">
                This page will allow you to view and record payments received from customers.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
