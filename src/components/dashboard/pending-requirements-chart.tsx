import { useId } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";

import type { ChartCategory } from "@/lib/dashboard-chart-data";
import { ChartTooltipFrame, DashboardChartCard } from "./dashboard-chart-card";
import { toSvgId } from "./chart-utils";

interface PendingRequirementsChartProps {
  data: ChartCategory[];
  isLoading: boolean;
  className?: string;
}

const REQUIREMENT_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

function RequirementTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const value = Number(payload[0].value ?? 0);

  return (
    <ChartTooltipFrame>
      <p className="font-medium">{String(label ?? "")}</p>
      <p className="mt-1 text-muted-foreground">{value} confirmandos pendientes</p>
    </ChartTooltipFrame>
  );
}

export function PendingRequirementsChart({
  data,
  isLoading,
  className,
}: PendingRequirementsChartProps) {
  const id = useId();
  const gradientIds = data.map((item) => toSvgId(id, `requirement-${item.key}`));
  const isEmpty = data.length === 0 || data.every((item) => item.value === 0);

  return (
    <DashboardChartCard
      title="Requisitos pendientes"
      description="Confirmandos activos que aún necesitan completar cada requisito."
      isLoading={isLoading}
      isEmpty={isEmpty}
      emptyTitle="Todos los requisitos están al día"
      emptyDescription="No hay requisitos pendientes entre los confirmandos activos."
      emptyTone="success"
      className={className}
    >
      <figure className="min-w-0">
        <div className="h-72 min-w-0" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 20, left: 8, bottom: 0 }}
            >
              <defs>
                {data.map((item, index) => (
                  <linearGradient
                    key={item.key}
                    id={gradientIds[index]}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor={REQUIREMENT_COLORS[index]} stopOpacity={0.68} />
                    <stop offset="100%" stopColor={REQUIREMENT_COLORS[index]} stopOpacity={1} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                type="number"
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={126}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--foreground)", fontSize: 11 }}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.55 }}
                wrapperStyle={{ zIndex: 20, outline: "none" }}
                content={<RequirementTooltip />}
              />
              <Bar
                dataKey="value"
                name="Pendientes"
                radius={[0, 6, 6, 0]}
                isAnimationActive={false}
              >
                {data.map((item, index) => (
                  <Cell key={item.key} fill={`url(#${gradientIds[index]})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <figcaption className="sr-only">
          Requisitos pendientes. {data.map((item) => `${item.label}: ${item.value}`).join("; ")}.
        </figcaption>
      </figure>
    </DashboardChartCard>
  );
}
