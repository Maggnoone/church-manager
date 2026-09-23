import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface ResponsiveColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

interface ResponsiveDataTableProps<T> {
  columns: ResponsiveColumn<T>[];
  data: T[];
  isLoading?: boolean;
  skeletonRows?: number;
  emptyState?: ReactNode;
  keyExtractor: (row: T) => string;
  className?: string;
}

export function ResponsiveDataTable<T>({
  columns,
  data,
  isLoading,
  skeletonRows = 5,
  emptyState,
  keyExtractor,
  className,
}: ResponsiveDataTableProps<T>) {
  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return emptyState ? (
      <div className={className}>{emptyState}</div>
    ) : null;
  }

  return (
    <>
      {/* Desktop table */}
      <div className={cn("hidden md:block overflow-x-auto", className)}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={keyExtractor(row)}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className={cn("md:hidden space-y-3", className)}>
        {data.map((row) => (
          <Card key={keyExtractor(row)} className="shadow-soft">
            <CardContent className="p-4 space-y-2">
              {columns.map((col) => (
                <div key={col.key} className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground shrink-0">
                    {col.header}
                  </span>
                  <span className="text-sm text-right">{col.cell(row)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
