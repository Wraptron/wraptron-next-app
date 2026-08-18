"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { authApi, getApiErrorMessage } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
    setSuccess(null);

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.forgotPassword({ email: email.trim() });
      setSuccess(
        res.message ||
          "If this email exists, a reset link has been sent",
      );
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to process password reset request. Please try again.",
        ),
      );
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
          <div className="space-y-4 p-6 sm:p-8 md:space-y-6">
            <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl">
              Forgot your password?
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email and we&apos;ll send you a link to reset your
              password if an account exists.
            </p>
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}
            {success && (
              <div
                role="status"
                className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-foreground"
              >
                {success}
              </div>
            )}
            {!success && (
              <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Your email</Label>
                  <Input
                    type="email"
                    name="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-blue-800"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send reset link
                </button>
              </form>
            )}
            <p className="text-sm font-light text-muted-foreground">
              <a
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Back to sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
