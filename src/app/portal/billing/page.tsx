"use client";

import { useEffect, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PortalPage } from "@/components/portal/portal-page";
import { InvoiceStatusBadge } from "@/components/portal/portal-badges";
import { usePageTitle } from "@/contexts/page-title-context";
import {
  MOCK_INVOICES,
  formatCurrency,
  getOutstandingBalance,
} from "@/lib/portal-data";

export default function PortalBillingPage() {
  const { setTitle } = usePageTitle();
  const [payOpen, setPayOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    setTitle("Billing");
    return () => setTitle(null);
  }, [setTitle]);

  const balance = getOutstandingBalance(MOCK_INVOICES);

  const handlePay = async () => {
    setPaying(true);
    // Razorpay checkout will be integrated here via backend order creation.
    await new Promise((r) => setTimeout(r, 1200));
    setPaying(false);
    setPayOpen(false);
  };

  return (
    <>
      <PortalPage
        title="Billing & payments"
        description="View outstanding balance and invoice history. Pay securely via Razorpay."
      >
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Outstanding balance
            </CardTitle>
            <CardDescription>Total amount due across unpaid invoices</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-3xl font-semibold tabular-nums">
              {formatCurrency(balance)}
            </p>
            <Button size="lg" disabled={balance === 0} onClick={() => setPayOpen(true)}>
              Pay now
            </Button>
          </CardContent>
        </Card>

        <section>
          <h2 className="text-lg font-medium mb-4">Invoice history</h2>
          <Card>
            <ScrollArea className="h-[min(480px,60vh)]">
              <ul className="divide-y divide-border">
                {MOCK_INVOICES.map((invoice) => (
                  <li
                    key={invoice.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"
                  >
                    <div>
                      <p className="font-medium font-mono text-sm">{invoice.number}</p>
                      <p className="text-sm text-muted-foreground">
                        Issued{" "}
                        {new Date(invoice.issuedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {" · "}
                        Due{" "}
                        {new Date(invoice.dueAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold tabular-nums">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </span>
                      <InvoiceStatusBadge status={invoice.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </Card>
        </section>
      </PortalPage>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay with Razorpay</DialogTitle>
            <DialogDescription>
              You will be redirected to Razorpay to complete payment of{" "}
              {formatCurrency(balance)}. Razorpay integration will connect to your backend
              order API when configured.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)} disabled={paying}>
              Cancel
            </Button>
            <Button onClick={handlePay} disabled={paying}>
              {paying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                "Continue to Razorpay"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
