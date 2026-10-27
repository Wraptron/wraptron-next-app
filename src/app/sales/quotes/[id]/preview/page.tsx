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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  ChevronDown,
  FileDown,
  Mail,
  MessageCircle,
  Printer,
  Share2,
} from "lucide-react";

export default function QuotePreviewPage() {
  const params = useParams();
  const { setTitle } = usePageTitle();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const id = typeof params.id === "string" ? parseInt(params.id, 10) : NaN;

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

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

  const handleDownloadPdf = async () => {
    if (!quote) return;
    setDownloadingPdf(true);
    try {
      const blob = await quotesApi.downloadPdf(quote.id);
      const safeNumber = (quote.quote_number || `QUO-${quote.id}`).replace(
        /[^\w.-]+/g,
        "-",
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Quote-${safeNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (!quote || typeof window === "undefined") return;
    const total =
      Number(quote.total || 0) ||
      Number(quote.subtotal || 0) +
        Number(quote.tax_total || 0) +
        Number(quote.adjustment_amount || 0);
    const text = `Quotation ${quote.quote_number || ""} for ${
      quote.customer_name || "Customer"
    } - ${new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(total)}\nView document: ${window.location.origin}/sales/quotes/${
      quote.id
    }/preview`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleEmailShare = () => {
    if (!quote || typeof window === "undefined") return;
    const total =
      Number(quote.total || 0) ||
      Number(quote.subtotal || 0) +
        Number(quote.tax_total || 0) +
        Number(quote.adjustment_amount || 0);
    const subject = `Quotation ${quote.quote_number || ""} from Wraptron`;
    const body = `Dear ${quote.customer_name || "Customer"},\n\nPlease review our quotation ${
      quote.quote_number || ""
    }.\nTotal Amount: ${new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(total)}\n\nView quotation document:\n${
      window.location.origin
    }/sales/quotes/${quote.id}/preview\n\nRegards,\nWraptron`;
    window.location.href = `mailto:?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  };

  const handleNativeShare = async () => {
    if (!quote || !canNativeShare) return;
    const total =
      Number(quote.total || 0) ||
      Number(quote.subtotal || 0) +
        Number(quote.tax_total || 0) +
        Number(quote.adjustment_amount || 0);
    try {
      await navigator.share({
        title: `Quotation ${quote.quote_number || ""}`,
        text: `Quotation ${quote.quote_number || ""} for ${
          quote.customer_name || "Customer"
        } - ${new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(total)}`,
        url: `${window.location.origin}/sales/quotes/${quote.id}/preview`,
      });
    } catch {
      // User cancelled
    }
  };

  return (
    <PageShell className="space-y-4 bg-background text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Button variant="outline" asChild>
          <Link href={Number.isNaN(id) ? "/sales/quotes" : `/sales/quotes/${id}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to quote
          </Link>
        </Button>

        {/* Print button with built-in document share options */}
        <DropdownMenu>
          <div className="inline-flex rounded-md shadow-xs">
            <Button
              type="button"
              onClick={() => window.print()}
              disabled={!quote}
              className="rounded-r-none border-r border-primary-foreground/20"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </Button>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                disabled={!quote}
                className="rounded-l-none px-2.5"
                aria-label="Print and share options"
                title="Print and share options"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </div>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print Document
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
            >
              <FileDown className="mr-2 h-4 w-4" />
              {downloadingPdf ? "Generating PDF..." : "Download PDF"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleWhatsAppShare}>
              <MessageCircle className="mr-2 h-4 w-4 text-emerald-600" />
              Share via WhatsApp
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleEmailShare}>
              <Mail className="mr-2 h-4 w-4 text-blue-600" />
              Share via Email
            </DropdownMenuItem>
            {canNativeShare && (
              <DropdownMenuItem onClick={handleNativeShare}>
                <Share2 className="mr-2 h-4 w-4 text-purple-600" />
                Share to Apps...
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
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
