"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAGE_SIZE_OPTIONS } from "@/lib/api/pagination";
import { formatCount } from "@/lib/utils/format";
import type { Paginated } from "@/types/api";

/**
 * Server-side pagination control.
 *
 * Renders a windowed page list with ellipses rather than every page number —
 * with a few thousand ledger entries at 20/page, a naive implementation paints
 * hundreds of buttons.
 */

export interface DataPaginationProps {
  page: Paginated<unknown>;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (limit: number) => void;
  disabled?: boolean;
  className?: string;
}

export function DataPagination({
  page,
  onPageChange,
  onPageSizeChange,
  disabled = false,
  className,
}: DataPaginationProps) {
  const { page: current, limit, total, totalPages } = page;

  const from = total === 0 ? 0 : (current - 1) * limit + 1;
  const to = Math.min(current * limit, total);

  const canPrevious = current > 1 && !disabled;
  const canNext = current < totalPages && !disabled;

  const pages = buildPageWindow(current, totalPages);

  return (
    <div
      className={cn(
        "border-border/70 bg-card flex flex-col gap-3 rounded-xl border px-4 py-3",
        "sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="text-muted-foreground flex items-center gap-4 text-xs">
        <span className="tabular">
          Showing <span className="text-foreground font-medium">{formatCount(from)}</span>
          {"–"}
          <span className="text-foreground font-medium">{formatCount(to)}</span> of{" "}
          <span className="text-foreground font-medium">{formatCount(total)}</span>
        </span>

        {onPageSizeChange && (
          <div className="hidden items-center gap-2 sm:flex">
            <span>Rows</span>
            <Select
              value={String(limit)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
              disabled={disabled}
            >
              <SelectTrigger size="sm" className="h-7 w-[4.5rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <nav
        className="flex items-center gap-1"
        aria-label="Pagination"
      >
        <PageButton
          onClick={() => onPageChange?.(1)}
          disabled={!canPrevious}
          label="First page"
        >
          <ChevronsLeft className="size-4" />
        </PageButton>
        <PageButton
          onClick={() => onPageChange?.(current - 1)}
          disabled={!canPrevious}
          label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </PageButton>

        <div className="flex items-center gap-1">
          {pages.map((entry, index) =>
            entry === "ellipsis" ? (
              <span
                key={`gap-${index}`}
                className="text-muted-foreground px-1 text-xs select-none"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <Button
                key={entry}
                variant={entry === current ? "default" : "ghost"}
                size="icon"
                className="tabular size-8 text-xs"
                onClick={() => onPageChange?.(entry)}
                disabled={disabled}
                aria-current={entry === current ? "page" : undefined}
                aria-label={`Page ${entry}`}
              >
                {entry}
              </Button>
            ),
          )}
        </div>

        <PageButton
          onClick={() => onPageChange?.(current + 1)}
          disabled={!canNext}
          label="Next page"
        >
          <ChevronRight className="size-4" />
        </PageButton>
        <PageButton
          onClick={() => onPageChange?.(totalPages)}
          disabled={!canNext}
          label="Last page"
        >
          <ChevronsRight className="size-4" />
        </PageButton>
      </nav>
    </div>
  );
}

function PageButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      {children}
    </Button>
  );
}

/**
 * Windowed page numbers: 1 … 4 [5] 6 … 20
 *
 * Always shows the first and last page (so "jump to end" is one click) plus a
 * one-page radius around the current page. Returns a flat array with
 * "ellipsis" markers so the renderer stays trivial.
 */
export function buildPageWindow(
  current: number,
  totalPages: number,
  radius = 1,
): Array<number | "ellipsis"> {
  if (totalPages <= 1) return [1];

  // Below this threshold the window logic would produce more ellipses than it
  // saves buttons, so just render them all.
  const MAX_WITHOUT_WINDOW = 7;
  if (totalPages <= MAX_WITHOUT_WINDOW) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages]);
  for (let offset = -radius; offset <= radius; offset += 1) {
    const candidate = current + offset;
    if (candidate > 1 && candidate < totalPages) pages.add(candidate);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];

  let previous = 0;
  for (const value of sorted) {
    if (previous && value - previous > 1) result.push("ellipsis");
    result.push(value);
    previous = value;
  }

  return result;
}
