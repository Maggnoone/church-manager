import type { ChartCategory } from "@/lib/dashboard-chart-data";
import { CategoryDonutChart } from "./category-donut-chart";

interface ConfirmandoStatusChartProps {
  data: ChartCategory[];
  isLoading: boolean;
  className?: string;
}

const STATUS_COLORS: Record<string, string> = {
  activo: "var(--chart-1)",
  apto: "var(--chart-4)",
  confirmado: "var(--chart-3)",
  baja: "var(--muted-foreground)",
};

export function ConfirmandoStatusChart({
  data,
  isLoading,
  className,
}: ConfirmandoStatusChartProps) {
  const coloredData = data.map((item) => ({
    ...item,
    color: STATUS_COLORS[item.key] ?? "var(--chart-2)",
  }));

  return (
    <CategoryDonutChart
      data={coloredData}
      isLoading={isLoading}
      title="Estado de confirmandos"
      description="Distribución actual según el avance pastoral."
      emptyTitle="No hay confirmandos para mostrar"
      emptyDescription="La distribución aparecerá cuando se registren confirmandos."
      centerLabel="en total"
      tooltipValueFormatter={(value) => `${value} confirmandos`}
      summaryUnit="confirmandos"
      legendAriaLabel="Detalle por estado"
      className={className}
    />
  );
}
