"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import { contactsApi, type Contact } from "@/lib/api";
import { usePageTitle } from "@/contexts/page-title-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  RefreshCw,
  Plus,
  Menu,
  LayoutGrid,
  Columns3,
  Edit,
  Trash2,
  ChevronDown,
  FileDown,
  Phone,
  Mail,
} from "lucide-react";
import { ContactFormSheet } from "@/components/contact-form-sheet";
import { ContactImportSheet } from "@/components/contact-import-sheet";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "card" | "kanban";
const CONTACTS_PAGE_SIZE = 200;

const telHref = (phone: string) =>
  `tel:${phone.replace(/[^\d+]/g, "") || phone.trim()}`;

/** Prefer mobile, then office phone, for click-to-call. */
const contactDialNumber = (c: Contact) =>
  (c.mobile?.trim() || c.phone?.trim()) || undefined;

const contactDisplayName = (c: Contact) =>
  [c.prefix, c.first_name, c.last_name].filter(Boolean).join(" ").trim() ||
  "contact";

const getStatusColor = (status?: string) => {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
    archived: "bg-red-100 text-red-800",
  };
  return colors[status?.toLowerCase() || ""] || "bg-gray-100 text-gray-800";
};

function ContactQuickActions({
  contact,
  size = "card",
  className,
}: {
  contact: Contact;
  size?: "card" | "table" | "kanban";
  className?: string;
}) {
  const tel = contactDialNumber(contact);
  const mail = contact.email?.trim();
  if (!tel && !mail) return null;

  const name = contactDisplayName(contact);
  const sizeCls =
    size === "card"
      ? "h-12 w-12 shadow-sm hover:shadow-md active:scale-[0.97] [&_svg]:size-6"
      : size === "table"
        ? "h-11 w-11 shadow-sm hover:shadow [&_svg]:size-5"
        : "h-10 w-10 shadow-sm hover:shadow [&_svg]:size-[18px]";
  const iconStroke = 2;
  const iconClass =
    size === "card" ? "size-6" : size === "table" ? "size-5" : "size-[18px]";

  const stop = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-3",
        className,
      )}
      onClick={stop}
    >
      {tel ? (
        <Button
          className={cn(
            "shrink-0 rounded-full p-0 transition-all",
            sizeCls,
          )}
          asChild
        >
          <a
            href={telHref(tel)}
            aria-label={`Call ${name}`}
            title="Call"
          >
            <Phone className={iconClass} strokeWidth={iconStroke} />
          </a>
        </Button>
      ) : null}
      {mail ? (
        <Button
          variant="outline"
          className={cn(
            "shrink-0 rounded-full border-2 p-0 transition-all",
            sizeCls,
          )}
          asChild
        >
          <a
            href={`mailto:${mail}`}
            aria-label={`Email ${name}`}
            title="Email"
          >
            <Mail className={iconClass} strokeWidth={iconStroke} />
          </a>
        </Button>
      ) : null}
    </div>
  );
}

