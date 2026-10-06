import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useConfirmandos, usePadrinos, useGruposSimple } from "@/hooks/use-data";
import {
  useAsistenciaResumen,
  useAsistenciaPorConfirmando,
  usePagosPorConcepto,
  useCostoPorConcepto,
  type AsistenciaPorConfirmando,
} from "@/hooks/use-data";
import { buildBalance, buildTotals } from "@/lib/balances";
import {
  buildAttendanceTrendFromResumen,
  sortCharlasChronologically,
} from "@/lib/dashboard-chart-data";
import { buildPaymentMethodBreakdown, buildPaymentStatusBreakdown } from "@/lib/payment-chart-data";
import { AttendanceTrendChart } from "@/components/dashboard/attendance-trend-chart";
import { CategoryDonutChart } from "@/components/dashboard/category-donut-chart";
import { ConfirmandoAttendanceDetail } from "@/components/dashboard/confirmando-attendance-detail";
import { ListPagination, LIST_PAGE_SIZE } from "@/components/ListPagination";
import { exportToCSV, exportToXLSX, exportToPDF, formatCurrency, formatDate } from "@/lib/export";
import {
  ClipboardList,
  FileSpreadsheet,
  FileText,
  FileType,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Users,
  Wallet,
  Calendar,
  MinusCircle,
  ClipboardCheck,
  Download,
} from "lucide-react";

export const Route = createFileRoute("/app/reportes")({ component: ReportesPage });

/* ================================================================== */
/*  Helpers                                                           */
/* ================================================================== */

function attendanceColor(pct: number) {
  if (pct >= 75) return "bg-emerald-100 text-emerald-700";
  if (pct >= 50) return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}

function runExport(
  kind: "xlsx" | "pdf" | "csv",
  title: string,
  rows: Record<string, unknown>[],
  filename: string,
  subtitle?: string,
) {
  if (!rows.length) return toast.warning("Sin datos para exportar");
  if (kind === "csv") exportToCSV(rows, filename);
  else if (kind === "xlsx") exportToXLSX(rows, filename, "Reporte");
  else {
    const cols = Object.keys(rows[0]);
    const vals = rows.map((d) => Object.values(d) as (string | number)[]);
    exportToPDF(title, cols, vals, filename, subtitle);
  }
}

const compactCurrency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  notation: "compact",
  maximumFractionDigits: 1,
});

/* ================================================================== */
/*  Asistencia                                                        */
/* ================================================================== */

