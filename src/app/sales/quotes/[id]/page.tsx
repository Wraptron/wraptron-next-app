"use client";

import { useParams } from "next/navigation";
import { QuoteBuilder } from "@/components/quote-builder";

export default function EditQuotePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? parseInt(params.id, 10) : NaN;
  return <QuoteBuilder quoteId={id} />;
}
