import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { useState, useMemo } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Database,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  searchKey?: string;
  searchPlaceholder?: string;
  pageSize?: number;
  pageIndex?: number;
  pageCount?: number;
  totalCount?: number;
  showPageSizeSelector?: boolean;
  pageSizeOptions?: number[];
  title?: string;
  description?: string;
  onPageChange?: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  manualPagination?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  searchKey,
  searchPlaceholder = "بحث...",
  pageSize = 10,
  pageIndex = 0,
  pageCount,
  totalCount,
  showPageSizeSelector = true,
  pageSizeOptions = [5, 10, 20, 30, 50, 100],
  title,
  description,
  onPageChange,
  onPageSizeChange,
  manualPagination = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [searchValue, setSearchValue] = useState("");

  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount ?? -1,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: manualPagination
      ? undefined
      : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    manualPagination,
    state: {
      sorting,
      columnFilters,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const nextState = updater({ pageIndex, pageSize });
        if (nextState.pageIndex !== pageIndex) {
          onPageChange?.(nextState.pageIndex);
        }
        if (nextState.pageSize !== pageSize) {
          onPageSizeChange?.(nextState.pageSize);
        }
      }
    },
  });

  const handleSearch = () => {
    if (searchKey && !manualPagination) {
      table.getColumn(searchKey)?.setFilterValue(searchValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Generate page numbers to display
  const pageNumbers = useMemo(() => {
    const totalPages = table.getPageCount();
    const currentPage = table.getState().pagination.pageIndex;
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    const pages: (number | "ellipsis")[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let start = Math.max(0, currentPage - halfVisible);
    let end = Math.min(totalPages - 1, currentPage + halfVisible);

    // Adjust if at the beginning
    if (currentPage <= halfVisible) {
      end = Math.min(totalPages - 1, maxVisiblePages - 1);
    }

    // Adjust if at the end
    if (currentPage >= totalPages - halfVisible - 1) {
      start = Math.max(0, totalPages - maxVisiblePages);
    }

    // Always show first page
    if (start > 0) {
      pages.push(0);
      if (start > 1) pages.push("ellipsis");
    }

    // Add middle pages
    for (let i = start; i <= end; i++) {
      if (i !== 0 && i !== totalPages - 1) {
        pages.push(i);
      } else if (start === 0 && i === 0) {
        pages.push(i);
      }
    }

    // Always show last page
    if (end < totalPages - 1) {
      if (end < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages - 1);
    } else if (end === totalPages - 1 && !pages.includes(totalPages - 1)) {
      pages.push(totalPages - 1);
    }

    return pages;
  }, [table.getPageCount(), table.getState().pagination.pageIndex]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Title skeleton */}
        {title && <Skeleton className="h-7 w-48" />}
        <Skeleton className="h-10 w-[250px]" />
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="bg-muted/50 px-4 py-3">
            <div className="flex gap-8">
              {columns.map((_, index) => (
                <Skeleton key={index} className="h-4 w-24" />
              ))}
            </div>
          </div>
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <div key={rowIndex} className="px-4 py-4 flex gap-8">
                {columns.map((_, cellIndex) => (
                  <Skeleton
                    key={cellIndex}
                    className="h-4 w-full max-w-[120px]"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Title and Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Title Section */}
        {(title || description) && (
          <div>
            {title && (
              <h3 className="text-lg font-bold text-foreground">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Search */}
        {searchKey && (
          <div className="flex items-center gap-2 w-full sm:w-auto sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onKeyDown={handleKeyDown}
                className="pr-10 h-10 bg-card border-border/50"
              />
            </div>
            <Button onClick={handleSearch} className="h-10 px-6 font-bold">
              بحث
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden bg-card/50">
        <Table>
          <TableHeader className="bg-muted/30 border-b border-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="h-11 text-muted-foreground font-bold text-xs">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b border-border/50 last:border-0"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3.5 font-medium text-foreground">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Database className="h-8 w-8 opacity-20" />
                    <span className="font-medium text-sm">لا توجد بيانات متاحة</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        {/* Page size selector & info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {showPageSizeSelector && (
            <>
              <span>عرض</span>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={`${size}`}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
          <span className="mr-2">
            {(manualPagination
              ? (totalCount ?? 0)
              : table.getFilteredRowModel().rows.length) > 0 ? (
              <>
                عرض{" "}
                <span className="font-medium">{pageIndex * pageSize + 1}</span>
                {" - "}
                <span className="font-medium">
                  {Math.min(
                    (pageIndex + 1) * pageSize,
                    manualPagination
                      ? (totalCount ?? 0)
                      : table.getFilteredRowModel().rows.length,
                  )}
                </span>
                {" من "}
                <span className="font-medium">
                  {manualPagination
                    ? (totalCount ?? 0)
                    : table.getFilteredRowModel().rows.length}
                </span>
                {" نتيجة"}
              </>
            ) : (
              "لا توجد نتائج"
            )}
          </span>
        </div>

        {/* Pagination controls */}
        {(manualPagination ? (pageCount ?? 0) : table.getPageCount()) > 1 && (
          <div className="flex items-center gap-1">
            {/* First page */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 hidden sm:flex"
              onClick={() =>
                manualPagination ? onPageChange?.(0) : table.setPageIndex(0)
              }
              disabled={
                manualPagination ? pageIndex === 0 : !table.getCanPreviousPage()
              }
              title="الصفحة الأولى"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>

            {/* Previous page */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                manualPagination
                  ? onPageChange?.(pageIndex - 1)
                  : table.previousPage()
              }
              disabled={
                manualPagination ? pageIndex === 0 : !table.getCanPreviousPage()
              }
              title="الصفحة السابقة"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {pageNumbers.map((page, idx) =>
                page === "ellipsis" ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 text-muted-foreground"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={page}
                    variant={pageIndex === page ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      manualPagination
                        ? onPageChange?.(page)
                        : table.setPageIndex(page)
                    }
                  >
                    {page + 1}
                  </Button>
                ),
              )}
            </div>

            {/* Next page */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                manualPagination
                  ? onPageChange?.(pageIndex + 1)
                  : table.nextPage()
              }
              disabled={
                manualPagination
                  ? pageIndex >= (pageCount ?? 0) - 1
                  : !table.getCanNextPage()
              }
              title="الصفحة التالية"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Last page */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 hidden sm:flex"
              onClick={() =>
                manualPagination
                  ? onPageChange?.((pageCount ?? 0) - 1)
                  : table.setPageIndex(table.getPageCount() - 1)
              }
              disabled={
                manualPagination
                  ? pageIndex >= (pageCount ?? 0) - 1
                  : !table.getCanNextPage()
              }
              title="الصفحة الأخيرة"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
