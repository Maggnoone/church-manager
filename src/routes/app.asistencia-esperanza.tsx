import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { exportToCSV, exportToXLSX, exportToPDF } from "@/lib/export";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  FileType,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMiembrosEsperanza, useAsistenciaEsperanza } from "@/hooks/use-data";
import type { AsistenciaEsperanza } from "@/hooks/use-data";
import { ListPagination, LIST_PAGE_SIZE } from "@/components/ListPagination";
import { toDateKey, getMonthGridDays, WEEKDAYS } from "@/lib/calendar-grid";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/asistencia-esperanza")({
  component: AsistenciaEsperanzaPage,
});

function AsistenciaEsperanzaPage() {
  const qc = useQueryClient();
  const { user, isAdmin, isCatequista, isSecretaria } = useAuth();
  const [month, setMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [page, setPage] = useState(1);

  const selectedKey = toDateKey(selectedDate);

  const { data: miembros = [], isLoading: loadingMiembros } = useMiembrosEsperanza();
  const { data: asistencia = [], isLoading: loadingAsistencia } = useAsistenciaEsperanza();

  const asistMap = useMemo(() => {
    const m = new Map<string, AsistenciaEsperanza>();
    asistencia.forEach((a) => {
      if (a.fecha === selectedKey) {
        m.set(a.miembro_id, a);
      }
    });
    return m;
  }, [asistencia, selectedKey]);

  const attendanceDateSet = useMemo(() => {
    const s = new Set<string>();
    asistencia.forEach((a) => s.add(a.fecha));
    return s;
  }, [asistencia]);

  const toggle = useMutation({
    mutationFn: async ({ miembro_id, presente }: { miembro_id: string; presente: boolean }) => {
      const client = supabase as unknown as SupabaseClient;
      const existing = asistMap.get(miembro_id);
      if (existing?.id) {
        const { error } = await client
          .from("asistencia_esperanza")
          .update({ presente })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await client.from("asistencia_esperanza").insert({
          miembro_id,
          fecha: selectedKey,
          presente,
          registered_by: user?.id ?? null,
        });
        if (error) throw error;
      }
    },
    onMutate: async ({ miembro_id, presente }) => {
      const queryKey = ["asistencia-esperanza"];
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<AsistenciaEsperanza[]>(queryKey);
      qc.setQueryData<AsistenciaEsperanza[]>(queryKey, (old = []) => {
        const existing = old.find((a) => a.miembro_id === miembro_id && a.fecha === selectedKey);
        if (existing) {
          return old.map((a) => (a.id === existing.id ? { ...a, presente } : a));
        }
        return [
          ...old,
          {
            id: `optimistic-${miembro_id}-${selectedKey}`,
            miembro_id,
            fecha: selectedKey,
            presente,
            notas: null,
            registered_by: user?.id ?? null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
      });
      return { previous };
    },
    onError: (e: Error, _variables, context) => {
      if (context?.previous) {
        qc.setQueryData(["asistencia-esperanza"], context.previous);
      }
      toast.error(e.message);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["asistencia-esperanza"] });
    },
  });

  const presentes = useMemo(() => {
    return miembros.filter((m) => asistMap.get(m.id)?.presente).length;
  }, [miembros, asistMap]);

  const totalPages = Math.max(1, Math.ceil(miembros.length / LIST_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedMiembros = miembros.slice(
    (currentPage - 1) * LIST_PAGE_SIZE,
    currentPage * LIST_PAGE_SIZE,
  );

  const todayKey = toDateKey(new Date());
  const isCurrentMonth =
    month.getFullYear() === new Date().getFullYear() && month.getMonth() === new Date().getMonth();

  const exportRows = useMemo(() => {
    return miembros.map((m) => {
      const a = asistMap.get(m.id);
      return {
        Nombre: m.full_name,
        Teléfono: m.telefono ?? "",
        Estado: a?.presente ? "Presente" : "Ausente",
      };
    });
  }, [miembros, asistMap]);

  const handleExportCSV = () => {
    if (!exportRows.length) {
      toast.error("No hay datos para exportar");
      return;
    }
    exportToCSV(exportRows, `asistencia-esperanza-${selectedKey}`);
  };

  const handleExportXLSX = () => {
    if (!exportRows.length) {
      toast.error("No hay datos para exportar");
      return;
    }
    exportToXLSX(exportRows, `asistencia-esperanza-${selectedKey}`, "Asistencia");
  };

  const handleExportPDF = () => {
    if (!exportRows.length) {
      toast.error("No hay datos para exportar");
      return;
    }
    const columns = ["Nombre", "Teléfono", "Estado"];
    const rows = exportRows.map((r) => [r.Nombre, r.Teléfono, r.Estado]);
    const formattedDate = selectedDate.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const subtitle = `Fecha: ${formattedDate} | ${presentes}/${miembros.length} presentes`;
    exportToPDF(
      "Asistencia Esperanza",
      columns,
      rows,
      `asistencia-esperanza-${selectedKey}`,
      subtitle,
      (data) => {
        const text = data.cell.text.join(" ");
        if (data.column.index === 2 && text === "Ausente") {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = "bold";
        }
        if (data.column.index === 2 && text === "Presente") {
          data.cell.styles.fontStyle = "bold";
        }
      },
    );
  };

  const isLoading = loadingMiembros || loadingAsistencia;

  if ((isCatequista || isSecretaria) && !isAdmin) return <Navigate to="/app" />;

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">Asistencia Esperanza</h1>
        <p className="text-sm text-muted-foreground">
          Se puede registrar asistencia cualquier día; solo las fechas hasta hoy están habilitadas.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportCSV}>
              <FileType className="mr-2 h-4 w-4" />
              CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportXLSX}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF}>
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Badge className="bg-success hover:bg-success/90 text-success-foreground">
          {presentes} presentes
        </Badge>
        <Badge variant="destructive">{miembros.length - presentes} ausentes</Badge>
      </div>

      <Card className="min-w-0 overflow-hidden shadow-soft">
        <CardContent className="p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-base font-semibold capitalize sm:text-lg">
              {month.toLocaleDateString("es-AR", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                aria-label="Mes anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => {
                  const today = new Date();
                  setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                  setSelectedDate(today);
                  setPage(1);
                }}
              >
                Hoy
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={isCurrentMonth}
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                aria-label="Mes siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-7 gap-0.5 sm:gap-1">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="py-1 text-center text-[10px] font-medium text-muted-foreground sm:text-xs"
              >
                {d}
              </div>
            ))}
            {getMonthGridDays(month).map((day) => {
              const key = toDateKey(day);
              const isCurrentMonth = day.getMonth() === month.getMonth();
              const isSelected = toDateKey(selectedDate) === key;
              const isToday = key === todayKey;
              const isFuture = key > todayKey;
              const hasAttendance = attendanceDateSet.has(key);

              return (
                <button
                  key={key}
                  type="button"
                  disabled={!isCurrentMonth || isFuture}
                  onClick={() => {
                    if (isCurrentMonth && !isFuture) {
                      setSelectedDate(day);
                      setPage(1);
                    }
                  }}
                  className={cn(
                    "flex min-h-8 min-w-0 flex-col items-center justify-center rounded-md border p-1 text-[10px] transition-colors sm:min-h-12 sm:p-2 sm:text-xs md:min-h-14",
                    isSelected && "border-primary bg-primary text-primary-foreground",
                    !isSelected && isToday && "border-primary",
                    !isSelected && !isToday && "border-transparent bg-secondary/40",
                    !isCurrentMonth && "invisible",
                    isFuture && "cursor-not-allowed opacity-40",
                    !isFuture && isCurrentMonth && !isSelected && "hover:bg-accent/60",
                  )}
                >
                  <span className="relative">
                    {day.getDate()}
                    {hasAttendance && !isSelected && (
                      <span className="absolute -right-1.5 -top-0.5 block h-1.5 w-1.5 rounded-full bg-primary sm:h-2 sm:w-2" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden shadow-soft">
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-base sm:text-lg">
            {selectedDate.toLocaleDateString("es-AR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-3 sm:p-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-5 w-10" />
                </div>
              ))}
            </div>
          ) : miembros.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">No hay miembros registrados.</p>
            </div>
          ) : (
            <>
              {paginatedMiembros.map((m) => {
                const a = asistMap.get(m.id);
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-2 rounded-lg border bg-card p-2 shadow-soft sm:p-3"
                  >
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-medium">{m.full_name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {m.telefono ?? "Sin teléfono"}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          a?.presente ? "text-success" : "text-destructive",
                        )}
                      >
                        {a?.presente ? "Presente" : "Ausente"}
                      </span>
                      <Switch
                        checked={!!a?.presente}
                        disabled={isSecretaria}
                        title={isSecretaria ? "Solo lectura" : undefined}
                        onCheckedChange={(v) => toggle.mutate({ miembro_id: m.id, presente: v })}
                      />
                    </div>
                  </div>
                );
              })}
              <ListPagination
                page={currentPage}
                totalPages={totalPages}
                total={miembros.length}
                itemLabel="miembros"
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
