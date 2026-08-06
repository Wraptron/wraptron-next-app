"use client";

import { PageShell } from "@/components/page-shell";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { contactsApi, type Contact } from "@/lib/api";
import { usePageTitle } from "@/contexts/page-title-context";
import {
  CollectionView,
  type CollectionColumn,
  type CollectionItem,
} from "@/components/collection-view";
import {
  CollectionKanbanView,
  type CollectionKanbanColumn,
} from "@/components/collection-kanban-view";
import {
  CollectionPageToolbar,
  useCollectionViewMode,
  type CollectionViewMode,
} from "@/components/collection-page-toolbar";
import { CollectionFilterControls } from "@/components/collection-filters";
import { useCollectionPageFilters } from "@/components/collection-page-filters";
import { useCollectionPaginatedData } from "@/hooks/use-collection-paginated-data";
import { getCollectionFilterDefinitions } from "@/lib/collection-filter-definitions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Plus,
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
import { statusBadgeClass } from "@/lib/status-colors";

const CONTACTS_PAGE_SIZE = 200;

const CONTACT_KANBAN_COLUMNS: CollectionKanbanColumn[] = [
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "archived", label: "Archived" },
  { id: "other", label: "Other" },
];

const CONTACT_KANBAN_COLUMN_IDS = new Set(
  CONTACT_KANBAN_COLUMNS.map((c) => c.id),
);

const telHref = (phone: string) =>
  `tel:${phone.replace(/[^\d+]/g, "") || phone.trim()}`;

/** Prefer mobile, then office phone, for click-to-call. */
const contactDialNumber = (c: Contact) =>
  c.mobile?.trim() || c.phone?.trim() || undefined;

const contactDisplayName = (c: Contact) =>
  [c.prefix, c.first_name, c.last_name].filter(Boolean).join(" ").trim() ||
  "contact";

const contactCompanyLine = (c: Contact) =>
  (c.company || c.client_company_name)?.trim() || "";

function contactKanbanColumnId(contact: Contact) {
  const key = contact.status?.toLowerCase() ?? "other";
  return CONTACT_KANBAN_COLUMN_IDS.has(key) ? key : "other";
}

function contactToCollectionItem(contact: Contact): CollectionItem {
  return {
    id: contact.id,
    title: contactDisplayName(contact),
    description: contact.email || contact.phone || contact.mobile || undefined,
    meta: contactCompanyLine(contact) || undefined,
    actions: contact.status ? (
      <Badge variant="outline" className="text-[10px] px-1 py-0">
        {contact.status}
      </Badge>
    ) : undefined,
  };
}

