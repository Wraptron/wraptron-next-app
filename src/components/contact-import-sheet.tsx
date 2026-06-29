"use client";

import React, { useCallback, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import {
  contactsApi,
  CONTACT_IMPORT_BATCH_SIZE,
  type ContactImportResult,
  type CreateContactInput,
} from "@/lib/api";

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

const TEMPLATE_HEADERS = [
  "prefix",
  "first_name",
  "last_name",
  "email",
  "phone",
  "mobile",
  "job_title",
  "department",
  "company",
  "status",
  "is_primary",
  "notes",
];

function buildTemplateCsv(): string {
  const headers = TEMPLATE_HEADERS.join(",");
  const example = [
    "Mr",
    "John",
    "Doe",
    "john.doe@example.com",
    "+1 555-0123",
    "",
    "Sales Manager",
    "Sales",
    "Acme Inc",
    "active",
    "false",
    "Imported from CSV",
  ].join(",");
  return [headers, example].join("\n");
}

function downloadTemplate() {
  const csv = buildTemplateCsv();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "contacts-import-template.csv";
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
  const headers = parseCsvRow(lines[0]).map((h) =>
    h.toLowerCase().trim().replace(/\s+/g, "_"),
  );
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

function toBoolean(value?: string): boolean | undefined {
  const v = (value ?? "").trim().toLowerCase();
  if (!v) return undefined;
  if (["true", "1", "yes", "y"].includes(v)) return true;
  if (["false", "0", "no", "n"].includes(v)) return false;
  return undefined;
}

function rowToContactInput(row: Record<string, string>): CreateContactInput {
  const firstName =
    row.first_name || row.firstname || row["first name"] || "Imported";
  const email = row.email?.trim();
  return {
    prefix: row.prefix || undefined,
    first_name: firstName,
    last_name: row.last_name || row.lastname || undefined,
    email: email || undefined,
    phone: row.phone || undefined,
    mobile: row.mobile || undefined,
    job_title: row.job_title || row.title || undefined,
    department: row.department || undefined,
    company: row.company || undefined,
    status: row.status || "active",
    is_primary: toBoolean(row.is_primary),
    notes: row.notes || undefined,
  };
}

export interface ContactImportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ContactImportSheet({
  open,
  onOpenChange,
  onSuccess,
}: ContactImportSheetProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [fileKey, setFileKey] = useState(0);
  const [importResult, setImportResult] = useState<{
    created: number;
    updated: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImportResult(null);
      setUploading(true);
      setProgress(0);
      setProgressLabel("");

      try {
        const text = await file.text();
        const rows = parseCsvFile(text);
        if (rows.length === 0) {
          setImportResult({
            created: 0,
            updated: 0,
            failed: 0,
            errors: ["No data rows in file or invalid CSV."],
          });
          return;
        }

        const contacts = rows.map(rowToContactInput);
        const batches = chunkArray(contacts, CONTACT_IMPORT_BATCH_SIZE);
        const merged: ContactImportResult = {
          created: 0,
          updated: 0,
          failed: 0,
          errors: [],
        };

        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          const processedBefore = i * CONTACT_IMPORT_BATCH_SIZE;
          setProgressLabel(
            `Importing rows ${processedBefore + 1}–${processedBefore + batch.length} of ${contacts.length}`,
          );
          setProgress(Math.round((i / batches.length) * 100));

          const result = await contactsApi.import(batch);
          merged.created += result.created;
          merged.updated += result.updated;
          merged.failed += result.failed;
          for (const error of result.errors) {
            if (merged.errors.length < 8) merged.errors.push(error);
          }
        }

        setProgress(100);
        setProgressLabel(`Finished importing ${contacts.length} rows`);
        setImportResult(merged);
        if (merged.created > 0 || merged.updated > 0) onSuccess();
      } catch (err) {
        setImportResult({
          created: 0,
          updated: 0,
          failed: 0,
          errors: [err instanceof Error ? err.message : "Failed to parse file"],
        });
      } finally {
        setUploading(false);
        setFileKey((k) => k + 1);
        e.target.value = "";
      }
    },
    [onSuccess],
  );

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setImportResult(null);
      setProgress(0);
      setProgressLabel("");
      setFileKey((k) => k + 1);
    }
    onOpenChange(next);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Import contacts</SheetTitle>
          <SheetDescription>
            Download the CSV template, fill in your contacts, then upload the
            file to import. Email is used as the unique identifier — existing
            contacts are updated. A company is created automatically when the
            company column is filled, and the contact is linked to it.
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
            <input
              key={fileKey}
              type="file"
              accept=".csv"
              className="flex-1 text-sm file:mr-2 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:text-sm"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {uploading && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progressLabel || "Importing..."}
                </p>
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                  aria-label="Contact import progress"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{progress}%</p>
              </div>
            )}
          </div>

          {importResult && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {importResult.created > 0 && (
                  <span className="flex items-center gap-1 text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    {importResult.created} contact
                    {importResult.created !== 1 ? "s" : ""} created
                  </span>
                )}
                {importResult.updated > 0 && (
                  <span className="flex items-center gap-1 text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    {importResult.updated} contact
                    {importResult.updated !== 1 ? "s" : ""} updated
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
