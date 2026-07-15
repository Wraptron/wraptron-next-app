"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Box,
  Users,
  Package,
  Briefcase,
  Search,
  LayoutDashboard,
  Building2,
  Handshake,
  UserCircle,
} from "lucide-react";
import {
  customersApi,
  productsApi,
  employeesApi,
  projectsApi,
  contactsApi,
  companiesApi,
  dealsApi,
} from "@/lib/api";
import { EMPLOYEES_BASE_PATH } from "@/lib/employee-routes";
import { filterAppSearchRoutes } from "@/lib/app-search-routes";
import { canAccessStaffRoutes } from "@/lib/nav-access";
import { useAuth } from "@/contexts/auth-context";

type ResultKind =
  | "page"
  | "deal"
  | "contact"
  | "company"
  | "customer"
  | "project"
  | "product"
  | "employee";

interface SearchResultItem {
  key: string;
  kind: ResultKind;
  title: string;
  subtitle?: string;
  url: string;
}

const KIND_ORDER: ResultKind[] = [
  "page",
  "deal",
  "contact",
  "company",
  "customer",
  "project",
  "product",
  "employee",
];

const REMOTE_MIN_QUERY_LEN = 2;

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [remoteResults, setRemoteResults] = React.useState<SearchResultItem[]>(
    [],
  );
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const staffAccess = canAccessStaffRoutes(user?.role);

  const pageResults: SearchResultItem[] = React.useMemo(() => {
    return filterAppSearchRoutes(query, { role: user?.role }).map((r) => ({
      key: `page-${r.href}`,
      kind: "page" as const,
      title: r.label,
      subtitle: r.section,
      url: r.href,
    }));
  }, [query, user?.role]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    if (!staffAccess || !query || query.trim().length < REMOTE_MIN_QUERY_LEN) {
      setRemoteResults([]);
      setLoading(false);
      return;
    }

    const q = query.trim();
    let cancelled = false;

    const searchRemote = async () => {
      setLoading(true);
      const found: SearchResultItem[] = [];

      const run = async <T,>(fn: () => Promise<T>) => {
        try {
          return await fn();
        } catch (e) {
          console.error("Global search request failed:", e);
          return null;
        }
      };

      const projectsRes = await run(() =>
        projectsApi.getAll({ search: q, limit: 5 }),
      );
      projectsRes?.data.forEach((project) => {
        found.push({
          key: `project-${project.id}`,
          kind: "project",
          title: project.project_name,
          subtitle: project.status,
          url: `/projects/${project.id}`,
        });
      });

      const customersRes = await run(() =>
        customersApi.getAll({ search: q, limit: 5 }),
      );
      customersRes?.data.forEach((customer) => {
        found.push({
          key: `customer-${customer.id}`,
          kind: "customer",
          title: customer.name,
          subtitle:
            customer.contact_email ||
            customer.contact_phone ||
            customer.customer_code,
          url: "/sales/customers",
        });
      });

      const productsRes = await run(() =>
        productsApi.getAll({ search: q, limit: 5 }),
      );
      productsRes?.data.forEach((product) => {
        found.push({
          key: `product-${product.id}`,
          kind: "product",
          title: product.part_name,
          subtitle: product.part_code,
          url: `/products/${product.id}`,
        });
      });

      const employeesRes = await run(() =>
        employeesApi.getAll({ search: q, limit: 5 }),
      );
      employeesRes?.data.forEach((employee) => {
        found.push({
          key: `employee-${employee.id}`,
          kind: "employee",
          title: `${employee.first_name} ${employee.last_name}`,
          subtitle: employee.email || employee.emp_code,
          url: `${EMPLOYEES_BASE_PATH}/${employee.id}`,
        });
      });

      const contactsRes = await run(() =>
        contactsApi.getAll({ search: q, limit: 5 }),
      );
      contactsRes?.data.forEach((contact) => {
        const name = [contact.first_name, contact.last_name]
          .filter(Boolean)
          .join(" ");
        found.push({
          key: `contact-${contact.id}`,
          kind: "contact",
          title: name || `Contact #${contact.id}`,
          subtitle: contact.email || contact.company || contact.phone,
          url: `/contacts/${contact.id}`,
        });
      });

      const companiesRes = await run(() =>
        companiesApi.getAll({ search: q, limit: 5 }),
      );
      companiesRes?.data.forEach((company) => {
        found.push({
          key: `company-${company.company_id}`,
          kind: "company",
          title: company.name,
          subtitle: company.industry || company.email || company.country,
          url: "/sales/companies",
        });
      });

      const dealsRes = await run(() =>
        dealsApi.getAll({ search: q, limit: 5 }),
      );
      dealsRes?.data.forEach((deal) => {
        found.push({
          key: `deal-${deal.id}`,
          kind: "deal",
          title: deal.title,
          subtitle:
            deal.stage ||
            deal.client_company_name ||
            deal.contact_name ||
            deal.status,
          url: `/sales/deals/${deal.id}`,
        });
      });

      if (!cancelled) {
        setRemoteResults(found);
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchRemote, 280);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [query, staffAccess]);

  const allResults = React.useMemo(
    () => [...pageResults, ...remoteResults],
    [pageResults, remoteResults],
  );

  const groupedResults = React.useMemo(() => {
    const acc = {} as Record<ResultKind, SearchResultItem[]>;
    for (const r of allResults) {
      if (!acc[r.kind]) acc[r.kind] = [];
      acc[r.kind].push(r);
    }
    return acc;
  }, [allResults]);

  const sortedGroupEntries = React.useMemo(() => {
    return KIND_ORDER.filter((k) => groupedResults[k]?.length).map(
      (k) => [k, groupedResults[k]] as const,
    );
  }, [groupedResults]);

  const handleSelect = (item: SearchResultItem) => {
    router.push(item.url);
    setOpen(false);
    setQuery("");
    setRemoteResults([]);
  };

  const getIcon = (kind: ResultKind) => {
    switch (kind) {
      case "page":
        return <LayoutDashboard className="h-4 w-4" />;
      case "project":
        return <Box className="h-4 w-4" />;
      case "customer":
        return <Users className="h-4 w-4" />;
      case "product":
        return <Package className="h-4 w-4" />;
      case "employee":
        return <Briefcase className="h-4 w-4" />;
      case "contact":
        return <UserCircle className="h-4 w-4" />;
      case "company":
        return <Building2 className="h-4 w-4" />;
      case "deal":
        return <Handshake className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (kind: ResultKind) => {
    switch (kind) {
      case "page":
        return "Pages";
      case "deal":
        return "Deals";
      case "contact":
        return "Contacts";
      case "company":
        return "Companies";
      case "customer":
        return "Customers";
      case "project":
        return "Projects";
      case "product":
        return "Products";
      case "employee":
        return "Employees";
      default:
        return "Results";
    }
  };

  const showRemoteHint =
    query.trim().length === 1 && pageResults.length === 0 && !loading;

  const showEmpty =
    !loading &&
    query.trim().length >= REMOTE_MIN_QUERY_LEN &&
    allResults.length === 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground border border-border rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Search…</span>
        <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) {
            setQuery("");
            setRemoteResults([]);
          }
        }}
        title="Search the app"
        description="Jump to any page or find CRM records, projects, products, and people."
        showCloseButton={false}
        shouldFilter={false}
      >
        <div className="relative">
          <div className="[&_[data-slot=command-input-wrapper]]:pr-16">
            <CommandInput
              placeholder="Pages, deals, contacts, companies, projects, products…"
              value={query}
              onValueChange={setQuery}
            />
          </div>
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 pointer-events-none z-10">
            ESC
          </kbd>
        </div>
        <CommandList className="max-h-[min(60vh,440px)]">
          {loading && query.trim().length >= REMOTE_MIN_QUERY_LEN && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Searching records…
            </div>
          )}
          {showRemoteHint && (
            <div className="py-4 px-2 text-center text-xs text-muted-foreground">
              Type at least two characters to search CRM records and catalog
              data.
            </div>
          )}
          {showEmpty && (
            <CommandEmpty>No matches. Try another keyword.</CommandEmpty>
          )}
          {sortedGroupEntries.map(([kind, items]) => (
            <CommandGroup key={kind} heading={getTypeLabel(kind)}>
              {items.map((item) => (
                <CommandItem
                  key={item.key}
                  value={`${item.title} ${item.subtitle ?? ""} ${item.url}`}
                  onSelect={() => handleSelect(item)}
                  className="gap-2"
                >
                  {getIcon(kind)}
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{item.title}</span>
                    {item.subtitle && (
                      <span className="truncate text-xs text-muted-foreground">
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
