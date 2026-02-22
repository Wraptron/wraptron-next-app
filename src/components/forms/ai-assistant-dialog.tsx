"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";
import { FormField, FieldType } from "@/hooks/use-form-builder";

interface AIAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (fields: FormField[]) => void;
}

export function AIAssistantDialog({
  open,
  onOpenChange,
  onGenerate,
}: AIAssistantDialogProps) {
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateForm = async () => {
    if (!description.trim()) return;

    setIsGenerating(true);
    
    // Simulate AI generation - in production, this would call an API
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Parse description and generate fields
    const fields: FormField[] = [];
    const desc = description.toLowerCase();

    // Contact form patterns
    if (desc.includes("contact") || desc.includes("message")) {
      fields.push(
        {
          id: `field-${Date.now()}-1`,
          type: "input-string" as FieldType,
          label: "Full Name",
          placeholder: "Enter your full name",
          required: true,
        },
        {
          id: `field-${Date.now()}-2`,
          type: "email" as FieldType,
          label: "Email Address",
          placeholder: "your.email@example.com",
          required: true,
        },
        {
          id: `field-${Date.now()}-3`,
          type: "long-text" as FieldType,
          label: "Message",
          placeholder: "Enter your message...",
          required: true,
        },
      );
    }

    // Survey patterns
    if (desc.includes("survey") || desc.includes("feedback")) {
      fields.push(
        {
          id: `field-${Date.now()}-1`,
          type: "input-string" as FieldType,
          label: "Name",
          required: true,
        },
        {
          id: `field-${Date.now()}-2`,
          type: "radio" as FieldType,
          label: "How satisfied are you?",
          options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied"],
          required: true,
        },
        {
          id: `field-${Date.now()}-3`,
          type: "rating-scale" as FieldType,
          label: "Rate your experience",
          scale: 5,
          required: true,
        },
        {
          id: `field-${Date.now()}-4`,
          type: "long-text" as FieldType,
          label: "Additional Comments",
          placeholder: "Share your thoughts...",
        },
      );
    }

    // Registration patterns
    if (desc.includes("register") || desc.includes("sign up") || desc.includes("signup")) {
      fields.push(
        {
          id: `field-${Date.now()}-1`,
          type: "input-string" as FieldType,
          label: "First Name",
          required: true,
        },
        {
          id: `field-${Date.now()}-2`,
          type: "input-string" as FieldType,
          label: "Last Name",
          required: true,
        },
        {
          id: `field-${Date.now()}-3`,
          type: "email" as FieldType,
          label: "Email",
          required: true,
        },
        {
          id: `field-${Date.now()}-4`,
          type: "phone" as FieldType,
          label: "Phone Number",
        },
      );
    }

    // Order form patterns
    if (desc.includes("order") || desc.includes("purchase")) {
      fields.push(
        {
          id: `field-${Date.now()}-1`,
          type: "input-string" as FieldType,
          label: "Product Name",
          required: true,
        },
        {
          id: `field-${Date.now()}-2`,
          type: "input-number" as FieldType,
          label: "Quantity",
          required: true,
        },
        {
          id: `field-${Date.now()}-3`,
          type: "input-decimal" as FieldType,
          label: "Price",
          required: true,
        },
      );
    }

    // Default fallback
    if (fields.length === 0) {
      fields.push(
        {
          id: `field-${Date.now()}-1`,
          type: "input-string" as FieldType,
          label: "Name",
          required: true,
        },
        {
          id: `field-${Date.now()}-2`,
          type: "email" as FieldType,
          label: "Email",
          required: true,
        },
      );
    }

    setIsGenerating(false);
    onGenerate(fields);
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Form Assistant
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="description">Describe your form</Label>
            <Textarea
              id="description"
              placeholder="e.g., A contact form with name, email, and message fields. Or a survey form with multiple choice questions and ratings."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-2">
              Describe what kind of form you want to create, and we'll generate it for you.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={generateForm} disabled={!description.trim() || isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Form
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
