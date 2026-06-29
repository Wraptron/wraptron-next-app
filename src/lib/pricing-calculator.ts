export type ProjectType =
  | "website"
  | "pwa"
  | "mobile_app"
  | "dedicated_team";

export type DesignComplexity = "basic" | "medium" | "high";

export type SupportTier = "none" | "basic_care" | "standard_care" | "premium_care";

export const SUPPORT_TIER_ORDER: SupportTier[] = [
  "none",
  "basic_care",
  "standard_care",
  "premium_care",
];

export interface ProjectTypeRates {
  label: string;
  basePrice: number;
  pricePerScreen: number;
  pricePerFunction: number;
}

export interface DesignComplexityOption {
  label: string;
  multiplier: number;
}

export interface SupportTierOption {
  label: string;
  monthlyAddon: number;
  multiplier: number;
}

export interface TechStackOption {
  id: string;
  label: string;
  multiplier: number;
}

export interface CapabilityOption {
  id: string;
  label: string;
  addon: number;
  hours?: number;
}

export const HOURS_PER_WORK_WEEK = 40;
export const HOURS_PER_MONTH = 173;

export interface ScopeScaleOption {
  id: string;
  label: string;
  description: string;
  count: number;
}

export interface TimelinePhaseConfig {
  id: string;
  label: string;
  baseHours: number;
  screenHoursPerUnit: number;
  functionHoursPerUnit: number;
  capabilityHoursPerUnit: number;
  applyDesignMultiplier: boolean;
  applyProjectMultiplier: boolean;
  applyTechMultiplier: boolean;
}

export interface TimelineConfig {
  phases: TimelinePhaseConfig[];
  projectTypeMultipliers: Record<ProjectType, number>;
  designComplexityMultipliers: Record<DesignComplexity, number>;
  contingencyHoursPercent: number;
}

export interface TeamRoleOption {
  id: string;
  label: string;
  monthlyRate: number;
}

export interface PricingCalculatorConfig {
  currency: string;
  projectTypes: Record<ProjectType, ProjectTypeRates>;
  designComplexity: Record<DesignComplexity, DesignComplexityOption>;
  supportTiers: Record<SupportTier, SupportTierOption>;
  techStack: {
    frontendFrameworks: TechStackOption[];
    backendFrameworks: TechStackOption[];
    capabilities: CapabilityOption[];
  };
  teamRoles: TeamRoleOption[];
  scopeScales: {
    screens: ScopeScaleOption[];
    functions: ScopeScaleOption[];
  };
  timeline: TimelineConfig;
  dedicatedTeamDefaults: { defaultDurationMonths: number };
  margins: { contingencyPercent: number };
  supportDefaults: { defaultMonths: number };
}

export interface TeamRoleSelection {
  roleId: string;
  count: number;
}

export interface PricingCalculatorInput {
  projectType: ProjectType;
  projectName?: string;
  screens?: number;
  functions?: number;
  screenScaleIndex?: number;
  functionScaleIndex?: number;
  designComplexity?: DesignComplexity;
  teamComposition?: TeamRoleSelection[];
  durationMonths?: number;
  frontendFramework?: string;
  backendFramework?: string;
  capabilities?: string[];
  supportTier: SupportTier;
  supportMonths?: number;
}

export interface PricingLineItem {
  id: string;
  label: string;
  amount: number;
  detail?: string;
}

export interface TimelinePhase {
  id: string;
  label: string;
  hours: number;
}

export interface TimelineEstimate {
  phases: TimelinePhase[];
  totalHours: number;
  totalWeeks: number;
  displayLabel: string;
}

export interface PricingEstimate {
  lineItems: PricingLineItem[];
  developmentSubtotal: number;
  supportTotal: number;
  contingency: number;
  total: number;
  timeline: TimelineEstimate;
}

