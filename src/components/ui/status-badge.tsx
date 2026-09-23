import { cn } from "@/lib/utils";

export type StatusTone = "neutral" | "accent" | "success" | "warning" | "danger" | "ink";

export interface StatusBadgeProps {
  tone?: StatusTone;
  label: string;
  className?: string;
}

const toneStyles: Record<StatusTone, { container: string; dot: string }> = {
  neutral: { container: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  accent: { container: "bg-accent text-accent-foreground", dot: "bg-primary" },
  success: { container: "bg-success/10 text-success", dot: "bg-success" },
  warning: { container: "bg-warning/10 text-warning", dot: "bg-warning" },
  danger: { container: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
  ink: { container: "bg-foreground text-background", dot: "bg-background" },
};

export function StatusBadge({ tone = "neutral", label, className }: StatusBadgeProps) {
  const styles = toneStyles[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        styles.container,
        className,
      )}
    >
      <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />
      {label}
    </span>
  );
}
