"use client";

import React, { useEffect, useState } from "react";
import { invoicesApi } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Receipt } from "lucide-react";

function formatInvoiceNumber(value: string) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) return "";
  return `INV-${String(number).padStart(6, "0")}`;
}

export function SettingsInvoiceNumber() {
  const [startNumber, setStartNumber] = useState("1");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const settings = await invoicesApi.getNumberSettings();
        if (!cancelled) setStartNumber(String(settings.start_number || 1));
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load invoice number settings",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const preview = formatInvoiceNumber(startNumber);

  const onSave = async () => {
    const number = Number(startNumber);
    if (!Number.isInteger(number) || number < 1 || number > 999999) {
      setError("Enter a whole number from 1 to 999999");
      setMessage(null);
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const saved = await invoicesApi.updateNumberSettings({
        start_number: number,
      });
      setStartNumber(String(saved.start_number));
      setMessage(
        "Invoice number saved. New invoices will continue from this number.",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save invoice number",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Invoice number
        </CardTitle>
        <CardDescription className="mt-2">
          Set the number new invoices should start from. Later invoices increase
          from the highest number already used.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-4 text-sm text-muted-foreground">Loading...</div>
        ) : (
          <div className="max-w-xs space-y-3">
            <div className="space-y-2">
              <Label htmlFor="invoice-start-number">Starting number</Label>
              <Input
                id="invoice-start-number"
                type="number"
                min={1}
                max={999999}
                step={1}
                value={startNumber}
                onChange={(e) => setStartNumber(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                {preview
                  ? `The next new invoice will be ${preview} or the next free number after it.`
                  : "Enter the first invoice number to use."}
              </p>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {message ? (
              <p className="text-sm text-green-700">{message}</p>
            ) : null}
            <Button onClick={onSave} disabled={saving}>
              {saving ? "Saving..." : "Save invoice number"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