export const DEFAULT_PRICING_CALCULATOR_CONFIG: PricingCalculatorConfig = {
  currency: "INR",
  projectTypes: {
    website: {
      label: "Website",
      basePrice: 150000,
      pricePerScreen: 8000,
      pricePerFunction: 12000,
    },
    pwa: {
      label: "Progressive Web App",
      basePrice: 250000,
      pricePerScreen: 12000,
      pricePerFunction: 15000,
    },
    mobile_app: {
      label: "Mobile App",
      basePrice: 400000,
      pricePerScreen: 15000,
      pricePerFunction: 18000,
    },
    dedicated_team: {
      label: "Dedicated Product Development Team",
      basePrice: 0,
      pricePerScreen: 0,
      pricePerFunction: 0,
    },
  },
  designComplexity: {
    basic: { label: "Basic", multiplier: 1 },
    medium: { label: "Medium", multiplier: 1.25 },
    high: { label: "High", multiplier: 1.6 },
  },
  supportTiers: {
    none: { label: "No support", monthlyAddon: 0, multiplier: 1 },
    basic_care: { label: "Basic care", monthlyAddon: 15000, multiplier: 1 },
    standard_care: {
      label: "Standard care",
      monthlyAddon: 22000,
      multiplier: 1,
    },
    premium_care: { label: "Premium care", monthlyAddon: 35000, multiplier: 1 },
  },
  techStack: {
    frontendFrameworks: [
      { id: "react", label: "React / Next.js", multiplier: 1 },
      { id: "vue", label: "Vue / Nuxt", multiplier: 1 },
      { id: "angular", label: "Angular", multiplier: 1.05 },
      { id: "svelte", label: "Svelte / SvelteKit", multiplier: 1.05 },
      { id: "astro", label: "Astro", multiplier: 0.95 },
    ],
    backendFrameworks: [
      { id: "node", label: "Node.js", multiplier: 1 },
      { id: "deno", label: "Deno", multiplier: 1.05 },
      { id: "python", label: "Python (Django/FastAPI)", multiplier: 1.05 },
      { id: "dotnet", label: ".NET", multiplier: 1.1 },
      { id: "go", label: "Go", multiplier: 1.1 },
    ],
    capabilities: [
      { id: "auth", label: "Authentication & authorization", addon: 40000 },
      { id: "payments", label: "Payments & billing", addon: 60000 },
      { id: "realtime", label: "Realtime / websockets", addon: 45000 },
      { id: "search", label: "Search & filtering", addon: 35000 },
      { id: "cms", label: "CMS / content management", addon: 50000 },
      { id: "analytics", label: "Analytics & reporting", addon: 40000 },
      { id: "integrations", label: "Third-party integrations", addon: 55000, hours: 60 },
      { id: "offline", label: "Offline-first / sync", addon: 70000, hours: 80 },
      { id: "admin_dashboard", label: "Admin dashboard", addon: 55000, hours: 80 },
    ],
  },
  teamRoles: [
    { id: "product_manager", label: "Product Manager", monthlyRate: 180000 },
    { id: "designer", label: "UI/UX Designer", monthlyRate: 140000 },
    { id: "frontend", label: "Frontend Engineer", monthlyRate: 160000 },
    { id: "backend", label: "Backend Engineer", monthlyRate: 170000 },
    { id: "fullstack", label: "Full-stack Engineer", monthlyRate: 185000 },
    { id: "qa", label: "QA Engineer", monthlyRate: 120000 },
    { id: "devops", label: "DevOps Engineer", monthlyRate: 150000 },
    { id: "mobile", label: "Mobile Engineer", monthlyRate: 175000 },
  ],
  scopeScales: {
    screens: [
      { id: "minimal", label: "Minimal", description: "1–3 screens / views", count: 2 },
      { id: "small", label: "Small", description: "4–8 screens / views", count: 6 },
      { id: "medium", label: "Medium", description: "9–15 screens / views", count: 12 },
      { id: "large", label: "Large", description: "16–25 screens / views", count: 20 },
      { id: "enterprise", label: "Enterprise", description: "26+ screens / views", count: 30 },
    ],
    functions: [
      { id: "minimal", label: "Minimal", description: "1–2 functional requirements", count: 2 },
      { id: "small", label: "Small", description: "3–5 functional requirements", count: 4 },
      { id: "medium", label: "Medium", description: "6–10 functional requirements", count: 8 },
      { id: "large", label: "Large", description: "11–18 functional requirements", count: 14 },
      { id: "enterprise", label: "Enterprise", description: "19+ functional requirements", count: 22 },
    ],
  },
  timeline: {
    phases: [
      {
        id: "discovery",
        label: "Discovery & planning",
        baseHours: 80,
        screenHoursPerUnit: 2,
        functionHoursPerUnit: 4,
        capabilityHoursPerUnit: 6,
        applyDesignMultiplier: false,
        applyProjectMultiplier: true,
        applyTechMultiplier: false,
      },
      {
        id: "design",
        label: "UI/UX design",
        baseHours: 120,
        screenHoursPerUnit: 8,
        functionHoursPerUnit: 3,
        capabilityHoursPerUnit: 4,
        applyDesignMultiplier: true,
        applyProjectMultiplier: true,
        applyTechMultiplier: false,
      },
      {
        id: "development",
        label: "Development",
        baseHours: 160,
        screenHoursPerUnit: 14,
        functionHoursPerUnit: 18,
        capabilityHoursPerUnit: 10,
        applyDesignMultiplier: false,
        applyProjectMultiplier: true,
        applyTechMultiplier: true,
      },
      {
        id: "qa",
        label: "QA & UAT",
        baseHours: 80,
        screenHoursPerUnit: 3,
        functionHoursPerUnit: 5,
        capabilityHoursPerUnit: 6,
        applyDesignMultiplier: false,
        applyProjectMultiplier: true,
        applyTechMultiplier: true,
      },
      {
        id: "launch",
        label: "Launch & handoff",
        baseHours: 40,
        screenHoursPerUnit: 1,
        functionHoursPerUnit: 1,
        capabilityHoursPerUnit: 2,
        applyDesignMultiplier: false,
        applyProjectMultiplier: true,
        applyTechMultiplier: false,
      },
    ],
    projectTypeMultipliers: {
      website: 1,
      pwa: 1.2,
      mobile_app: 1.35,
      dedicated_team: 1,
    },
    designComplexityMultipliers: {
      basic: 1,
      medium: 1.2,
      high: 1.5,
    },
    contingencyHoursPercent: 10,
  },
  dedicatedTeamDefaults: { defaultDurationMonths: 6 },
  margins: { contingencyPercent: 10 },
  supportDefaults: { defaultMonths: 12 },
};

