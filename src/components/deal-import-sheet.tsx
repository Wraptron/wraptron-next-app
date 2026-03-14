"use client";

import React, { useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { dealsApi, type CreateDealInput } from "@/lib/api";
import { useCurrency } from "@/contexts/currency-context";

const TEMPLATE_HEADERS = [
  "title",
  "stage",
  "value",
  "currency",
  "probability",
  "expected_close_date",
  "description",
];

function buildTemplateCsv(): string {
  const headers = TEMPLATE_HEADERS.join(",");
  const example = [
    "Q1 Enterprise Deal",
    "New Lead",
    "50000",
    "USD",
    "25",
    "2025-06-30",
    "Initial engagement",
  ].join(",");
  return [headers, example].join("\n");
}

function downloadTemplate() {
  const csv = buildTemplateCsv();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "deals-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsvRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (inQuotes) {
      current += c;
    } else if (c === ",") {
      result.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsvFile(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headerRow = parseCsvRow(lines[0]);
  const headers = headerRow.map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvRow(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function rowToDealInput(row: Record<string, string>, defaultCurrency: string): CreateDealInput {
  const num = (s: string) => {
    const n = parseFloat(String(s).replace(/[^0-9.-]/g, ""));
    return isNaN(n) ? undefined : n;
  };
  return {
    title: row.title || row["deal_title"] || "Imported deal",
    stage: row.stage || "New Lead",
    value: num(row.value),
    currency: row.currency || defaultCurrency,
    probability: num(row.probability) ?? 0,
    expected_close_date: row.expected_close_date || row["expected_close_date"] || undefined,
    description: row.description || undefined,
  };
}

export interface DealImportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DealImportSheet({
  open,
  onOpenChange,
  onSuccess,
}: DealImportSheetProps) {
  const { currency: defaultCurrency } = useCurrency();
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [fileKey, setFileKey] = useState(0);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImportResult(null);
      setUploading(true);
      const errors: string[] = [];
      let created = 0;
      let failed = 0;
      try {
        const text = await file.text();
        const rows = parseCsvFile(text);
        if (rows.length === 0) {
          setImportResult({ created: 0, failed: 0, errors: ["No data rows in file or invalid CSV."] });
          setUploading(false);
          e.target.value = "";
          return;
        }
        for (let i = 0; i < rows.length; i++) {
          try {
            const input = rowToDealInput(rows[i], defaultCurrency);
            await dealsApi.create(input);
            created++;
          } catch (err) {
            failed++;
            const msg = err instanceof Error ? err.message : String(err);
            errors.push(`Row ${i + 2}: ${msg}`);
            if (errors.length >= 5) {
              errors.push(`... and ${rows.length - i - 1} more`);
              break;
            }
          }
        }
        setImportResult({ created, failed, errors });
        if (created > 0) onSuccess();
      } catch (err) {
        setImportResult({
          created: 0,
          failed: 0,
          errors: [err instanceof Error ? err.message : "Failed to parse file"],
        });
      } finally {
        setUploading(false);
        setFileKey((k) => k + 1);
        e.target.value = "";
      }
    },
    [defaultCurrency, onSuccess]
  );

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setImportResult(null);
      setFileKey((k) => k + 1);
    }
    onOpenChange(next);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Import deals</SheetTitle>
          <SheetDescription>
            Download the CSV template, fill in your deals, then upload the file to import.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label>Template</Label>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-center"
              onClick={downloadTemplate}
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV template
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Upload file</Label>
            <div className="flex items-center gap-2">
              <input
                key={fileKey}
                type="file"
                accept=".csv"
                className="flex-1 text-sm file:mr-2 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:text-sm"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>
            {uploading && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing…
              </p>
            )}
          </div>
          {importResult && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {importResult.created > 0 && (
                  <span className="flex items-center gap-1 text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    {importResult.created} deal{importResult.created !== 1 ? "s" : ""} created
                  </span>
                )}
                {importResult.failed > 0 && (
                  <span className="flex items-center gap-1 text-amber-700">
                    <AlertCircle className="h-4 w-4" />
                    {importResult.failed} failed
                  </span>
                )}
              </div>
              {importResult.errors.length > 0 && (
                <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                  {importResult.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
