"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useOrganization } from "@/contexts/organization-context";
import {
  authApi,
  getApiErrorMessage,
  invitesApi,
  organizationsApi,
  setActiveOrgId,
  setAuthToken,
  type InvitePreview,
} from "@/lib/api";
import { buildNavAccess, defaultPostLoginPath } from "@/lib/nav-access";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function InviteShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
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
              {title}
            </h1>
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

function InviteSummary({ preview }: { preview: InvitePreview }) {
  const expires = new Date(preview.expires_at);
  const expiresLabel = Number.isNaN(expires.getTime())
    ? preview.expires_at
    : expires.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  return (
    <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm space-y-2">
      <p>
        <span className="text-muted-foreground">Organization:</span>{" "}
        <span className="font-medium">{preview.org_name}</span>
      </p>
      <p>
        <span className="text-muted-foreground">Role:</span>{" "}
        <span className="font-medium">{preview.role_name}</span>
      </p>
      <p>
        <span className="text-muted-foreground">Email:</span>{" "}
        <span className="font-medium">{preview.email}</span>
      </p>
      <p className="text-muted-foreground text-xs">Expires {expiresLabel}</p>
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
    >
      {message}
    </div>
  );
}

function PrimaryButton({
  children,
  loading,
  disabled,
  type = "button",
  onClick,
}: {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-blue-800"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    loading: authLoading,
    refreshUser,
  } = useAuth();
  const { refreshOrganizations } = useOrganization();

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    if (!token) {
      setPageError("This invite link is invalid.");
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    setPageError(null);
    try {
      const data = await invitesApi.preview(token);
      if (data.status !== "pending") {
        const reason =
          data.status === "revoked"
            ? "This invite has been revoked."
            : data.status === "accepted"
              ? "This invite has already been accepted."
              : data.status === "expired"
                ? "This invite has expired."
                : "This invite is no longer valid.";
        setPageError(reason);
        setPreview(null);
        return;
      }

      const expiresAt = new Date(data.expires_at);
      if (!Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() < Date.now()) {
        setPageError("This invite has expired.");
        setPreview(null);
        return;
      }

      setPreview(data);
    } catch (err) {
      setPageError(
        getApiErrorMessage(err, "This invite link is invalid or unavailable."),
      );
      setPreview(null);
    } finally {
      setPageLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  const redirectAfterJoin = async (organizationId: number) => {
    setActiveOrgId(organizationId);
    const [meRes, orgsRes] = await Promise.all([
      authApi.getMe(),
      organizationsApi.getMine(),
    ]);
    await Promise.all([refreshUser(), refreshOrganizations()]);
    const joinedOrg = orgsRes.organizations.find(
      (o) => Number(o.id) === organizationId,
    );
    router.push(
      defaultPostLoginPath(
        buildNavAccess({
          permissions: joinedOrg?.permissions ?? [],
          isOwner:
            orgsRes.is_super_admin || joinedOrg?.role_type === "owner",
          globalRole: meRes.user.role,
        }),
      ),
    );
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !preview) return;
    setActionError(null);

    if (!password) {
      setActionError("Password is required.");
      return;
    }
    if (password.length < 6) {
      setActionError("Password must be at least 6 characters long.");
      return;
    }

    setActionLoading(true);
    try {
      const result = await invitesApi.signup(token, {
        name: name.trim() || undefined,
        password,
      });
      setAuthToken(result.token);
      await redirectAfterJoin(result.organization_id);
    } catch (err) {
      setActionError(
        getApiErrorMessage(err, "Could not create your account. Please try again."),
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview) return;
    setActionError(null);

    if (!loginPassword) {
      setActionError("Password is required.");
      return;
    }

    setActionLoading(true);
    try {
      const result = await authApi.login({
        email: preview.email,
        password: loginPassword,
      });
      setAuthToken(result.token);
      await refreshUser();
      setLoginPassword("");
    } catch (err) {
      setActionError(
        getApiErrorMessage(err, "Invalid email or password. Please try again."),
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!token) return;
    setActionError(null);
    setActionLoading(true);
    try {
      const result = await invitesApi.accept(token);
      await redirectAfterJoin(result.organization_id);
    } catch (err) {
      setActionError(
        getApiErrorMessage(err, "Could not accept this invite. Please try again."),
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (pageLoading || authLoading) {
    return (
      <InviteShell title="Organization invite">
        <div className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </InviteShell>
    );
  }

  if (pageError) {
    return (
      <InviteShell title="Invite unavailable">
        <ErrorAlert message={pageError} />
        <p className="text-sm text-muted-foreground">
          Ask your organization owner to send a new invite if you still need access.
        </p>
      </InviteShell>
    );
  }

  if (!preview) {
    return null;
  }

  if (preview.flow_type === "signup") {
    return (
      <InviteShell title="Join your organization">
        <InviteSummary preview={preview} />
        {actionError && <ErrorAlert message={actionError} />}
        <form className="space-y-4 md:space-y-6" onSubmit={handleSignup}>
          <div className="space-y-2">
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={preview.email}
              readOnly
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <PrimaryButton type="submit" loading={actionLoading}>
            Create account and join
          </PrimaryButton>
        </form>
      </InviteShell>
    );
  }

  return (
    <InviteShell title="Accept organization invite">
      <InviteSummary preview={preview} />
      {actionError && <ErrorAlert message={actionError} />}
      {isAuthenticated ? (
        user?.email.toLowerCase() !== preview.email.toLowerCase() ? (
          <div className="space-y-4">
            <ErrorAlert
              message={`This invite is for ${preview.email}, but you're signed in as ${user?.email}. Log out and sign in with the invited account to accept.`}
            />
            <PrimaryButton
              onClick={() => {
                setAuthToken(null);
                void refreshUser();
              }}
            >
              Log out
            </PrimaryButton>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You&apos;re signed in. Accept this invite to join{" "}
              <span className="font-medium text-foreground">{preview.org_name}</span>{" "}
              as <span className="font-medium text-foreground">{preview.role_name}</span>.
            </p>
            <PrimaryButton loading={actionLoading} onClick={() => void handleAccept()}>
              Accept invite
            </PrimaryButton>
          </div>
        )
      ) : (
        <form className="space-y-4 md:space-y-6" onSubmit={handleLogin}>
          <p className="text-sm text-muted-foreground">
            Sign in with your existing account to accept this invite.
          </p>
          <div className="space-y-2">
            <Label htmlFor="login-email">Your email</Label>
            <Input
              id="login-email"
              type="email"
              value={preview.email}
              readOnly
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <PrimaryButton type="submit" loading={actionLoading}>
            Sign in
          </PrimaryButton>
        </form>
      )}
    </InviteShell>
  );
}