function roundCurrency(value: number): number {
  return Math.round(value);
}

function roundHours(value: number): number {
  return Math.round(value);
}

export function formatTimelineHours(hours: number): string {
  return `${hours.toLocaleString()} hrs`;
}

export function hoursToWeeks(hours: number): number {
  return Math.round((hours / HOURS_PER_WORK_WEEK) * 10) / 10;
}

export function formatTimelineWeeks(weeks: number): string {
  if (weeks === 1) return "1 week";
  return `${weeks} weeks`;
}

export function formatTimelineHoursAndWeeks(hours: number): string {
  const weeks = hoursToWeeks(hours);
  return `${formatTimelineHours(hours)} (~${formatTimelineWeeks(weeks)})`;
}

export function resolveScopeCount(
  input: PricingCalculatorInput,
  config: PricingCalculatorConfig,
  kind: "screens" | "functions",
): number {
  const scales = config.scopeScales[kind];
  const scaleIndex =
    kind === "screens" ? input.screenScaleIndex : input.functionScaleIndex;

  if (scaleIndex !== undefined && scales[scaleIndex]) {
    return scales[scaleIndex].count;
  }

  const direct = kind === "screens" ? input.screens : input.functions;
  return Math.max(0, direct ?? 0);
}

function getTechMultiplier(
  input: PricingCalculatorInput,
  config: PricingCalculatorConfig,
): number {
  const frontend = config.techStack.frontendFrameworks.find(
    (f) => f.id === input.frontendFramework,
  );
  const backend = config.techStack.backendFrameworks.find(
    (b) => b.id === input.backendFramework,
  );
  return (frontend?.multiplier ?? 1) * (backend?.multiplier ?? 1);
}

