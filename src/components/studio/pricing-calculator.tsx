"use client";

import { useEffect, useMemo, useState } from "react";
import { usePageTitle } from "@/contexts/page-title-context";
import { pricingCalculatorApi } from "@/lib/api";
import {
  calculatePricingEstimate,
  DEFAULT_PRICING_CALCULATOR_CONFIG,
  isScopeProjectType,
  mergePricingConfig,
  PROJECT_TYPE_OPTIONS,
  SUPPORT_TIER_ORDER,
  type DesignComplexity,
  type PricingCalculatorConfig,
  type PricingCalculatorInput,
  type ProjectType,
  type SupportTier,
  type TeamRoleSelection,
} from "@/lib/pricing-calculator";
import { PricingEstimateSummary } from "@/components/studio/pricing-estimate-summary";
import { ScopeScaleSlider } from "@/components/studio/scope-scale-slider";
import { PageShell } from "@/components/page-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Globe,
  LayoutDashboard,
  Minus,
  Plus,
  Settings2,
  Smartphone,
  Users,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const PROJECT_TYPE_ICONS: Record<ProjectType, typeof Globe> = {
  website: Globe,
  pwa: LayoutDashboard,
  mobile_app: Smartphone,
  dedicated_team: Users,
};

const initialTeamComposition = (): TeamRoleSelection[] => [
  { roleId: "product_manager", count: 1 },
  { roleId: "designer", count: 1 },
  { roleId: "frontend", count: 1 },
  { roleId: "backend", count: 1 },
];

