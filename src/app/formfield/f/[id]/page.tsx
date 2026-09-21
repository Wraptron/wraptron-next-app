import { notFound } from "next/navigation";

// Formfield app hidden — restore by uncommenting the original page below.
export default function PublishedFormPage() {
  notFound();
}

/*
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPublishedForm, type PublishedForm } from "@/lib/formfield-publish";
import { PublishedFormView } from "@/components/forms/published-form";
import { ApiError, formsApi, getApiErrorMessage } from "@/lib/api";
import type { FormField } from "@/types/form-builder";

function toPublishedForm(
  publicId: string,
  title: string,
  fields: unknown[],
  publishedAt: string,
): PublishedForm {
  return {
    id: publicId,
    title: title.trim() || "Untitled Form",
    fields: Array.isArray(fields) ? (fields as FormField[]) : [],
    publishedAt,
  };
}

export default function PublishedFormPage() {
  const params = useParams<{ id: string }>();
  const [form, setForm] = useState<PublishedForm | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const id = params?.id;
    if (!id) {
      setForm(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const record = await formsApi.getPublic(id);
        if (!cancelled) {
          setLoadError(null);
          setForm(
            toPublishedForm(
              record.public_id,
              record.title,
              record.fields,
              record.updated_at,
            ),
          );
        }
      } catch (error) {
        const local = getPublishedForm(id);
        if (!cancelled && local) {
          setLoadError(null);
          setForm(local);
          return;
        }
        if (!cancelled) {
          setForm(null);
          setLoadError(
            error instanceof ApiError && error.status === 404
              ? null
              : getApiErrorMessage(error, "Could not load this form."),
          );
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [params?.id]);

  if (form === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading form…
      </div>
    );
  }

  if (!form) {
    return (
      <div className="mx-auto max-w-lg space-y-2 px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold">Form not found</h1>
        <p className="text-muted-foreground">
          {loadError ||
            "This publish link is invalid or the form is not available."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-background">
      <PublishedFormView
        form={form}
        onSubmit={(values) => formsApi.submitPublic(form.id, values)}
      />
    </div>
  );
}
*/