function getCapabilityHours(
  capabilityIds: string[],
  config: PricingCalculatorConfig,
): number {
  return capabilityIds.reduce((sum, capId) => {
    const cap = config.techStack.capabilities.find((c) => c.id === capId);
    return sum + (cap?.hours ?? 0);
  }, 0);
}

export function calculateTimelineEstimate(
  input: PricingCalculatorInput,
  config: PricingCalculatorConfig,
): TimelineEstimate {
  if (input.projectType === "dedicated_team") {
    const months =
      input.durationMonths ?? config.dedicatedTeamDefaults.defaultDurationMonths;
    const composition = input.teamComposition ?? [];
    const headcount = composition.reduce(
      (sum, selection) => sum + (selection.count ?? 0),
      0,
    );
    const hoursPerMonth =
      headcount > 0 ? headcount * HOURS_PER_MONTH : HOURS_PER_MONTH;
    const totalHours = roundHours(hoursPerMonth * months);
    const totalWeeks = hoursToWeeks(totalHours);
    return {
      phases: [
        {
          id: "engagement",
          label: "Team engagement",
          hours: totalHours,
        },
      ],
      totalHours,
      totalWeeks,
      displayLabel: `${formatTimelineHoursAndWeeks(totalHours)} (~${months} months)`,
    };
  }

  const screens = resolveScopeCount(input, config, "screens");
  const functions = resolveScopeCount(input, config, "functions");
  const capabilityIds = input.capabilities ?? [];
  const capabilityHours = getCapabilityHours(capabilityIds, config);
  const complexity = input.designComplexity ?? "basic";
  const projectMultiplier =
    config.timeline.projectTypeMultipliers[input.projectType] ?? 1;
  const designMultiplier =
    config.timeline.designComplexityMultipliers[complexity] ?? 1;
  const techMultiplier = getTechMultiplier(input, config);

  const phases: TimelinePhase[] = config.timeline.phases.map((phase) => {
    let hours =
      phase.baseHours +
      screens * phase.screenHoursPerUnit +
      functions * phase.functionHoursPerUnit +
      capabilityIds.length * phase.capabilityHoursPerUnit;

    if (phase.id === "development" || phase.id === "qa") {
      hours += capabilityHours;
    }

    if (phase.applyDesignMultiplier) hours *= designMultiplier;
    if (phase.applyProjectMultiplier) hours *= projectMultiplier;
    if (phase.applyTechMultiplier) hours *= techMultiplier;

    return {
      id: phase.id,
      label: phase.label,
      hours: roundHours(hours),
    };
  });

  let totalHours = phases.reduce((sum, phase) => sum + phase.hours, 0);
  const contingencyHours = roundHours(
    totalHours * (config.timeline.contingencyHoursPercent / 100),
  );

  if (contingencyHours > 0) {
    phases.push({
      id: "buffer",
      label: "Buffer / contingency",
      hours: contingencyHours,
    });
    totalHours += contingencyHours;
  }

  totalHours = roundHours(totalHours);
  const totalWeeks = hoursToWeeks(totalHours);

  return {
    phases,
    totalHours,
    totalWeeks,
    displayLabel: formatTimelineHoursAndWeeks(totalHours),
  };
}

