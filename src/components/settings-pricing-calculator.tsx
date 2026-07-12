"use client";

import { useEffect, useState } from "react";
import { pricingCalculatorApi } from "@/lib/api";
import {
  DEFAULT_PRICING_CALCULATOR_CONFIG,
  mergePricingConfig,
  PROJECT_TYPE_OPTIONS,
  SUPPORT_TIER_ORDER,
  type DesignComplexity,
  type PricingCalculatorConfig,
  type ProjectType,
  type SupportTier,
} from "@/lib/pricing-calculator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calculator, RefreshCw } from "lucide-react";

const TABLE_INPUT_CLASSNAME =
  "m-0 h-10 w-full min-w-0 rounded-none border-0 bg-transparent p-0 shadow-none tabular-nums focus-visible:bg-muted/40 focus-visible:ring-0 focus-visible:ring-offset-0";

export function SettingsPricingCalculator() {
  const [config, setConfig] = useState<PricingCalculatorConfig>(
    DEFAULT_PRICING_CALCULATOR_CONFIG,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await pricingCalculatorApi.getConfig();
        setConfig(mergePricingConfig(res.config));
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to load pricing config",
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateProjectType = (
    type: ProjectType,
    field: "basePrice" | "pricePerScreen" | "pricePerFunction",
    value: string,
  ) => {
    const num = Number(value);
    if (Number.isNaN(num)) return;
    setConfig((prev) => ({
      ...prev,
      projectTypes: {
        ...prev.projectTypes,
        [type]: { ...prev.projectTypes[type], [field]: num },
      },
    }));
  };

  const updateDesignComplexity = (
    key: DesignComplexity,
    multiplier: string,
  ) => {
    const num = Number(multiplier);
    if (Number.isNaN(num)) return;
    setConfig((prev) => ({
      ...prev,
      designComplexity: {
        ...prev.designComplexity,
        [key]: { ...prev.designComplexity[key], multiplier: num },
      },
    }));
  };

  const updateSupportTier = (
    key: SupportTier,
    field: "monthlyAddon" | "multiplier",
    value: string,
  ) => {
    const num = Number(value);
    if (Number.isNaN(num)) return;
    setConfig((prev) => ({
      ...prev,
      supportTiers: {
        ...prev.supportTiers,
        [key]: { ...prev.supportTiers[key], [field]: num },
      },
    }));
  };

  const updateTeamRoleRate = (roleId: string, value: string) => {
    const num = Number(value);
    if (Number.isNaN(num)) return;
    setConfig((prev) => ({
      ...prev,
      teamRoles: prev.teamRoles.map((role) =>
        role.id === roleId ? { ...role, monthlyRate: num } : role,
      ),
    }));
  };

  const updateTechMultiplier = (
    group: "frontendFrameworks" | "backendFrameworks" | "databases",
    id: string,
    value: string,
  ) => {
    const num = Number(value);
    if (Number.isNaN(num)) return;
    setConfig((prev) => ({
      ...prev,
      techStack: {
        ...prev.techStack,
        [group]: prev.techStack[group].map((item) =>
          item.id === id ? { ...item, multiplier: num } : item,
        ),
      },
    }));
  };

  const updateCapabilityAddon = (id: string, value: string) => {
    const num = Number(value);
    if (Number.isNaN(num)) return;
    setConfig((prev) => ({
      ...prev,
      techStack: {
        ...prev.techStack,
        capabilities: prev.techStack.capabilities.map((cap) =>
          cap.id === id ? { ...cap, addon: num } : cap,
        ),
      },
    }));
  };

  const updateCapabilityHours = (id: string, value: string) => {
    const num = Number(value);
    if (Number.isNaN(num)) return;
    setConfig((prev) => ({
      ...prev,
      techStack: {
        ...prev.techStack,
        capabilities: prev.techStack.capabilities.map((cap) =>
          cap.id === id ? { ...cap, hours: num } : cap,
        ),
      },
    }));
  };

  const updateTimelinePhase = (
    phaseId: string,
    field: keyof import("@/lib/pricing-calculator").TimelinePhaseConfig,
    value: string,
  ) => {
    const num = Number(value);
    if (Number.isNaN(num)) return;
    setConfig((prev) => ({
      ...prev,
      timeline: {
        ...prev.timeline,
        phases: prev.timeline.phases.map((phase) =>
          phase.id === phaseId ? { ...phase, [field]: num } : phase,
        ),
      },
    }));
  };

  const updateScopeScaleCount = (
    kind: "screens" | "functions",
    scaleId: string,
    value: string,
  ) => {
    const num = Number(value);
    if (Number.isNaN(num)) return;
    setConfig((prev) => ({
      ...prev,
      scopeScales: {
        ...prev.scopeScales,
        [kind]: prev.scopeScales[kind].map((scale) =>
          scale.id === scaleId ? { ...scale, count: num } : scale,
        ),
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await pricingCalculatorApi.updateConfig(config);
      setSuccess("Pricing calculator rates saved.");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to save pricing config",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setConfig(DEFAULT_PRICING_CALCULATOR_CONFIG);
    setSuccess(null);
    setError(null);
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading pricing calculator settings…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="pricing-calculator" className="mb-6 scroll-mt-28">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Pricing calculator
            </CardTitle>
            <CardDescription className="mt-2">
              Configure base rates, multipliers, and support costs used in
              Studio.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetDefaults}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset to defaults
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save rates"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {success ? (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        ) : null}

        <section className="space-y-4">
          <h3 className="font-medium">Project type rates</h3>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-10 w-[220px] px-3 py-0">
                    Project type
                  </TableHead>
                  <TableHead className="h-10 p-0">Base price</TableHead>
                  <TableHead className="h-10 p-0">Per screen</TableHead>
                  <TableHead className="h-10 p-0">Per function</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PROJECT_TYPE_OPTIONS.filter(
                  (p) => p.value !== "dedicated_team",
                ).map((project) => {
                  const rates = config.projectTypes[project.value];
                  return (
                    <TableRow
                      key={project.value}
                      className="hover:bg-transparent"
                    >
                      <TableCell className="px-3 py-0 font-medium">
                        {project.label}
                      </TableCell>
                      <TableCell className="p-0">
                        <Input
                          type="number"
                          min={0}
                          className={TABLE_INPUT_CLASSNAME}
                          value={rates.basePrice}
                          onChange={(e) =>
                            updateProjectType(
                              project.value,
                              "basePrice",
                              e.target.value,
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="p-0">
                        <Input
                          type="number"
                          min={0}
                          className={TABLE_INPUT_CLASSNAME}
                          value={rates.pricePerScreen}
                          onChange={(e) =>
                            updateProjectType(
                              project.value,
                              "pricePerScreen",
                              e.target.value,
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="p-0">
                        <Input
                          type="number"
                          min={0}
                          className={TABLE_INPUT_CLASSNAME}
                          value={rates.pricePerFunction}
                          onChange={(e) =>
                            updateProjectType(
                              project.value,
                              "pricePerFunction",
                              e.target.value,
                            )
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-medium">Design complexity multipliers</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              Object.entries(config.designComplexity) as [
                DesignComplexity,
                { label: string; multiplier: number },
              ][]
            ).map(([key, option]) => (
              <div key={key} className="space-y-1 rounded-lg border p-3">
                <Label>{option.label}</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.05}
                  value={option.multiplier}
                  onChange={(e) => updateDesignComplexity(key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-medium">Support tiers</h3>
          <div className="grid gap-3">
            {SUPPORT_TIER_ORDER.map((key) => {
              const tier = config.supportTiers[key];
              return (
                <div
                  key={key}
                  className="grid gap-3 rounded-lg border p-4 sm:grid-cols-3"
                >
                  <p className="font-medium sm:col-span-3">{tier.label}</p>
                  <div className="space-y-1">
                    <Label>Monthly add-on</Label>
                    <Input
                      type="number"
                      min={0}
                      value={tier.monthlyAddon}
                      onChange={(e) =>
                        updateSupportTier(key, "monthlyAddon", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Development multiplier</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.05}
                      value={tier.multiplier}
                      onChange={(e) =>
                        updateSupportTier(key, "multiplier", e.target.value)
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-medium">Team role monthly rates</h3>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-10 px-3 py-0">Role</TableHead>
                  <TableHead className="h-10 p-0">Monthly rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.teamRoles.map((role) => (
                  <TableRow key={role.id} className="hover:bg-transparent">
                    <TableCell className="px-3 py-0 font-medium">
                      {role.label}
                    </TableCell>
                    <TableCell className="p-0">
                      <Input
                        type="number"
                        min={0}
                        className={TABLE_INPUT_CLASSNAME}
                        value={role.monthlyRate}
                        onChange={(e) =>
                          updateTeamRoleRate(role.id, e.target.value)
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-medium">Technology stack multipliers</h3>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Front-end</p>
              {config.techStack.frontendFrameworks.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 text-sm">{item.label}</span>
                  <Input
                    type="number"
                    min={0}
                    step={0.05}
                    className="w-24"
                    value={item.multiplier}
                    onChange={(e) =>
                      updateTechMultiplier(
                        "frontendFrameworks",
                        item.id,
                        e.target.value,
                      )
                    }
                  />
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Back-end</p>
              {config.techStack.backendFrameworks.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 text-sm">{item.label}</span>
                  <Input
                    type="number"
                    min={0}
                    step={0.05}
                    className="w-24"
                    value={item.multiplier}
                    onChange={(e) =>
                      updateTechMultiplier(
                        "backendFrameworks",
                        item.id,
                        e.target.value,
                      )
                    }
                  />
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Database</p>
              {config.techStack.databases.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 text-sm">{item.label}</span>
                  <Input
                    type="number"
                    min={0}
                    step={0.05}
                    className="w-24"
                    value={item.multiplier}
                    onChange={(e) =>
                      updateTechMultiplier(
                        "databases",
                        item.id,
                        e.target.value,
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-medium">Scope scale counts</h3>
          <p className="text-sm text-muted-foreground">
            Numeric values used for pricing and timeline when a scale is
            selected on the slider.
          </p>
          <div className="grid gap-6 lg:grid-cols-2">
            {(["screens", "functions"] as const).map((kind) => (
              <div key={kind} className="space-y-3">
                <p className="text-sm font-medium capitalize">{kind}</p>
                {config.scopeScales[kind].map((scale) => (
                  <div
                    key={scale.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{scale.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {scale.description}
                      </p>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      className="w-24"
                      value={scale.count}
                      onChange={(e) =>
                        updateScopeScaleCount(kind, scale.id, e.target.value)
                      }
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-medium">Timeline phases</h3>
          <p className="text-sm text-muted-foreground">
            Base hours and per-unit additions for each delivery phase. Phases
            combine into the total timeline shown in the estimate.
          </p>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-10 w-[200px] px-3 py-0">
                    Phase
                  </TableHead>
                  <TableHead className="h-10 p-0">Base hours</TableHead>
                  <TableHead className="h-10 p-0">Hours per screen</TableHead>
                  <TableHead className="h-10 p-0">Hours per function</TableHead>
                  <TableHead className="h-10 p-0">
                    Hours per capability
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.timeline.phases.map((phase) => (
                  <TableRow key={phase.id} className="hover:bg-transparent">
                    <TableCell className="px-3 py-0 font-medium">
                      {phase.label}
                    </TableCell>
                    <TableCell className="p-0">
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        className={TABLE_INPUT_CLASSNAME}
                        value={phase.baseHours}
                        onChange={(e) =>
                          updateTimelinePhase(
                            phase.id,
                            "baseHours",
                            e.target.value,
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="p-0">
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        className={TABLE_INPUT_CLASSNAME}
                        value={phase.screenHoursPerUnit}
                        onChange={(e) =>
                          updateTimelinePhase(
                            phase.id,
                            "screenHoursPerUnit",
                            e.target.value,
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="p-0">
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        className={TABLE_INPUT_CLASSNAME}
                        value={phase.functionHoursPerUnit}
                        onChange={(e) =>
                          updateTimelinePhase(
                            phase.id,
                            "functionHoursPerUnit",
                            e.target.value,
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="p-0">
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        className={TABLE_INPUT_CLASSNAME}
                        value={phase.capabilityHoursPerUnit}
                        onChange={(e) =>
                          updateTimelinePhase(
                            phase.id,
                            "capabilityHoursPerUnit",
                            e.target.value,
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(
              Object.entries(config.timeline.projectTypeMultipliers) as [
                ProjectType,
                number,
              ][]
            ).map(([type, multiplier]) => (
              <div key={type} className="space-y-1">
                <Label>{config.projectTypes[type].label} multiplier</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.05}
                  value={multiplier}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      timeline: {
                        ...prev.timeline,
                        projectTypeMultipliers: {
                          ...prev.timeline.projectTypeMultipliers,
                          [type]: Number(e.target.value) || 0,
                        },
                      },
                    }))
                  }
                />
              </div>
            ))}
            <div className="space-y-1">
              <Label>Timeline contingency %</Label>
              <Input
                type="number"
                min={0}
                value={config.timeline.contingencyHoursPercent}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    timeline: {
                      ...prev.timeline,
                      contingencyHoursPercent: Number(e.target.value) || 0,
                    },
                  }))
                }
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-medium">Capability add-ons</h3>
          <div className="grid gap-3">
            {config.techStack.capabilities.map((cap) => (
              <div
                key={cap.id}
                className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_120px_120px]"
              >
                <span className="self-center text-sm font-medium">
                  {cap.label}
                </span>
                <div className="space-y-1">
                  <Label className="text-xs">Price add-on</Label>
                  <Input
                    type="number"
                    min={0}
                    value={cap.addon}
                    onChange={(e) =>
                      updateCapabilityAddon(cap.id, e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Timeline hours</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={cap.hours ?? 0}
                    onChange={(e) =>
                      updateCapabilityHours(cap.id, e.target.value)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-medium">Margins & defaults</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>Contingency %</Label>
              <Input
                type="number"
                min={0}
                value={config.margins.contingencyPercent}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    margins: {
                      ...prev.margins,
                      contingencyPercent: Number(e.target.value) || 0,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Default support months</Label>
              <Input
                type="number"
                min={1}
                value={config.supportDefaults.defaultMonths}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    supportDefaults: {
                      ...prev.supportDefaults,
                      defaultMonths: Number(e.target.value) || 1,
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Default team duration (months)</Label>
              <Input
                type="number"
                min={1}
                value={config.dedicatedTeamDefaults.defaultDurationMonths}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    dedicatedTeamDefaults: {
                      ...prev.dedicatedTeamDefaults,
                      defaultDurationMonths: Number(e.target.value) || 1,
                    },
                  }))
                }
              />
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
