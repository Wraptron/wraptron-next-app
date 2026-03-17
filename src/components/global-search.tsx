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
import { Box, Users, Package, Briefcase, Search } from "lucide-react";
import {
  customersApi,
  productsApi,
  employeesApi,
  projectsApi,
} from "@/lib/api";

interface SearchResult {
  id: string | number;
  title: string;
  subtitle?: string;
  type: "project" | "customer" | "product" | "employee";
  url: string;
}

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  // Keyboard shortcuts: Cmd/Ctrl + K to open, Escape to close
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open]);

  // Search when query changes
  React.useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const searchAll = async () => {
      setLoading(true);
      const allResults: SearchResult[] = [];

      try {
        // Search Projects
        try {
          const projectsResponse = await projectsApi.getAll({
            search: query,
            limit: 5,
          });
          projectsResponse.data.forEach((project) => {
            allResults.push({
              id: project.id,
              title: project.project_name,
              subtitle: project.status,
              type: "project",
              url: `/projects/${project.id}`,
            });
          });
        } catch (error) {
          console.error("Error searching projects:", error);
        }

        // Search Customers
        try {
          const customersResponse = await customersApi.getAll({
            search: query,
            limit: 5,
          });
          customersResponse.data.forEach((customer) => {
            allResults.push({
              id: customer.id,
              title: customer.name,
              subtitle: customer.contact_email || customer.contact_phone,
              type: "customer",
              url: `/customers/${customer.id}`,
            });
          });
        } catch (error) {
          console.error("Error searching customers:", error);
        }

        // Search Products
        try {
          const productsResponse = await productsApi.getAll({
            search: query,
            limit: 5,
          });
          productsResponse.data.forEach((product) => {
            allResults.push({
              id: product.id,
              title: product.part_name,
              subtitle: product.part_code,
              type: "product",
              url: `/products/${product.id}`,
            });
          });
        } catch (error) {
          console.error("Error searching products:", error);
        }

        // Search Employees
        try {
          const employeesResponse = await employeesApi.getAll({
            search: query,
            limit: 5,
          });
          employeesResponse.data.forEach((employee) => {
            allResults.push({
              id: employee.id,
              title: `${employee.first_name} ${employee.last_name}`,
              subtitle: employee.email || employee.emp_code,
              type: "employee",
              url: `/employees/${employee.id}`,
            });
          });
        } catch (error) {
          console.error("Error searching employees:", error);
        }
      } catch (error) {
        console.error("Error in global search:", error);
      } finally {
        setLoading(false);
      }

      setResults(allResults);
    };

    // Debounce search
    const timeoutId = setTimeout(searchAll, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    router.push(result.url);
    setOpen(false);
    setQuery("");
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "project":
        return <Box className="h-4 w-4" />;
      case "customer":
        return <Users className="h-4 w-4" />;
      case "product":
        return <Package className="h-4 w-4" />;
      case "employee":
        return <Briefcase className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "project":
        return "Projects";
      case "customer":
        return "Customers";
      case "product":
        return "Products";
      case "employee":
        return "Employees";
      default:
        return "Results";
    }
  };

  // Group results by type
  const groupedResults = results.reduce(
    (acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = [];
      }
      acc[result.type].push(result);
      return acc;
    },
    {} as Record<SearchResult["type"], SearchResult[]>,
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Search...</span>
        <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search Everything"
        description="Search across projects, customers, products, employees, and more..."
        showCloseButton={false}
      >
        <div className="relative">
          <div className="[&_[data-slot=command-input-wrapper]]:pr-16">
            <CommandInput
              placeholder="Search projects, customers, products, employees..."
              value={query}
              onValueChange={setQuery}
            />
          </div>
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 pointer-events-none z-10">
            ESC
          </kbd>
        </div>
        <CommandList>
          {loading && (
            <div className="py-6 text-center text-sm text-gray-500">
              Searching...
            </div>
          )}
          {!loading && query.length >= 2 && results.length === 0 && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}
          {!loading &&
            Object.entries(groupedResults).map(([type, items]) => (
              <CommandGroup
                key={type}
                heading={getTypeLabel(type as SearchResult["type"])}
              >
                {items.map((result) => (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    value={`${result.title} ${result.subtitle || ""}`}
                    onSelect={() => handleSelect(result)}
                  >
                    {getIcon(result.type)}
                    <div className="flex flex-col">
                      <span>{result.title}</span>
                      {result.subtitle && (
                        <span className="text-xs text-gray-500">
                          {result.subtitle}
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