export function PricingCalculator() {
  const { setTitle } = usePageTitle();
  const [config, setConfig] = useState<PricingCalculatorConfig>(
    DEFAULT_PRICING_CALCULATOR_CONFIG,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [projectType, setProjectType] = useState<ProjectType>("website");
  const [projectName, setProjectName] = useState("");
  const [screenScaleIndex, setScreenScaleIndex] = useState(2);
  const [functionScaleIndex, setFunctionScaleIndex] = useState(2);
  const [designComplexity, setDesignComplexity] =
    useState<DesignComplexity>("medium");
  const [frontendFramework, setFrontendFramework] = useState("react");
  const [backendFramework, setBackendFramework] = useState("node");
  const [capabilities, setCapabilities] = useState<string[]>(["auth"]);
  const [supportTier, setSupportTier] = useState<SupportTier>("basic_care");
  const [supportMonths, setSupportMonths] = useState("12");
  const [durationMonths, setDurationMonths] = useState("6");
  const [teamComposition, setTeamComposition] = useState<TeamRoleSelection[]>(
    initialTeamComposition,
  );

  useEffect(() => {
    setTitle("Studio — Pricing Calculator");
    return () => setTitle(null);
  }, [setTitle]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await pricingCalculatorApi.getConfig();
        setConfig(mergePricingConfig(res.config));
      } catch (e) {
        setConfig(DEFAULT_PRICING_CALCULATOR_CONFIG);
        setError(
          e instanceof Error
            ? e.message
            : "Could not load pricing config — using defaults",
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const input: PricingCalculatorInput = useMemo(
    () => ({
      projectType,
      projectName: projectName.trim() || undefined,
      screenScaleIndex,
      functionScaleIndex,
      designComplexity,
      frontendFramework,
      backendFramework,
      capabilities,
      supportTier,
      supportMonths: Number(supportMonths) || 0,
      durationMonths: Number(durationMonths) || 0,
      teamComposition,
    }),
    [
      projectType,
      projectName,
      screenScaleIndex,
      functionScaleIndex,
      designComplexity,
      frontendFramework,
      backendFramework,
      capabilities,
      supportTier,
      supportMonths,
      durationMonths,
      teamComposition,
    ],
  );

  const estimate = useMemo(
    () => calculatePricingEstimate(input, config),
    [input, config],
  );

  const projectLabel =
    projectName.trim() ||
    config.projectTypes[projectType]?.label ||
    "Project estimate";

  const toggleCapability = (id: string, checked: boolean) => {
    setCapabilities((prev) =>
      checked ? [...prev, id] : prev.filter((c) => c !== id),
    );
  };

  const updateTeamCount = (roleId: string, delta: number) => {
    setTeamComposition((prev) => {
      const existing = prev.find((r) => r.roleId === roleId);
      if (existing) {
        const nextCount = Math.max(0, existing.count + delta);
        if (nextCount === 0) {
          return prev.filter((r) => r.roleId !== roleId);
        }
        return prev.map((r) =>
          r.roleId === roleId ? { ...r, count: nextCount } : r,
        );
      }
      if (delta > 0) {
        return [...prev, { roleId, count: delta }];
      }
      return prev;
    });
  };

  const getTeamCount = (roleId: string) =>
    teamComposition.find((r) => r.roleId === roleId)?.count ?? 0;

  return (
    <PageShell>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Pricing calculator
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Estimate project cost from scope, technology stack, and support tier.
            Rates are configurable in Settings.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/settings?section=apps#pricing-calculator">
            <Settings2 className="mr-2 h-4 w-4" />
            Configure rates
          </Link>
        </Button>
      </div>

      {error ? (
        <Alert className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project type</CardTitle>
              <CardDescription>
                Choose the kind of engagement you are scoping.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project name (optional)</Label>
                <Input
                  id="project-name"
                  placeholder="e.g. Acme customer portal"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <Label>Project type</Label>
                <RadioGroup
                  value={projectType}
                  onValueChange={(v) => setProjectType(v as ProjectType)}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  {PROJECT_TYPE_OPTIONS.map((opt) => {
                    const Icon = PROJECT_TYPE_ICONS[opt.value];
                    const selected = projectType === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={cn(
                          "relative flex cursor-pointer flex-col gap-3 rounded-xl border p-4 transition-colors",
                          "has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5",
                          "hover:border-primary/40 hover:bg-muted/30",
                          selected && "border-primary bg-primary/5 shadow-sm",
                        )}
                      >
                        <RadioGroupItem
                          value={opt.value}
                          className="sr-only"
                        />
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-background",
                              selected && "border-primary/30 bg-primary/10 text-primary",
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium leading-tight">
                              {opt.label}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {opt.description}
                            </p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {isScopeProjectType(projectType) ? (
            <Card>
              <CardHeader>
                <CardTitle>Scope of work</CardTitle>
                <CardDescription>
                  Size the build from screens, functional requirements, and
                  design complexity.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ScopeScaleSlider
                  label="Screens / views / pages"
                  options={config.scopeScales.screens}
                  valueIndex={screenScaleIndex}
                  onValueIndexChange={setScreenScaleIndex}
                />
                <ScopeScaleSlider
                  label="Functional requirements / functions"
                  options={config.scopeScales.functions}
                  valueIndex={functionScaleIndex}
                  onValueIndexChange={setFunctionScaleIndex}
                />
                <div className="space-y-3">
                  <Label>Design complexity</Label>
                  <RadioGroup
                    value={designComplexity}
                    onValueChange={(v) =>
                      setDesignComplexity(v as DesignComplexity)
                    }
                    className="grid gap-3 sm:grid-cols-3"
                  >
                    {(
                      Object.entries(config.designComplexity) as [
                        DesignComplexity,
                        { label: string; multiplier: number },
                      ][]
                    ).map(([key, option]) => (
                      <label
                        key={key}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                      >
                        <RadioGroupItem value={key} className="mt-0.5" />
                        <div>
                          <p className="font-medium">{option.label}</p>
                          <p className="text-xs text-muted-foreground">
                            ×{option.multiplier} multiplier
                          </p>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Team composition</CardTitle>
                <CardDescription>
                  Select roles and headcount for the dedicated product
                  development team.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Engagement duration (months)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={1}
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  {config.teamRoles.map((role) => {
                    const count = getTeamCount(role.id);
                    return (
                      <div
                        key={role.id}
                        className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="font-medium">{role.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {role.monthlyRate.toLocaleString()}/month
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateTeamCount(role.id, -1)}
                            disabled={count === 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Badge variant="secondary" className="min-w-8 justify-center">
                            {count}
                          </Badge>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateTeamCount(role.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Technology stack</CardTitle>
              <CardDescription>
                Front-end, back-end, and application capabilities that affect
                delivery effort.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Front-end framework</Label>
                  <Select
                    value={frontendFramework}
                    onValueChange={setFrontendFramework}
                    disabled={!isScopeProjectType(projectType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {config.techStack.frontendFrameworks.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.label}
                          {f.multiplier !== 1 ? ` (×${f.multiplier})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Back-end framework</Label>
                  <Select
                    value={backendFramework}
                    onValueChange={setBackendFramework}
                    disabled={!isScopeProjectType(projectType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {config.techStack.backendFrameworks.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.label}
                          {b.multiplier !== 1 ? ` (×${b.multiplier})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isScopeProjectType(projectType) ? (
                <div className="space-y-3">
                  <Label>Capabilities & integrations</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {config.techStack.capabilities.map((cap) => (
                      <label
                        key={cap.id}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/40"
                      >
                        <Checkbox
                          checked={capabilities.includes(cap.id)}
                          onCheckedChange={(checked) =>
                            toggleCapability(cap.id, checked === true)
                          }
                          className="mt-0.5"
                        />
                        <div>
                          <p className="text-sm font-medium">{cap.label}</p>
                          <p className="text-xs text-muted-foreground">
                            +{cap.addon.toLocaleString()}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Tech stack multipliers apply to product builds. Dedicated team
                  pricing is based on role rates and duration.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Support tier</CardTitle>
              <CardDescription>
                Post-launch care and ongoing maintenance coverage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={supportTier}
                onValueChange={(v) => setSupportTier(v as SupportTier)}
                className="grid gap-3"
              >
                {SUPPORT_TIER_ORDER.map((key) => {
                  const tier = config.supportTiers[key];
                  return (
                  <label
                    key={key}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                  >
                    <RadioGroupItem value={key} className="mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">{tier.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {tier.monthlyAddon > 0
                          ? `${tier.monthlyAddon.toLocaleString()}/month`
                          : "No recurring support cost"}
                        {tier.multiplier !== 1
                          ? ` · ×${tier.multiplier} on development`
                          : ""}
                      </p>
                    </div>
                  </label>
                  );
                })}
              </RadioGroup>

              {supportTier !== "none" ? (
                <div className="space-y-2">
                  <Label htmlFor="support-months">Support period (months)</Label>
                  <Input
                    id="support-months"
                    type="number"
                    min={1}
                    value={supportMonths}
                    onChange={(e) => setSupportMonths(e.target.value)}
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div>
          {loading ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Loading rates…
              </CardContent>
            </Card>
          ) : (
            <PricingEstimateSummary
              estimate={estimate}
              projectLabel={projectLabel}
            />
          )}
        </div>
      </div>
    </PageShell>
  );
}
