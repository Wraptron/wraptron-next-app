"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePageTitle } from "@/contexts/page-title-context";
import {
  invoiceSettingsApi,
  quotesApi,
  type InvoiceSettings,
  type Quote,
} from "@/lib/api";
import { QuotePreview } from "@/components/quote-preview";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";

export default function QuotePreviewPage() {
  const params = useParams();
  const { setTitle } = usePageTitle();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = typeof params.id === "string" ? parseInt(params.id, 10) : NaN;

  useEffect(() => {
    if (Number.isNaN(id)) {
      setError("Invalid quote ID");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([quotesApi.getById(id), invoiceSettingsApi.get()])
      .then(([quoteData, invoiceSettings]) => {
        setQuote(quoteData);
        setSettings(invoiceSettings);
      })
      .catch(() => setError("Failed to load quote"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    setTitle(quote ? `Quote ${quote.quote_number}` : null);
    return () => setTitle(null);
  }, [quote, setTitle]);

  return (
    <PageShell className="space-y-4 bg-background text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Button variant="outline" asChild>
          <Link href={Number.isNaN(id) ? "/sales/quotes" : `/sales/quotes/${id}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to quote
          </Link>
        </Button>
        <Button type="button" onClick={() => window.print()} disabled={!quote}>
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Loading quotation...
        </div>
      ) : quote ? (
        <QuotePreview quote={quote} settings={settings} />
      ) : null}
    </PageShell>
  );
}
