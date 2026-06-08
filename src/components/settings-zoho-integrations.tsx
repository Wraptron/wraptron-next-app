"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  zohoApi,
  type ZohoBooksOrganization,
  type ZohoConnection,
  type ZohoOAuthConfigResponse,
} from "@/lib/api";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  ExternalLink,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const formatDate = (dateString?: string | null) => {
  if (!dateString?.trim()) return "Never";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Never";
    return date.toLocaleString();
  } catch {
    return "Never";
  }
};

const zohoErrorMessages: Record<string, string> = {
  access_denied: "Zoho authorization was cancelled.",
  missing_code_or_state: "OAuth callback was missing required parameters.",
  invalid_state: "OAuth session expired. Please try connecting again.",
  not_configured: "Zoho OAuth is not configured on the server.",
  token_exchange_failed: "Failed to exchange authorization code for tokens.",
  callback_failed: "An unexpected error occurred during Zoho authorization.",
  invalid_client:
    "Zoho rejected the OAuth client. Confirm ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET match the same app in the Zoho API Console, and set ZOHO_ACCOUNTS_DOMAIN to your region (e.g. accounts.zoho.in for India, accounts.zoho.com for US). Then reconnect.",
  invalid_client_secret:
    "Zoho client secret is invalid. Copy a fresh Client Secret from the API Console into ZOHO_CLIENT_SECRET and restart the backend.",
};

