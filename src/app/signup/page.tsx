"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Signup() {
  const router = useRouter();
  const { signup, isAuthenticated, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="flex min-h-screen flex-col items-center justify-center px-6 py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </main>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      return;
    }

    if (!formData.companyName.trim()) {
      setError("Company / Workspace name is required");
      return;
    }

    if (!formData.phoneNumber) {
      setError("Phone number is required");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!formData.acceptTerms) {
      setError("You must accept the terms and conditions");
      return;
    }

    try {
      setLoading(true);
      await signup(
        formData.email,
        formData.password,
        formData.firstName || undefined,
        formData.lastName || undefined,
        undefined,
        formData.phoneNumber || undefined,
        formData.companyName.trim(),
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" &&
              err !== null &&
              "data" in err &&
              typeof (err as { data?: { error?: string } }).data?.error ===
                "string"
            ? (err as { data: { error: string } }).data.error
            : "Failed to create account. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen flex-col items-center justify-center px-6 py-8 lg:py-0">
        <a
          href="/"
          className="mb-6 flex items-center text-2xl font-semibold text-foreground"
        >
          <Image
            width={250}
            height={40}
            src="/wordmark.svg"
            alt="Wraptron"
            className="dark:brightness-0 dark:invert"
          />
        </a>
        <div className="w-full rounded-lg border border-border bg-card text-card-foreground shadow-sm sm:max-w-md">
          <div className="space-y-4 p-6 text-start sm:p-8 md:space-y-6">
            <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl">
              Create an account
            </h1>
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}
            <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  type="text"
                  name="firstName"
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  type="text"
                  name="lastName"
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  placeholder="Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company / Workspace Name</Label>
                <Input
                  type="text"
                  name="companyName"
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  placeholder="Acme Solutions"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Your email</Label>
                <Input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="name@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  type="tel"
                  name="phoneNumber"
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  placeholder="+1234567890"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  type="password"
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  type="password"
                  name="confirm-password"
                  id="confirm-password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <div className="flex items-start gap-3">
                <input
                  id="terms"
                  aria-describedby="terms"
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      acceptTerms: e.target.checked,
                    })
                  }
                  className={cn(
                    "mt-0.5 size-4 shrink-0 rounded border border-input bg-background",
                    "text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  )}
                  required
                />
                <Label
                  htmlFor="terms"
                  className="cursor-pointer font-normal text-muted-foreground"
                >
                  I accept the{" "}
                  <a
                    className="font-medium text-primary hover:underline"
                    href="https://www.wraptron.com/privacy-policy/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Terms and Conditions
                  </a>
                </Label>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-blue-800"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Create an account
              </button>
              <p className="text-sm font-light text-muted-foreground">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Login
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
