"use client";

import React, { useState } from "react";
import { FormField } from "@/hooks/use-form-builder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code2, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestModePanelProps {
  fields: FormField[];
  isTestMode: boolean;
}

export function TestModePanel({ fields, isTestMode }: TestModePanelProps) {
  const [copied, setCopied] = useState(false);

  const generatePayload = () => {
    const payload: Record<string, any> = {};
    fields.forEach((field) => {
      if (field.hidden) return;
      
      switch (field.type) {
        case "input-string":
        case "input-number":
        case "input-decimal":
        case "email":
        case "phone":
          payload[field.apiKey || field.fieldId || field.id] = getFakeValue(field.type);
          break;
        case "long-text":
          payload[field.apiKey || field.fieldId || field.id] = "This is a sample long text response.";
          break;
        case "radio":
          payload[field.apiKey || field.fieldId || field.id] = field.options?.[0] || "";
          break;
        case "checkbox":
          payload[field.apiKey || field.fieldId || field.id] = [field.options?.[0] || ""];
          break;
        case "dropdown":
          payload[field.apiKey || field.fieldId || field.id] = field.options?.[0] || "";
          break;
        case "date-time":
          payload[field.apiKey || field.fieldId || field.id] = new Date().toISOString();
          break;
        case "rating-scale":
          payload[field.apiKey || field.fieldId || field.id] = 3;
          break;
        case "file-upload":
          payload[field.apiKey || field.fieldId || field.id] = "file.pdf";
          break;
      }
    });
    return payload;
  };

  const getFakeValue = (type: string): string => {
    const values: Record<string, string> = {
      "input-string": "John Doe",
      "input-number": "42",
      "input-decimal": "3.14",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567",
    };
    return values[type] || "";
  };

  const payload = generatePayload();
  const payloadJson = JSON.stringify(payload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(payloadJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isTestMode) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 border-t bg-white p-4 shadow-lg">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              Submission Payload Preview
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-50 p-3 rounded border overflow-x-auto max-h-48 overflow-y-auto font-mono">
            {payloadJson}
          </pre>
          <p className="text-xs text-gray-500 mt-2">
            This is the data structure that will be submitted when the form is filled with test data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
