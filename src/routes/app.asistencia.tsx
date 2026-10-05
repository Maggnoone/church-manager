import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDateTime, exportToCSV, exportToXLSX, exportToPDF } from "@/lib/export";
import { ClipboardCheck, Download, FileSpreadsheet, FileText } from "lucide-react";
import { useCharlasList, useConfirmandosActivos, useAsistencia, useGruposSimple } from "@/hooks/use-data";
import { ListPagination, LIST_PAGE_SIZE } from "@/components/ListPagination";
import { useAuth } from "@/hooks/use-auth";
import type { Asistencia } from "@/integrations/supabase/types";
import { getAttendanceExportDate } from "@/lib/attendance-export-data";

export const Route = createFileRoute("/app/asistencia")({ component: AsistenciaPage });

function AsistenciaPage() {
  const qc = useQueryClient();
  const [charlaId, setCharlaId] = useState<string>("");
  const [grupoFilter, setGrupoFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const { user } = useAuth();

  const { data: charlas = [] } = useCharlasList();
  const { data: confirmandos = [] } = useConfirmandosActivos();
  const { data: asistencia = [] } = useAsistencia(charlaId);
  const { data: grupos = [] } = useGruposSimple();

  const asistMap = useMemo(() => {
    const m = new Map<string, Asistencia>();
    asistencia.forEach((a) => m.set(a.confirmando_id, a));
    return m;
  }, [asistencia]);

  const toggle = useMutation({
    mutationFn: async ({ confirmando_id, presente }: { confirmando_id: string; presente: boolean }) => {
      const existing = asistMap.get(confirmando_id);
      if (existing?.id) {
        const { error } = await supabase.from("asistencia").update({ presente }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("asistencia")
          .insert({ charla_id: charlaId, confirmando_id, presente, registered_by: user?.id });
        if (error) throw error;
      }
    },
    onMutate: async ({ confirmando_id, presente }) => {
      await qc.cancelQueries({ queryKey: ["asistencia", charlaId] });
      const previous = qc.getQueryData<Asistencia[]>(["asistencia", charlaId]);
      qc.setQueryData<Asistencia[]>(["asistencia", charlaId], (old = []) => {
        const exists = old.some((a) => a.confirmando_id === confirmando_id);
        return exists
          ? old.map((a) => (a.confirmando_id === confirmando_id ? { ...a, presente } : a))
          : [...old, { confirmando_id, presente, charla_id: charlaId } as Asistencia];
      });
      return { previous };
    },
    onError: (e: Error, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(["asistencia", charlaId], ctx.previous);
      toast.error(e.message);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["asistencia", charlaId] });
      qc.invalidateQueries({ queryKey: ["asistencias"] });
      qc.invalidateQueries({ queryKey: ["asistencia-resumen"] });
      qc.invalidateQueries({ queryKey: ["asistencia-por-confirmando"] });
    },
  });

  const filteredConfirmandos = useMemo(() => {
    if (grupoFilter === "all") return confirmandos;
    return confirmandos.filter((c) => c.group_id === grupoFilter);
  }, [confirmandos, grupoFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredConfirmandos.length / LIST_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedConfirmandos = filteredConfirmandos.slice(
    (currentPage - 1) * LIST_PAGE_SIZE,
    currentPage * LIST_PAGE_SIZE,
  );

  const presentes = useMemo(() => {
    return filteredConfirmandos.filter((c) => asistMap.get(c.id)?.presente).length;
  }, [filteredConfirmandos, asistMap]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [charlaId, grupoFilter]);

  const charlaSeleccionada = charlas.find((c) => c.id === charlaId);

  const exportData = useMemo(() => {
    if (!charlaId || filteredConfirmandos.length === 0) return [];
    return filteredConfirmandos.map((c) => {
      const a = asistMap.get(c.id);
      return {
        Confirmando: c.full_name,
        Grupo: c.grupos?.nombre ?? "Sin grupo",
        Estado: a?.presente ? "Presente" : "Ausente",
        "Fecha y hora de charla": getAttendanceExportDate(charlaSeleccionada, a),
      };
    });
  }, [charlaId, charlaSeleccionada, filteredConfirmandos, asistMap]);

  const handleExportCSV = () => {
    if (!exportData.length) { toast.error("No hay datos para exportar"); return; }
    const filename = `asistencia-${charlaSeleccionada?.titulo || "charla"}-${new Date().toISOString().split("T")[0]}`;
    exportToCSV(exportData, filename);
    toast.success("CSV exportado correctamente");
  };

  const handleExportXLSX = () => {
    if (!exportData.length) { toast.error("No hay datos para exportar"); return; }
    const filename = `asistencia-${charlaSeleccionada?.titulo || "charla"}-${new Date().toISOString().split("T")[0]}`;
    exportToXLSX(exportData, filename, "Asistencia");
    toast.success("Excel exportado correctamente");
  };

  const handleExportPDF = () => {
    if (!exportData.length) { toast.error("No hay datos para exportar"); return; }
    const filename = `asistencia-${charlaSeleccionada?.titulo || "charla"}-${new Date().toISOString().split("T")[0]}`;
    const columns = ["Confirmando", "Grupo", "Estado", "Fecha y hora de charla"];
    const rows = exportData.map((item) => [item["Confirmando"], item["Grupo"], item["Estado"], item["Fecha y hora de charla"]]);
    const subtitle = `Charla: ${charlaSeleccionada?.titulo || "—"} | ${formatDateTime(charlaSeleccionada?.fecha)} | ${presentes}/${filteredConfirmandos.length} presentes`;
    exportToPDF("Reporte de Asistencia", columns, rows, filename, subtitle, (data) => {
      const text = data.cell.text.join(" ");
      if (data.column.index === 2 && text === "Ausente") {
        data.cell.styles.textColor = [220, 38, 38];
        data.cell.styles.fontStyle = "bold";
      }
      if (data.column.index === 2 && text === "Presente") {
        data.cell.styles.fontStyle = "bold";
      }
    });
    toast.success("PDF exportado correctamente");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Pase de Lista</h1>
        <p className="text-sm text-muted-foreground">Selecciona una sesión y marca la asistencia. Optimizado para móvil.</p>
      </div>

      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-base">Sesión</CardTitle></CardHeader>
        <CardContent>
          <Select value={charlaId} onValueChange={setCharlaId}>
            <SelectTrigger className="min-w-0 gap-2 overflow-hidden [&>span]:min-w-0 [&>span]:flex-1 [&>svg]:shrink-0"><SelectValue placeholder="Selecciona una charla" /></SelectTrigger>
            <SelectContent className="max-w-[calc(100vw-2rem)]">
              {charlas.map((c) => (
                <SelectItem key={c.id} value={c.id} className="min-w-0 items-start py-2 text-left [&>span:last-child]:min-w-0 [&>span:last-child]:flex-1 [&>span:last-child]:whitespace-normal [&>span:last-child]:break-words [&>span:last-child]:line-clamp-2 [&>span:last-child]:leading-snug max-[375px]:[&>span:last-child]:text-[13px]">{formatDateTime(c.fecha)} — {c.titulo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {charlaId && (
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
            <div className="space-y-2 min-w-0 flex-1">
              <CardTitle className="text-base flex items-center gap-2 min-w-0"><ClipboardCheck className="h-4 w-4 shrink-0" /> Confirmandos</CardTitle>
              <Select value={grupoFilter} onValueChange={setGrupoFilter}>
                <SelectTrigger className="w-full sm:w-[240px]">
                  <SelectValue placeholder="Todos los grupos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los grupos</SelectItem>
                  {grupos.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <Badge className="bg-success hover:bg-success/90 text-success-foreground max-sm:flex-1 max-sm:justify-center">{presentes} presentes</Badge>
              <Badge variant="destructive" className="max-sm:flex-1 max-sm:justify-center">{filteredConfirmandos.length - presentes} ausentes</Badge>
              <div className="flex flex-wrap items-center gap-1 max-md:w-full max-md:px-1">
                <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!exportData.length} className="px-2 sm:px-3 rounded-md max-md:flex-1"><Download className="h-4 w-4" /><span className="ml-1">CSV</span></Button>
                <Button variant="outline" size="sm" onClick={handleExportXLSX} disabled={!exportData.length} className="px-2 sm:px-3 rounded-md max-md:flex-1"><FileSpreadsheet className="h-4 w-4" /><span className="ml-1">Excel</span></Button>
                <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={!exportData.length} className="px-2 sm:px-3 rounded-md max-md:flex-1"><FileText className="h-4 w-4" /><span className="ml-1">PDF</span></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {paginatedConfirmandos.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No hay confirmandos en este grupo.</p>
            ) : (
              paginatedConfirmandos.map((c) => {
                const a = asistMap.get(c.id);
                return (
                  <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg border bg-card p-3 shadow-soft max-[375px]:gap-1.5 max-[375px]:rounded-md max-[375px]:p-2">
                    <div className="min-w-0 flex-1 pr-2 max-[375px]:pr-1">
                      <span className="block min-w-0 break-words font-medium text-[15px] leading-snug line-clamp-2 sm:line-clamp-none sm:truncate sm:text-base max-[375px]:text-[13px] max-[375px]:leading-tight">{c.full_name}</span>
                      <span className="block truncate text-xs text-muted-foreground max-[375px]:text-[11px]">{c.grupos?.nombre ?? "Sin grupo"}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 max-[375px]:gap-1.5">
                      <span className={`text-xs font-semibold max-[375px]:text-[11px] ${a?.presente ? "text-success" : "text-destructive"}`}>{a?.presente ? "Presente" : "Ausente"}</span>
                      <Switch checked={!!a?.presente} onCheckedChange={(v) => toggle.mutate({ confirmando_id: c.id, presente: v })} />
                    </div>
                  </div>
                );
              })
            )}
            <ListPagination
              page={currentPage}
              totalPages={totalPages}
              total={filteredConfirmandos.length}
              itemLabel="confirmandos"
              onPageChange={setPage}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
