"use client";

import { useParams } from "next/navigation";
import { InvoiceBuilder } from "@/components/invoice-builder";

export default function EditInvoicePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? parseInt(params.id, 10) : NaN;
  return <InvoiceBuilder invoiceId={id} />;
}