function AsistenciaSection() {
  const [subTab, setSubTab] = useState<"charla" | "confirmando">("charla");
  const [page, setPage] = useState(1);
  const [selectedConfirmando, setSelectedConfirmando] = useState<AsistenciaPorConfirmando | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const { data: charlas = [], isLoading: loadingCharlas } = useAsistenciaResumen();
  const { data: confirmandos = [], isLoading: loadingConf } = useAsistenciaPorConfirmando();
  const { data: grupos = [] } = useGruposSimple();
  const [groupFilter, setGroupFilter] = useState<string>("");

  const openConfirmandoDetail = (confirmando: AsistenciaPorConfirmando) => {
    setSelectedConfirmando(confirmando);
    setDetailOpen(true);
  };

  const filteredCharlas = useMemo(() => {
    if (!groupFilter) return charlas;
    return charlas.filter((c) => c.grupo === groupFilter);
  }, [charlas, groupFilter]);

  const filteredConfirmandos = useMemo(() => {
    if (!groupFilter) return confirmandos;
    return confirmandos.filter((c) => c.grupo === groupFilter);
  }, [confirmandos, groupFilter]);

  const sortedFilteredCharlas = useMemo(
    () => sortCharlasChronologically(filteredCharlas),
    [filteredCharlas],
  );

  const charlaTotalPages = Math.max(1, Math.ceil(sortedFilteredCharlas.length / LIST_PAGE_SIZE));
  const charlaPage = Math.min(page, charlaTotalPages);
  const charlasPaginated = sortedFilteredCharlas.slice(
    (charlaPage - 1) * LIST_PAGE_SIZE,
    charlaPage * LIST_PAGE_SIZE,
  );

  const attendanceTrend = useMemo(
    () => buildAttendanceTrendFromResumen(charlasPaginated),
    [charlasPaginated],
  );

  const confTotalPages = Math.max(1, Math.ceil(filteredConfirmandos.length / LIST_PAGE_SIZE));
  const confPage = Math.min(page, confTotalPages);
  const confirmandosPaginated = filteredConfirmandos.slice(
    (confPage - 1) * LIST_PAGE_SIZE,
    confPage * LIST_PAGE_SIZE,
  );

  const exportRowsCharla = () =>
    sortedFilteredCharlas.map((c) => ({
      Charla: c.titulo,
      Fecha: c.fecha,
      Tipo: c.tipo,
      Grupo: c.grupo ?? "—",
      Presentes: c.presentes,
      Ausentes: c.ausentes,
      Total: c.total_confirmandos,
      "%": `${c.pct}%`,
    }));

  const exportRowsConf = () =>
    filteredConfirmandos.map((c) => ({
      Confirmando: c.full_name,
      Grupo: c.grupo ?? "—",
      Asistidas: c.asistidas,
      Ausencias: c.ausencias,
      Total: c.total_sesiones,
      "%": `${c.pct}%`,
    }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 max-md:w-full max-md:px-1">
          <Button
            size="sm"
            variant={subTab === "charla" ? "default" : "outline"}
            className="max-md:flex-1"
            onClick={() => {
              setSubTab("charla");
              setPage(1);
            }}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Por charla
          </Button>
          <Button
            size="sm"
            variant={subTab === "confirmando" ? "default" : "outline"}
            className="max-md:flex-1"
            onClick={() => {
              setSubTab("confirmando");
              setPage(1);
            }}
          >
            <Users className="mr-2 h-4 w-4" />
            Por confirmando
          </Button>
        </div>
        <div className="flex items-center gap-2 max-md:w-full max-md:px-1">
          <Select
            value={groupFilter || "all"}
            onValueChange={(v) => {
              setGroupFilter(v === "all" ? "" : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="min-w-0 flex-1 sm:w-[200px] sm:flex-none">
              <SelectValue placeholder="Todos los grupos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los grupos</SelectItem>
              {grupos.map((g) => (
                <SelectItem key={g.id} value={g.nombre ?? ""}>
                  {g.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            className="max-md:flex-1"
            onClick={() => {
              if (subTab === "charla") {
                runExport("xlsx", "Asistencia por Charla", exportRowsCharla(), "asistencia-charla");
              } else {
                runExport(
                  "xlsx",
                  "Asistencia por Confirmando",
                  exportRowsConf(),
                  "asistencia-confirmando",
                );
              }
            }}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>

      <AttendanceTrendChart data={attendanceTrend} isLoading={loadingCharlas} className="hidden md:block" />

      {/* ── Por charla ── */}
      {subTab === "charla" && (
        <div className="space-y-3">
          <div className="hidden md:block overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Charla</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Presentes</TableHead>
                  <TableHead>Ausentes</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingCharlas ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredCharlas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No hay charlas registradas.
                    </TableCell>
                  </TableRow>
                ) : (
                  charlasPaginated.map((c) => (
                    <TableRow key={c.charla_id}>
                      <TableCell className="font-medium">{c.titulo}</TableCell>
                      <TableCell>{formatDate(c.fecha)}</TableCell>
                      <TableCell className="capitalize">{c.tipo}</TableCell>
                      <TableCell>{c.grupo ?? "—"}</TableCell>
                      <TableCell>{c.presentes}</TableCell>
                      <TableCell>{c.ausentes}</TableCell>
                      <TableCell>{c.total_confirmandos}</TableCell>
                      <TableCell>
                        <Badge className={attendanceColor(c.pct)}>{c.pct}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {loadingCharlas
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="shadow-soft">
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))
              : charlasPaginated.map((c) => (
                  <Card key={c.charla_id} className="shadow-soft">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{c.titulo}</span>
                        <Badge className={attendanceColor(c.pct)}>{c.pct}%</Badge>
                      </div>
                      <div className="flex items-start justify-between gap-2 text-sm">
                        <span className="text-muted-foreground">Fecha</span>
                        <span>{formatDate(c.fecha)}</span>
                      </div>
                      <div className="flex items-start justify-between gap-2 text-sm">
                        <span className="text-muted-foreground">Tipo</span>
                        <span className="capitalize">{c.tipo}</span>
                      </div>
                      <div className="flex items-start justify-between gap-2 text-sm">
                        <span className="text-muted-foreground">Presentes / Ausentes / Total</span>
                        <span>
                          {c.presentes} / {c.ausentes} / {c.total_confirmandos}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
          </div>
          <ListPagination
            page={charlaPage}
            totalPages={charlaTotalPages}
            total={filteredCharlas.length}
            itemLabel="charlas"
            onPageChange={setPage}
          />
        </div>
      )}

      {/* ── Por confirmando ── */}
      {subTab === "confirmando" && (
        <div className="space-y-3">
          <div className="hidden md:block overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Confirmando</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Charlas asistidas</TableHead>
                  <TableHead>Ausencias</TableHead>
                  <TableHead>Total charlas</TableHead>
                  <TableHead>%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingConf ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredConfirmandos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No hay confirmandos registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  confirmandosPaginated.map((c) => (
                    <TableRow key={c.confirmando_id}>
                      <TableCell className="font-medium">
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto p-0 font-medium"
                          onClick={() => openConfirmandoDetail(c)}
                        >
                          {c.full_name}
                        </Button>
                      </TableCell>
                      <TableCell>{c.grupo ?? "—"}</TableCell>
                      <TableCell>{c.asistidas}</TableCell>
                      <TableCell>{c.ausencias}</TableCell>
                      <TableCell>{c.total_sesiones}</TableCell>
                      <TableCell>
                        <Badge className={attendanceColor(c.pct)}>{c.pct}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {loadingConf
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="shadow-soft">
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))
              : confirmandosPaginated.map((c) => (
                  <Card
                    key={c.confirmando_id}
                    className="cursor-pointer shadow-soft transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => openConfirmandoDetail(c)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openConfirmandoDetail(c);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Ver detalle de asistencia de ${c.full_name}`}
                  >
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{c.full_name}</span>
                        <Badge className={attendanceColor(c.pct)}>{c.pct}%</Badge>
                      </div>
                      <div className="flex items-start justify-between gap-2 text-sm">
                        <span className="text-muted-foreground">Grupo</span>
                        <span>{c.grupo ?? "—"}</span>
                      </div>
                      <div className="flex items-start justify-between gap-2 text-sm">
                        <span className="text-muted-foreground">Asistidas / Ausencias / Total charlas</span>
                        <span>
                          {c.asistidas} / {c.ausencias} / {c.total_sesiones}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={c.pct} className="flex-1" />
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {c.pct}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
          </div>
          <ListPagination
            page={confPage}
            totalPages={confTotalPages}
            total={filteredConfirmandos.length}
            itemLabel="confirmandos"
            onPageChange={setPage}
          />
        </div>
      )}

      <ConfirmandoAttendanceDetail
        confirmandoId={selectedConfirmando?.confirmando_id ?? null}
        fullName={selectedConfirmando?.full_name ?? null}
        grupo={selectedConfirmando?.grupo ?? null}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}

/* ================================================================== */
/*  Pagos                                                             */
/* ================================================================== */

function PagosSection() {
  const { canSeePagos } = useAuth();
  const [subTab, setSubTab] = useState<"retiro" | "boleta">("retiro");
  const [page, setPage] = useState(1);
  const concepto = subTab;
  const conceptOf = subTab === "retiro" ? "del Retiro" : "de la Boleta";
  const { data: pagos = [], isLoading: loadingPagos } = usePagosPorConcepto(concepto);
  const { data: costo } = useCostoPorConcepto(concepto);
  const { data: confirmandos = [] } = useConfirmandos();
  const costMonto = Number(costo?.monto ?? 0);
  const costConfigured = costMonto > 0;

  const balances = useMemo(
    () => buildBalance(pagos, confirmandos, costMonto),
    [pagos, confirmandos, costMonto],
  );
  const { totalRecaudado, metaTotal, pendienteTotal } = useMemo(
    () => buildTotals(balances, costMonto, confirmandos.length),
    [balances, costMonto, confirmandos.length],
  );
  const paymentStatus = useMemo(
    () => buildPaymentStatusBreakdown(balances, costMonto),
    [balances, costMonto],
  );
  const paymentMethods = useMemo(() => buildPaymentMethodBreakdown(pagos), [pagos]);

  if (!canSeePagos) {
    return (
      <Card className="shadow-soft">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="font-medium text-foreground">Acceso restringido</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No tenés permisos para ver la información de pagos.
          </p>
        </CardContent>
      </Card>
    );
  }

  const exportRows = () =>
    balances.map((b) => ({
      Confirmando: b.full_name,
      Total: Number(costo?.monto ?? 0),
      Abonado: b.abonado,
      Pendiente: b.pendiente,
      "%": `${Math.round(b.pct)}%`,
    }));

  const totalPages = Math.max(1, Math.ceil(balances.length / LIST_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedBalances = balances.slice(
    (currentPage - 1) * LIST_PAGE_SIZE,
    currentPage * LIST_PAGE_SIZE,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 max-md:w-full">
          <Button
            size="sm"
            variant={subTab === "retiro" ? "default" : "outline"}
            className="max-md:flex-1"
            onClick={() => {
              setSubTab("retiro");
              setPage(1);
            }}
          >
            <Wallet className="mr-2 h-4 w-4" />
            Retiro
          </Button>
          <Button
            size="sm"
            variant={subTab === "boleta" ? "default" : "outline"}
            className="max-md:flex-1"
            onClick={() => {
              setSubTab("boleta");
              setPage(1);
            }}
          >
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Boleta
          </Button>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="max-md:flex-1"
          onClick={() => runExport("xlsx", `Pagos ${subTab}`, exportRows(), `pagos-${subTab}`)}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Excel
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Recaudado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display text-2xl font-semibold text-success">
              {formatCurrency(totalRecaudado)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display text-2xl font-semibold text-warning">
              {formatCurrency(pendienteTotal)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Meta total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display text-2xl font-semibold">{formatCurrency(metaTotal)}</div>
            <Progress className="mt-2" value={metaTotal ? (totalRecaudado / metaTotal) * 100 : 0} />
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <CategoryDonutChart
          data={paymentStatus}
          isLoading={loadingPagos}
          title="Estado de pago"
          description={`Distribución de confirmandos según su pago ${conceptOf}.`}
          emptyTitle={
            costConfigured ? "Sin confirmandos para mostrar" : `Costo ${conceptOf} sin configurar`
          }
          emptyDescription={
            costConfigured
              ? "La distribución aparecerá cuando haya confirmandos registrados."
              : `Configurá el costo ${conceptOf} para que este gráfico aplique.`
          }
          centerLabel="confirmandos"
          tooltipValueFormatter={(value) => `${value} confirmandos`}
          summaryUnit="confirmandos"
          legendAriaLabel="Detalle por estado de pago"
          showPercentage
        />
        <CategoryDonutChart
          data={paymentMethods}
          isLoading={loadingPagos}
          title="Métodos de pago"
          description={`Recaudación ${conceptOf} según el método utilizado.`}
          emptyTitle="Sin pagos registrados"
          emptyDescription="La distribución aparecerá cuando se registren pagos."
          centerLabel="recaudado"
          centerValueFormatter={(total) => compactCurrency.format(total)}
          tooltipValueFormatter={(value) => formatCurrency(value)}
          valueFormatter={(value) => formatCurrency(value)}
          summaryText={(total) => `Recaudación total: ${formatCurrency(total)}`}
          legendAriaLabel="Detalle por método de pago"
          showPercentage
        />
      </div>

      {/* Balance table */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Estado por confirmando</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Confirmando</TableHead>
                  <TableHead>Abonado</TableHead>
                  <TableHead>Pendiente</TableHead>
                  <TableHead className="min-w-[12rem]">Cumplimiento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingPagos ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : balances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No hay confirmandos registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedBalances.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.full_name}</TableCell>
                      <TableCell>{formatCurrency(b.abonado)}</TableCell>
                      <TableCell
                        className={b.pendiente === 0 ? "text-success font-medium" : "text-warning"}
                      >
                        {formatCurrency(b.pendiente)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={b.pct} className="flex-1" />
                          <span className="text-xs text-muted-foreground w-10 text-right">
                            {Math.round(b.pct)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {loadingPagos
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="shadow-soft">
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))
              : paginatedBalances.map((b) => (
                  <Card key={b.id} className="shadow-soft">
                    <CardContent className="p-4 space-y-2">
                      <span className="font-semibold">{b.full_name}</span>
                      <div className="flex items-start justify-between gap-2 text-sm">
                        <span className="text-muted-foreground">Abonado</span>
                        <span>{formatCurrency(b.abonado)}</span>
                      </div>
                      <div className="flex items-start justify-between gap-2 text-sm">
                        <span className="text-muted-foreground">Pendiente</span>
                        <span
                          className={
                            b.pendiente === 0 ? "text-success font-medium" : "text-warning"
                          }
                        >
                          {formatCurrency(b.pendiente)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Progress value={b.pct} className="flex-1" />
                        <span className="text-xs text-muted-foreground w-10 text-right">
                          {Math.round(b.pct)}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
          </div>
          <ListPagination
            page={currentPage}
            totalPages={totalPages}
            total={balances.length}
            itemLabel="confirmandos"
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}

/* ================================================================== */
/*  Requisitos                                                        */
/* ================================================================== */

function RequisitosSection() {
  const [subTab, setSubTab] = useState<"confirmando" | "padrino">("confirmando");
  const [page, setPage] = useState(1);
  const { data: confirmandos = [], isLoading: loadingConf } = useConfirmandos();
  const { data: padrinos = [], isLoading: loadingPadrinos } = usePadrinos();
  const { data: asistencias = [], isLoading: loadingAsist } = useAsistenciaPorConfirmando();
  const { data: pagos = [] } = usePagosPorConcepto("retiro");
  const { data: costo } = useCostoPorConcepto("retiro");

  const balances = useMemo(
    () => buildBalance(pagos, confirmandos, Number(costo?.monto ?? 0)),
    [pagos, confirmandos, costo],
  );

  const confTotalPages = Math.max(1, Math.ceil(confirmandos.length / LIST_PAGE_SIZE));
  const confPage = Math.min(page, confTotalPages);
  const confirmandosPaginated = confirmandos.slice(
    (confPage - 1) * LIST_PAGE_SIZE,
    confPage * LIST_PAGE_SIZE,
  );

  const padTotalPages = Math.max(1, Math.ceil(padrinos.length / LIST_PAGE_SIZE));
  const padPage = Math.min(page, padTotalPages);
  const padrinosPaginated = padrinos.slice(
    (padPage - 1) * LIST_PAGE_SIZE,
    padPage * LIST_PAGE_SIZE,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 max-md:w-full">
          <Button
            size="sm"
            variant={subTab === "confirmando" ? "default" : "outline"}
            className="max-md:flex-1"
            onClick={() => {
              setSubTab("confirmando");
              setPage(1);
            }}
          >
            <Users className="mr-2 h-4 w-4" />
            Confirmandos
          </Button>
          <Button
            size="sm"
            variant={subTab === "padrino" ? "default" : "outline"}
            className="max-md:flex-1"
            onClick={() => {
              setSubTab("padrino");
              setPage(1);
            }}
          >
            <Users className="mr-2 h-4 w-4" />
            Padrinos
          </Button>
        </div>
      </div>

      {/* ── Confirmandos ── */}
      {subTab === "confirmando" && (
        <div className="space-y-3">
          <div className="hidden md:block overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Confirmando</TableHead>
                  <TableHead>Bautismo</TableHead>
                  <TableHead>Comunión</TableHead>
                  <TableHead>Padrino</TableHead>
                  <TableHead>Datos completos</TableHead>
                  <TableHead>Asist. &gt;75%</TableHead>
                  <TableHead>Pago retiro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingConf || loadingAsist ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : confirmandos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No hay confirmandos registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  confirmandosPaginated.map((c) => {
                    const datosOk = !!(c.dni && c.direccion && c.contacto_padres);
                    const asistPct = asistencias.find((a) => a.confirmando_id === c.id)?.pct ?? 0;
                    const pagoOk = (balances.find((b) => b.id === c.id)?.pct ?? 0) >= 100;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.full_name}</TableCell>
                        <TableCell>
                          {c.has_baptism ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell>
                          {c.has_communion ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell>
                          {c.padrino_id ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell>
                          {datosOk ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell>
                          {asistPct >= 75 ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-warning" />
                          )}
                        </TableCell>
                        <TableCell>
                          {pagoOk ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {/* Mobile checklist cards */}
          <div className="md:hidden space-y-3">
            {loadingConf
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="shadow-soft">
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))
              : confirmandosPaginated.map((c) => {
                  const datosOk = !!(c.dni && c.direccion && c.contacto_padres);
                  const asistPct = asistencias.find((a) => a.confirmando_id === c.id)?.pct ?? 0;
                  const pagoOk = (balances.find((b) => b.id === c.id)?.pct ?? 0) >= 100;
                  return (
                    <Card key={c.id} className="shadow-soft">
                      <CardContent className="p-4 space-y-2">
                        <span className="font-semibold">{c.full_name}</span>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground truncate">Bautismo</span>
                            <span className="shrink-0">{c.has_baptism ? "✅" : "❌"}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground truncate">Comunión</span>
                            <span className="shrink-0">{c.has_communion ? "✅" : "❌"}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground truncate">Padrino</span>
                            <span className="shrink-0">{c.padrino_id ? "✅" : "❌"}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground truncate">Datos</span>
                            <span className="shrink-0">{datosOk ? "✅" : "❌"}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground truncate">
                              Asistencia &gt;75%
                            </span>
                            <span className="shrink-0">{asistPct >= 75 ? "✅" : "⚠️"}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground truncate">Pago retiro</span>
                            <span className="shrink-0">{pagoOk ? "✅" : "❌"}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
          </div>
          <ListPagination
            page={confPage}
            totalPages={confTotalPages}
            total={confirmandos.length}
            itemLabel="confirmandos"
            onPageChange={setPage}
          />
        </div>
      )}

      {/* ── Padrinos ── */}
      {subTab === "padrino" && (
        <div className="space-y-3">
          <div className="hidden md:block overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Padrino</TableHead>
                  <TableHead>Confirmado</TableHead>
                  <TableHead>Casado por Iglesia</TableHead>
                  <TableHead>Datos completos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingPadrinos ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : padrinos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No hay padrinos registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  padrinosPaginated.map((p) => {
                    const datosOk = !!(p.dni && p.telefono && p.email);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.full_name}</TableCell>
                        <TableCell>
                          {p.has_confirmation ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell>
                          {p.is_married_church === null ? (
                            <MinusCircle className="h-4 w-4 text-muted-foreground" />
                          ) : p.is_married_church ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell>
                          {datosOk ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {loadingPadrinos
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="shadow-soft">
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))
              : padrinosPaginated.map((p) => {
                  const datosOk = !!(p.dni && p.telefono && p.email);
                  return (
                    <Card key={p.id} className="shadow-soft">
                      <CardContent className="p-4 space-y-2">
                        <span className="font-semibold">{p.full_name}</span>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground truncate">Confirmado</span>
                            <span className="shrink-0">{p.has_confirmation ? "✅" : "❌"}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground truncate">
                              Casado por Iglesia
                            </span>
                            <span className="shrink-0">
                              {p.is_married_church === null
                                ? "N/A"
                                : p.is_married_church
                                  ? "✅"
                                  : "❌"}
                            </span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground truncate">Datos completos</span>
                            <span className="shrink-0">{datosOk ? "✅" : "❌"}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
          </div>
          <ListPagination
            page={padPage}
            totalPages={padTotalPages}
            total={padrinos.length}
            itemLabel="padrinos"
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Exportar (legacy)                                                 */
/* ================================================================== */

interface ReporteDef {
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  data: () => Record<string, unknown>[];
  filename: string;
}

function ExportarSection() {
  const { canSeePagos } = useAuth();
  const { data: confirmandos = [] } = useConfirmandos();
  const { data: pagos = [] } = usePagosPorConcepto("retiro");

  const pendientes = confirmandos.filter((c) => c.status === "activo");
  const aptos = confirmandos.filter((c) => c.status === "apto" || c.status === "confirmado");
  const sinBautismo = confirmandos.filter((c) => !c.has_baptism);

  const reportes: ReporteDef[] = [
    {
      title: "Listado completo de confirmandos",
      desc: `${confirmandos.length} registros con grupo, padrino y sacramentos.`,
      icon: Users,
      data: () =>
        confirmandos.map((c) => ({
          Nombre: c.full_name,
          CI: c.dni,
          Grupo: c.grupos?.nombre,
          Padrino: c.padrinos?.full_name,
          Bautismo: c.has_baptism ? "Sí" : "No",
          Comunión: c.has_communion ? "Sí" : "No",
          Estado: c.status,
        })),
      filename: "confirmandos-completo",
    },
    {
      title: "Confirmandos pendientes de aptitud",
      desc: `${pendientes.length} jóvenes aún en formación activa.`,
      icon: AlertTriangle,
      data: () =>
        pendientes.map((c) => ({
          Nombre: c.full_name,
          CI: c.dni,
          Bautismo: c.has_baptism ? "Sí" : "Falta",
          Comunión: c.has_communion ? "Sí" : "Falta",
          Padrino: c.padrinos?.full_name ?? "Sin asignar",
        })),
      filename: "pendientes-aptitud",
    },
    {
      title: "Confirmandos aptos / confirmados",
      desc: `${aptos.length} listos o ya confirmados.`,
      icon: ClipboardCheck,
      data: () =>
        aptos.map((c) => ({
          Nombre: c.full_name,
          CI: c.dni,
          Estado: c.status,
          Fecha_confirmación: c.fecha_confirmacion ?? "—",
        })),
      filename: "aptos-confirmados",
    },
    {
      title: "Confirmandos sin bautismo registrado",
      desc: `${sinBautismo.length} requieren completar requisito.`,
      icon: AlertTriangle,
      data: () =>
        sinBautismo.map((c) => ({
          Nombre: c.full_name,
          CI: c.dni,
          Contacto: c.contacto_padres ?? c.telefono,
        })),
      filename: "sin-bautismo",
    },
    ...(canSeePagos
      ? [
          {
            title: "Historial completo de pagos",
            desc: `${pagos.length} transacciones registradas.`,
            icon: Wallet,
            data: () =>
              pagos.map((p) => ({
                Fecha: p.fecha,
                Confirmando: p.confirmandos?.full_name,
                Monto: p.monto,
                Método: p.metodo,
                Referencia: p.referencia ?? "",
              })),
            filename: "pagos-historial",
          },
        ]
      : []),
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {reportes.map((r) => (
        <Card key={r.title} className="shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                <r.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">{r.title}</CardTitle>
                <CardDescription className="text-xs">{r.desc}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => runExport("xlsx", r.title, r.data(), r.filename)}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => runExport("pdf", r.title, r.data(), r.filename)}
            >
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => runExport("csv", r.title, r.data(), r.filename)}
            >
              <FileType className="mr-2 h-4 w-4" />
              CSV
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Main Page                                                         */
/* ================================================================== */

function ReportesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Asistencia, pagos, requisitos y exportaciones.
        </p>
      </div>

      <Tabs defaultValue="asistencia">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-2xl p-1.5 sm:inline-flex sm:h-10 sm:flex-wrap sm:rounded-full sm:p-1 sm:gap-0 [&>button]:min-w-0 [&>button]:w-full [&>button]:px-2 sm:[&>button]:w-auto sm:[&>button]:px-4 [&>button_svg]:shrink-0">
          <TabsTrigger value="asistencia">
            <ClipboardList className="mr-2 h-4 w-4" />
            Asistencia
          </TabsTrigger>
          <TabsTrigger value="pagos">
            <Wallet className="mr-2 h-4 w-4" />
            Pagos
          </TabsTrigger>
          <TabsTrigger value="requisitos">
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Requisitos
          </TabsTrigger>
          <TabsTrigger value="exportar">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="asistencia">
          <AsistenciaSection />
        </TabsContent>

        <TabsContent value="pagos">
          <PagosSection />
        </TabsContent>

        <TabsContent value="requisitos">
          <RequisitosSection />
        </TabsContent>

        <TabsContent value="exportar">
          <ExportarSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
