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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Download, Inbox } from "lucide-react";
import { DeleteDialog } from "@/components/DeleteDialog";
import { FieldError } from "@/components/FieldError";
import { TableSkeleton } from "@/components/TableSkeleton";
import { ListPagination, LIST_PAGE_SIZE } from "@/components/ListPagination";
import { toast } from "sonner";
import { exportToXLSX } from "@/lib/export";
import { useAuth } from "@/hooks/use-auth";
import { usePadrinos } from "@/hooks/use-data";
import type { Padrino, PadrinoInsert } from "@/integrations/supabase/types";

export const Route = createFileRoute("/app/padrinos")({ component: PadrinosPage });

const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  dni: z.string().max(20).optional().or(z.literal("")),
  telefono: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email().max(255).optional().or(z.literal("")),
  parentesco: z.string().max(60).optional().or(z.literal("")),
  has_confirmation: z.boolean(),
  is_married_church: z.boolean().optional(),
  notas: z.string().max(500).optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

function PadrinosPage() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Padrino | null>(null);

  const { data: rows = [], isLoading } = usePadrinos();

  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / LIST_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = rows.slice((currentPage - 1) * LIST_PAGE_SIZE, currentPage * LIST_PAGE_SIZE);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", has_confirmation: true, is_married_church: false },
  });

  const openNew = () => { setEditing(null); form.reset({ full_name: "", has_confirmation: true, is_married_church: false, dni: "", telefono: "", email: "", parentesco: "", notas: "" }); setOpen(true); };
  const openEdit = (r: Padrino) => { setEditing(r); form.reset({ ...r, dni: r.dni ?? "", telefono: r.telefono ?? "", email: r.email ?? "", parentesco: r.parentesco ?? "", notas: r.notas ?? "", is_married_church: !!r.is_married_church }); setOpen(true); };

  const buildPayload = (v: FormValues): PadrinoInsert => ({
    full_name: v.full_name,
    dni: v.dni || null,
    telefono: v.telefono || null,
    email: v.email || null,
    parentesco: v.parentesco || null,
    has_confirmation: v.has_confirmation,
    is_married_church: v.is_married_church ?? false,
    notas: v.notas || null,
  });

  const save = useMutation({
    mutationFn: async (v: FormValues) => {
      const payload = buildPayload(v);
      const { error } = editing
        ? await supabase.from("padrinos").update(payload).eq("id", editing.id)
        : await supabase.from("padrinos").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Guardado"); qc.invalidateQueries({ queryKey: ["padrinos"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("padrinos").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Eliminado"); qc.invalidateQueries({ queryKey: ["padrinos"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Padrinos y Madrinas</h1>
          <p className="text-sm text-muted-foreground">Registro completo de padrinos disponibles.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => exportToXLSX(rows.map((r) => ({ Nombre: r.full_name, DNI: r.dni, Teléfono: r.telefono, Email: r.email, Parentesco: r.parentesco, Confirmado: r.has_confirmation ? "Sí" : "No" })), "padrinos")}>
            <Download className="mr-2 h-4 w-4" />Exportar
          </Button>
          <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nuevo</Button>
        </div>
      </div>

      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-base">{rows.length} padrinos registrados</CardTitle></CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>DNI</TableHead><TableHead>Teléfono</TableHead><TableHead>Parentesco</TableHead><TableHead>Confirmado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="py-0"><TableSkeleton cols={6} rows={5} /></TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="h-8 w-8 opacity-40" />
                      <p>No hay padrinos registrados.</p>
                      <Button size="sm" variant="outline" onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nuevo padrino</Button>
                    </div>
                  </TableCell></TableRow>
                ) : paginated.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.full_name}</TableCell>
                    <TableCell>{r.dni ?? "—"}</TableCell>
                    <TableCell>{r.telefono ?? "—"}</TableCell>
                    <TableCell>{r.parentesco ?? "—"}</TableCell>
                    <TableCell>{r.has_confirmation ? "Sí" : "No"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" aria-label={`Editar padrino ${r.full_name}`} onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                      {isAdmin && (
                        <DeleteDialog
                          title={`¿Eliminar a ${r.full_name}?`}
                          description="Esta acción eliminará permanentemente el registro del padrino."
                          trigger={
                            <Button size="icon" variant="ghost" aria-label={`Eliminar padrino ${r.full_name}`} disabled={remove.isPending}>
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
                  <p>No hay padrinos registrados.</p>
                  <Button size="sm" variant="outline" onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nuevo padrino</Button>
                </div>
              </div>
            ) : (
              paginated.map((r) => (
                <Card key={r.id} className="shadow-soft">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{r.full_name}</span>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" aria-label={`Editar padrino ${r.full_name}`} onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                        {isAdmin && (
                          <DeleteDialog
                            title={`¿Eliminar a ${r.full_name}?`}
                            description="Esta acción eliminará permanentemente el registro del padrino."
                            trigger={
                              <Button size="icon" variant="ghost" aria-label={`Eliminar padrino ${r.full_name}`} disabled={remove.isPending}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            }
                            onConfirm={() => remove.mutate(r.id)}
                            isPending={remove.isPending}
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-2 text-sm"><span className="text-muted-foreground">DNI</span><span>{r.dni ?? "—"}</span></div>
                    <div className="flex items-start justify-between gap-2 text-sm"><span className="text-muted-foreground">Teléfono</span><span>{r.telefono ?? "—"}</span></div>
                    <div className="flex items-start justify-between gap-2 text-sm"><span className="text-muted-foreground">Parentesco</span><span>{r.parentesco ?? "—"}</span></div>
                    <div className="flex items-start justify-between gap-2 text-sm"><span className="text-muted-foreground">Confirmado</span><span>{r.has_confirmation ? "Sí" : "No"}</span></div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <ListPagination
            page={currentPage}
            totalPages={totalPages}
            total={rows.length}
            itemLabel="padrinos"
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Editar padrino" : "Nuevo padrino"}
      >
        <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1">
            <Label htmlFor="full_name">Nombre completo <span className="text-destructive">*</span></Label>
            <Input id="full_name" {...form.register("full_name")} aria-invalid={!!form.formState.errors.full_name} />
            <FieldError name="full_name" form={form} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="dni">DNI</Label>
            <Input id="dni" {...form.register("dni")} aria-invalid={!!form.formState.errors.dni} />
            <FieldError name="dni" form={form} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="parentesco">Parentesco</Label>
            <Input id="parentesco" {...form.register("parentesco")} placeholder="Tío, abuela..." aria-invalid={!!form.formState.errors.parentesco} />
            <FieldError name="parentesco" form={form} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input id="telefono" {...form.register("telefono")} aria-invalid={!!form.formState.errors.telefono} />
            <FieldError name="telefono" form={form} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} aria-invalid={!!form.formState.errors.email} />
            <FieldError name="email" form={form} />
          </div>
          <div className="flex items-center gap-2"><Checkbox id="conf" checked={form.watch("has_confirmation")} onCheckedChange={(c) => form.setValue("has_confirmation", !!c)} /><Label htmlFor="conf">Está confirmado</Label></div>
          <div className="flex items-center gap-2"><Checkbox id="mar" checked={!!form.watch("is_married_church")} onCheckedChange={(c) => form.setValue("is_married_church", !!c)} /><Label htmlFor="mar">Casado por iglesia</Label></div>
          <div className="sm:col-span-2 space-y-1">
            <Label htmlFor="notas">Notas</Label>
            <Input id="notas" {...form.register("notas")} aria-invalid={!!form.formState.errors.notas} />
            <FieldError name="notas" form={form} />
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
