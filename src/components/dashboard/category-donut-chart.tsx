import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, type TooltipProps } from "recharts";

import type { ChartCategory } from "@/lib/dashboard-chart-data";
import { ChartTooltipFrame, DashboardChartCard } from "./dashboard-chart-card";

interface CategoryDonutChartProps {
  data: ChartCategory[];
  isLoading: boolean;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyTone?: "neutral" | "success";
  /** Label rendered under the center total. */
  centerLabel?: string;
  /** Formats the total rendered in the donut center. */
  centerValueFormatter?: (total: number) => string;
  /** Formats each value shown in the chart tooltip. */
  tooltipValueFormatter?: (value: number) => string;
  /** Formats each value shown in the legend and the accessible summary. */
  valueFormatter?: (value: number) => string;
  /** Unit used by the default accessible summary (e.g. "confirmandos"). */
  summaryUnit?: string;
  /**
   * Leading sentence of the accessible summary, without a trailing period.
   * Defaults to `Total de {total} {summaryUnit}`.
   */
  summaryText?: (total: number) => string;
  /** Accessible label for the legend list. */
  legendAriaLabel?: string;
  /** Shows each category's share of the total in the legend. */
  showPercentage?: boolean;
  className?: string;
}

const DEFAULT_TOOLTIP = (value: number) => String(value);
const DEFAULT_VALUE = (value: number) => String(value);
const DEFAULT_CENTER = (total: number) => String(total);

interface DonutTooltipProps extends TooltipProps<number, string> {
  formatter: (value: number) => string;
  total: number;
}

function DonutTooltip({ active, payload, formatter, total }: DonutTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  const value = Number(entry.value ?? 0);
  const label = String(entry.name ?? "");
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <ChartTooltipFrame>
      <p className="font-medium">{label}</p>
      <p className="mt-1 text-muted-foreground">
        {formatter(value)}
        {total > 0 ? ` · ${pct}%` : ""}
      </p>
    </ChartTooltipFrame>
  );
}

export function CategoryDonutChart({
  data,
  isLoading,
  title,
  description,
  emptyTitle,
  emptyDescription,
  emptyTone = "neutral",
  centerLabel = "en total",
  centerValueFormatter = DEFAULT_CENTER,
  tooltipValueFormatter = DEFAULT_TOOLTIP,
  valueFormatter = DEFAULT_VALUE,
  summaryUnit = "elementos",
  summaryText,
  legendAriaLabel = "Detalle por categoría",
  showPercentage = false,
  className,
}: CategoryDonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const summary = summaryText ? summaryText(total) : `Total de ${total} ${summaryUnit}`;

  return (
    <DashboardChartCard
      title={title}
      description={description}
      isLoading={isLoading}
      isEmpty={total === 0}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      emptyTone={emptyTone}
      className={className}
    >
      <figure className="min-w-0">
        <div className="relative h-56 min-w-0" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={61}
                outerRadius={84}
                paddingAngle={3}
                dataKey="value"
                nameKey="label"
                stroke="var(--card)"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {data.map((entry) => (
                  <Cell key={entry.key} fill={entry.color ?? "var(--chart-2)"} />
                ))}
              </Pie>
              <Tooltip
                wrapperStyle={{ zIndex: 20, outline: "none" }}
                content={<DonutTooltip formatter={tooltipValueFormatter} total={total} />}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-3xl font-semibold tabular-nums">
              {centerValueFormatter(total)}
            </span>
            <span className="text-xs text-muted-foreground">{centerLabel}</span>
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-2" aria-label={legendAriaLabel}>
          {data.map((item) => (
            <li key={item.key} className="flex min-w-0 items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color ?? "var(--chart-2)" }}
                aria-hidden="true"
              />
              <span className="truncate text-muted-foreground">{item.label}</span>
              <span
                className={`ml-auto font-medium tabular-nums${
                  showPercentage ? " flex items-baseline gap-1" : ""
                }`}
              >
                {valueFormatter(item.value)}
                {showPercentage && total > 0 ? (
                  <span className="text-xs font-normal text-muted-foreground">
                    {Math.round((item.value / total) * 100)}%
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
        <figcaption className="sr-only">
          {summary}. {data.map((item) => `${item.label}: ${valueFormatter(item.value)}`).join("; ")}
          .
        </figcaption>
      </figure>
    </DashboardChartCard>
  );
}
