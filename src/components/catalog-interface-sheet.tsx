"use client";

import React, { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  catalogInterfacesApi,
  type CatalogInterface,
  type InterfaceType,
} from "@/lib/api";

export interface CatalogInterfaceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interfaceTypes: InterfaceType[];
  editing: CatalogInterface | null;
  onSuccess: () => void;
}

export function CatalogInterfaceSheet({
  open,
  onOpenChange,
  interfaceTypes,
  editing,
  onSuccess,
}: CatalogInterfaceSheetProps) {
  const [name, setName] = useState("");
  const [typeId, setTypeId] = useState<string>("");
  const [cost, setCost] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setTypeId(String(editing.interface_type_id));
      setCost(
        editing.cost != null && editing.cost !== ""
          ? String(editing.cost)
          : "",
      );
    } else {
      setName("");
      setTypeId(interfaceTypes[0] ? String(interfaceTypes[0].id) : "");
      setCost("");
    }
  }, [open, editing, interfaceTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n || !typeId) return;
    const costNum = cost.trim() === "" ? null : parseFloat(cost);
    if (cost.trim() !== "" && (Number.isNaN(costNum) || costNum! < 0)) {
      alert("Enter a valid cost or leave empty.");
      return;
    }
    setLoading(true);
    try {
      const tid = parseInt(typeId, 10);
      if (editing) {
        await catalogInterfacesApi.update(editing.id, {
          name: n,
          interface_type_id: tid,
          cost: costNum,
        });
      } else {
        await catalogInterfacesApi.create({
          name: n,
          interface_type_id: tid,
          cost: costNum,
        });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      alert(
        err && typeof err === "object" && "message" in err
          ? String((err as Error).message)
          : "Save failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>{editing ? "Edit interface" : "New interface"}</SheetTitle>
          <SheetDescription>
            Interface name, structural type (page / component / layout), and
            cost.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 gap-4 py-4">
          {interfaceTypes.length === 0 && (
            <Alert>
              <AlertDescription>
                Add at least one interface type in{" "}
                <Link href="/settings" className="font-medium underline underline-offset-4">
                  Settings → Interface types
                </Link>{" "}
                before you can save.
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="ci-name">Interface name *</Label>
            <Input
              id="ci-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Checkout page shell"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Type *</Label>
            <Select
              value={typeId || undefined}
              onValueChange={setTypeId}
              required
              disabled={interfaceTypes.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    interfaceTypes.length === 0
                      ? "No types yet — add in Settings"
                      : "Select type"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {interfaceTypes.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Manage types in Settings → Product catalog types.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ci-cost">Cost</Label>
            <Input
              id="ci-cost"
              type="number"
              min={0}
              step={0.01}
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <SheetFooter className="mt-auto gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !name.trim() ||
                !typeId ||
                interfaceTypes.length === 0
              }
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : editing ? (
                "Save"
              ) : (
                "Create"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
