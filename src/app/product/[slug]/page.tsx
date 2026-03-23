import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Layers, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from "next";

/** Dedicated list/CRUD lives at `/product/interfaces` and `/product/features` */
const VALID_SLUGS = ["tech-stack", "milestone"] as const;
type SectionSlug = (typeof VALID_SLUGS)[number];

const SECTION_CONFIG: Record<
  SectionSlug,
  {
    title: string;
    shortTitle: string;
    description: string;
    icon: typeof Layers;
    points: { title: string; body: string }[];
  }
> = {
  "tech-stack": {
    title: "Tech stack",
    shortTitle: "Tech Stack",
    description:
      "Materials, tooling, machines, and drawing data used to manufacture each product.",
    icon: Layers,
    points: [
      {
        title: "Materials",
        body: "Record raw material type, grade, supplier, color, UV/fire ratings, and MFI where applicable.",
      },
      {
        title: "Tooling & cycle",
        body: "Track mould numbers, cavities, machine tonnage, cycle time, cooling requirements, and drawing revisions.",
      },
      {
        title: "Engineering continuity",
        body: "Keep manufacturing parameters next to commercial data for faster handoffs.",
      },
    ],
  },
  milestone: {
    title: "Milestone",
    shortTitle: "Milestone",
    description:
      "Program phases, PPAP, revisions, and traceability milestones across the product lifecycle.",
    icon: Flag,
    points: [
      {
        title: "Phases & PPAP",
        body: "Use APQP phase and PPAP level fields to mirror your gated process.",
      },
      {
        title: "Revisions & IMDS",
        body: "Store revision change logs, IMDS submission IDs, and serialisation or batch rules.",
      },
      {
        title: "Shelf life & compliance",
        body: "Document shelf life and traceability expectations in one place.",
      },
    ],
  },
};

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isValidSlug(slug)) {
    return { title: "Product" };
  }
  const cfg = SECTION_CONFIG[slug];
  return {
    title: `${cfg.shortTitle} · Products`,
    description: cfg.description,
  };
}

function isValidSlug(s: string): s is SectionSlug {
  return (VALID_SLUGS as readonly string[]).includes(s);
}

export default async function ProductSectionPage({ params }: PageProps) {
  const { slug } = await params;
  if (!isValidSlug(slug)) {
    notFound();
  }

  const cfg = SECTION_CONFIG[slug];
  const Icon = cfg.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" className="mb-6 -ml-2" asChild>
          <Link href="/products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to products
          </Link>
        </Button>

        <div className="flex items-start gap-4 mb-8">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Products
            </p>
            <h1 className="text-2xl font-semibold tracking-tight mt-0.5">
              {cfg.title}
            </h1>
            <p className="text-muted-foreground mt-2">{cfg.description}</p>
          </div>
        </div>

        <div className="space-y-4">
          {cfg.points.map((p) => (
            <Card key={p.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{p.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {p.body}
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-sm text-muted-foreground mt-8">
          These areas map to fields on each{" "}
          <Link href="/products" className="text-primary underline-offset-4 hover:underline">
            product record
          </Link>
          . Open a product to view and edit the full data.
        </p>
      </div>
    </div>
  );
}
