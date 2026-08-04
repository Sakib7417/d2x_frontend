"use client";

import { Fragment, type ReactNode } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, type EmptyStateProps } from "./empty-state";
import { ErrorState } from "./error-state";
import { DataPagination } from "./data-pagination";
import type { NormalizedApiError, Paginated } from "@/types/api";

/**
 * Generic data table.
 *
 * Deliberately not TanStack Table. Everything in this app is server-paginated,
 * server-filtered and server-sorted — the backend owns all of it — so a client
 * table engine would add ~14kB and a headless abstraction layer to solve
 * problems we do not have. What we actually need is consistent
 * loading/empty/error handling and a responsive layout, which is what this is.
 *
 * State precedence is fixed and deliberate:
 *   error > loading > empty > data
 * An error must win over a stale `items` array, otherwise a failed refetch
 * silently shows the previous page's data as if it were current.
 *
 * RESPONSIVENESS
 * A horizontally scrolling 9-column table is unusable on a phone. Below `md`
 * the table is replaced by a stacked card list via `renderMobileCard`. Tables
 * that don't supply one fall back to horizontal scroll, but every list screen
 * in this product should supply one.
 */

export interface DataTableColumn<TRow> {
  /** Stable key; also used as the React key for cells. */
  id: string;
  header: ReactNode;
  /** Cell renderer. Receives the row and its index on the current page. */
  cell: (row: TRow, index: number) => ReactNode;
  align?: "left" | "right" | "center";
  /** Tailwind width utility, e.g. "w-40". */
  width?: string;
  /**
   * Hide this column below a breakpoint, to keep the table readable on
   * tablets without dropping to the mobile card layout entirely.
   */
  hideBelow?: "sm" | "md" | "lg" | "xl";
  /** Prevent text wrapping — use for amounts, dates, hashes. */
  nowrap?: boolean;
  className?: string;
}

export interface DataTableProps<TRow> {
  columns: Array<DataTableColumn<TRow>>;
  /** Normalised page from `@/lib/api/pagination`. */
  page: Paginated<TRow> | undefined;
  loading?: boolean;
  /** True while a background refetch runs over existing data. */
  fetching?: boolean;
  error?: NormalizedApiError | null;
  onRetry?: () => void;
  getRowId: (row: TRow, index: number) => string;
  onRowClick?: (row: TRow) => void;
  /** Rendered instead of the table below `md`. */
  renderMobileCard?: (row: TRow, index: number) => ReactNode;
  emptyState?: Partial<EmptyStateProps>;
  /** Number of skeleton rows during the initial load. */
  skeletonRows?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (limit: number) => void;
  /** Hide the pagination bar — for short, unpaginated lists. */
  hidePagination?: boolean;
  className?: string;
}

const HIDE_BELOW_CLASSES = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
} as const;

const ALIGN_CLASSES = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const;

