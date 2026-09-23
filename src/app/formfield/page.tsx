import { notFound } from "next/navigation";

// Formfield app hidden — restore by uncommenting the original page below.
export default function FormfieldPage() {
  notFound();
}

/*
import { useEffect } from "react";
import { FormBuilderProvider } from "@/components/forms/builder/form-builder-context";
import { BuilderLayout } from "@/components/forms/builder/builder-layout";
import { usePageTitle } from "@/contexts/page-title-context";

export default function FormfieldPage() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Formfield");
    return () => setTitle(null);
  }, [setTitle]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <FormBuilderProvider>
        <BuilderLayout />
      </FormBuilderProvider>
    </div>
  );
}
*/
