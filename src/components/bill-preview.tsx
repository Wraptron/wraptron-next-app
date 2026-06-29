"use client";

import type { Bill } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

function formatDate(value?: string) {
  if (!value) return "—";
  return value.slice(0, 10);
}

export function BillPreview({ bill }: { bill: Bill }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="flex justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">EXPENSE BILL</div>
          <div className="font-mono">#{bill.bill_number}</div>
          <div>Date: {formatDate(bill.bill_date)}</div>
          <div>Due: {formatDate(bill.due_date)}</div>
        </div>
        <div className="text-right text-muted-foreground">
          {bill.status ? (
            <div className="capitalize">{bill.status.replace(/_/g, " ")}</div>
          ) : null}
          {bill.balance_due != null ? (
            <div>Balance due: {money(Number(bill.balance_due))}</div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <div className="font-semibold">Vendor</div>
          <div>{bill.vendor_name}</div>
          <div className="whitespace-pre-line text-muted-foreground">
            {bill.vendor_address || "—"}
          </div>
          <div>GSTIN: {bill.vendor_gst || "—"}</div>
        </div>
        <div className="space-y-1 text-muted-foreground">
          <div>Payment terms: {bill.payment_terms || "—"}</div>
          <div>Place of supply: {bill.place_of_supply || "—"}</div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>HSN</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bill.items?.map((item, idx) => (
              <TableRow key={item.id ?? idx}>
                <TableCell>{item.item_description}</TableCell>
                <TableCell>{item.hsn}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{money(Number(item.rate || 0))}</TableCell>
                <TableCell>{money(Number(item.amount || 0))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="ml-auto max-w-xs space-y-1 rounded-md border bg-muted/40 p-3">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{money(Number(bill.subtotal || 0))}</span>
        </div>
        <div className="flex justify-between">
          <span>CGST</span>
          <span>{money(Number(bill.cgst_total || 0))}</span>
        </div>
        <div className="flex justify-between">
          <span>SGST</span>
          <span>{money(Number(bill.sgst_total || 0))}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>{money(Number(bill.total || 0))}</span>
        </div>
      </div>
    </div>
  );
}
