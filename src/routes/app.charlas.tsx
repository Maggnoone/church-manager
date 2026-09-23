import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Inbox } from "lucide-react";
import { DeleteDialog } from "@/components/DeleteDialog";
import { TableSkeleton } from "@/components/TableSkeleton";
import { FieldError } from "@/components/FieldError";
import { ListPagination, LIST_PAGE_SIZE } from "@/components/ListPagination";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/export";
import { useAuth } from "@/hooks/use-auth";
import { useCharlas } from "@/hooks/use-data";
import type { Charla, CharlaInsert, SessionType } from "@/integrations/supabase/types";

export const Route = createFileRoute("/app/charlas")({ component: CharlasPage });

const schema = z.object({
  titulo: z.string().min(2).max(120),
  descripcion: z.string().max(2000).optional().or(z.literal("")),
  fecha: z.string().min(1, "Requerido"),
  duracion_min: z.coerce.number().int().min(15).max(600),
  ponente: z.string().max(120).optional().or(z.literal("")),
  ubicacion: z.string().max(120).optional().or(z.literal("")),
  tipo: z.enum(["charla", "convivencia", "retiro", "celebracion"]),
});
type FormValues = z.infer<typeof schema>;

function CharlasPage() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Charla | null>(null);

  const { data: rows = [], isLoading } = useCharlas();

  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / LIST_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = rows.slice((currentPage - 1) * LIST_PAGE_SIZE, currentPage * LIST_PAGE_SIZE);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { titulo: "", duracion_min: 60, tipo: "charla", fecha: "" },
  });

  const openNew = () => { setEditing(null); form.reset({ titulo: "", descripcion: "", duracion_min: 60, tipo: "charla", ponente: "", ubicacion: "", fecha: new Date().toISOString().slice(0, 16) }); setOpen(true); };
  const openEdit = (r: Charla) => {
    setEditing(r);
    form.reset({
      titulo: r.titulo,
      descripcion: r.descripcion ?? "",
      fecha: new Date(r.fecha).toISOString().slice(0, 16),
      duracion_min: r.duracion_min ?? 60,
      ponente: r.ponente ?? "",
      ubicacion: r.ubicacion ?? "",
      tipo: r.tipo,
    });
    setOpen(true);
  };

  const buildPayload = (v: FormValues): CharlaInsert => ({
    titulo: v.titulo,
    fecha: new Date(v.fecha).toISOString(),
    duracion_min: v.duracion_min,
    tipo: v.tipo as SessionType,
    descripcion: v.descripcion || null,
    ponente: v.ponente || null,
    ubicacion: v.ubicacion || null,
  });

  const save = useMutation({
    mutationFn: async (v: FormValues) => {
      const payload = buildPayload(v);
      const { error } = editing ? await supabase.from("charlas").update(payload).eq("id", editing.id) : await supabase.from("charlas").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Guardado"); qc.invalidateQueries({ queryKey: ["charlas"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("charlas").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Eliminada"); qc.invalidateQueries({ queryKey: ["charlas"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const tipoColor: Record<string, "default" | "secondary" | "outline"> = { retiro: "default", convivencia: "secondary", charla: "outline", celebracion: "default" };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Charlas y Encuentros</h1>
          <p className="text-sm text-muted-foreground">Itinerario formativo: catequesis, convivencias y retiro.</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nueva</Button>
      </div>

      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-base">{rows.length} sesiones</CardTitle></CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Título</TableHead><TableHead>Tipo</TableHead><TableHead>Ponente</TableHead><TableHead>Ubicación</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="py-0"><TableSkeleton cols={6} rows={5} /></TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="h-8 w-8 opacity-40" />
                      <p>No hay sesiones programadas.</p>
                      <Button size="sm" variant="outline" onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nueva sesión</Button>
                    </div>
                  </TableCell></TableRow>
                ) : paginated.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{formatDateTime(r.fecha)}</TableCell>
                    <TableCell className="font-medium">{r.titulo}</TableCell>
                    <TableCell><Badge variant={tipoColor[r.tipo] ?? "outline"}>{r.tipo}</Badge></TableCell>
                    <TableCell>{r.ponente ?? "—"}</TableCell>
                    <TableCell>{r.ubicacion ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" aria-label={`Editar charla ${r.titulo}`} onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                      {isAdmin && (
                        <DeleteDialog
                          title={`¿Eliminar charla "${r.titulo}"?`}
                          description="Esta acción eliminará permanentemente la sesión del itinerario."
                          trigger={
                            <Button size="icon" variant="ghost" aria-label={`Eliminar charla ${r.titulo}`} disabled={remove.isPending}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          }
                          onConfirm={() => remove.mutate(r.id)}
                          isPending={remove.isPending}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="shadow-soft"><CardContent className="p-4 space-y-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></CardContent></Card>
              ))
            ) : rows.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="flex flex-col items-center gap-2">
                  <Inbox className="h-8 w-8 opacity-40" />
                  <p>No hay sesiones programadas.</p>
                  <Button size="sm" variant="outline" onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nueva sesión</Button>
                </div>
              </div>
            ) : (
              paginated.map((r) => (
                <Card key={r.id} className="shadow-soft">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{r.titulo}</span>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" aria-label={`Editar charla ${r.titulo}`} onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                        {isAdmin && (
                          <DeleteDialog
                            title={`¿Eliminar charla "${r.titulo}"?`}
                            description="Esta acción eliminará permanentemente la sesión del itinerario."
                            trigger={
                              <Button size="icon" variant="ghost" aria-label={`Eliminar charla ${r.titulo}`} disabled={remove.isPending}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            }
                            onConfirm={() => remove.mutate(r.id)}
                            isPending={remove.isPending}
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-2 text-sm"><span className="text-muted-foreground">Fecha</span><span>{formatDateTime(r.fecha)}</span></div>
                    <div className="flex items-start justify-between gap-2 text-sm"><span className="text-muted-foreground">Tipo</span><Badge variant={tipoColor[r.tipo] ?? "outline"}>{r.tipo}</Badge></div>
                    <div className="flex items-start justify-between gap-2 text-sm"><span className="text-muted-foreground">Ponente</span><span>{r.ponente ?? "—"}</span></div>
                    <div className="flex items-start justify-between gap-2 text-sm"><span className="text-muted-foreground">Ubicación</span><span>{r.ubicacion ?? "—"}</span></div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <ListPagination
            page={currentPage}
            totalPages={totalPages}
            total={rows.length}
            itemLabel="sesiones"
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Editar sesión" : "Nueva sesión"}
      >
        <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1">
            <Label htmlFor="titulo">Título <span className="text-destructive">*</span></Label>
            <Input id="titulo" {...form.register("titulo")} aria-invalid={!!form.formState.errors.titulo} />
            <FieldError name="titulo" form={form} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="fecha">Fecha y hora <span className="text-destructive">*</span></Label>
            <Input id="fecha" type="datetime-local" {...form.register("fecha")} aria-invalid={!!form.formState.errors.fecha} />
            <FieldError name="fecha" form={form} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="duracion_min">Duración (min)</Label>
            <Input id="duracion_min" type="number" {...form.register("duracion_min")} aria-invalid={!!form.formState.errors.duracion_min} />
            <FieldError name="duracion_min" form={form} />
          </div>
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select value={form.watch("tipo")} onValueChange={(v) => form.setValue("tipo", v as SessionType)}>
              <SelectTrigger aria-invalid={!!form.formState.errors.tipo}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="charla">Charla</SelectItem>
                <SelectItem value="convivencia">Convivencia</SelectItem>
                <SelectItem value="retiro">Retiro</SelectItem>
                <SelectItem value="celebracion">Celebración</SelectItem>
              </SelectContent>
            </Select>
            <FieldError name="tipo" form={form} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ponente">Ponente</Label>
            <Input id="ponente" {...form.register("ponente")} aria-invalid={!!form.formState.errors.ponente} />
            <FieldError name="ponente" form={form} />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <Label htmlFor="ubicacion">Ubicación</Label>
            <Input id="ubicacion" {...form.register("ubicacion")} aria-invalid={!!form.formState.errors.ubicacion} />
            <FieldError name="ubicacion" form={form} />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea id="descripcion" rows={3} {...form.register("descripcion")} aria-invalid={!!form.formState.errors.descripcion} />
            <FieldError name="descripcion" form={form} />
          </div>
          <div className="flex flex-wrap gap-2 justify-end mt-4 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={save.isPending}>Guardar</Button>
          </div>
        </form>
      </ResponsiveDialog>
    </div>
  );
}
