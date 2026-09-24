import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAsistenciaHistorial } from "@/hooks/use-data";
import { buildConfirmandoAttendanceTrend } from "@/lib/dashboard-chart-data";
import { AttendanceTrendChart } from "./attendance-trend-chart";
import { ListPagination } from "@/components/ListPagination";
import { formatDateTime, exportToPDF } from "@/lib/export";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, CheckCircle2, XCircle, BarChart3, FileDown } from "lucide-react";

interface ConfirmandoAttendanceDetailProps {
  confirmandoId: string | null;
  fullName: string | null;
  grupo: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CHART_PAGE_SIZE = 5;

export function ConfirmandoAttendanceDetail({
  confirmandoId,
  fullName,
  grupo,
  open,
  onOpenChange,
}: ConfirmandoAttendanceDetailProps) {
  const { data: historial = [], isLoading, error } = useAsistenciaHistorial(confirmandoId);

  const trend = useMemo(
    () =>
      buildConfirmandoAttendanceTrend(
        historial
          .filter((h) => h.charlas !== null)
          .map((h) => ({
            charla_id: h.charla_id,
            titulo: h.charlas!.titulo,
            fecha: h.charlas!.fecha,
            presente: h.presente,
          })),
      ),
    [historial],
  );

  const [chartPage, setChartPage] = useState(1);
  const chartTotalPages = Math.max(1, Math.ceil(trend.length / CHART_PAGE_SIZE));

  useEffect(() => {
    setChartPage(1);
  }, [confirmandoId, open]);

  useEffect(() => {
    if (chartPage > chartTotalPages) {
      setChartPage(chartTotalPages);
    }
  }, [chartPage, chartTotalPages]);

  const chartSlice = trend.slice((chartPage - 1) * CHART_PAGE_SIZE, chartPage * CHART_PAGE_SIZE);

  const total = historial.length;
  const presentes = historial.filter((h) => h.presente).length;
  const ausentes = total - presentes;
  const pct = total > 0 ? Math.round((presentes / total) * 100) : 0;

  const handleExportPDF = () => {
    if (total === 0) return;
    const columns = ["Charla", "Fecha y hora de charla", "Tipo", "Estado"];
    const rows = historial.map((h) => [
      h.charlas?.titulo ?? "—",
      h.charlas?.fecha ? formatDateTime(h.charlas.fecha) : "—",
      h.charlas?.tipo ?? "—",
      h.presente ? "Presente" : "Ausente",
    ]);
    const subtitle = `Grupo: ${grupo ?? "Sin grupo"} | ${total} encuentros | ${presentes} presentes | ${ausentes} ausentes | ${pct}% asistencia`;
    const filename = `asistencia-${fullName ?? "confirmando"}-${new Date().toISOString().split("T")[0]}`;
    exportToPDF(
      `Historial de Asistencia - ${fullName ?? "Confirmando"}`,
      columns,
      rows,
      filename,
      subtitle,
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg md:max-w-xl p-0">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            <SheetHeader className="space-y-1 text-left">
              <SheetTitle className="text-lg font-semibold">{fullName ?? "Confirmando"}</SheetTitle>
              <SheetDescription>
                {grupo ? `Grupo: ${grupo}` : "Sin grupo asignado"} · Detalle de asistencia
              </SheetDescription>
            </SheetHeader>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={total === 0}>
                <FileDown className="mr-2 h-4 w-4" />
                Descargar PDF
              </Button>
            </div>

            {isLoading && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                  ))}
                </div>
                <Skeleton className="h-72 w-full rounded-lg" />
                <Skeleton className="h-40 w-full rounded-lg" />
              </div>
            )}

            {error && !isLoading && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
                <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
                <p className="font-medium text-destructive">Error al cargar el historial</p>
                <p className="text-sm text-muted-foreground">
                  Intentá de nuevo más tarde o contactá al administrador.
                </p>
              </div>
            )}

            {!isLoading && !error && (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="shadow-soft">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Encuentros
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-semibold">{total}</div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-soft">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        Presentes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-semibold text-success">{presentes}</div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-soft">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <XCircle className="h-3.5 w-3.5 text-destructive" />
                        Ausencias
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-semibold text-destructive">{ausentes}</div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-soft">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <BarChart3 className="h-3.5 w-3.5" />
                        Asistencia
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-semibold">{pct}%</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Trend chart */}
                <AttendanceTrendChart data={chartSlice} isLoading={false} className="shadow-soft" />
                <ListPagination
                  page={chartPage}
                  totalPages={chartTotalPages}
                  total={trend.length}
                  itemLabel="fechas de asistencia"
                  onPageChange={setChartPage}
                  pageSize={CHART_PAGE_SIZE}
                />

                {/* Sessions table / cards */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Registro por encuentro
                  </h3>

                  {total === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border p-8 text-center">
                      <p className="font-medium text-foreground">Sin registros de asistencia</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        No hay charlas pasadas con asistencia cargada para este confirmando.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="hidden md:block overflow-x-auto rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Charla</TableHead>
                              <TableHead>Fecha y hora de charla</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Estado</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {historial.map((h) => (
                              <TableRow key={h.id}>
                                <TableCell className="font-medium">
                                  {h.charlas?.titulo ?? "—"}
                                </TableCell>
                                <TableCell>
                                  {h.charlas?.fecha ? formatDateTime(h.charlas.fecha) : "—"}
                                </TableCell>
                                <TableCell className="capitalize">
                                  {h.charlas?.tipo ?? "—"}
                                </TableCell>
                                <TableCell>
                                  {h.presente ? (
                                    <Badge className="bg-emerald-100 text-emerald-700">
                                      <CheckCircle2 className="mr-1 h-3 w-3" />
                                      Presente
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-rose-100 text-rose-700">
                                      <XCircle className="mr-1 h-3 w-3" />
                                      Ausente
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="md:hidden space-y-3">
                        {historial.map((h) => (
                          <Card key={h.id} className="shadow-soft">
                            <CardContent className="p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-sm">
                                  {h.charlas?.titulo ?? "—"}
                                </span>
                                {h.presente ? (
                                  <Badge className="bg-emerald-100 text-emerald-700">
                                    Presente
                                  </Badge>
                                ) : (
                                  <Badge className="bg-rose-100 text-rose-700">Ausente</Badge>
                                )}
                              </div>
                              <div className="flex items-start justify-between gap-2 text-sm">
                                <span className="text-muted-foreground">Fecha y hora de charla</span>
                                <span>{h.charlas?.fecha ? formatDateTime(h.charlas.fecha) : "—"}</span>
                              </div>
                              <div className="flex items-start justify-between gap-2 text-sm">
                                <span className="text-muted-foreground">Tipo</span>
                                <span className="capitalize">{h.charlas?.tipo ?? "—"}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
