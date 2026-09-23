import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";

import type { AttendanceTrendPoint } from "@/lib/dashboard-chart-data";
import { ChartTooltipFrame, DashboardChartCard } from "./dashboard-chart-card";
import { toSvgId } from "./chart-utils";

interface AttendanceTrendChartProps {
  data: AttendanceTrendPoint[];
  isLoading: boolean;
  className?: string;
}

function isAttendancePoint(value: unknown): value is AttendanceTrendPoint {
  if (typeof value !== "object" || value === null) return false;
  const point = value as Record<string, unknown>;
  return (
    typeof point.title === "string" &&
    typeof point.label === "string" &&
    typeof point.present === "number" &&
    typeof point.absent === "number" &&
    typeof point.total === "number" &&
    typeof point.attendancePercentage === "number"
  );
}

function AttendanceTooltip({ active, payload }: TooltipProps<number, string>) {
  const point: unknown = payload?.[0]?.payload;
  if (!active || !isAttendancePoint(point)) return null;

  return (
    <ChartTooltipFrame>
      <p className="font-medium">{point.title}</p>
      <p className="mt-0.5 text-muted-foreground">{point.label}</p>
      <p className="mt-2 font-semibold text-primary">{point.attendancePercentage}% de asistencia</p>
      <p className="mt-1 text-muted-foreground">
        {point.present} presentes · {point.absent} ausentes · {point.total} en total
      </p>
    </ChartTooltipFrame>
  );
}

export function AttendanceTrendChart({ data, isLoading, className }: AttendanceTrendChartProps) {
  const gradientId = toSvgId(useId(), "attendance-gradient");

  return (
    <DashboardChartCard
      title="Tendencia de asistencia"
      description="Porcentaje de presentes en todos los encuentros pasados registrados."
      isLoading={isLoading}
      isEmpty={data.length === 0}
      emptyTitle="Todavía no hay asistencia registrada"
      emptyDescription="La tendencia aparecerá cuando existan encuentros pasados con asistencia cargada."
      className={className}
    >
      <figure className="min-w-0">
        <div className="h-72 min-w-0" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 10, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                interval={0}
                minTickGap={18}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => `${value}%`}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <Tooltip content={<AttendanceTooltip />} cursor={{ stroke: "var(--chart-2)" }} />
              <Area
                type="monotone"
                dataKey="attendancePercentage"
                name="Asistencia"
                stroke="var(--chart-1)"
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
                activeDot={{ r: 4, fill: "var(--chart-1)", stroke: "var(--card)", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <figcaption className="sr-only">
          Asistencia por encuentro.{" "}
          {data
            .map(
              (point) =>
                `${point.title}: ${point.attendancePercentage}% (${point.present} presentes, ${point.absent} ausentes)`,
            )
            .join("; ")}
          .
        </figcaption>
      </figure>
    </DashboardChartCard>
  );
}
