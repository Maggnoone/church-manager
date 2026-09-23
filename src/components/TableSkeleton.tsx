import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

interface TableSkeletonProps {
  cols: number;
  rows?: number;
}

export function TableSkeleton({ cols, rows = 5 }: TableSkeletonProps) {
  return (
    <Table>
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i}>
            {Array.from({ length: cols }).map((_, j) => (
              <TableCell key={j}>
                <Skeleton className="h-4 w-full" style={{ maxWidth: j === 0 ? "60%" : j === cols - 1 ? "40%" : "80%" }} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