function ZohoMark({ className }: { className?: string }) {
  return (
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-lg bg-[#E42527] text-sm font-bold text-white ${className ?? ""}`}
    >
      Z
    </div>
  );
}

export function SettingsZohoIntegrations() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [connections, setConnections] = useState<ZohoConnection[]>([]);
  const [oauthConfig, setOauthConfig] =
    useState<ZohoOAuthConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] =
    useState<ZohoConnection | null>(null);
  const [connectionName, setConnectionName] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [verifying, setVerifying] = useState<number | null>(null);
  const [orgDialogOpen, setOrgDialogOpen] = useState(false);
  const [orgOptions, setOrgOptions] = useState<ZohoBooksOrganization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [orgLoading, setOrgLoading] = useState(false);
  const [syncing, setSyncing] = useState<number | null>(null);

  const fetchConnections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [configRes, connectionsRes] = await Promise.all([
        zohoApi.getOAuthConfig(),
        zohoApi.getConnections(),
      ]);
      setOauthConfig(configRes);
      setConnections(connectionsRes.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load Zoho connections",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  useEffect(() => {
    const zohoStatus = searchParams.get("zoho");
    if (!zohoStatus) return;

    if (zohoStatus === "connected") {
      const name = searchParams.get("connection_name");
      setSuccessMessage(
        name
          ? `Zoho connection "${name}" connected successfully.`
          : "Zoho connected successfully.",
      );
      fetchConnections();
    } else if (zohoStatus === "error") {
      const messageKey = searchParams.get("message") ?? "callback_failed";
      setError(
        zohoErrorMessages[messageKey] ??
          `Zoho connection failed (${messageKey}).`,
      );
    }

    router.replace("/settings?section=integrations", { scroll: false });
  }, [searchParams, router, fetchConnections]);

  const handleConnect = async () => {
    const name = connectionName.trim();
    if (!name) {
      setError("Connection name is required.");
      return;
    }

    try {
      setFormLoading(true);
      setError(null);
      const { authorization_url } = await zohoApi.startOAuth({
        connection_name: name,
      });
      window.location.href = authorization_url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start Zoho authorization",
      );
      setFormLoading(false);
    }
  };

  const handleVerify = async (connection: ZohoConnection) => {
    try {
      setVerifying(connection.id);
      setError(null);
      const result = await zohoApi.verifyConnection(connection.id);
      if (result.success) {
        if (result.books_error) {
          setError(
            `Zoho account verified, but Books access failed: ${result.books_error}`,
          );
        } else {
          setSuccessMessage(
            result.books_organization_name
              ? `Zoho Books connected to "${result.books_organization_name}".`
              : "Zoho connection verified.",
          );
        }
        await fetchConnections();
      } else {
        setError(result.error ?? "Verification failed.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setVerifying(null);
    }
  };

  const openOrganizationDialog = async (connection: ZohoConnection) => {
    try {
      setSelectedConnection(connection);
      setSelectedOrgId(connection.books_organization_id ?? "");
      setOrgDialogOpen(true);
      setOrgLoading(true);
      setError(null);
      const response = await zohoApi.getBooksOrganizations(connection.id);
      setOrgOptions(response.data);
      if (!connection.books_organization_id && response.data.length === 1) {
        setSelectedOrgId(response.data[0].organization_id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load Zoho Books organizations",
      );
      setOrgDialogOpen(false);
    } finally {
      setOrgLoading(false);
    }
  };

  const handleSaveOrganization = async () => {
    if (!selectedConnection || !selectedOrgId) return;

    const organization = orgOptions.find(
      (org) => org.organization_id === selectedOrgId,
    );
    if (!organization) return;

    try {
      setOrgLoading(true);
      setError(null);
      await zohoApi.updateConnection(selectedConnection.id, {
        books_organization_id: organization.organization_id,
        books_organization_name: organization.name,
      });
      setSuccessMessage(`Zoho Books organization set to "${organization.name}".`);
      setOrgDialogOpen(false);
      setSelectedConnection(null);
      await fetchConnections();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save Zoho Books organization",
      );
    } finally {
      setOrgLoading(false);
    }
  };

  const handleSync = async (connection: ZohoConnection) => {
    try {
      setSyncing(connection.id);
      setError(null);
      const result = await zohoApi.syncConnection(connection.id);
      if (!result.success || !result.stats) {
        setError(result.message ?? result.error ?? "Zoho sync failed.");
        return;
      }
      const { customers, products, invoices } = result.stats;
      setSuccessMessage(
        `Sync complete — customers: ${customers.created} created, ${customers.updated} updated; products: ${products.created} created, ${products.updated} updated; invoices: ${invoices.created} created, ${invoices.updated} updated.`,
      );
      await fetchConnections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Zoho sync failed.");
    } finally {
      setSyncing(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedConnection) return;

    try {
      setFormLoading(true);
      setError(null);
      await zohoApi.deleteConnection(selectedConnection.id);
      setSuccessMessage("Zoho connection removed.");
      setDeleteDialogOpen(false);
      setSelectedConnection(null);
      await fetchConnections();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete connection",
      );
    } finally {
      setFormLoading(false);
    }
  };

  const redirectUri =
    oauthConfig?.redirect_uri ?? `${API_BASE_URL}/api/zoho/oauth/callback`;

  return (
    <>
      {successMessage && (
        <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/50">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50">
          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ZohoMark className="h-5 w-5 text-base" />
                Zoho Connections
              </CardTitle>
              <CardDescription className="mt-2">
                Connect Zoho Books via OAuth to access invoices, contacts, bills,
                and other Books data
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setConnectionName("");
                setConnectDialogOpen(true);
              }}
              disabled={!oauthConfig?.configured}
            >
              <Plus className="h-4 w-4 mr-2" />
              Connect Zoho
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!oauthConfig?.configured && !loading && (
            <Alert className="mb-4">
              <AlertDescription>
                Zoho OAuth is not configured on the server. Set{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  ZOHO_CLIENT_ID
                </code>{" "}
                and{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  ZOHO_CLIENT_SECRET
                </code>{" "}
                in the backend environment.
              </AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-12">
              <ZohoMark className="mx-auto mb-4 h-12 w-12 text-lg" />
              <h3 className="text-lg font-medium mb-2">No Zoho connections</h3>
              <p className="text-muted-foreground mb-4">
                Authorize Wraptron to access your Zoho Books account
              </p>
              <Button
                onClick={() => setConnectDialogOpen(true)}
                disabled={!oauthConfig?.configured}
              >
                <Plus className="h-4 w-4 mr-2" />
                Connect Your Zoho Account
              </Button>
            </div>
          ) : (
            <div className="rounded-md border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Connection Name</TableHead>
                    <TableHead>Zoho Account</TableHead>
                    <TableHead>Books Organization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Verified</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {connections.map((connection) => (
                    <TableRow key={connection.id}>
                      <TableCell className="font-medium">
                        {connection.connection_name}
                      </TableCell>
                      <TableCell>
                        {connection.zoho_display_name ||
                        connection.zoho_email ? (
                          <div>
                            {connection.zoho_display_name && (
                              <div>{connection.zoho_display_name}</div>
                            )}
                            {connection.zoho_email && (
                              <div className="text-sm text-muted-foreground">
                                {connection.zoho_email}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Not verified
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {connection.books_organization_name ? (
                          <div>
                            <div>{connection.books_organization_name}</div>
                            {connection.books_organization_id && (
                              <div className="text-sm text-muted-foreground">
                                ID: {connection.books_organization_id}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Not selected
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            connection.is_active
                              ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                              : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                          }
                        >
                          {connection.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(connection.last_verified_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSync(connection)}
                            disabled={
                              syncing === connection.id ||
                              !connection.books_organization_id
                            }
                          >
                            {syncing === connection.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Sync"
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openOrganizationDialog(connection)}
                          >
                            Org
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerify(connection)}
                            disabled={verifying === connection.id}
                          >
                            <RefreshCw
                              className={`h-4 w-4 ${
                                verifying === connection.id
                                  ? "animate-spin"
                                  : ""
                              }`}
                            />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedConnection(connection);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive hover:text-destructive/90"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to set up Zoho OAuth</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-foreground">
            <li>
              Open the{" "}
              <a
                href="https://api-console.zoho.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline"
              >
                Zoho API Console
                <ExternalLink className="h-3 w-3" />
              </a>{" "}
              and create a Server-based Application
            </li>
            <li>
              Add an Authorized Redirect URI (use one that matches your backend{" "}
              <code className="rounded bg-muted px-1 py-0.5">
                ZOHO_REDIRECT_URI
              </code>
              ):
              <code className="mt-1 block rounded bg-muted px-2 py-1 text-xs break-all">
                {redirectUri}
              </code>
              <span className="mt-1 block text-xs text-muted-foreground">
                Local dev options:{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  {API_BASE_URL}/api/zoho/oauth/callback
                </code>{" "}
                (backend) or{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  {typeof window !== "undefined"
                    ? window.location.origin
                    : "http://localhost:3000"}
                  /api/zoho/oauth/callback
                </code>{" "}
                (frontend proxy)
              </span>
            </li>
            <li>Copy the Client ID and Client Secret into the backend env</li>
            <li>
              Enable Zoho Books scopes for your client (the app requests Books
              API access, not Desk)
            </li>
            <li>
              If your Books account is on a regional data center (e.g.{" "}
              <code className="rounded bg-muted px-1 py-0.5">.in</code>,{" "}
              <code className="rounded bg-muted px-1 py-0.5">.eu</code>), set{" "}
              <code className="rounded bg-muted px-1 py-0.5">
                ZOHO_ACCOUNTS_DOMAIN
              </code>{" "}
              to match (e.g.{" "}
              <code className="rounded bg-muted px-1 py-0.5">
                accounts.zoho.in
              </code>
              )
            </li>
            <li>
              Click Connect Zoho above, authorize access, then choose your Books
              organization
            </li>
          </ol>
          {oauthConfig?.scopes && (
            <p className="mt-4 text-xs text-muted-foreground">
              Requested scopes: {oauthConfig.scopes}
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Zoho</DialogTitle>
            <DialogDescription>
              You will be redirected to Zoho to authorize Wraptron. Choose a
              name to identify this connection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="zoho-connection-name">Connection name</Label>
              <Input
                id="zoho-connection-name"
                placeholder="e.g. Production Zoho Books"
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConnect();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConnectDialogOpen(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleConnect} disabled={formLoading}>
              {formLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Redirecting…
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Continue to Zoho
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={orgDialogOpen} onOpenChange={setOrgDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Zoho Books organization</DialogTitle>
            <DialogDescription>
              Every Books API call requires an organization. Choose the
              organization Wraptron should use for{" "}
              {selectedConnection?.connection_name ?? "this connection"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {orgLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : orgOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No organizations returned. Verify the connection has Zoho Books
                scopes and reconnect if you previously authorized Desk only.
              </p>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="zoho-books-org">Organization</Label>
                <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                  <SelectTrigger id="zoho-books-org">
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {orgOptions.map((org) => (
                      <SelectItem
                        key={org.organization_id}
                        value={org.organization_id}
                      >
                        {org.name}
                        {org.currency_code ? ` (${org.currency_code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOrgDialogOpen(false)}
              disabled={orgLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveOrganization}
              disabled={orgLoading || !selectedOrgId}
            >
              {orgLoading ? "Saving…" : "Save organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Zoho connection</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &quot;
              {selectedConnection?.connection_name}&quot;? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={formLoading}
            >
              {formLoading ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
