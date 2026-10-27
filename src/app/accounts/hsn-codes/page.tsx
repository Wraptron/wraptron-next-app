"use client";

import { PageShell } from "@/components/page-shell";
import React, { useCallback, useEffect, useState } from "react";
import { usePageTitle } from "@/contexts/page-title-context";
import { hsnCodesApi, type HsnCode } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function HsnCodesPage() {
  const { setTitle } = usePageTitle();
  const [codes, setCodes] = useState<HsnCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<HsnCode | null>(null);
  const [code, setCode] = useState("");
  const [tax, setTax] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTitle("HSN Codes");
    return () => setTitle(null);
  }, [setTitle]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await hsnCodesApi.getAll();
      setCodes(res.data ?? []);
    } catch (e: unknown) {
      setCodes([]);
      setError(errorMessage(e, "Failed to load HSN codes"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const taxNumber = Number(tax);
  const codeValid = /^\d{4,8}$/.test(code.trim());
  const taxValid = tax.trim() !== "" && Number.isFinite(taxNumber) && taxNumber >= 0 && taxNumber <= 100;

  const handleAdd = async () => {
    if (!codeValid || !taxValid) return;
    setBusy(true);
    setError(null);
    try {
      await hsnCodesApi.create({
        code: code.trim(),
        tax_percent: taxNumber,
        description: description.trim() || null,
      });
      setAddOpen(false);
      setCode("");
      setTax("");
      setDescription("");
      await load();
    } catch (e: unknown) {
      setError(errorMessage(e, "Failed to add HSN code"));
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = async () => {
    if (!selected || !codeValid || !taxValid) return;
    setBusy(true);
    setError(null);
    try {
      await hsnCodesApi.update(selected.id, {
        code: code.trim(),
        tax_percent: taxNumber,
        description: description.trim() || null,
      });
      setEditOpen(false);
      setSelected(null);
      setDescription("");
      await load();
    } catch (e: unknown) {
      setError(errorMessage(e, "Failed to update HSN code"));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      await hsnCodesApi.delete(selected.id);
      setDeleteOpen(false);
      setSelected(null);
      await load();
    } catch (e: unknown) {
      setError(errorMessage(e, "Failed to delete HSN code"));
    } finally {
      setBusy(false);
    }
  };

  const formFields = (idPrefix: string) => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-code`}>HSN code</Label>
        <Input
          id={`${idPrefix}-code`}
          inputMode="numeric"
          placeholder="e.g. 8471"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-tax`}>Tax (%)</Label>
        <Input
          id={`${idPrefix}-tax`}
          type="number"
          min={0}
          max={100}
          step="0.01"
          placeholder="e.g. 18"
          value={tax}
          onChange={(e) => setTax(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-description`}>Description (optional)</Label>
        <Textarea
          id={`${idPrefix}-description`}
          rows={3}
          placeholder="e.g. Automatic data processing machines and units thereof"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
    </div>
  );

  return (
    <PageShell fill className="bg-background text-foreground">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">HSN Codes</h1>
          <p className="mt-1 text-muted-foreground">
            Store HSN codes and the tax rate that applies to each one.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setCode("");
              setTax("");
              setDescription("");
              setAddOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add HSN code
          </Button>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>HSN codes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-12 text-center text-muted-foreground">Loading HSN codes...</p>
          ) : codes.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">
              No HSN codes yet. Add a code and its tax rate to use them on invoices and bills.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">HSN code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Tax</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono font-medium">{item.code}</TableCell>
                    <TableCell className="max-w-[340px]">
                      {item.description ? (
                        <span className="line-clamp-2 text-sm text-foreground/90">
                          {item.description}
                        </span>
                      ) : (
                        <span className="text-xs italic text-muted-foreground">
                          No description
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{Number(item.tax_percent)}%</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit HSN ${item.code}`}
                        onClick={() => {
                          setSelected(item);
                          setCode(item.code);
                          setTax(String(Number(item.tax_percent)));
                          setDescription(item.description ?? "");
                          setEditOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete HSN ${item.code}`}
                        onClick={() => {
                          setSelected(item);
                          setDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add HSN code</DialogTitle>
            <DialogDescription>
              Enter a 4 to 8 digit HSN code, tax percentage, and optional description.
            </DialogDescription>
          </DialogHeader>
          {formFields("hsn-add")}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => void handleAdd()} disabled={busy || !codeValid || !taxValid}>
              {busy ? "Adding..." : "Add HSN code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit HSN code</DialogTitle>
            <DialogDescription>Update the code, tax percentage, or description.</DialogDescription>
          </DialogHeader>
          {formFields("hsn-edit")}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => void handleEdit()} disabled={busy || !codeValid || !taxValid}>
              {busy ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete HSN code</DialogTitle>
            <DialogDescription>
              Remove HSN {selected?.code}? This does not change existing invoices or bills.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={busy}>
              {busy ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
