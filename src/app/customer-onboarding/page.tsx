"use client";

import { useState } from "react";
import { ApiError, customerOnboardingApi } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Rocket,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { COUNTRIES } from "@/lib/countries";
import { cn } from "@/lib/utils";

const MAX_STEP = 6;

const SIGNUP_TYPES = [
  {
    id: "individual",
    label: "Individual",
    description: "Personal or freelance use",
    icon: User,
  },
  {
    id: "business",
    label: "Business",
    description: "Established company",
    icon: Building2,
  },
  {
    id: "startup",
    label: "Startup",
    description: "Early-stage venture",
    icon: Rocket,
  },
  {
    id: "student",
    label: "Student / Academician",
    description: "Education and research",
    icon: GraduationCap,
  },
] as const;

const GST_TYPES = [
  { id: "regular", label: "Regular Registered Business" },
  { id: "composition", label: "Composition Registered Business" },
  { id: "unregistered", label: "Unregistered Business" },
  { id: "overseas", label: "Overseas" },
  { id: "sez", label: "Special Economic Zone" },
  { id: "deemed_exports", label: "Deemed Exports" },
] as const;

/** Hero background — professional workspace (Unsplash). */
const ONBOARDING_HERO_BG =
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2400&q=80";

type SignupTypeId = (typeof SIGNUP_TYPES)[number]["id"];
type GstTypeId = (typeof GST_TYPES)[number]["id"];

function needsCompanyDetails(signupType: SignupTypeId | ""): boolean {
  return signupType === "business" || signupType === "startup";
}

/** Must match `GST_TYPES_REQUIRING_GSTIN` in backend `customer-onboarding.ts`. */
const GST_TYPES_REQUIRING_GSTIN = [
  "regular",
  "composition",
  "sez",
  "deemed_exports",
] as const;

function gstTypeRequiresGstin(t: GstTypeId | ""): boolean {
  return (
    t !== "" && (GST_TYPES_REQUIRING_GSTIN as readonly string[]).includes(t)
  );
}

type FormState = {
  signupType: SignupTypeId | "";
  contactName: string;
  email: string;
  phone: string;
  companyName: string;
  address: string;
  country: string;
  website: string;
  gstin: string;
  gstType: GstTypeId | "";
  portalAccess: "yes" | "no" | "";
};

const initialForm: FormState = {
  signupType: "",
  contactName: "",
  email: "",
  phone: "",
  companyName: "",
  address: "",
  country: "",
  website: "",
  gstin: "",
  gstType: "",
  portalAccess: "",
};

function StepIndicator({
  step,
  totalSteps,
}: {
  step: number;
  totalSteps: number;
}) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            i + 1 === step
              ? "w-8 bg-blue-600"
              : i + 1 < step
                ? "w-4 bg-blue-300"
                : "w-4 bg-neutral-200",
          )}
          aria-hidden
        />
      ))}
      <span className="sr-only">
        Step {step} of {totalSteps}
      </span>
    </div>
  );
}

