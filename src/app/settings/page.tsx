"use client";

import React, { useState, useEffect } from "react";
import { usePageTitle } from "@/contexts/page-title-context";
import { useCurrency } from "@/contexts/currency-context";
import {
  githubApi,
  salesStagesApi,
  projectStatusesApi,
  invoiceSettingsApi,
  type GitHubConnection,
  type SalesStage,
  type ProjectStatus,
  type InvoiceSettings,
} from "@/lib/api";
import { SettingsProductCatalogTypes } from "@/components/settings-product-catalog-types";
import { SettingsWorkspaceSkills } from "@/components/settings-workspace-skills";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import {
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Github,
  DollarSign,
  TrendingUp,
  FolderKanban,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "next-themes";

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD"];
const UI_LOCALE_KEY = "wraptron-ui-locale";

export default function Settings() {
  const { setTitle } = usePageTitle();
  const { currency, setCurrency, formatCurrency } = useCurrency();
  const { theme, setTheme } = useTheme();
  const [themeReady, setThemeReady] = useState(false);
  const [uiLocale, setUiLocale] = useState("en");
  const [connections, setConnections] = useState<GitHubConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<GitHubConnection | null>(null);

  // Form states
  const [connectionName, setConnectionName] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Verification state
  const [verifying, setVerifying] = useState<number | null>(null);

  // Sales stages state
  const [stages, setStages] = useState<SalesStage[]>([]);
  const [stagesLoading, setStagesLoading] = useState(true);
  const [stageAddOpen, setStageAddOpen] = useState(false);
  const [stageEditOpen, setStageEditOpen] = useState(false);
  const [stageDeleteOpen, setStageDeleteOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<SalesStage | null>(null);
  const [stageName, setStageName] = useState("");
  const [stageFormLoading, setStageFormLoading] = useState(false);

  const [projectStatuses, setProjectStatuses] = useState<ProjectStatus[]>([]);
  const [projectStatusesLoading, setProjectStatusesLoading] = useState(true);
  const [projStatusAddOpen, setProjStatusAddOpen] = useState(false);
  const [projStatusEditOpen, setProjStatusEditOpen] = useState(false);
  const [projStatusDeleteOpen, setProjStatusDeleteOpen] = useState(false);
  const [selectedProjStatus, setSelectedProjStatus] =
    useState<ProjectStatus | null>(null);
  const [projStatusName, setProjStatusName] = useState("");
  const [projStatusFormLoading, setProjStatusFormLoading] = useState(false);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings | null>(null);
  const [invoiceSettingsForm, setInvoiceSettingsForm] = useState({
    company_name: "",
    company_address: "",
    company_gst: "",
    company_logo_url: "",
  });
  const [invoiceSettingsSaving, setInvoiceSettingsSaving] = useState(false);

  useEffect(() => {
    setTitle("Settings");
    return () => setTitle(null);
  }, [setTitle]);

  useEffect(() => {
    setThemeReady(true);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(UI_LOCALE_KEY);
      if (stored) setUiLocale(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const handleUiLocaleChange = (value: string) => {
    setUiLocale(value);
    try {
      localStorage.setItem(UI_LOCALE_KEY, value);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  useEffect(() => {
    const load = async () => {
      setStagesLoading(true);
      try {
        const res = await salesStagesApi.getAll();
        setStages(res.data ?? []);
      } catch {
        setStages([]);
      } finally {
        setStagesLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadInvoiceSettings = async () => {
      try {
        const data = await invoiceSettingsApi.get();
        setInvoiceSettings(data);
        setInvoiceSettingsForm({
          company_name: data?.company_name || "",
          company_address: data?.company_address || "",
          company_gst: data?.company_gst || "",
          company_logo_url: data?.company_logo_url || "",
        });
      } catch {
        // Best effort; keep form editable even if load fails.
      }
    };
    loadInvoiceSettings();
  }, []);

  useEffect(() => {
    const load = async () => {
      setProjectStatusesLoading(true);
      try {
        const res = await projectStatusesApi.getAll();
        setProjectStatuses(res.data ?? []);
      } catch {
        setProjectStatuses([]);
      } finally {
        setProjectStatusesLoading(false);
      }
    };
    load();
  }, []);

  const fetchConnections = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await githubApi.getConnections();
      setConnections(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch connections");
    } finally {
      setLoading(false);
    }
  };

  const handleAddConnection = async () => {
    if (!connectionName.trim() || !accessToken.trim()) {
      setError("Connection name and access token are required");
      return;
    }

    setFormLoading(true);
    setError(null);
    try {
      await githubApi.createConnection({
        connection_name: connectionName,
        access_token: accessToken,
      });
      setSuccessMessage("GitHub connection added successfully!");
      setAddDialogOpen(false);
      setConnectionName("");
      setAccessToken("");
      fetchConnections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add connection");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditConnection = async () => {
    if (!selectedConnection) return;

    setFormLoading(true);
    setError(null);
    try {
      const updateData: { connection_name?: string; access_token?: string } = {};
      if (connectionName.trim()) updateData.connection_name = connectionName;
      if (accessToken.trim()) updateData.access_token = accessToken;

      await githubApi.updateConnection(selectedConnection.id, updateData);
      setSuccessMessage("GitHub connection updated successfully!");
      setEditDialogOpen(false);
      setConnectionName("");
      setAccessToken("");
      setSelectedConnection(null);
      fetchConnections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update connection");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConnection = async () => {
    if (!selectedConnection) return;

    setFormLoading(true);
    setError(null);
    try {
      await githubApi.deleteConnection(selectedConnection.id);
      setSuccessMessage("GitHub connection deleted successfully!");
      setDeleteDialogOpen(false);
      setSelectedConnection(null);
      fetchConnections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete connection");
    } finally {
      setFormLoading(false);
    }
  };

  const handleVerifyConnection = async (connection: GitHubConnection) => {
    setVerifying(connection.id);
    setError(null);
    try {
      const result = await githubApi.verifyConnection(connection.id);
      if (result.success) {
        setSuccessMessage(`Connection verified! Connected as ${result.github_user}`);
        fetchConnections();
      } else {
        setError(result.error || "Verification failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify connection");
    } finally {
      setVerifying(null);
    }
  };

  const openEditDialog = (connection: GitHubConnection) => {
    setSelectedConnection(connection);
    setConnectionName(connection.connection_name);
    setAccessToken("");
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (connection: GitHubConnection) => {
    setSelectedConnection(connection);
    setDeleteDialogOpen(true);
  };

  const fetchStages = async () => {
    try {
      const res = await salesStagesApi.getAll();
      setStages(res.data ?? []);
    } catch {
      setStages([]);
    }
  };

  const handleAddStage = async () => {
    if (!stageName.trim()) {
      setError("Stage name is required");
      return;
    }
    setStageFormLoading(true);
    setError(null);
    try {
      await salesStagesApi.create({ name: stageName.trim(), sort_order: stages.length });
      setSuccessMessage("Sales stage added.");
      setStageAddOpen(false);
      setStageName("");
      fetchStages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add stage");
    } finally {
      setStageFormLoading(false);
    }
  };

  const handleEditStage = async () => {
    if (!selectedStage) return;
    if (!stageName.trim()) {
      setError("Stage name is required");
      return;
    }
    setStageFormLoading(true);
    setError(null);
    try {
      await salesStagesApi.update(selectedStage.id, { name: stageName.trim() });
      setSuccessMessage("Sales stage updated.");
      setStageEditOpen(false);
      setStageName("");
      setSelectedStage(null);
      fetchStages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update stage");
    } finally {
      setStageFormLoading(false);
    }
  };

  const handleDeleteStage = async () => {
    if (!selectedStage) return;
    setStageFormLoading(true);
    setError(null);
    try {
      await salesStagesApi.delete(selectedStage.id);
      setSuccessMessage("Sales stage deleted.");
      setStageDeleteOpen(false);
      setSelectedStage(null);
      fetchStages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete stage");
    } finally {
      setStageFormLoading(false);
    }
  };

  const openEditStage = (s: SalesStage) => {
    setSelectedStage(s);
    setStageName(s.name);
    setStageEditOpen(true);
  };

  const openDeleteStage = (s: SalesStage) => {
    setSelectedStage(s);
    setStageDeleteOpen(true);
  };

  const fetchProjectStatuses = async () => {
    try {
      const res = await projectStatusesApi.getAll();
      setProjectStatuses(res.data ?? []);
    } catch {
      setProjectStatuses([]);
    }
  };

  const handleAddProjStatus = async () => {
    if (!projStatusName.trim()) {
      setError("Status name is required");
      return;
    }
    setProjStatusFormLoading(true);
    setError(null);
    try {
      await projectStatusesApi.create({
        name: projStatusName.trim(),
        sort_order: projectStatuses.length,
      });
      setSuccessMessage("Project status added.");
      setProjStatusAddOpen(false);
      setProjStatusName("");
      fetchProjectStatuses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add status");
    } finally {
      setProjStatusFormLoading(false);
    }
  };

  const handleEditProjStatus = async () => {
    if (!selectedProjStatus) return;
    if (!projStatusName.trim()) {
      setError("Status name is required");
      return;
    }
    setProjStatusFormLoading(true);
    setError(null);
    try {
      await projectStatusesApi.update(selectedProjStatus.id, {
        name: projStatusName.trim(),
      });
      setSuccessMessage("Project status updated.");
      setProjStatusEditOpen(false);
      setProjStatusName("");
      setSelectedProjStatus(null);
      fetchProjectStatuses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setProjStatusFormLoading(false);
    }
  };

  const handleDeleteProjStatus = async () => {
    if (!selectedProjStatus) return;
    setProjStatusFormLoading(true);
    setError(null);
    try {
      await projectStatusesApi.delete(selectedProjStatus.id);
      setSuccessMessage("Project status deleted.");
      setProjStatusDeleteOpen(false);
      setSelectedProjStatus(null);
      fetchProjectStatuses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete status");
    } finally {
      setProjStatusFormLoading(false);
    }
  };

  const openEditProjStatus = (s: ProjectStatus) => {
    setSelectedProjStatus(s);
    setProjStatusName(s.name);
    setProjStatusEditOpen(true);
  };

  const openDeleteProjStatus = (s: ProjectStatus) => {
    setSelectedProjStatus(s);
    setProjStatusDeleteOpen(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return "Invalid date";
    }
  };

  const handleSaveInvoiceSettings = async () => {
    if (
      !invoiceSettingsForm.company_name.trim() ||
      !invoiceSettingsForm.company_address.trim() ||
      !invoiceSettingsForm.company_gst.trim()
    ) {
      setError("Invoice company name, address and GST are required");
      return;
    }
    setInvoiceSettingsSaving(true);
    setError(null);
    try {
      const saved = await invoiceSettingsApi.update({
        company_name: invoiceSettingsForm.company_name.trim(),
        company_address: invoiceSettingsForm.company_address.trim(),
        company_gst: invoiceSettingsForm.company_gst.trim(),
        company_logo_url: invoiceSettingsForm.company_logo_url.trim() || undefined,
      });
      setInvoiceSettings(saved);
      setSuccessMessage("Invoice company settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save invoice settings");
    } finally {
      setInvoiceSettingsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Success Message */}
        {successMessage && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Profile menu: Appearance, Language, Timezone */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription className="mt-2">
              Display, language, and time settings for your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div id="appearance" className="scroll-mt-28 space-y-3">
              <div>
                <h3 className="text-sm font-medium text-foreground">Appearance</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose how Wraptron looks on this device.
                </p>
              </div>
              {!themeReady ? (
                <p className="text-sm text-muted-foreground">Loading theme…</p>
              ) : (
                <RadioGroup
                  value={theme ?? "system"}
                  onValueChange={setTheme}
                  className="grid gap-3"
                >
                  <label
                    htmlFor="theme-light"
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 cursor-pointer hover:bg-accent/50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
                  >
                    <RadioGroupItem value="light" id="theme-light" />
                    <Sun className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium">Light mode</span>
                  </label>
                  <label
                    htmlFor="theme-dark"
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 cursor-pointer hover:bg-accent/50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
                  >
                    <RadioGroupItem value="dark" id="theme-dark" />
                    <Moon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium">Dark mode</span>
                  </label>
                  <label
                    htmlFor="theme-system"
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 cursor-pointer hover:bg-accent/50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
                  >
                    <RadioGroupItem value="system" id="theme-system" />
                    <Monitor className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium">System</span>
                  </label>
                </RadioGroup>
              )}
            </div>
            <div id="language" className="scroll-mt-28 space-y-3">
              <div>
                <h3 className="text-sm font-medium text-foreground">Language</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Interface language for menus and labels.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ui-language">Interface language</Label>
                <Select value={uiLocale} onValueChange={handleUiLocaleChange}>
                  <SelectTrigger id="ui-language" className="w-full max-w-xs">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div id="timezone" className="scroll-mt-28 space-y-2">
              <h3 className="text-sm font-medium text-foreground">Timezone</h3>
              <p className="text-sm text-muted-foreground">
                Default timezone for dates and schedules will be available here.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Currency Settings Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              <CardTitle>Currency Settings</CardTitle>
            </div>
            <CardDescription className="mt-2">
              Set your preferred currency for displaying monetary values throughout the application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Default Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency" className="w-[200px]">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((curr) => (
                      <SelectItem key={curr} value={curr}>
                        {curr} - {formatCurrency(1000, curr)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Example: {formatCurrency(1000)} (1,000 in your selected currency)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Invoice Company Settings</CardTitle>
            <CardDescription className="mt-2">
              These details are used in invoice header and tax invoice output.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoice-company-name">Company name *</Label>
                <Input
                  id="invoice-company-name"
                  value={invoiceSettingsForm.company_name}
                  onChange={(e) =>
                    setInvoiceSettingsForm((p) => ({ ...p, company_name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice-company-gst">GST *</Label>
                <Input
                  id="invoice-company-gst"
                  value={invoiceSettingsForm.company_gst}
                  onChange={(e) =>
                    setInvoiceSettingsForm((p) => ({ ...p, company_gst: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="invoice-company-address">Address *</Label>
                <Textarea
                  id="invoice-company-address"
                  rows={3}
                  value={invoiceSettingsForm.company_address}
                  onChange={(e) =>
                    setInvoiceSettingsForm((p) => ({ ...p, company_address: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="invoice-company-logo-url">Logo URL</Label>
                <Input
                  id="invoice-company-logo-url"
                  placeholder="https://... or data:image/png;base64,..."
                  value={invoiceSettingsForm.company_logo_url}
                  onChange={(e) =>
                    setInvoiceSettingsForm((p) => ({ ...p, company_logo_url: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button onClick={handleSaveInvoiceSettings} disabled={invoiceSettingsSaving}>
                {invoiceSettingsSaving ? "Saving..." : "Save invoice settings"}
              </Button>
              {invoiceSettings?.updated_at && (
                <span className="text-sm text-gray-500">
                  Last updated: {formatDate(invoiceSettings.updated_at)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <SettingsProductCatalogTypes />

        <SettingsWorkspaceSkills />

        {/* Sales Stages Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Sales stages
                </CardTitle>
                <CardDescription className="mt-2">
                  Manage deal stages used in the sales pipeline (e.g. lead, qualified, won, lost)
                </CardDescription>
              </div>
              <Button onClick={() => { setStageName(""); setStageAddOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add stage
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stagesLoading ? (
              <div className="text-center py-8">Loading stages...</div>
            ) : stages.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                No stages yet. Add one to customize your pipeline.
              </div>
            ) : (
              <div className="rounded-md border bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stages.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>{s.sort_order}</TableCell>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditStage(s)}>
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteStage(s)}
                              className="text-red-600 hover:text-red-700"
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

        {/* Project statuses Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5" />
                  Project statuses
                </CardTitle>
                <CardDescription className="mt-2">
                  Manage project statuses for the projects list, kanban board, and create form
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  setProjStatusName("");
                  setProjStatusAddOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add status
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {projectStatusesLoading ? (
              <div className="text-center py-8">Loading statuses...</div>
            ) : projectStatuses.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                No statuses yet. Add one to customize your project pipeline.
              </div>
            ) : (
              <div className="rounded-md border bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectStatuses.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>{s.sort_order}</TableCell>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditProjStatus(s)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteProjStatus(s)}
                              className="text-red-600 hover:text-red-700"
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

        {/* GitHub Connections Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  GitHub Connections
                </CardTitle>
                <CardDescription className="mt-2">
                  Manage global GitHub connections to link repositories with your projects
                </CardDescription>
              </div>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Connection
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading connections...</div>
            ) : connections.length === 0 ? (
              <div className="text-center py-12">
                <Github className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No GitHub connections</h3>
                <p className="text-gray-600 mb-4">
                  Add a GitHub connection to start linking repositories to your projects
                </p>
                <Button onClick={() => setAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Connection
                </Button>
              </div>
            ) : (
              <div className="rounded-md border bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Connection Name</TableHead>
                      <TableHead>GitHub User</TableHead>
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
                          <div className="flex items-center gap-2">
                            {connection.github_user ? (
                              <>
                                <span>{connection.github_user}</span>
                                {connection.github_email && (
                                  <span className="text-sm text-gray-500">
                                    ({connection.github_email})
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-400">Not verified</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              connection.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {connection.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(connection.last_verified_at)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerifyConnection(connection)}
                              disabled={verifying === connection.id}
                            >
                              <RefreshCw
                                className={`h-4 w-4 ${
                                  verifying === connection.id ? "animate-spin" : ""
                                }`}
                              />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(connection)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteDialog(connection)}
                              className="text-red-600 hover:text-red-700"
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

        {/* Help Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How to create a GitHub Personal Access Token</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Go to GitHub Settings → Developer settings → Personal access tokens</li>
              <li>Click "Generate new token (classic)"</li>
              <li>
                Give it a descriptive name and select the following scopes:
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li><code className="bg-gray-100 px-1 py-0.5 rounded">repo</code> - Full control of private repositories</li>
                  <li><code className="bg-gray-100 px-1 py-0.5 rounded">read:user</code> - Read user profile data</li>
                  <li><code className="bg-gray-100 px-1 py-0.5 rounded">project</code> - Full control of user projects (required for GitHub Projects integration)</li>
                  <li><code className="bg-gray-100 px-1 py-0.5 rounded">read:org</code> - Read org and team membership (if using organization projects)</li>
                </ul>
              </li>
              <li>Click "Generate token" and copy the token immediately (you won't see it again)</li>
              <li>Paste the token here when creating a new connection</li>
            </ol>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-1">💡 Note about GitHub Projects:</p>
              <p className="text-xs text-blue-800">
                GitHub Projects (V2) are different from repositories. You need to create them separately at{" "}
                <a href="https://github.com/users/YOUR_USERNAME/projects/new" target="_blank" rel="noopener noreferrer" className="underline">
                  github.com/users/YOUR_USERNAME/projects/new
                </a>
                . Make sure your token has the <code className="bg-blue-100 px-1 py-0.5 rounded">project</code> scope to access them.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Add Connection Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add GitHub Connection</DialogTitle>
              <DialogDescription>
                Connect your GitHub account to link repositories with projects
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="connection-name">Connection Name</Label>
                <Input
                  id="connection-name"
                  placeholder="e.g., My GitHub Account"
                  value={connectionName}
                  onChange={(e) => setConnectionName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="access-token">Personal Access Token</Label>
                <Input
                  id="access-token"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Your token will be encrypted and stored securely
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAddDialogOpen(false);
                  setConnectionName("");
                  setAccessToken("");
                }}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleAddConnection} disabled={formLoading}>
                {formLoading ? "Adding..." : "Add Connection"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Connection Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit GitHub Connection</DialogTitle>
              <DialogDescription>
                Update connection name or access token
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-connection-name">Connection Name</Label>
                <Input
                  id="edit-connection-name"
                  placeholder="e.g., My GitHub Account"
                  value={connectionName}
                  onChange={(e) => setConnectionName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-access-token">
                  New Personal Access Token (optional)
                </Label>
                <Input
                  id="edit-access-token"
                  type="password"
                  placeholder="Leave empty to keep existing token"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setConnectionName("");
                  setAccessToken("");
                  setSelectedConnection(null);
                }}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleEditConnection} disabled={formLoading}>
                {formLoading ? "Updating..." : "Update Connection"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Connection Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete GitHub Connection</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedConnection?.connection_name}"?
                This will also remove all repository links using this connection.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setSelectedConnection(null);
                }}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConnection}
                disabled={formLoading}
              >
                {formLoading ? "Deleting..." : "Delete Connection"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Sales Stage Dialog */}
        <Dialog open={stageAddOpen} onOpenChange={setStageAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add sales stage</DialogTitle>
              <DialogDescription>
                Add a new stage to your sales pipeline (e.g. lead, qualified, won).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="stage-name">Name</Label>
                <Input
                  id="stage-name"
                  placeholder="e.g. discovery"
                  value={stageName}
                  onChange={(e) => setStageName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setStageAddOpen(false); setStageName(""); }} disabled={stageFormLoading}>
                Cancel
              </Button>
              <Button onClick={handleAddStage} disabled={stageFormLoading || !stageName.trim()}>
                {stageFormLoading ? "Adding..." : "Add stage"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Sales Stage Dialog */}
        <Dialog open={stageEditOpen} onOpenChange={setStageEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit sales stage</DialogTitle>
              <DialogDescription>
                Change the stage name. Deals using this stage will show the new name.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-stage-name">Name</Label>
                <Input
                  id="edit-stage-name"
                  value={stageName}
                  onChange={(e) => setStageName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setStageEditOpen(false); setStageName(""); setSelectedStage(null); }} disabled={stageFormLoading}>
                Cancel
              </Button>
              <Button onClick={handleEditStage} disabled={stageFormLoading || !stageName.trim()}>
                {stageFormLoading ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Sales Stage Dialog */}
        <Dialog open={stageDeleteOpen} onOpenChange={setStageDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete sales stage</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedStage?.name}"? Deals in this stage will keep the stage value but it may no longer appear in pipeline lists until you add a stage with the same name again.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setStageDeleteOpen(false); setSelectedStage(null); }} disabled={stageFormLoading}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteStage} disabled={stageFormLoading}>
                {stageFormLoading ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Project Status Dialog */}
        <Dialog open={projStatusAddOpen} onOpenChange={setProjStatusAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add project status</DialogTitle>
              <DialogDescription>
                Add a status used on the projects board (e.g. Draft, Active, Completed).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="proj-status-name">Name</Label>
                <Input
                  id="proj-status-name"
                  placeholder="e.g. In review"
                  value={projStatusName}
                  onChange={(e) => setProjStatusName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setProjStatusAddOpen(false);
                  setProjStatusName("");
                }}
                disabled={projStatusFormLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddProjStatus}
                disabled={projStatusFormLoading || !projStatusName.trim()}
              >
                {projStatusFormLoading ? "Adding..." : "Add status"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Project Status Dialog */}
        <Dialog open={projStatusEditOpen} onOpenChange={setProjStatusEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit project status</DialogTitle>
              <DialogDescription>
                Changing the name updates how it appears in dropdowns; existing projects keep the new label when they match.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-proj-status-name">Name</Label>
                <Input
                  id="edit-proj-status-name"
                  value={projStatusName}
                  onChange={(e) => setProjStatusName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setProjStatusEditOpen(false);
                  setProjStatusName("");
                  setSelectedProjStatus(null);
                }}
                disabled={projStatusFormLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditProjStatus}
                disabled={projStatusFormLoading || !projStatusName.trim()}
              >
                {projStatusFormLoading ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Project Status Dialog */}
        <Dialog open={projStatusDeleteOpen} onOpenChange={setProjStatusDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete project status</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedProjStatus?.name}"? Projects using this value will show it under Other until you edit them.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setProjStatusDeleteOpen(false);
                  setSelectedProjStatus(null);
                }}
                disabled={projStatusFormLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteProjStatus}
                disabled={projStatusFormLoading}
              >
                {projStatusFormLoading ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
