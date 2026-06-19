"use client";

import { PageShell } from "@/components/page-shell";
import React, { useEffect } from "react";
import { usePageTitle } from "@/contexts/page-title-context";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, FileText, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PAYSLIPS = [
  {
    id: "PAY-001",
    employee: "John Doe",
    period: "January 2026",
    amount: 5500.00,
    status: "Paid",
    date: "2026-01-31",
  },
  {
    id: "PAY-002",
    employee: "Jane Smith",
    period: "January 2026",
    amount: 6200.00,
    status: "Paid",
    date: "2026-01-31",
  },
  {
    id: "PAY-003",
    employee: "Mike Johnson",
    period: "January 2026",
    amount: 4800.00,
    status: "Processing",
    date: "2026-01-31",
  },
];

export default function PayslipsPage() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Payslips");
    return () => setTitle(null);
  }, [setTitle]);

  return (
    <PageShell fill className="bg-background text-foreground">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Payslips</h1>
            <p className="text-muted-foreground mt-1">Manage and distribute employee salary slips</p>
          </div>
          <div className="flex gap-2">
             <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button>
              Generate Payslips
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payslip ID</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Pay Period</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PAYSLIPS.map((payslip) => (
                <TableRow key={payslip.id}>
                  <TableCell className="font-medium">{payslip.id}</TableCell>
                  <TableCell>{payslip.employee}</TableCell>
                  <TableCell>{payslip.period}</TableCell>
                  <TableCell>${payslip.amount.toFixed(2)}</TableCell>
                  <TableCell>{payslip.date}</TableCell>
                  <TableCell>
                    <Badge variant={payslip.status === "Paid" ? "default" : "secondary"}
                      className={payslip.status === "Paid" ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"}>
                      {payslip.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </PageShell>
  );
}