export default function CustomerOnboardingPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [done, setDone] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setStepError(null);
  };

  const validateStep = (s: number): string | null => {
    if (s === 2) {
      if (!form.signupType) return "Please select who you are signing up as.";
      if (!form.contactName.trim()) return "Contact name is required.";
      if (!form.email.trim()) return "Email is required.";
      if (!form.phone.trim()) return "Phone number is required.";
    }
    if (s === 3) {
      if (!needsCompanyDetails(form.signupType)) return null;
      if (!form.companyName.trim()) return "Company name is required.";
      if (!form.address.trim()) return "Address is required.";
      if (!form.country.trim()) return "Country is required.";
    }
    if (s === 4) {
      if (!form.gstType) return "Please select a GST information option.";
      if (gstTypeRequiresGstin(form.gstType) && !form.gstin.trim()) {
        return "GSTIN is required for the selected GST category.";
      }
    }
    if (s === 5) {
      if (!form.portalAccess)
        return "Please choose whether you want portal access.";
    }
    return null;
  };

  const validateAllForSubmit = (): string | null => {
    const steps: number[] = needsCompanyDetails(form.signupType)
      ? [2, 3, 4, 5]
      : [2, 4, 5];
    for (const s of steps) {
      const err = validateStep(s);
      if (err) return err;
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    const needsCo = needsCompanyDetails(form.signupType);
    if (step === 2) {
      setStep(needsCo ? 3 : 4);
      return;
    }
    if (step < MAX_STEP) setStep((x) => x + 1);
  };

  const goBack = () => {
    setStepError(null);
    if (step <= 1) return;
    const needsCo = needsCompanyDetails(form.signupType);
    if (step === 4) {
      setStep(needsCo ? 3 : 2);
      return;
    }
    setStep((x) => x - 1);
  };

  const handleComplete = async () => {
    setSubmitError(null);
    const err = validateAllForSubmit();
    if (err) {
      setStepError(err);
      return;
    }
    setSubmitting(true);
    try {
      const needsCo = needsCompanyDetails(form.signupType);
      await customerOnboardingApi.submit({
        signupType: form.signupType,
        contactName: form.contactName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        companyName: needsCo ? form.companyName.trim() : "",
        address: needsCo ? form.address.trim() : "",
        country: needsCo ? form.country.trim() : "",
        website: needsCo ? form.website.trim() || undefined : undefined,
        gstType: form.gstType,
        portalAccess: form.portalAccess as "yes" | "no",
        gstin: gstTypeRequiresGstin(form.gstType)
          ? form.gstin.trim()
          : undefined,
      });
      setDone(true);
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Something went wrong. Please try again.";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 px-6 py-12">
        <div className="max-w-md text-center space-y-4">
          <Link href="/" className="inline-block mb-4">
            <Image width={200} height={32} src="/wordmark.svg" alt="Wraptron" />
          </Link>
          <h1 className="text-2xl font-semibold text-neutral-900">Thank you</h1>
          <p className="text-neutral-600 text-sm leading-relaxed">
            Your details have been saved to our systems. Our team will follow up
            if anything else is needed.
          </p>
          <Button asChild className="mt-4">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      {/* Step 1: full-bleed hero with background */}
      {step === 1 ? (
        <div className="relative flex-1 flex flex-col min-h-[100dvh]">
          <div className="absolute inset-0 z-0">
            <Image
              src={ONBOARDING_HERO_BG}
              alt=""
              fill
              priority
              className="object-cover"
              sizes="100vw"
              unoptimized
            />
            <div className="absolute inset-0 bg-neutral-950/60" aria-hidden />
          </div>
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12">
            <Link href="/" className="mb-8">
              <Image
                width={220}
                height={36}
                src="/wordmark.svg"
                alt="Wraptron"
                className="brightness-0 invert drop-shadow-md"
              />
            </Link>
            <div className="w-full max-w-lg rounded-2xl border border-white/20 bg-white/95 p-8 shadow-xl backdrop-blur-sm md:p-10">
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 md:text-3xl">
                Understanding the customer
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-neutral-600 md:text-base">
                Hello and Welcome to Wraptron! Our customer onboarding form is
                aimed to make your journey to our services as smooth as
                possible. Please provide the necessary details to ensure a
                seamless client experience. We appreciate your time and look
                forward to further serving you in your future with us.
              </p>
              <p className="mt-6 text-sm font-medium text-neutral-800">
                Please click next to start.
              </p>
              <div className="mt-8 flex justify-end">
                <Button type="button" onClick={() => setStep(2)} size="lg">
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col">
          <header className="border-b border-neutral-200 bg-white px-4 py-3">
            <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
              <Link href="/" className="shrink-0">
                <Image
                  width={140}
                  height={24}
                  src="/wordmark.svg"
                  alt="Wraptron"
                />
              </Link>
              <p className="text-xs text-neutral-500 hidden sm:block">
                Customer onboarding (KYC)
              </p>
            </div>
          </header>

          <StepIndicator
            step={
              needsCompanyDetails(form.signupType)
                ? step
                : step <= 2
                  ? step
                  : step - 1
            }
            totalSteps={needsCompanyDetails(form.signupType) ? 6 : 5}
          />

          <div className="flex-1 px-4 pb-10">
            <div className="mx-auto w-full max-w-2xl">
              {stepError && (
                <div
                  role="alert"
                  className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                >
                  {stepError}
                </div>
              )}

              {step === 2 && (
                <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8 space-y-8">
                  <div>
                    <h2 className="text-xl font-semibold text-neutral-900 md:text-2xl">
                      Let&apos;s get started
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      Tell us how you&apos;ll use Wraptron and how to reach you.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base">
                      Who are you signing up as?
                    </Label>
                    <RadioGroup
                      value={form.signupType}
                      onValueChange={(v) => {
                        const id = v as SignupTypeId;
                        setForm((f) => ({
                          ...f,
                          signupType: id,
                          ...(id !== "business" && id !== "startup"
                            ? {
                                companyName: "",
                                address: "",
                                country: "",
                                website: "",
                              }
                            : {}),
                        }));
                        setStepError(null);
                      }}
                      className="grid gap-3 sm:grid-cols-2"
                    >
                      {SIGNUP_TYPES.map((opt) => {
                        const Icon = opt.icon;
                        const selected = form.signupType === opt.id;
                        return (
                          <label
                            key={opt.id}
                            className={cn(
                              "relative flex cursor-pointer rounded-xl border-2 p-4 transition-all",
                              selected
                                ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20"
                                : "border-neutral-200 hover:border-neutral-300 bg-white",
                            )}
                          >
                            <RadioGroupItem
                              value={opt.id}
                              id={`signup-${opt.id}`}
                              className="mt-1"
                            />
                            <div className="ml-3 flex flex-1 gap-3">
                              <div
                                className={cn(
                                  "flex size-10 shrink-0 items-center justify-center rounded-lg",
                                  selected
                                    ? "bg-blue-600 text-white"
                                    : "bg-neutral-100 text-neutral-600",
                                )}
                              >
                                <Icon className="size-5" />
                              </div>
                              <div>
                                <span className="font-medium text-neutral-900 block">
                                  {opt.label}
                                </span>
                                <span className="text-xs text-neutral-500 mt-0.5 block">
                                  {opt.description}
                                </span>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </RadioGroup>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-1">
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Your name</Label>
                      <Input
                        id="contactName"
                        value={form.contactName}
                        onChange={(e) => update("contactName", e.target.value)}
                        placeholder="Full name"
                        autoComplete="name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Your Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Your Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        placeholder="+91 …"
                        autoComplete="tel"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && needsCompanyDetails(form.signupType) && (
                <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8 space-y-8">
                  <div>
                    <h2 className="text-xl font-semibold text-neutral-900 md:text-2xl">
                      Company details
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      Business identity, location, and website.
                    </p>
                  </div>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company name</Label>
                      <Input
                        id="companyName"
                        value={form.companyName}
                        onChange={(e) => update("companyName", e.target.value)}
                        placeholder="Legal entity name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={form.address}
                        onChange={(e) => update("address", e.target.value)}
                        placeholder="Street, city, region"
                        rows={3}
                        className="resize-y min-h-[80px]"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Select
                          value={form.country || undefined}
                          onValueChange={(v) => update("country", v)}
                        >
                          <SelectTrigger
                            id="country"
                            className="w-full"
                            aria-label="Country"
                          >
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {COUNTRIES.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          type="url"
                          value={form.website}
                          onChange={(e) => update("website", e.target.value)}
                          placeholder="https://…"
                          autoComplete="url"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8 space-y-8">
                  <div>
                    <h2 className="text-xl font-semibold text-neutral-900 md:text-2xl">
                      GST details
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      How your business is registered for GST and your GSTIN
                      when applicable.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base">GST information</Label>
                    <RadioGroup
                      value={form.gstType}
                      onValueChange={(v) => {
                        const id = v as GstTypeId;
                        setForm((f) => ({
                          ...f,
                          gstType: id,
                          ...(!(
                            GST_TYPES_REQUIRING_GSTIN as readonly string[]
                          ).includes(id)
                            ? { gstin: "" }
                            : {}),
                        }));
                        setStepError(null);
                      }}
                      className="grid gap-2 sm:grid-cols-2"
                    >
                      {GST_TYPES.map((opt) => {
                        const selected = form.gstType === opt.id;
                        return (
                          <label
                            key={opt.id}
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition-all",
                              selected
                                ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20"
                                : "border-neutral-200 hover:border-neutral-300 bg-white",
                            )}
                          >
                            <RadioGroupItem
                              value={opt.id}
                              id={`gst-${opt.id}`}
                              className="mt-0.5"
                            />
                            <span className="text-sm font-medium text-neutral-900 leading-snug">
                              {opt.label}
                            </span>
                          </label>
                        );
                      })}
                    </RadioGroup>
                    {gstTypeRequiresGstin(form.gstType) && (
                      <div className="space-y-2 pt-1">
                        <Label htmlFor="gstin">GSTIN</Label>
                        <Input
                          id="gstin"
                          value={form.gstin}
                          onChange={(e) => update("gstin", e.target.value)}
                          placeholder="e.g. 22AAAAA0000A1Z5"
                          autoComplete="off"
                          className="font-mono"
                          required
                          aria-required
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8 space-y-8">
                  <div>
                    <h2 className="text-xl font-semibold text-neutral-900 md:text-2xl">
                      Customer preferences
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      How you&apos;d like to work with us digitally.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm text-neutral-700 leading-relaxed">
                      Do you want to access our portal to view your transactions
                      and make payments online?
                    </p>
                    <RadioGroup
                      value={form.portalAccess}
                      onValueChange={(v) =>
                        update("portalAccess", v as "yes" | "no")
                      }
                      className="flex rounded-xl border border-neutral-200 bg-neutral-100 p-1 gap-1 max-w-md"
                    >
                      {(["yes", "no"] as const).map((val) => {
                        const selected = form.portalAccess === val;
                        return (
                          <label
                            key={val}
                            className={cn(
                              "flex flex-1 cursor-pointer items-center justify-center rounded-lg px-4 py-3 text-sm font-medium transition-all",
                              selected
                                ? "bg-white text-neutral-900 shadow-sm"
                                : "text-neutral-600 hover:text-neutral-900",
                            )}
                          >
                            <RadioGroupItem
                              value={val}
                              id={`portal-${val}`}
                              className="sr-only"
                            />
                            <span className="capitalize">{val}</span>
                          </label>
                        );
                      })}
                    </RadioGroup>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8 space-y-6">
                  {submitError && (
                    <div
                      role="alert"
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                    >
                      {submitError}
                    </div>
                  )}
                  <h2 className="text-xl font-semibold text-neutral-900 md:text-2xl">
                    Privacy policy
                  </h2>
                  <div className="prose prose-sm max-w-none text-neutral-600 space-y-4">
                    <p>
                      We collect several types of information to provide and
                      improve our services to you. The types of data we collect
                      include:
                    </p>
                    <div>
                      <p className="font-medium text-neutral-800">
                        Personal information
                      </p>
                      <p className="mt-1">
                        While using our services, you may provide us with
                        certain personally identifiable information, such as:
                      </p>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Email address</li>
                        <li>First name and last name</li>
                        <li>Phone number</li>
                        <li>Address</li>
                        <li>State, province</li>
                        <li>ZIP / postal code</li>
                        <li>City</li>
                        <li>Social media profile information</li>
                        <li>Business details such as GST number</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-800">Usage data</p>
                      <p className="mt-1">
                        We collect information about how you use our website and
                        services, to enhance your experience on our website.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-800">Cookies</p>
                      <p className="mt-1">
                        We use cookies. You can control the use of cookies at
                        the individual browser level.
                      </p>
                    </div>
                    <p>
                      You can find the complete privacy policy here:{" "}
                      <a
                        href="https://wraptron.com/privacy-policy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-700"
                      >
                        https://wraptron.com/privacy-policy
                      </a>
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-8 flex items-center justify-between gap-4">
                <Button type="button" variant="outline" onClick={goBack}>
                  <ChevronLeft className="size-4" />
                  Back
                </Button>
                {step < MAX_STEP ? (
                  <Button type="button" onClick={goNext}>
                    Next
                    <ChevronRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => void handleComplete()}
                    disabled={submitting}
                  >
                    {submitting ? "Saving…" : "Complete onboarding"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
