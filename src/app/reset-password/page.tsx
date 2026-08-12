"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { authApi, getApiErrorMessage } from "@/lib/api";
import {
  validatePasswordMatch,
  validatePasswordStrength,
} from "@/lib/password-validation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const missingToken = !token;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Reset token is missing or invalid");
      return;
    }

    const strength = validatePasswordStrength(formData.newPassword);
    if (!strength.valid) {
      setError(strength.error);
      return;
    }

    const match = validatePasswordMatch(
      formData.newPassword,
      formData.confirmPassword,
    );
    if (!match.valid) {
      setError(match.error);
      return;
    }

    try {
      setLoading(true);
      await authApi.resetPassword({
        token,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      setSuccess(true);
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to reset password. The link may be invalid or expired.",
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
              {success ? "Password reset" : "Set a new password"}
            </h1>

            {missingToken && !success && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                This reset link is missing a token. Request a new password reset
                from the login page.
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            {success ? (
              <div className="space-y-4">
                <div
                  role="status"
                  className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-foreground"
                >
                  Your password has been reset successfully. You can now sign in
                  with your new password.
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
                >
                  Go to sign in
                </button>
              </div>
            ) : (
              !missingToken && (
                <form
                  className="space-y-4 md:space-y-6"
                  onSubmit={handleSubmit}
                >
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="newPassword"
                        id="newPassword"
                        value={formData.newPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            newPassword: e.target.value,
                          })
                        }
                        placeholder="••••••••"
                        className="pr-10"
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm password</Label>
                    <div className="relative">
                      <Input
                        type={showConfirm ? "text" : "password"}
                        name="confirmPassword"
                        id="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value,
                          })
                        }
                        placeholder="••••••••"
                        className="pr-10"
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                        aria-label={
                          showConfirm ? "Hide password" : "Show password"
                        }
                      >
                        {showConfirm ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-blue-800"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Reset password
                  </button>
                </form>
              )
            )}

            {!success && (
              <p className="text-sm font-light text-muted-foreground">
                <a
                  href="/forgot-password"
                  className="font-medium text-primary hover:underline"
                >
                  Request a new reset link
                </a>
                {" · "}
                <a
                  href="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Back to sign in
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background text-foreground">
          <div className="flex min-h-screen flex-col items-center justify-center px-6 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