function buildContactTableColumns(
  contacts: Contact[],
  onEdit: (contact: Contact) => void,
  onDelete: (contact: Contact) => void,
): CollectionColumn[] {
  const byId = new Map(contacts.map((c) => [c.id, c]));

  return [
    {
      id: "name",
      header: "Name",
      headerClassName: "w-[200px]",
      sortValue: (item) => {
        const c = byId.get(Number(item.id));
        if (!c) return "";
        return [c.prefix, c.first_name, c.last_name]
          .filter(Boolean)
          .join(" ")
          .trim();
      },
      cell: (item) => {
        const c = byId.get(Number(item.id));
        if (!c) return "—";
        return (
          <span>
            {c.prefix && `${c.prefix} `}
            {c.first_name} {c.last_name || ""}
          </span>
        );
      },
    },
    {
      id: "email",
      header: "Email",
      sortValue: (item) => byId.get(Number(item.id))?.email ?? "",
      cell: (item) => byId.get(Number(item.id))?.email || "—",
    },
    {
      id: "phone",
      header: "Phone",
      sortValue: (item) => {
        const c = byId.get(Number(item.id));
        return c?.phone || c?.mobile || "";
      },
      cell: (item) => {
        const c = byId.get(Number(item.id));
        return c?.phone || c?.mobile || "—";
      },
    },
    {
      id: "company",
      header: "Company",
      sortValue: (item) => {
        const c = byId.get(Number(item.id));
        return c?.company || c?.client_company_name || "";
      },
      cell: (item) => {
        const c = byId.get(Number(item.id));
        return c?.company || c?.client_company_name || "—";
      },
    },
    {
      id: "job_title",
      header: "Job Title",
      sortValue: (item) => byId.get(Number(item.id))?.job_title ?? "",
      cell: (item) => byId.get(Number(item.id))?.job_title || "—",
    },
    {
      id: "status",
      header: "Status",
      sortValue: (item) => byId.get(Number(item.id))?.status ?? "",
      cell: (item) => {
        const c = byId.get(Number(item.id));
        if (!c?.status) return "—";
        return <Badge className={statusBadgeClass(c.status)}>{c.status}</Badge>;
      },
    },
    {
      id: "primary",
      header: "Primary",
      sortValue: (item) => (byId.get(Number(item.id))?.is_primary ? 1 : 0),
      cell: (item) => {
        const c = byId.get(Number(item.id));
        if (!c) return "—";
        return c.is_primary ? (
          <Badge className={statusBadgeClass("customer")}>Primary</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      id: "quick_actions",
      header: (
        <span className="inline-flex justify-end gap-1 text-muted-foreground">
          <Phone className="size-3.5 opacity-70" aria-hidden />
          <Mail className="size-3.5 opacity-70" aria-hidden />
        </span>
      ),
      headerClassName: "w-[108px] text-right",
      className: "text-right",
      sortable: false,
      cell: (item) => {
        const c = byId.get(Number(item.id));
        if (!c) return null;
        return (
          <div
            className="flex justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            <ContactQuickActions contact={c} size="table" />
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      headerClassName: "w-[100px]",
      cell: (item) => {
        const c = byId.get(Number(item.id));
        if (!c) return null;
        return (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(c)}
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(c)}
              title="Delete"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        );
      },
    },
  ];
}

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
          className={cn("shrink-0 rounded-full p-0 transition-all", sizeCls)}
          asChild
        >
          <a href={telHref(tel)} aria-label={`Call ${name}`} title="Call">
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
          <a href={`mailto:${mail}`} aria-label={`Email ${name}`} title="Email">
            <Mail className={iconClass} strokeWidth={iconStroke} />
          </a>
        </Button>
      ) : null}
    </div>
  );
}

