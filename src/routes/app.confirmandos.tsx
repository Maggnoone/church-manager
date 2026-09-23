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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, Download, Pencil, Trash2, FileSpreadsheet, FileText, FileType, Inbox } from "lucide-react";
import { FieldError } from "@/components/FieldError";
import { TableSkeleton } from "@/components/TableSkeleton";
import { DeleteDialog } from "@/components/DeleteDialog";
import { ListPagination, LIST_PAGE_SIZE } from "@/components/ListPagination";
import { toast } from "sonner";
import { exportToCSV, exportToPDF, exportToXLSX } from "@/lib/export";
import { useAuth } from "@/hooks/use-auth";
import { useConfirmandos, useGruposSimple, usePadrinosSimple } from "@/hooks/use-data";
import type { ConfirmandoWithRelations, ConfirmandoInsert, ConfirmandoStatus } from "@/integrations/supabase/types";

export const Route = createFileRoute("/app/confirmandos")({
  component: ConfirmandosPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  dni: z.string().trim().max(20).optional().or(z.literal("")),
  fecha_nacimiento: z.string().optional().or(z.literal("")),
  telefono: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  direccion: z.string().trim().max(255).optional().or(z.literal("")),
  nombre_padre: z.string().trim().max(120).optional().or(z.literal("")),
  nombre_madre: z.string().trim().max(120).optional().or(z.literal("")),
  contacto_padres: z.string().trim().max(60).optional().or(z.literal("")),
  has_baptism: z.boolean(),
  has_communion: z.boolean(),
  status: z.enum(["activo", "apto", "confirmado", "baja"]),
  group_id: z.string().uuid().optional().or(z.literal("")),
  padrino_id: z.string().uuid().optional().or(z.literal("")),
  notas: z.string().max(1000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

function ConfirmandosPage() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ConfirmandoWithRelations | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = LIST_PAGE_SIZE;

  const { data: rows = [], isLoading } = useConfirmandos();
  const { data: grupos = [] } = useGruposSimple();
  const { data: padrinos = [] } = usePadrinosSimple();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", has_baptism: false, has_communion: false, status: "activo" },
  });

  const openNew = () => {
    setEditing(null);
    form.reset({ full_name: "", has_baptism: false, has_communion: false, status: "activo", dni: "", telefono: "", email: "", direccion: "", nombre_padre: "", nombre_madre: "", contacto_padres: "", group_id: "", padrino_id: "", notas: "", fecha_nacimiento: "" });
    setOpen(true);
  };

  const openEdit = (r: ConfirmandoWithRelations) => {
    setEditing(r);
    form.reset({
      full_name: r.full_name ?? "",
      dni: r.dni ?? "",
      fecha_nacimiento: r.fecha_nacimiento ?? "",
      telefono: r.telefono ?? "",
      email: r.email ?? "",
      direccion: r.direccion ?? "",
      nombre_padre: r.nombre_padre ?? "",
      nombre_madre: r.nombre_madre ?? "",
      contacto_padres: r.contacto_padres ?? "",
      has_baptism: !!r.has_baptism,
      has_communion: !!r.has_communion,
      status: r.status ?? "activo",
      group_id: r.group_id ?? "",
      padrino_id: r.padrino_id ?? "",
      notas: r.notas ?? "",
    });
    setOpen(true);
  };

  const buildPayload = (values: FormValues): ConfirmandoInsert => ({
    full_name: values.full_name,
    dni: values.dni || null,
    fecha_nacimiento: values.fecha_nacimiento || null,
    telefono: values.telefono || null,
    email: values.email || null,
    direccion: values.direccion || null,
    nombre_padre: values.nombre_padre || null,
    nombre_madre: values.nombre_madre || null,
    contacto_padres: values.contacto_padres || null,
    has_baptism: values.has_baptism,
    has_communion: values.has_communion,
    status: values.status as ConfirmandoStatus,
    group_id: values.group_id || null,
    padrino_id: values.padrino_id || null,
    notas: values.notas || null,
  });

  const save = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = buildPayload(values);
      if (editing) {
        const { error } = await supabase.from("confirmandos").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("confirmandos").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Confirmando actualizado" : "Confirmando creado");
      qc.invalidateQueries({ queryKey: ["confirmandos"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("confirmandos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Eliminado");
      qc.invalidateQueries({ queryKey: ["confirmandos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = rows.filter((r) => {
    const s = search.toLowerCase();
    const matchSearch = !s || r.full_name?.toLowerCase().includes(s) || (r.dni ?? "").toLowerCase().includes(s);
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const exportData = () =>
    filtered.map((r) => ({
      Nombre: r.full_name,
      DNI: r.dni ?? "",
      Grupo: r.grupos?.nombre ?? "",
      Padrino: r.padrinos?.full_name ?? "",
      Bautismo: r.has_baptism ? "Sí" : "No",
      Comunión: r.has_communion ? "Sí" : "No",
      Estado: r.status,
      Teléfono: r.telefono ?? "",
      Email: r.email ?? "",
    }));

  const handleExport = (kind: "csv" | "xlsx" | "pdf") => {
    const data = exportData();
    if (!data.length) return toast.warning("No hay datos para exportar");
    if (kind === "csv") exportToCSV(data, "confirmandos");
    else if (kind === "xlsx") exportToXLSX(data, "confirmandos", "Confirmandos");
    else
      exportToPDF(
        "Listado de Confirmandos",
        Object.keys(data[0]),
        data.map((d) => Object.values(d) as (string | number)[]),
        "confirmandos",
        `Total: ${data.length} registros`,
      );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Confirmandos</h1>
          <p className="text-sm text-muted-foreground">Gestión completa de los jóvenes en formación.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline"><Download className="mr-2 h-4 w-4" />Exportar</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("xlsx")}><FileSpreadsheet className="mr-2 h-4 w-4" />Excel (.xlsx)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}><FileText className="mr-2 h-4 w-4" />PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv")}><FileType className="mr-2 h-4 w-4" />CSV</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nuevo</Button>
        </div>
      </div>

      <Card className="shadow-soft">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <CardTitle className="text-base">Total: {filtered.length}</CardTitle>
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por nombre o DNI"
                className="w-full sm:w-64 pl-8"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="apto">Apto</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Padrino</TableHead>
                  <TableHead>Sacramentos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="py-0"><TableSkeleton cols={7} rows={5} /></TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="h-8 w-8 opacity-40" />
                      <p>No hay confirmandos registrados.</p>
                      <Button size="sm" variant="outline" onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nuevo confirmando</Button>
                    </div>
                  </TableCell></TableRow>
                ) : paginated.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.full_name}</TableCell>
                    <TableCell>{r.dni ?? "—"}</TableCell>
                    <TableCell>{r.grupos?.nombre ?? "—"}</TableCell>
                    <TableCell>{r.padrinos?.full_name ?? <span className="text-muted-foreground">Sin asignar</span>}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Badge variant={r.has_baptism ? "default" : "outline"}>B</Badge>
                        <Badge variant={r.has_communion ? "default" : "outline"}>C</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.status === "confirmado" ? "default" : r.status === "apto" ? "secondary" : "outline"}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" aria-label={`Editar confirmando ${r.full_name}`} onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                      {isAdmin && (
                        <DeleteDialog
                          title={`¿Eliminar a ${r.full_name}?`}
                          description="Esta acción eliminará permanentemente el registro del confirmando."
                          trigger={
                            <Button size="icon" variant="ghost" aria-label={`Eliminar confirmando ${r.full_name}`} disabled={remove.isPending}>
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
                <Card key={i} className="shadow-soft">
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))
            ) : filtered.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="flex flex-col items-center gap-2">
                  <Inbox className="h-8 w-8 opacity-40" />
                  <p>No hay confirmandos registrados.</p>
                  <Button size="sm" variant="outline" onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nuevo confirmando</Button>
                </div>
              </div>
            ) : (
              paginated.map((r) => (
                <Card key={r.id} className="shadow-soft">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{r.full_name}</span>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" aria-label={`Editar confirmando ${r.full_name}`} onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                        {isAdmin && (
                          <DeleteDialog
                            title={`¿Eliminar a ${r.full_name}?`}
                            description="Esta acción eliminará permanentemente el registro del confirmando."
                            trigger={
                              <Button size="icon" variant="ghost" aria-label={`Eliminar confirmando ${r.full_name}`} disabled={remove.isPending}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            }
                            onConfirm={() => remove.mutate(r.id)}
                            isPending={remove.isPending}
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">DNI</span>
                      <span>{r.dni ?? "—"}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">Grupo</span>
                      <span>{r.grupos?.nombre ?? "—"}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">Padrino</span>
                      <span>{r.padrinos?.full_name ?? <span className="text-muted-foreground">Sin asignar</span>}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">Sacramentos</span>
                      <div className="flex gap-1">
                        <Badge variant={r.has_baptism ? "default" : "outline"}>B</Badge>
                        <Badge variant={r.has_communion ? "default" : "outline"}>C</Badge>
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">Estado</span>
                      <Badge variant={r.status === "confirmado" ? "default" : r.status === "apto" ? "secondary" : "outline"}>
                        {r.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <ListPagination
            page={currentPage}
            totalPages={totalPages}
            total={filtered.length}
            itemLabel="confirmandos"
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Editar confirmando" : "Nuevo confirmando"}
        className="max-w-2xl"
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
            <Label htmlFor="fecha_nacimiento">Fecha nacimiento</Label>
            <Input id="fecha_nacimiento" type="date" {...form.register("fecha_nacimiento")} aria-invalid={!!form.formState.errors.fecha_nacimiento} />
            <FieldError name="fecha_nacimiento" form={form} />
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
          <div className="sm:col-span-2 space-y-1">
            <Label htmlFor="direccion">Dirección</Label>
            <Input id="direccion" {...form.register("direccion")} aria-invalid={!!form.formState.errors.direccion} />
            <FieldError name="direccion" form={form} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nombre_padre">Padre</Label>
            <Input id="nombre_padre" {...form.register("nombre_padre")} aria-invalid={!!form.formState.errors.nombre_padre} />
            <FieldError name="nombre_padre" form={form} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nombre_madre">Madre</Label>
            <Input id="nombre_madre" {...form.register("nombre_madre")} aria-invalid={!!form.formState.errors.nombre_madre} />
            <FieldError name="nombre_madre" form={form} />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <Label htmlFor="contacto_padres">Contacto de padres</Label>
            <Input id="contacto_padres" {...form.register("contacto_padres")} aria-invalid={!!form.formState.errors.contacto_padres} />
            <FieldError name="contacto_padres" form={form} />
          </div>
          <div className="space-y-1">
            <Label>Grupo</Label>
            <Select value={form.watch("group_id") || ""} onValueChange={(v) => form.setValue("group_id", v)}>
              <SelectTrigger aria-invalid={!!form.formState.errors.group_id}><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>{grupos.map((g) => <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>)}</SelectContent>
            </Select>
            <FieldError name="group_id" form={form} />
          </div>
          <div className="space-y-1">
            <Label>Padrino/Madrina</Label>
            <Select value={form.watch("padrino_id") || ""} onValueChange={(v) => form.setValue("padrino_id", v)}>
              <SelectTrigger aria-invalid={!!form.formState.errors.padrino_id}><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>{padrinos.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
            </Select>
            <FieldError name="padrino_id" form={form} />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Checkbox id="bap" checked={form.watch("has_baptism")} onCheckedChange={(c) => form.setValue("has_baptism", !!c)} />
            <Label htmlFor="bap">Bautizado</Label>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Checkbox id="com" checked={form.watch("has_communion")} onCheckedChange={(c) => form.setValue("has_communion", !!c)} />
            <Label htmlFor="com">Primera comunión</Label>
          </div>
          <div className="sm:col-span-2 space-y-1">
            <Label>Estado</Label>
            <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as ConfirmandoStatus)}>
              <SelectTrigger aria-invalid={!!form.formState.errors.status}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="apto">Apto (requiere bautismo)</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>
            <FieldError name="status" form={form} />
          </div>
          <div className="flex flex-wrap gap-2 justify-end mt-4 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? "Guardando…" : "Guardar"}</Button>
          </div>
        </form>
      </ResponsiveDialog>
    </div>
  );
}
