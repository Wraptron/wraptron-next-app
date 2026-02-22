"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
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
import { RefreshCw, Plus, Menu, LayoutGrid, Columns3, Edit, Trash2 } from "lucide-react";
import { ContactForm } from "@/components/contact-form";

type ViewMode = "list" | "card" | "kanban";

const getStatusColor = (status?: string) => {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
    archived: "bg-red-100 text-red-800",
  };
  return colors[status?.toLowerCase() || ""] || "bg-gray-100 text-gray-800";
};

const ContactCard = ({ contact, onEdit, onDelete }: { contact: Contact; onEdit: () => void; onDelete: () => void }) => (
  <Card className="hover:shadow-md transition-shadow">
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
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
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
    </CardContent>
  </Card>
);

export default function ContactsPage() {
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const [editingContact, setEditingContact] = useState<Contact | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await contactsApi.getAll();
      setContacts(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch contacts");
    } finally {
      setLoading(false);
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
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No contacts found.
                  </TableCell>
                </TableRow>
              ) : (
                contacts.map((contact) => (
                  <TableRow key={contact.id} className="hover:bg-gray-50">
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
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(contact)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(contact)}>
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
                  <Card key={contact.id} className="mb-2">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-sm">
                          {contact.prefix && `${contact.prefix} `}
                          {contact.first_name} {contact.last_name || ""}
                        </h4>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(contact)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(contact)}>
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">{contact.email || "No email"}</p>
                      {contact.phone && <p className="text-xs text-gray-600">{contact.phone}</p>}
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
            <Button variant="default" size="sm" onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-1" /> New Contact
            </Button>
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

        <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingContact ? "Edit Contact" : "New Contact"}</DialogTitle>
            </DialogHeader>
            <ContactForm
              contact={editingContact}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setFormDialogOpen(false);
                setEditingContact(undefined);
              }}
            />
          </DialogContent>
        </Dialog>

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