const ContactCard = ({
  contact,
  onClick,
  onEdit,
  onDelete,
}: {
  contact: Contact;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <Card
    className="hover:shadow-md transition-shadow cursor-pointer"
    onClick={onClick}
  >
    <CardHeader>
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="text-lg">
            {contact.prefix && `${contact.prefix} `}
            {contact.first_name} {contact.last_name || ""}
          </CardTitle>
          {contact.title && (
            <p className="text-sm text-muted-foreground mt-1">{contact.title}</p>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-2 text-sm">
        {contact.email && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email:</span>
            <span>{contact.email}</span>
          </div>
        )}
        {contact.phone && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phone:</span>
            <span>{contact.phone}</span>
          </div>
        )}
        {contact.company && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Company:</span>
            <span>{contact.company}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status:</span>
          <Badge className={statusBadgeClass(contact.status)}>
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
  const collectionFilters = useCollectionPageFilters(
    "contacts",
    getCollectionFilterDefinitions("contacts"),
  );
  const {
    items: contacts,
    total,
    loading,
    loadingMore,
    error,
    backgroundError,
    reload: fetchContacts,
    setItems: setContacts,
  } = useCollectionPaginatedData(
    contactsApi.getAll,
    collectionFilters.apiParamsKey,
    collectionFilters.apiParams,
    { pageSize: CONTACTS_PAGE_SIZE },
  );
  const [viewMode, setViewMode] = useCollectionViewMode(
    "contacts_view_mode",
    "list",
  );
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [importSheetOpen, setImportSheetOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);

  useEffect(() => {
    setSelectedContactIds([]);
  }, [collectionFilters.apiParamsKey]);

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

  useEffect(() => {
    setTitle("Contacts");
    return () => setTitle(null);
  }, [setTitle]);

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
    setIsDeleting(true);
    try {
      await contactsApi.delete(contactToDelete.id);
      setContacts(contacts.filter((c) => c.id !== contactToDelete.id));
      setSelectedContactIds((prev) =>
        prev.filter((id) => id !== contactToDelete.id),
      );
      setDeleteDialogOpen(false);
      setContactToDelete(null);
      fetchContacts();
    } catch (error) {
      console.error("Error deleting contact:", error);
      alert("Failed to delete contact. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmBulkDelete = async () => {
    if (selectedContactIds.length === 0) return;
    setIsDeleting(true);
    try {
      await contactsApi.deleteBulk(selectedContactIds);
      const deletedSet = new Set(selectedContactIds);
      setContacts((prev) => prev.filter((c) => !deletedSet.has(c.id)));
      setSelectedContactIds([]);
      setBulkDeleteDialogOpen(false);
      fetchContacts();
    } catch (error) {
      console.error("Error deleting selected contacts:", error);
      alert("Failed to delete selected contacts. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSuccess = () => {
    setFormDialogOpen(false);
    setEditingContact(undefined);
    fetchContacts();
  };

  const collectionItems = useMemo(
    () => contacts.map(contactToCollectionItem),
    [contacts],
  );

  const contactById = useMemo(
    () => new Map(contacts.map((c) => [c.id, c])),
    [contacts],
  );

  const contactTableColumns = useMemo(
    () => buildContactTableColumns(contacts, handleEdit, handleDelete),
    [contacts],
  );

  const handleContactKanbanMove = useCallback(
    async (item: CollectionItem, toColumnId: string) => {
      const id = Number(item.id);
      const contact = contactById.get(id);
      if (!contact) return;

      const previousStatus = contact.status;
      setContacts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: toColumnId } : c)),
      );

      try {
        await contactsApi.update(id, { status: toColumnId });
      } catch (err) {
        setContacts((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: previousStatus } : c)),
        );
        console.error("Failed to update contact status:", err);
      }
    },
    [contactById],
  );

  const renderContactKanbanCard = useCallback(
    (item: CollectionItem) => {
      const contact = contactById.get(Number(item.id));
      if (!contact) return null;
      return (
        <Card className="cursor-grab border border-border bg-card shadow-none active:cursor-grabbing">
          <CardContent className="p-3">
            <div className="mb-2 flex items-start justify-between">
              <h4 className="text-sm font-semibold">
                {contactDisplayName(contact)}
              </h4>
              <div
                className="ml-2 flex shrink-0 gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleEdit(contact)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleDelete(contact)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {contact.email || "No email"}
            </p>
            {contact.phone && (
              <p className="text-xs text-muted-foreground">{contact.phone}</p>
            )}
            {(contactDialNumber(contact) || contact.email?.trim()) && (
              <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                <ContactQuickActions contact={contact} size="kanban" />
              </div>
            )}
          </CardContent>
        </Card>
      );
    },
    [contactById, handleEdit, handleDelete],
  );

  const renderContacts = (mode: CollectionViewMode) => {
    if (mode === "list") {
      return (
        <CollectionView
          loading={loading}
          items={collectionItems}
          columns={contactTableColumns}
          primaryColumnId="name"
          selectable
          selectedIds={selectedContactIds}
          onSelectedIdsChange={(ids) =>
            setSelectedContactIds(ids.map((id) => Number(id)))
          }
          getRowHref={(item) => `/contacts/${item.id}`}
          onRowClick={(item) => router.push(`/contacts/${item.id}`)}
          emptyMessage="No contacts found."
          loadingMessage="Loading contacts…"
        />
      );
    }

    if (mode === "kanban") {
      return (
        <CollectionKanbanView
          loading={loading}
          items={collectionItems}
          columns={CONTACT_KANBAN_COLUMNS}
          groupBy={(item) => {
            const contact = contactById.get(Number(item.id));
            return contact ? contactKanbanColumnId(contact) : "other";
          }}
          getColumnSubtext={(_columnId, columnItems) => {
            const count = columnItems.length;
            return `${count} contact${count !== 1 ? "s" : ""}`;
          }}
          onItemMove={handleContactKanbanMove}
          getRowHref={(item) => `/contacts/${item.id}`}
          renderCard={renderContactKanbanCard}
          emptyMessage="No contacts found."
          loadingMessage="Loading contacts…"
        />
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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

  const countLabel = loading
    ? "Loading…"
    : `${contacts.length}${total > contacts.length ? ` of ${total}` : ""} contact${
        total === 1 ? "" : "s"
      }${collectionFilters.isFiltering ? " (filtered)" : ""}`;

  const showEmpty = !loading && !error && contacts.length === 0;

  return (
    <PageShell fill className="bg-background text-foreground">
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
            <p className="mt-1 text-muted-foreground">{countLabel}</p>
            {loadingMore && (
              <p className="mt-1 text-xs text-muted-foreground">
                Loading more contacts…
              </p>
            )}
            {backgroundError && (
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-500">
                {backgroundError}
              </p>
            )}
          </div>

          <CollectionPageToolbar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            newAction={{
              label: "New Contact",
              onClick: handleCreate,
              menuItems: [
                {
                  label: "Import",
                  onClick: () => setImportSheetOpen(true),
                  icon: <FileDown className="h-4 w-4" />,
                },
              ],
            }}
            className="w-full md:w-auto"
          >
            {selectedContactIds.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setBulkDeleteDialogOpen(true)}
                aria-label={`Delete ${selectedContactIds.length} selected contact${selectedContactIds.length === 1 ? "" : "s"}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </CollectionPageToolbar>
        </div>

        <CollectionFilterControls
          definitions={collectionFilters.definitions}
          search={collectionFilters.search}
          onSearchChange={collectionFilters.setSearch}
          searchPlaceholder="Search contacts…"
          facets={collectionFilters.facets}
          onFacetChange={collectionFilters.setFacetValues}
          numbers={collectionFilters.numbers}
          onNumberRangeChange={collectionFilters.setNumberRange}
          dates={collectionFilters.dates}
          onDateRangeChange={collectionFilters.setDateRange}
          resource={collectionFilters.resource}
          filterState={collectionFilters.filterState}
          onApplySavedView={collectionFilters.applyFilterState}
          onClearAll={collectionFilters.clearFilters}
          isFiltering={collectionFilters.isFiltering}
          getOptions={collectionFilters.getOptions}
          loadOptions={collectionFilters.loadOptions}
        />
      </div>

      {error && (
        <div className="mb-4 py-8 text-center text-destructive">{error}</div>
      )}

      {!showEmpty && !error && (
        <>
          <div className="md:hidden rounded-md border border-border bg-card divide-y divide-border">
            {contacts.map((contact) => {
              const name = contactDisplayName(contact);
              const company = contactCompanyLine(contact);
              return (
                <div key={contact.id} className="flex items-center gap-3 p-4">
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => router.push(`/contacts/${contact.id}`)}
                  >
                    <div className="truncate font-medium text-foreground">
                      {name}
                    </div>
                    {company ? (
                      <div className="mt-0.5 truncate text-sm text-muted-foreground">
                        {company}
                      </div>
                    ) : null}
                  </button>
                  <div
                    className="shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ContactQuickActions
                      contact={contact}
                      size="table"
                      className="gap-2 justify-end"
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div
            className={cn(
              "hidden md:block",
              viewMode === "kanban" && "flex min-h-0 flex-1 flex-col",
            )}
          >
            {renderContacts(viewMode)}
          </div>
        </>
      )}

      {showEmpty && (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <h3 className="text-xl font-medium">No contacts yet</h3>
          <p className="mt-2 text-muted-foreground">
            Create your first contact to get started.
          </p>
          <Button variant="default" className="mt-6" onClick={handleCreate}>
            <Plus className="mr-2 size-4" />
            Create Contact
          </Button>
        </div>
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
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Selected Contacts</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <strong className="text-foreground">
              {selectedContactIds.length}
            </strong>{" "}
            selected contact{selectedContactIds.length === 1 ? "" : "s"}? This
            action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setBulkDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmBulkDelete}
              disabled={isDeleting}
            >
              {isDeleting
                ? "Deleting…"
                : `Delete ${selectedContactIds.length} Contact${selectedContactIds.length === 1 ? "" : "s"}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
