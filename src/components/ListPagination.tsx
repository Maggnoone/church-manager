import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const LIST_PAGE_SIZE = 7;

interface ListPaginationProps {
  page: number; // 1-indexed current page
  totalPages: number; // total number of pages (>= 1)
  total: number; // total item count
  itemLabel?: string; // optional plural noun appended to "Mostrando X–Y de N <label>"
  onPageChange: (page: number) => void;
  pageSize?: number; // optional page size, defaults to LIST_PAGE_SIZE
}

export function ListPagination({
  page,
  totalPages,
  total,
  itemLabel,
  onPageChange,
  pageSize = LIST_PAGE_SIZE,
}: ListPaginationProps) {
  if (total <= pageSize) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
      <p className="text-sm text-muted-foreground">
        {`Mostrando ${start}–${end} de ${total}${itemLabel ? ` ${itemLabel}` : ""}`}
      </p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Anterior
        </Button>
        <span className="min-w-[4.5rem] text-center text-sm text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
