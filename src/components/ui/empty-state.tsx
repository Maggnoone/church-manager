import type * as React from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Card
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-14 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground [&_svg]:size-6">
          {icon}
        </div>
      ) : null}
      <div className="space-y-1">
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        {description ? (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </Card>
  );
}