export function DataTable<TRow>({
  columns,
  page,
  loading = false,
  fetching = false,
  error,
  onRetry,
  getRowId,
  onRowClick,
  renderMobileCard,
  emptyState,
  skeletonRows = 8,
  onPageChange,
  onPageSizeChange,
  hidePagination = false,
  className,
}: DataTableProps<TRow>) {
  // --- error wins over everything ------------------------------------------
  if (error) {
    return (
      <Shell className={className}>
        <ErrorState error={error} onRetry={onRetry} />
      </Shell>
    );
  }

  // --- initial load ---------------------------------------------------------
  if (loading) {
    return (
      <Shell className={className}>
        <TableSkeleton columns={columns} rows={skeletonRows} />
      </Shell>
    );
  }

  const rows = page?.items ?? [];

  // --- empty ---------------------------------------------------------------
  if (rows.length === 0) {
    return (
      <Shell className={className}>
        <EmptyState
          title={emptyState?.title ?? "Nothing here yet"}
          description={emptyState?.description}
          icon={emptyState?.icon}
          action={emptyState?.action}
          secondaryAction={emptyState?.secondaryAction}
        />
      </Shell>
    );
  }

  // --- data ----------------------------------------------------------------
  return (
    <div className={cn("space-y-3", className)}>
      <Shell
        className={cn(
          // Dim during a background refetch so the user can tell the figures
          // are being updated, without the layout collapsing to a spinner.
          "transition-opacity duration-200",
          fetching && "pointer-events-none opacity-60",
        )}
      >
        {/* Desktop / tablet */}
        <div
          className={cn(
            "overflow-x-auto",
            renderMobileCard && "hidden md:block",
          )}
        >
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {columns.map((column) => (
                  <TableHead
                    key={column.id}
                    className={cn(
                      "text-muted-foreground bg-surface-1/40 sticky top-0 z-10 text-xs font-medium tracking-wide backdrop-blur-sm",
                      column.width,
                      column.align && ALIGN_CLASSES[column.align],
                      column.hideBelow && HIDE_BELOW_CLASSES[column.hideBelow],
                      column.className,
                    )}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow
                  key={getRowId(row, index)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "border-border/50 transition-colors",
                    onRowClick && "hover:bg-accent/40 cursor-pointer",
                  )}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      className={cn(
                        "py-3",
                        column.align && ALIGN_CLASSES[column.align],
                        column.hideBelow &&
                          HIDE_BELOW_CLASSES[column.hideBelow],
                        column.nowrap && "whitespace-nowrap",
                        column.className,
                      )}
                    >
                      {column.cell(row, index)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile */}
        {renderMobileCard && (
          <div className="divide-border/50 divide-y md:hidden">
            {rows.map((row, index) => (
              <motion.div
                key={getRowId(row, index)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: Math.min(index * 0.03, 0.2),
                  ease: [0.16, 1, 0.3, 1],
                }}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn("p-4", onRowClick && "active:bg-accent/40")}
              >
                {renderMobileCard(row, index)}
              </motion.div>
            ))}
          </div>
        )}
      </Shell>

      {!hidePagination && page && page.totalPages > 1 && (
        <DataPagination
          page={page}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          disabled={fetching}
        />
      )}
    </div>
  );
}

function Shell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border/70 bg-card shadow-ambient overflow-hidden rounded-2xl border",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Skeleton that mirrors the real column layout.
 *
 * Matching the actual column count and alignment matters: a generic grey block
 * causes a visible reflow when data lands, which reads as jank. Widths are
 * varied pseudo-randomly but deterministically (index-derived) so the
 * placeholder looks like text rather than a bar chart, without introducing
 * `Math.random()` and the hydration mismatch that comes with it.
 */
function TableSkeleton<TRow>({
  columns,
  rows,
}: {
  columns: Array<DataTableColumn<TRow>>;
  rows: number;
}) {
  const widths = ["w-16", "w-24", "w-20", "w-28", "w-14", "w-32"];

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead
                key={column.id}
                className={cn(
                  "bg-surface-1/40",
                  column.width,
                  column.align && ALIGN_CLASSES[column.align],
                  column.hideBelow && HIDE_BELOW_CLASSES[column.hideBelow],
                )}
              >
                <Skeleton className="h-3 w-16" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex} className="border-border/50">
              {columns.map((column, columnIndex) => (
                <TableCell
                  key={column.id}
                  className={cn(
                    "py-3.5",
                    column.hideBelow && HIDE_BELOW_CLASSES[column.hideBelow],
                  )}
                >
                  <Skeleton
                    className={cn(
                      "h-4",
                      widths[(rowIndex + columnIndex) % widths.length],
                      column.align === "right" && "ml-auto",
                      column.align === "center" && "mx-auto",
                    )}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Label/value pair for mobile card rows — keeps the stacked layout consistent
 * across every table's mobile fallback.
 */
export function MobileField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-sm font-medium">{children}</span>
    </div>
  );
}

export { Fragment as DataTableFragment };
