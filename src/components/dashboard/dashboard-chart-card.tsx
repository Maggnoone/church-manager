import { useId, type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toSvgId } from "./chart-utils";

interface DashboardChartCardProps {
  title: string;
  description: string;
  isLoading: boolean;
  isEmpty: boolean;
  emptyTitle: string;
  emptyDescription: string;
  emptyTone?: "neutral" | "success";
  className?: string;
  children: ReactNode;
}

export function DashboardChartCard({
  title,
  description,
  isLoading,
  isEmpty,
  emptyTitle,
  emptyDescription,
  emptyTone = "neutral",
  className,
  children,
}: DashboardChartCardProps) {
  const titleId = toSvgId(useId(), "title");

  return (
    <Card className={`min-w-0 shadow-soft ${className ?? ""}`} aria-labelledby={titleId}>
      <CardHeader className="pb-3">
        <CardTitle id={titleId} className="text-base">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="min-w-0">
        {isLoading ? (
          <div className="space-y-4" aria-label={`Cargando ${title.toLocaleLowerCase("es-AR")}`}>
            <Skeleton className="h-64 w-full rounded-xl" />
            <div className="flex gap-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ) : isEmpty ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
            {emptyTone === "success" ? (
              <CheckCircle2 className="mb-3 h-8 w-8 text-success" aria-hidden="true" />
            ) : null}
            <p className="font-medium text-foreground">{emptyTitle}</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">{emptyDescription}</p>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export function ChartTooltipFrame({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-elegant">
      {children}
    </div>
  );
}
