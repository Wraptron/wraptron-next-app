import { cn } from "@/lib/utils";

/** Full-width page padding — use instead of max-w-* centered containers. */
export const pageShellClass =
  "w-full px-4 py-6 md:px-6 md:py-8 lg:px-8 xl:px-10";

/** Fills the main content area (for kanban / list views that need viewport height). */
export const pageShellFillClass =
  "flex min-h-0 w-full flex-1 flex-col px-4 py-6 md:px-6 md:py-8 lg:px-8 xl:px-10";

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
  /** When true, page grows to fill available main-content height. */
  fill?: boolean;
};

export function PageShell({ children, className, fill = false }: PageShellProps) {
  return (
    <div className={cn(fill ? pageShellFillClass : pageShellClass, className)}>
      {children}
    </div>
  );
}