export function calculatePricingEstimate(
  input: PricingCalculatorInput,
  config: PricingCalculatorConfig,
): PricingEstimate {
  const lineItems: PricingLineItem[] = [];
  let developmentSubtotal = 0;

  if (input.projectType === "dedicated_team") {
    const duration =
      input.durationMonths ?? config.dedicatedTeamDefaults.defaultDurationMonths;
    const composition = input.teamComposition ?? [];
    let monthlyTeamCost = 0;

    for (const selection of composition) {
      if (!selection.count || selection.count <= 0) continue;
      const role = config.teamRoles.find((r) => r.id === selection.roleId);
      if (!role) continue;
      const amount = role.monthlyRate * selection.count;
      monthlyTeamCost += amount;
      lineItems.push({
        id: `role-${role.id}`,
        label: role.label,
        amount: role.monthlyRate * selection.count * duration,
        detail: `${selection.count} × ${duration} months @ ${role.monthlyRate.toLocaleString()}/mo`,
      });
    }

    developmentSubtotal = monthlyTeamCost * duration;

    if (developmentSubtotal === 0 && composition.length === 0) {
      lineItems.push({
        id: "team-placeholder",
        label: "Team composition",
        amount: 0,
        detail: "Add roles to estimate team cost",
      });
    }
  } else {
    const rates = config.projectTypes[input.projectType];
    const screens = resolveScopeCount(input, config, "screens");
    const functions = resolveScopeCount(input, config, "functions");
    const complexity = input.designComplexity ?? "basic";

    const baseAmount = rates.basePrice;
    const screenAmount = screens * rates.pricePerScreen;
    const functionAmount = functions * rates.pricePerFunction;
    const scopeSubtotal = baseAmount + screenAmount + functionAmount;

    lineItems.push({
      id: "base",
      label: `${rates.label} base`,
      amount: baseAmount,
    });

    if (screens > 0) {
      lineItems.push({
        id: "screens",
        label: "Screens / views / pages",
        amount: screenAmount,
        detail: `${screens} × ${rates.pricePerScreen.toLocaleString()}`,
      });
    }

    if (functions > 0) {
      lineItems.push({
        id: "functions",
        label: "Functional requirements",
        amount: functionAmount,
        detail: `${functions} × ${rates.pricePerFunction.toLocaleString()}`,
      });
    }

    const complexityOption = config.designComplexity[complexity];
    const afterComplexity = scopeSubtotal * complexityOption.multiplier;
    if (complexityOption.multiplier !== 1) {
      lineItems.push({
        id: "design-complexity",
        label: `Design complexity (${complexityOption.label})`,
        amount: afterComplexity - scopeSubtotal,
        detail: `×${complexityOption.multiplier}`,
      });
    }

    const frontend = config.techStack.frontendFrameworks.find(
      (f) => f.id === input.frontendFramework,
    );
    const backend = config.techStack.backendFrameworks.find(
      (b) => b.id === input.backendFramework,
    );
    const techMultiplier =
      (frontend?.multiplier ?? 1) * (backend?.multiplier ?? 1);

    let afterTech = afterComplexity * techMultiplier;
    if (techMultiplier !== 1) {
      lineItems.push({
        id: "tech-multiplier",
        label: "Technology stack adjustment",
        amount: afterTech - afterComplexity,
        detail: `×${techMultiplier.toFixed(2)}`,
      });
    }

    const selectedCapabilities = input.capabilities ?? [];
    let capabilityAddons = 0;
    for (const capId of selectedCapabilities) {
      const cap = config.techStack.capabilities.find((c) => c.id === capId);
      if (!cap) continue;
      capabilityAddons += cap.addon;
      lineItems.push({
        id: `cap-${cap.id}`,
        label: cap.label,
        amount: cap.addon,
      });
    }

    developmentSubtotal = afterTech + capabilityAddons;
  }

  const supportTier = config.supportTiers[input.supportTier];
  const supportMonths =
    input.supportMonths ?? config.supportDefaults.defaultMonths;
  let supportTotal = 0;

  if (input.supportTier !== "none") {
    const addonTotal = supportTier.monthlyAddon * supportMonths;
    const multiplierAdjustment =
      developmentSubtotal * (supportTier.multiplier - 1);
    supportTotal = addonTotal + multiplierAdjustment;

    if (addonTotal > 0) {
      lineItems.push({
        id: "support-addon",
        label: `${supportTier.label} (${supportMonths} months)`,
        amount: addonTotal,
        detail: `${supportTier.monthlyAddon.toLocaleString()}/mo`,
      });
    }
    if (multiplierAdjustment > 0) {
      lineItems.push({
        id: "support-multiplier",
        label: `${supportTier.label} multiplier`,
        amount: multiplierAdjustment,
        detail: `×${supportTier.multiplier}`,
      });
    }
  }

  const contingency =
    developmentSubtotal * (config.margins.contingencyPercent / 100);

  if (contingency > 0) {
    lineItems.push({
      id: "contingency",
      label: `Contingency (${config.margins.contingencyPercent}%)`,
      amount: contingency,
    });
  }

  const total = developmentSubtotal + supportTotal + contingency;
  const timeline = calculateTimelineEstimate(input, config);

  return {
    lineItems,
    developmentSubtotal: roundCurrency(developmentSubtotal),
    supportTotal: roundCurrency(supportTotal),
    contingency: roundCurrency(contingency),
    total: roundCurrency(total),
    timeline,
  };
}

