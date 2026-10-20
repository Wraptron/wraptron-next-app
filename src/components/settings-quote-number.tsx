"use client";

import React, { useEffect, useState } from "react";
import { quotesApi } from "@/lib/api";
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
import { FileText } from "lucide-react";

function formatQuoteNumber(value: string) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) return "";
  return `EST-${String(number).padStart(6, "0")}`;
}

export function SettingsQuoteNumber() {
  const [startNumber, setStartNumber] = useState("1");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const settings = await quotesApi.getNumberSettings();
        if (!cancelled) setStartNumber(String(settings.start_number || 1));
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load quote number settings",
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

  const preview = formatQuoteNumber(startNumber);

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
      const saved = await quotesApi.updateNumberSettings({ start_number: number });
      setStartNumber(String(saved.start_number));
      setMessage("Quote number saved. New quotes will continue from this number.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save quote number",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Quote number
        </CardTitle>
        <CardDescription className="mt-2">
          Set the number new quotes should start from. Later quotes increase
          from the highest number already used.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-4 text-sm text-muted-foreground">Loading...</div>
        ) : (
          <div className="max-w-xs space-y-3">
            <div className="space-y-2">
              <Label htmlFor="quote-start-number">Starting number</Label>
              <Input
                id="quote-start-number"
                type="number"
                min={1}
                max={999999}
                step={1}
                value={startNumber}
                onChange={(e) => setStartNumber(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                {preview
                  ? `The next new quote will be ${preview} or the next free number after it.`
                  : "Enter the first quote number to use."}
              </p>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {message ? (
              <p className="text-sm text-green-700">{message}</p>
            ) : null}
            <Button onClick={onSave} disabled={saving}>
              {saving ? "Saving..." : "Save quote number"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
