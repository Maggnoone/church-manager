import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  format?: (value: number) => string;
  icon: LucideIcon;
  hint?: string;
  className?: string;
  /** `brand` renders the card on the teal login gradient with light text. */
  variant?: "default" | "brand";
}

export function StatCard({
  label,
  value,
  format,
  icon: Icon,
  hint,
  className,
  variant = "default",
}: StatCardProps) {
  const isBrand = variant === "brand";
  return (
    <Card
      className={cn(
        "shadow-soft transition hover:shadow-elegant",
        isBrand && "border-transparent bg-gradient-brand",
        className,
      )}
    >
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl [&_svg]:size-5",
              isBrand ? "bg-white/15 text-white" : "bg-accent text-accent-foreground",
            )}
          >
            <Icon aria-hidden="true" />
          </div>
          <span className={cn("text-sm", isBrand ? "text-white/80" : "text-muted-foreground")}>
            {label}
          </span>
        </div>
        <div className="mt-4">
          <CountUp
            value={value}
            format={format}
            className={cn("font-display text-3xl font-semibold", isBrand && "text-white")}
          />
        </div>
        {hint ? (
          <p className={cn("mt-1 text-xs", isBrand ? "text-white/70" : "text-muted-foreground")}>
            {hint}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
