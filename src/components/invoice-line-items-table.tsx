"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";

export type InvoiceItemDraft = {
  item_description: string;
  hsn: string;
  quantity: string;
  rate: string;
  gst_rate: string;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const cellInputClass =
  "h-9 rounded-none border-0 px-2 shadow-none focus-visible:ring-0";

type InvoiceLineItemsTableProps = {
  items: InvoiceItemDraft[];
  onItemsChange: (items: InvoiceItemDraft[]) => void;
  emptyItem: InvoiceItemDraft;
};

export function InvoiceLineItemsTable({
  items,
  onItemsChange,
  emptyItem,
}: InvoiceLineItemsTableProps) {
  const updateItem = (idx: number, patch: Partial<InvoiceItemDraft>) => {
    onItemsChange(
      items.map((item, i) => (i === idx ? { ...item, ...patch } : item)),
    );
  };

  const removeItem = (idx: number) => {
    onItemsChange(items.filter((_, i) => i !== idx));
  };

  const addItem = () => {
    onItemsChange([...items, { ...emptyItem }]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base">Items</Label>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4 mr-1" />
          Add Item
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-0 hover:bg-transparent">
            <TableHead className="h-auto min-w-[200px] p-0">Item</TableHead>
            <TableHead className="h-auto w-[100px] p-0">HSN</TableHead>
            <TableHead className="h-auto w-[80px] p-0">Qty</TableHead>
            <TableHead className="h-auto w-[100px] p-0">Rate</TableHead>
            <TableHead className="h-auto w-[80px] p-0">GST %</TableHead>
            <TableHead className="h-auto w-[100px] p-0 text-right">Amount</TableHead>
            <TableHead className="h-auto w-[36px] p-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, idx) => (
            <TableRow key={idx} className="border-0 hover:bg-transparent">
              <TableCell className="p-0">
                <Input
                  value={item.item_description}
                  onChange={(e) =>
                    updateItem(idx, { item_description: e.target.value })
                  }
                  placeholder="Description"
                  className={cellInputClass}
                />
              </TableCell>
              <TableCell className="p-0">
                <Input
                  value={item.hsn}
                  onChange={(e) => updateItem(idx, { hsn: e.target.value })}
                  placeholder="HSN"
                  className={cellInputClass}
                />
              </TableCell>
              <TableCell className="p-0">
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(idx, { quantity: e.target.value })
                  }
                  className={cellInputClass}
                />
              </TableCell>
              <TableCell className="p-0">
                <Input
                  type="number"
                  value={item.rate}
                  onChange={(e) => updateItem(idx, { rate: e.target.value })}
                  className={cellInputClass}
                />
              </TableCell>
              <TableCell className="p-0">
                <Input
                  type="number"
                  value={item.gst_rate}
                  onChange={(e) =>
                    updateItem(idx, { gst_rate: e.target.value })
                  }
                  className={cellInputClass}
                />
              </TableCell>
              <TableCell className="p-0 px-2 text-right tabular-nums">
                {money(Number(item.quantity || 0) * Number(item.rate || 0))}
              </TableCell>
              <TableCell className="p-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  disabled={items.length === 1}
                  onClick={() => removeItem(idx)}
                  aria-label="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
