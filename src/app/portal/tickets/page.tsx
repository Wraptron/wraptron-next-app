"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PortalPage } from "@/components/portal/portal-page";
import {
  TicketStatusBadge,
  TicketTypeBadge,
} from "@/components/portal/portal-badges";
import { usePageTitle } from "@/contexts/page-title-context";
import {
  MOCK_TICKETS,
  formatRelativeDate,
  type SupportTicket,
  type TicketType,
} from "@/lib/portal-data";

export default function PortalTicketsPage() {
  const { setTitle } = usePageTitle();
  const [tickets, setTickets] = useState(MOCK_TICKETS);
  const [composeOpen, setComposeOpen] = useState(false);
  const [ticketType, setTicketType] = useState<TicketType>("Bug");

  useEffect(() => {
    setTitle("Tickets");
    return () => setTitle(null);
  }, [setTitle]);

  const openTickets = useMemo(
    () =>
      tickets.filter(
        (t) => t.status === "Open" || t.status === "In Progress" || t.status === "Resolved",
      ),
    [tickets],
  );
  const closedTickets = useMemo(
    () => tickets.filter((t) => t.status === "Closed"),
    [tickets],
  );

  const handleCreateTicket = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const subject = (form.elements.namedItem("subject") as HTMLInputElement).value;
    const description = (form.elements.namedItem("description") as HTMLTextAreaElement).value;
    const now = new Date().toISOString();
    const newTicket: SupportTicket = {
      id: `T-${1000 + tickets.length}`,
      subject,
      type: ticketType,
      status: "Open",
      assignee: "Unassigned",
      createdAt: now,
      updatedAt: now,
      description,
    };
    setTickets((prev) => [newTicket, ...prev]);
    setComposeOpen(false);
    form.reset();
  };

  return (
    <>
      <PortalPage
        title="Raise a ticket"
        description="Report bugs or request changes. Your assigned team will respond within one business day."
        actions={
          <Button onClick={() => setComposeOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New ticket
          </Button>
        }
      >
        <Tabs defaultValue="open">
          <TabsList>
            <TabsTrigger value="open">Open ({openTickets.length})</TabsTrigger>
            <TabsTrigger value="closed">Closed ({closedTickets.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="open" className="mt-4">
            <TicketList tickets={openTickets} emptyMessage="No open tickets." />
          </TabsContent>
          <TabsContent value="closed" className="mt-4">
            <TicketList tickets={closedTickets} emptyMessage="No closed tickets yet." />
          </TabsContent>
        </Tabs>
      </PortalPage>

      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New support ticket</DialogTitle>
            <DialogDescription>
              Describe the issue or change request in detail so we can route it to the right team.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" placeholder="Brief summary" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={ticketType} onValueChange={(v) => setTicketType(v as TicketType)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bug">Bug</SelectItem>
                  <SelectItem value="Change">Change</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Steps to reproduce, expected vs actual behavior..."
                rows={5}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setComposeOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit ticket</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TicketList({
  tickets,
  emptyMessage,
}: {
  tickets: SupportTicket[];
  emptyMessage: string;
}) {
  if (tickets.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-3">
      {tickets.map((ticket) => (
        <li key={ticket.id}>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-medium">
                    <span className="text-muted-foreground font-mono text-sm mr-2">
                      {ticket.id}
                    </span>
                    {ticket.subject}
                  </CardTitle>
                  <CardDescription className="mt-1">{ticket.description}</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <TicketTypeBadge type={ticket.type} />
                  <TicketStatusBadge status={ticket.status} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
              <span>Assignee: {ticket.assignee}</span>
              <span>Updated {formatRelativeDate(ticket.updatedAt)}</span>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
