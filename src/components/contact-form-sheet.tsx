"use client";

import React, { useState, useEffect } from "react";
import { useSheetPush } from "@/contexts/sheet-push-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import type { Contact } from "@/lib/api";

const MAIN_CONTENT_PORTAL_ID = "main-content-portal";
const CONTACT_FORM_ID = "contact-form-sheet-form";

export interface ContactFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  contact?: Contact | null;
}

export function ContactFormSheet({
  open,
  onOpenChange,
  onSuccess,
  contact,
}: ContactFormSheetProps) {
  const [loading, setLoading] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const setSheetOpen = useSheetPush()?.setSheetOpen;

  useEffect(() => {
    setContainer(document.getElementById(MAIN_CONTENT_PORTAL_ID));
  }, []);

  useEffect(() => {
    if (!open) {
      setSheetOpen?.(false);
      return;
    }
    const portal = document.getElementById(MAIN_CONTENT_PORTAL_ID);
    const sheetEl = portal?.querySelector("[data-slot='sheet-content']");
    if (!sheetEl) {
      const t = setTimeout(() => {
        const el = portal?.querySelector("[data-slot='sheet-content']");
        if (el) setSheetOpen?.(true, Math.ceil((el as HTMLElement).getBoundingClientRect().width));
      }, 350);
      return () => {
        clearTimeout(t);
        setSheetOpen?.(false);
      };
    }
    const updateWidth = () => setSheetOpen?.(true, Math.ceil((sheetEl as HTMLElement).getBoundingClientRect().width));
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(sheetEl);
    return () => {
      ro.disconnect();
      setSheetOpen?.(false);
    };
  }, [open, setSheetOpen]);

  const handleOpenChange = (next: boolean) => {
    if (!next) onOpenChange(false);
    onOpenChange(next);
  };

  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange} container={container}>
      <SheetContent
        side="right"
        className="flex flex-col w-[33.333vw] min-w-[280px] max-w-[100vw] overflow-hidden"
      >
        <SheetHeader>
          <SheetTitle>{contact ? "Edit Contact" : "Create Contact"}</SheetTitle>
          <SheetDescription>
            {contact
              ? "Update contact name, email, and details."
              : "Add a new contact with name, email, and details."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          <div className="p-4">
            <ContactForm
              formId={CONTACT_FORM_ID}
              hideActions
              contact={contact ?? undefined}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
              onLoadingChange={setLoading}
            />
          </div>
        </div>

        <SheetFooter className="mt-auto border-t p-4 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" form={CONTACT_FORM_ID} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : contact ? (
              "Update"
            ) : (
              "Create Contact"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