export function mergePricingConfig(
  partial?: Partial<PricingCalculatorConfig> | null,
): PricingCalculatorConfig {
  if (!partial) return DEFAULT_PRICING_CALCULATOR_CONFIG;
  return {
    ...DEFAULT_PRICING_CALCULATOR_CONFIG,
    ...partial,
    projectTypes: {
      ...DEFAULT_PRICING_CALCULATOR_CONFIG.projectTypes,
      ...(partial.projectTypes ?? {}),
    },
    designComplexity: {
      ...DEFAULT_PRICING_CALCULATOR_CONFIG.designComplexity,
      ...(partial.designComplexity ?? {}),
    },
    supportTiers: {
      ...DEFAULT_PRICING_CALCULATOR_CONFIG.supportTiers,
      ...(partial.supportTiers ?? {}),
    },
    techStack: {
      frontendFrameworks:
        partial.techStack?.frontendFrameworks ??
        DEFAULT_PRICING_CALCULATOR_CONFIG.techStack.frontendFrameworks,
      backendFrameworks:
        partial.techStack?.backendFrameworks ??
        DEFAULT_PRICING_CALCULATOR_CONFIG.techStack.backendFrameworks,
      capabilities: mergeCapabilities(
        partial.techStack?.capabilities,
        DEFAULT_PRICING_CALCULATOR_CONFIG.techStack.capabilities,
      ),
    },
    teamRoles:
      partial.teamRoles ?? DEFAULT_PRICING_CALCULATOR_CONFIG.teamRoles,
    scopeScales: {
      screens:
        partial.scopeScales?.screens ??
        DEFAULT_PRICING_CALCULATOR_CONFIG.scopeScales.screens,
      functions:
        partial.scopeScales?.functions ??
        DEFAULT_PRICING_CALCULATOR_CONFIG.scopeScales.functions,
    },
    timeline: mergeTimelineConfig(partial.timeline),
    dedicatedTeamDefaults: {
      ...DEFAULT_PRICING_CALCULATOR_CONFIG.dedicatedTeamDefaults,
      ...(partial.dedicatedTeamDefaults ?? {}),
    },
    margins: {
      ...DEFAULT_PRICING_CALCULATOR_CONFIG.margins,
      ...(partial.margins ?? {}),
    },
    supportDefaults: {
      ...DEFAULT_PRICING_CALCULATOR_CONFIG.supportDefaults,
      ...(partial.supportDefaults ?? {}),
    },
  };
}

