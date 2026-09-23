import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { AttendanceTrendChart } from "@/components/dashboard/attendance-trend-chart";
import { ConfirmandoStatusChart } from "@/components/dashboard/confirmando-status-chart";
import { PendingRequirementsChart } from "@/components/dashboard/pending-requirements-chart";
import {
  Users,
  HeartHandshake,
  BookOpen,
  Wallet,
  ClipboardCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ErrorFallback } from "@/components/ErrorFallback";
import { formatCurrency } from "@/lib/export";
import { staggerContainer, staggerItem } from "@/lib/motion";
import type { Confirmando, Pago, CostoRetiro } from "@/integrations/supabase/types";
import {
  buildAttendanceTrend,
  buildConfirmandoStatusCounts,
  buildPendingRequirements,
  type AttendanceTrendPoint,
  type ChartCategory,
} from "@/lib/dashboard-chart-data";
import logoESP from "@/assets/logoESP.png";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

interface DashboardStats {
  totalConf: number;
  conBautismo: number;
  aptos: number;
  padrinos: number;
  charlas: number;
  asistPct: number;
  cobradoReal: number;
  metaRetiro: number;
  pendiente: number;
  pendingRequirements: ChartCategory[];
  confirmandoStatuses: ChartCategory[];
  attendanceTrend: AttendanceTrendPoint[];
}

interface KpiCard {
  label: string;
  value: number;
  format?: (value: number) => string;
  icon: LucideIcon;
  hint?: string;
  variant?: "default" | "brand";
}

