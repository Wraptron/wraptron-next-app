"use client";

import { useEffect } from "react";
import {
  BookOpen,
  ExternalLink,
  FileText,
  Figma,
  PlayCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PortalPage } from "@/components/portal/portal-page";
import { usePageTitle } from "@/contexts/page-title-context";
import { RESOURCE_DOCS, type ResourceDoc } from "@/lib/portal-data";

const RESOURCE_ICONS: Record<ResourceDoc["type"], React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  api: BookOpen,
  figma: Figma,
  notion: BookOpen,
  video: PlayCircle,
};

const RESOURCE_LABELS: Record<ResourceDoc["type"], string> = {
  pdf: "PDF guide",
  api: "API reference",
  figma: "Figma",
  notion: "Notion",
  video: "Video",
};

export default function PortalResourcesPage() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Resources");
    return () => setTitle(null);
  }, [setTitle]);

  return (
    <PortalPage
      title="Resources & docs"
      description="Guides, references, and walkthroughs for your projects."
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RESOURCE_DOCS.map((doc) => {
          const Icon = RESOURCE_ICONS[doc.type];
          return (
            <li key={doc.id}>
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{doc.title}</CardTitle>
                      <CardDescription>{RESOURCE_LABELS[doc.type]}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto">
                  <p className="text-sm text-muted-foreground mb-4">{doc.description}</p>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={doc.href} target="_blank" rel="noopener noreferrer">
                      Open resource
                      <ExternalLink className="ml-2 h-3.5 w-3.5" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </PortalPage>
  );
}