export const PROJECT_TYPE_OPTIONS: {
  value: ProjectType;
  label: string;
  description: string;
}[] = [
  {
    value: "website",
    label: "Website",
    description: "Marketing sites, landing pages, and content-driven web presence.",
  },
  {
    value: "pwa",
    label: "Progressive Web App",
    description: "Installable web apps with offline support and app-like UX.",
  },
  {
    value: "mobile_app",
    label: "Mobile App",
    description: "Native or cross-platform iOS and Android applications.",
  },
  {
    value: "dedicated_team",
    label: "Dedicated Team",
    description: "Embedded product squad billed by role and engagement length.",
  },
];

function mergeCapabilities(
  stored: CapabilityOption[] | undefined,
  defaults: CapabilityOption[],
): CapabilityOption[] {
  if (!stored?.length) return defaults;
  const storedIds = new Set(stored.map((c) => c.id));
  const merged = [...stored.map(normalizeCapability)];
  for (const def of defaults) {
    if (!storedIds.has(def.id)) merged.push(def);
  }
  return merged;
}

type LegacyTimelinePhaseConfig = TimelinePhaseConfig & {
  baseWeeks?: number;
  screenWeeksPerUnit?: number;
  functionWeeksPerUnit?: number;
  capabilityWeeksPerUnit?: number;
};

type LegacyCapabilityOption = CapabilityOption & { weeks?: number };

type LegacyTimelineConfig = Partial<TimelineConfig> & {
  contingencyWeeksPercent?: number;
  phases?: LegacyTimelinePhaseConfig[];
};

function normalizeCapability(cap: LegacyCapabilityOption): CapabilityOption {
  return {
    id: cap.id,
    label: cap.label,
    addon: cap.addon,
    hours:
      cap.hours ??
      (cap.weeks != null ? cap.weeks * HOURS_PER_WORK_WEEK : undefined),
  };
}

function normalizeTimelinePhase(
  phase: LegacyTimelinePhaseConfig,
): TimelinePhaseConfig {
  return {
    id: phase.id,
    label: phase.label,
    baseHours:
      phase.baseHours ??
      (phase.baseWeeks != null ? phase.baseWeeks * HOURS_PER_WORK_WEEK : 0),
    screenHoursPerUnit:
      phase.screenHoursPerUnit ??
      (phase.screenWeeksPerUnit != null
        ? phase.screenWeeksPerUnit * HOURS_PER_WORK_WEEK
        : 0),
    functionHoursPerUnit:
      phase.functionHoursPerUnit ??
      (phase.functionWeeksPerUnit != null
        ? phase.functionWeeksPerUnit * HOURS_PER_WORK_WEEK
        : 0),
    capabilityHoursPerUnit:
      phase.capabilityHoursPerUnit ??
      (phase.capabilityWeeksPerUnit != null
        ? phase.capabilityWeeksPerUnit * HOURS_PER_WORK_WEEK
        : 0),
    applyDesignMultiplier: phase.applyDesignMultiplier,
    applyProjectMultiplier: phase.applyProjectMultiplier,
    applyTechMultiplier: phase.applyTechMultiplier,
  };
}

function mergeTimelineConfig(
  partial?: LegacyTimelineConfig | null,
): TimelineConfig {
  const defaults = DEFAULT_PRICING_CALCULATOR_CONFIG.timeline;
  if (!partial) return defaults;
  return {
    phases: partial.phases?.length
      ? partial.phases.map(normalizeTimelinePhase)
      : defaults.phases,
    projectTypeMultipliers: {
      ...defaults.projectTypeMultipliers,
      ...(partial.projectTypeMultipliers ?? {}),
    },
    designComplexityMultipliers: {
      ...defaults.designComplexityMultipliers,
      ...(partial.designComplexityMultipliers ?? {}),
    },
    contingencyHoursPercent:
      partial.contingencyHoursPercent ??
      (partial.contingencyWeeksPercent != null
        ? partial.contingencyWeeksPercent
        : defaults.contingencyHoursPercent),
  };
}

export function isScopeProjectType(type: ProjectType): boolean {
  return type !== "dedicated_team";
}
