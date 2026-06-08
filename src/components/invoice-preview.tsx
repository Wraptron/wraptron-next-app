"use client";

import type { Invoice, InvoiceSettings } from "@/lib/api";
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

export function InvoicePreview({
  invoice,
  settings,
}: {
  invoice: Invoice;
  settings?: InvoiceSettings | null;
}) {
  return (
    <div className="space-y-4 text-sm">
      <div className="flex justify-between gap-4">
        <div>
          <div className="text-base font-semibold">
            {settings?.company_name || "Company"}
          </div>
          <div className="whitespace-pre-line text-muted-foreground">
            {settings?.company_address || "—"}
          </div>
          <div>GSTIN: {settings?.company_gst || "—"}</div>
          {settings?.company_logo_url && (
            <img
              src={settings.company_logo_url}
              alt="Company logo"
              className="mt-2 h-10 object-contain"
            />
          )}
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">TAX INVOICE</div>
          <div>#{invoice.invoice_number}</div>
          <div>Date: {formatDate(invoice.invoice_date)}</div>
          <div>Due: {formatDate(invoice.due_date)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <div className="font-semibold">Bill to</div>
          <div>{invoice.customer_name}</div>
          <div className="whitespace-pre-line text-muted-foreground">
            {invoice.customer_address || "—"}
          </div>
          <div>GSTIN: {invoice.customer_gst || "—"}</div>
        </div>
        <div className="space-y-1 text-muted-foreground">
          <div>Payment terms: {invoice.payment_terms || "—"}</div>
          <div>Place of supply: {invoice.place_of_supply || "—"}</div>
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
            {invoice.items?.map((item, idx) => (
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
          <span>{money(Number(invoice.subtotal || 0))}</span>
        </div>
        <div className="flex justify-between">
          <span>CGST</span>
          <span>{money(Number(invoice.cgst_total || 0))}</span>
        </div>
        <div className="flex justify-between">
          <span>SGST</span>
          <span>{money(Number(invoice.sgst_total || 0))}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>{money(Number(invoice.total || 0))}</span>
        </div>
      </div>

      <div>
        <div className="font-semibold">Terms and conditions</div>
        <div className="whitespace-pre-line text-muted-foreground">
          {invoice.terms_and_conditions || "—"}
        </div>
      </div>
      <div>
        <div className="font-semibold">Authorized signature</div>
        <div className="text-muted-foreground">
          {invoice.authorized_signature || "—"}
        </div>
      </div>
    </div>
  );
}