const ContactCard = ({ contact, onClick, onEdit, onDelete }: { contact: Contact; onClick: () => void; onEdit: () => void; onDelete: () => void }) => (
  <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
    <CardHeader>
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="text-lg">
            {contact.prefix && `${contact.prefix} `}
            {contact.first_name} {contact.last_name || ""}
          </CardTitle>
          {contact.title && <p className="text-sm text-gray-600 mt-1">{contact.title}</p>}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Edit">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete">
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-2 text-sm">
        {contact.email && (
          <div className="flex justify-between">
            <span className="text-gray-500">Email:</span>
            <span>{contact.email}</span>
          </div>
        )}
        {contact.phone && (
          <div className="flex justify-between">
            <span className="text-gray-500">Phone:</span>
            <span>{contact.phone}</span>
          </div>
        )}
        {contact.company && (
          <div className="flex justify-between">
            <span className="text-gray-500">Company:</span>
            <span>{contact.company}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-500">Status:</span>
          <Badge className={getStatusColor(contact.status)}>
            {contact.status || "N/A"}
          </Badge>
        </div>
      </div>
      {(contactDialNumber(contact) || contact.email?.trim()) && (
        <div onClick={(e) => e.stopPropagation()}>
          <ContactQuickActions contact={contact} size="card" />
        </div>
      )}
    </CardContent>
  </Card>
);

export default function ContactsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTitle } = usePageTitle();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [backgroundError, setBackgroundError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("contacts_view_mode");
      if (saved === "list" || saved === "card" || saved === "kanban") {
        return saved as ViewMode;
      }
    }
    return "list";
  });
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [importSheetOpen, setImportSheetOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const activeRequestRef = useRef(0);

  // Open edit sheet when URL has ?edit=id (e.g. from contact detail page)
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId) return;
    const id = parseInt(editId, 10);
    if (isNaN(id)) return;
    contactsApi
      .getById(id)
      .then((c) => {
        setEditingContact(c);
        setFormDialogOpen(true);
        router.replace("/contacts", { scroll: false });
      })
      .catch(() => {});
  }, [searchParams, router]);

  const formatLoadError = (err: unknown) => {
    const message = err instanceof Error ? err.message : "Failed to fetch contacts";
    const lower = message.toLowerCase();
    if (lower.includes("timeout") || lower.includes("timed out")) {
      return "Request timed out. Showing partial data where available. Please retry.";
    }
    return message;
  };

  const fetchContacts = async () => {
    const requestId = ++activeRequestRef.current;
    setLoading(true);
    setBackgroundLoading(false);
    setError(null);
    setBackgroundError(null);

    try {
      // Fast first paint: fetch first page, then progressively load the rest.
      const first = await contactsApi.getAll({ limit: CONTACTS_PAGE_SIZE, offset: 0 });
      if (requestId !== activeRequestRef.current) return;

      setContacts(first.data);
      setLoading(false);

      const total = first.total ?? first.data.length;
      if (total > first.data.length) {
        setBackgroundLoading(true);
        for (let offset = first.data.length; offset < total; offset += CONTACTS_PAGE_SIZE) {
          try {
            const next = await contactsApi.getAll({
              limit: CONTACTS_PAGE_SIZE,
              offset,
            });
            if (requestId !== activeRequestRef.current) return;
            setContacts((prev) => [...prev, ...next.data]);
          } catch (bgErr) {
            if (requestId !== activeRequestRef.current) return;
            setBackgroundError(formatLoadError(bgErr));
            break;
          }
        }
      }
    } catch (err) {
      if (requestId !== activeRequestRef.current) return;
      setError(formatLoadError(err));
    } finally {
      if (requestId === activeRequestRef.current) {
        setLoading(false);
        setBackgroundLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    setTitle("Contacts");
    return () => setTitle(null);
  }, [setTitle]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("contacts_view_mode", viewMode);
    }
  }, [viewMode]);

  const handleCreate = () => {
    setEditingContact(undefined);
    setFormDialogOpen(true);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormDialogOpen(true);
  };

  const handleDelete = (contact: Contact) => {
    setContactToDelete(contact);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!contactToDelete) return;
    try {
      await contactsApi.delete(contactToDelete.id);
      setContacts(contacts.filter((c) => c.id !== contactToDelete.id));
      setDeleteDialogOpen(false);
      setContactToDelete(null);
    } catch (error) {
      console.error("Error deleting contact:", error);
      alert("Failed to delete contact. Please try again.");
    }
  };

  const handleFormSuccess = () => {
    setFormDialogOpen(false);
    setEditingContact(undefined);
    fetchContacts();
  };

  const renderContacts = () => {
    if (viewMode === "list") {
      return (
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Primary</TableHead>
                <TableHead className="w-[108px] text-right">
                  <span className="sr-only">Call or email</span>
                  <span
                    className="inline-flex justify-end gap-1 text-muted-foreground"
                    aria-hidden
                  >
                    <Phone className="size-3.5 opacity-70" />
                    <Mail className="size-3.5 opacity-70" />
                  </span>
                </TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    No contacts found.
                  </TableCell>
                </TableRow>
              ) : (
                contacts.map((contact) => (
                  <TableRow
                    key={contact.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/contacts/${contact.id}`)}
                  >
                    <TableCell className="font-medium">
                      {contact.prefix && `${contact.prefix} `}
                      {contact.first_name} {contact.last_name || ""}
                    </TableCell>
                    <TableCell>{contact.email || "N/A"}</TableCell>
                    <TableCell>{contact.phone || contact.mobile || "N/A"}</TableCell>
                    <TableCell>{contact.company || contact.client_company_name || "N/A"}</TableCell>
                    <TableCell>{contact.job_title || "N/A"}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(contact.status)}>
                        {contact.status || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {contact.is_primary ? (
                        <Badge className="bg-blue-100 text-blue-800">Primary</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end">
                        <ContactQuickActions contact={contact} size="table" />
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(contact)} title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(contact)} title="Delete">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      );
    }

    if (viewMode === "kanban") {
      const grouped: Record<string, Contact[]> = {
        active: [],
        inactive: [],
        archived: [],
        other: [],
      };

      contacts.forEach((contact) => {
        const status = contact.status?.toLowerCase() || "other";
        if (grouped[status]) {
          grouped[status].push(contact);
        } else {
          grouped.other.push(contact);
        }
      });

      const columns = [
        { key: "active", label: "Active", color: "bg-green-50" },
        { key: "inactive", label: "Inactive", color: "bg-gray-50" },
        { key: "archived", label: "Archived", color: "bg-red-50" },
        { key: "other", label: "Other", color: "bg-blue-50" },
      ];

      return (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <div
              key={column.key}
              className={`flex-shrink-0 w-72 ${column.color} rounded-lg p-3`}
            >
              <h3 className="font-semibold mb-3 text-sm uppercase">
                {column.label} ({grouped[column.key]?.length || 0})
              </h3>
              <div className="space-y-2">
                {grouped[column.key]?.map((contact) => (
                  <Card
                    key={contact.id}
                    className="mb-2 cursor-pointer hover:shadow-md"
                    onClick={() => router.push(`/contacts/${contact.id}`)}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-sm">
                          {contact.prefix && `${contact.prefix} `}
                          {contact.first_name} {contact.last_name || ""}
                        </h4>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(contact)} title="Edit">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(contact)} title="Delete">
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">{contact.email || "No email"}</p>
                      {contact.phone && <p className="text-xs text-gray-600">{contact.phone}</p>}
                      {(contactDialNumber(contact) || contact.email?.trim()) && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <ContactQuickActions contact={contact} size="kanban" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {(!grouped[column.key] || grouped[column.key].length === 0) && (
                  <div className="text-sm text-gray-500 text-center py-4">No contacts</div>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Card view
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.map((contact) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            onClick={() => router.push(`/contacts/${contact.id}`)}
            onEdit={() => handleEdit(contact)}
            onDelete={() => handleDelete(contact)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
            <p className="text-gray-600 mt-1">{contacts.length} contacts</p>
            {backgroundLoading && (
              <p className="text-xs text-gray-500 mt-1">Loading more contacts...</p>
            )}
            {backgroundError && (
              <p className="text-xs text-amber-700 mt-1">{backgroundError}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ButtonGroup orientation="horizontal">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "card" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("card")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("kanban")}
              >
                <Columns3 className="h-4 w-4" />
              </Button>
            </ButtonGroup>
            <Button onClick={fetchContacts} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <div className="inline-flex">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreate}
                className="rounded-r-none"
              >
                <Plus className="h-4 w-4 mr-1" /> New Contact
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="p-1 rounded-l-none border-l-0"
                    aria-label="Contact actions"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setImportSheetOpen(true)}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Import
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {loading && <div className="text-center py-8">Loading...</div>}
        {error && <div className="text-red-600 text-center py-8">{error}</div>}

        {!loading && !error && (
          contacts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-dashed">
              <h3 className="text-xl font-medium mb-2">No contacts yet</h3>
              <p className="text-gray-500 mb-6">Create your first contact to get started.</p>
              <Button variant="default" onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" /> Create Contact
              </Button>
            </div>
          ) : (
            renderContacts()
          )
        )}

        <ContactFormSheet
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          onSuccess={handleFormSuccess}
          contact={editingContact}
        />
        <ContactImportSheet
          open={importSheetOpen}
          onOpenChange={setImportSheetOpen}
          onSuccess={handleFormSuccess}
        />

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Contact</DialogTitle>
            </DialogHeader>
            <p className="py-4">
              Are you sure you want to delete{" "}
              {contactToDelete && (
                <>
                  {contactToDelete.prefix && `${contactToDelete.prefix} `}
                  {contactToDelete.first_name} {contactToDelete.last_name || ""}
                </>
              )}
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
