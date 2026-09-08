"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { PageShell } from "@/components/page-shell";
import { usePageTitle } from "@/contexts/page-title-context";
import {
  domainsApi,
  getApiErrorMessage,
  whoisApi,
  type SavedDomain,
  type WhoisLookupResponse,
} from "@/lib/api";

function formatTimestamp(value: string | null | undefined): string {
  if (!value?.trim()) return "—";
  const trimmed = value.trim();
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return trimmed;
  const hasTime =
    /T\d{1,2}:\d{2}/.test(trimmed) || /\d{1,2}:\d{2}(:\d{2})?/.test(trimmed);
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    ...(hasTime ? { timeStyle: "short" as const } : {}),
  });
}

function savedToLookup(row: SavedDomain): WhoisLookupResponse {
  return {
    domain: row.domain,
    parsed: {
      registrar: row.registrar,
      registrarUrl: row.registrar_url,
      creationDate: row.creation_date,
      expiryDate: row.expiry_date,
      updatedDate: row.updated_date,
      status: row.status ?? [],
      nameServers: row.name_servers ?? [],
      registrantOrg: row.registrant_org,
      registrantCountry: row.registrant_country,
      dnssec: row.dnssec,
    },
    raw: row.raw ?? "",
    checkedAt: row.checked_at,
  };
}

function Field({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm break-all">{value?.trim() ? value : "—"}</dd>
    </div>
  );
}

export default function WhoisPage() {
  const { setTitle } = usePageTitle();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WhoisLookupResponse | null>(null);
  const [saved, setSaved] = useState<SavedDomain[]>([]);
  const [savedError, setSavedError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const loadSaved = useCallback(async () => {
    try {
      const { data } = await domainsApi.list();
      setSavedError(null);
      setSaved(data);
    } catch (err) {
      setSavedError(getApiErrorMessage(err, "Failed to load saved domains"));
    }
  }, []);

  useEffect(() => {
    setTitle("Domain Logger");
    return () => setTitle(null);
  }, [setTitle]);

  useEffect(() => {
    void loadSaved();
  }, [loadSaved]);

  const alreadySaved = useMemo(() => {
    if (!result) return false;
    return saved.some(
      (row) => row.domain.toLowerCase() === result.domain.toLowerCase(),
    );
  }, [result, saved]);

  async function lookup(event?: React.FormEvent) {
    event?.preventDefault();
    const domain = query.trim();
    if (!domain) {
      setError("Enter a domain to look up");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await whoisApi.lookup(domain);
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(getApiErrorMessage(err, "WHOIS lookup failed"));
    } finally {
      setLoading(false);
    }
  }

  async function saveResult() {
    if (!result || alreadySaved) return;
    setSaving(true);
    setError(null);
    try {
      const row = await domainsApi.save(result);
      setSaved((current) => [
        row,
        ...current.filter((item) => item.id !== row.id),
      ]);
      setSavedError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save domain"));
    } finally {
      setSaving(false);
    }
  }

  async function removeSaved(id: string) {
    const previous = saved;
    const removed = saved.find((row) => row.id === id);
    setSaved((current) => current.filter((row) => row.id !== id));
    setSavedError(null);
    if (
      removed &&
      result?.domain.toLowerCase() === removed.domain.toLowerCase()
    ) {
      setResult(null);
    }
    try {
      await domainsApi.remove(id);
    } catch (err) {
      setSaved(previous);
      setSavedError(getApiErrorMessage(err, "Failed to remove domain"));
    }
  }

  function closeResult() {
    setResult(null);
    setError(null);
  }

  function openSaved(row: SavedDomain) {
    setError(null);
    setQuery(row.domain);
    setResult(savedToLookup(row));
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  useEffect(() => {
    if (!result) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeResult();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [result]);

  const parsed = result?.parsed;

  return (
    <PageShell>
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Domain WHOIS lookup
        </h1>
        <p className="text-sm text-muted-foreground">
          Look up registration details, then save domains you want to keep.
        </p>
      </div>

      <form onSubmit={lookup} className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1 space-y-2">
          <Label htmlFor="domain">Domain</Label>
          <Input
            id="domain"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="example.com"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Search />
            )}
            Lookup
          </Button>
        </div>
      </form>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {result && parsed ? (
        <Card ref={resultRef}>
          <CardHeader className="border-b">
            <CardTitle className="text-xl">{result.domain}</CardTitle>
            <CardDescription>
              Checked {formatTimestamp(result.checkedAt)}
            </CardDescription>
            <CardAction>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Close lookup result"
                onClick={closeResult}
              >
                <X />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Registrar" value={parsed.registrar} />
              <Field label="Registrar URL" value={parsed.registrarUrl} />
              <Field
                label="Creation date"
                value={formatTimestamp(parsed.creationDate)}
              />
              <Field
                label="Expiry date"
                value={formatTimestamp(parsed.expiryDate)}
              />
              <Field
                label="Updated date"
                value={formatTimestamp(parsed.updatedDate)}
              />
              <Field label="DNSSEC" value={parsed.dnssec} />
              <Field
                label="Registrant organization"
                value={parsed.registrantOrg}
              />
              <Field
                label="Registrant country"
                value={parsed.registrantCountry}
              />
            </dl>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Status
              </p>
              {parsed.status.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {parsed.status.map((status) => (
                    <Badge key={status} variant="secondary">
                      {status}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm">—</p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Name servers
              </p>
              {parsed.nameServers.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {parsed.nameServers.map((ns) => (
                    <li key={ns} className="font-mono text-xs sm:text-sm">
                      {ns}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm">—</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t justify-between gap-2">
            <Button
              type="button"
              onClick={() => void saveResult()}
              disabled={alreadySaved || saving}
            >
              {saving ? <Loader2 className="animate-spin" /> : null}
              {alreadySaved ? "Saved" : "Save"}
            </Button>
            <Button type="button" variant="outline" onClick={closeResult}>
              Close
            </Button>
          </CardFooter>
        </Card>
      ) : null}

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Saved domains</h2>
          <p className="text-sm text-muted-foreground">
            Stored lookups, newest first.
          </p>
        </div>
        {savedError ? (
          <p className="text-sm text-destructive" role="alert">
            {savedError}
          </p>
        ) : null}
        {saved.length === 0 && !savedError ? (
          <p className="text-sm text-muted-foreground">No saved domains yet.</p>
        ) : (
          <ul className="space-y-2">
            {saved.map((row) => {
              const isOpen =
                result?.domain.toLowerCase() === row.domain.toLowerCase();
              return (
              <li key={row.id}>
                <Card
                  className={cn(
                    "py-4 cursor-pointer transition-colors hover:bg-accent/40",
                    isOpen && "ring-1 ring-ring",
                  )}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isOpen}
                  onClick={() => openSaved(row)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openSaved(row);
                    }
                  }}
                >
                  <CardContent className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{row.domain}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.registrar ?? "Unknown registrar"}
                        {row.expiry_date
                          ? ` · expires ${formatTimestamp(row.expiry_date)}`
                          : ""}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        void removeSaved(row.id);
                      }}
                    >
                      <Trash2 />
                      Remove
                    </Button>
                  </CardContent>
                </Card>
              </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
    </PageShell>
  );
}