function Dashboard() {
  const { user, roles, canSeePagos } = useAuth();
  const reduceMotion = useReducedMotion();

  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats", canSeePagos],
    queryFn: async () => {
      const [confirmandos, padrinos, charlas, asistencia, pagos, costo] = await Promise.all([
        supabase
          .from("confirmandos")
          .select(
            "id, status, has_baptism, has_communion, padrino_id, dni, direccion, contacto_padres",
            { count: "exact" },
          ),
        supabase.from("padrinos").select("id", { count: "exact", head: true }),
        supabase.from("charlas").select("id, titulo, fecha", { count: "exact" }),
        supabase.from("asistencia").select("id, charla_id, presente"),
        canSeePagos
          ? supabase.from("pagos").select("monto, concepto")
          : Promise.resolve({ data: [] as Pago[], error: null }),
        canSeePagos
          ? supabase
              .from("costo_retiro")
              .select("monto")
              .eq("activo", true)
              .eq("concepto", "retiro")
              .maybeSingle()
          : Promise.resolve({ data: null as CostoRetiro | null, error: null }),
      ]);
      if (confirmandos.error) throw confirmandos.error;
      if (padrinos.error) throw padrinos.error;
      if (charlas.error) throw charlas.error;
      if (asistencia.error) throw asistencia.error;
      if (pagos.error) throw pagos.error;
      if (costo.error) throw costo.error;

      const totalConf = confirmandos.count ?? 0;
      const dataConf = (confirmandos.data ?? []) as Pick<
        Confirmando,
        | "id"
        | "status"
        | "has_baptism"
        | "has_communion"
        | "padrino_id"
        | "dni"
        | "direccion"
        | "contacto_padres"
      >[];
      const conBautismo = dataConf.filter((c) => c.has_baptism).length;
      const aptos = dataConf.filter((c) => c.status === "apto" || c.status === "confirmado").length;
      const attendanceRows = asistencia.data ?? [];
      const totalAsist = attendanceRows.length;
      const presentes = attendanceRows.filter((a) => a.presente).length;
      const paymentRows = (pagos.data ?? []) as Pick<Pago, "monto" | "concepto">[];
      const cobradoReal = paymentRows.reduce(
        (sum, payment) =>
          payment.concepto === "retiro" && Number.isFinite(Number(payment.monto))
            ? sum + Number(payment.monto)
            : sum,
        0,
      );
      const costoTotal = Number((costo.data as CostoRetiro | null)?.monto ?? 0) * totalConf;
      return {
        totalConf,
        conBautismo,
        aptos,
        padrinos: padrinos.count ?? 0,
        charlas: charlas.count ?? 0,
        asistPct: totalAsist ? Math.round((presentes / totalAsist) * 100) : 0,
        cobradoReal,
        metaRetiro: costoTotal,
        pendiente: Math.max(costoTotal - cobradoReal, 0),
        pendingRequirements: buildPendingRequirements(dataConf),
        confirmandoStatuses: buildConfirmandoStatusCounts(dataConf),
        attendanceTrend: buildAttendanceTrend(charlas.data ?? [], attendanceRows),
      };
    },
  });

  if (isError) {
    return (
      <ErrorFallback
        error={error instanceof Error ? error : new Error(String(error))}
        reset={refetch}
        message="No se pudieron cargar los datos del dashboard."
      />
    );
  }

  const cards: KpiCard[] = [
    {
      label: "Confirmandos",
      value: stats?.totalConf ?? 0,
      icon: Users,
      hint: `${stats?.conBautismo ?? 0} con bautismo`,
      variant: "brand",
    },
    {
      label: "Aptos / Confirmados",
      value: stats?.aptos ?? 0,
      icon: Sparkles,
      hint: "Listos para el sacramento",
    },
    {
      label: "Padrinos registrados",
      value: stats?.padrinos ?? 0,
      icon: HeartHandshake,
      hint: "Disponibles para asignar",
    },
    {
      label: "Charlas programadas",
      value: stats?.charlas ?? 0,
      icon: BookOpen,
      hint: "Itinerario formativo",
    },
    {
      label: "Asistencia promedio",
      value: stats?.asistPct ?? 0,
      format: (n) => `${Math.round(n)}%`,
      icon: ClipboardCheck,
      hint: "De todos los encuentros",
    },
    ...(canSeePagos
      ? [
          {
            label: "Recaudado retiro",
            value: stats?.metaRetiro ?? 0,
            format: formatCurrency,
            icon: Wallet,
            hint: `Cobrado: ${formatCurrency(stats?.cobradoReal ?? 0)} · Pendiente: ${formatCurrency(stats?.pendiente ?? 0)}`,
          },
        ]
      : []),
  ];

  const renderKpiCard = (card: KpiCard) => (
    <StatCard
      label={card.label}
      value={card.value}
      format={card.format}
      icon={card.icon}
      hint={card.hint}
      variant={card.variant}
    />
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("es-AR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Bienvenido, <span className="text-primary">{user?.email?.split("@")[0]}</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rol{roles.length > 1 ? "es" : ""}:{" "}
          <span className="font-medium text-foreground">{roles.join(", ") || "sin asignar"}</span>
        </p>
      </div>

      {reduceMotion ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <div key={c.label}>{renderKpiCard(c)}</div>
          ))}
        </div>
      ) : (
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {cards.map((c) => (
            <motion.div key={c.label} variants={staggerItem}>
              {renderKpiCard(c)}
            </motion.div>
          ))}
        </motion.div>
      )}

      <div className="grid min-w-0 gap-4 lg:grid-cols-3">
        <ConfirmandoStatusChart data={stats?.confirmandoStatuses ?? []} isLoading={isLoading} />
        <AttendanceTrendChart
          data={stats?.attendanceTrend ?? []}
          isLoading={isLoading}
          className="lg:col-span-2"
        />
      </div>

      <div className={`grid min-w-0 gap-4 ${canSeePagos ? "lg:grid-cols-2" : ""}`}>
        <PendingRequirementsChart data={stats?.pendingRequirements ?? []} isLoading={isLoading} />
      </div>

      <Card className="bg-gradient-hero shadow-soft">
        <CardContent className="flex items-center gap-4 p-6">
          <img
            src={logoESP}
            alt="Esperanza de San Pablo"
            className="h-12 w-12 rounded-xl object-contain shadow-glow"
          />
          <div>
            <h3 className="font-display text-lg font-semibold">Tip del día</h3>
            <p className="text-sm text-muted-foreground">
              Recuerda que un confirmando solo puede marcarse como <strong>Apto</strong> si tiene su
              bautismo registrado.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
