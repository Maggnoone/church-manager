import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/TableSkeleton";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { FieldError } from "@/components/FieldError";
import { DeleteDialog } from "@/components/DeleteDialog";
import { ListPagination, LIST_PAGE_SIZE } from "@/components/ListPagination";
import { exportToCSV, exportToXLSX, exportToPDF } from "@/lib/export";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import {
  Inbox,
  Heart,
  Plus,
  Download,
  FileSpreadsheet,
  FileText,
  FileType,
  Search,
  Pencil,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMiembrosEsperanza } from "@/hooks/use-data";
import type { MiembroEsperanza } from "@/hooks/use-data";

export const Route = createFileRoute("/app/esperanza")({
  component: EsperanzaPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  dni: z.string().trim().max(20).optional().or(z.literal("")),
  fecha_nacimiento: z.string().optional().or(z.literal("")),
  telefono: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  notas: z.string().trim().optional().or(z.literal("")),
  activo: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function EsperanzaPage() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "activo" | "inactivo">("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MiembroEsperanza | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = LIST_PAGE_SIZE;

  const { data: miembros = [], isLoading } = useMiembrosEsperanza();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "",
      dni: "",
      fecha_nacimiento: "",
      telefono: "",
      email: "",
      notas: "",
      activo: true,
    },
  });

  const openNew = () => {
    setEditing(null);
    form.reset({
      full_name: "",
      dni: "",
      fecha_nacimiento: "",
      telefono: "",
      email: "",
      notas: "",
      activo: true,
    });
    setOpen(true);
  };

  const openEdit = (m: MiembroEsperanza) => {
    setEditing(m);
    form.reset({
      full_name: m.full_name,
      dni: m.dni ?? "",
      fecha_nacimiento: m.fecha_nacimiento ?? "",
      telefono: m.telefono ?? "",
      email: m.email ?? "",
      notas: m.notas ?? "",
      activo: m.activo,
    });
    setOpen(true);
  };

  const buildPayload = (values: FormValues) => ({
    full_name: values.full_name,
    dni: values.dni || null,
    fecha_nacimiento: values.fecha_nacimiento || null,
    telefono: values.telefono || null,
    email: values.email || null,
    notas: values.notas || null,
    activo: values.activo,
  });

  const save = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = buildPayload(values);
      const client = supabase as unknown as SupabaseClient;
      if (editing) {
        const { error } = await client
          .from("miembros_esperanza")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await client.from("miembros_esperanza").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Miembro actualizado" : "Miembro creado");
      qc.invalidateQueries({ queryKey: ["miembros-esperanza"] });
      setOpen(false);
      form.reset();
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const client = supabase as unknown as SupabaseClient;
      const { error } = await client.from("miembros_esperanza").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Miembro eliminado");
      qc.invalidateQueries({ queryKey: ["miembros-esperanza"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return miembros.filter((m) => {
      const matchSearch =
        !s || m.full_name.toLowerCase().includes(s) || (m.dni ?? "").toLowerCase().includes(s);
      const matchStatus =
        statusFilter === "all" || (statusFilter === "activo" ? m.activo : !m.activo);
      return matchSearch && matchStatus;
    });
  }, [miembros, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const exportData = () =>
    filtered.map((m) => ({
      Nombre: m.full_name,
      DNI: m.dni ?? "",
      Teléfono: m.telefono ?? "",
      "Fecha nacimiento": m.fecha_nacimiento ?? "",
      Email: m.email ?? "",
      Estado: m.activo ? "Activo" : "Inactivo",
    }));

  const handleExport = (kind: "csv" | "xlsx" | "pdf") => {
    const data = exportData();
    if (!data.length) return toast.warning("No hay datos para exportar");
    if (kind === "csv") exportToCSV(data, "esperanza");
    else if (kind === "xlsx") exportToXLSX(data, "esperanza", "Esperanza");
    else
      exportToPDF(
        "Listado de Esperanza",
        Object.keys(data[0]),
        data.map((d) => Object.values(d) as (string | number)[]),
        "esperanza",
        `Total: ${data.length} registros`,
      );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Miembros de Esperanza</h1>
          <p className="text-sm text-muted-foreground">
            Listado independiente de miembros de Esperanza.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1 text-sm">
            <Heart className="mr-1 h-3.5 w-3.5" />
            {filtered.length} {filtered.length === 1 ? "miembro" : "miembros"}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("xlsx")}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                <FileText className="mr-2 h-4 w-4" />
                PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                <FileType className="mr-2 h-4 w-4" />
                CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo miembro
          </Button>
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
                setStatusFilter(v as "all" | "activo" | "inactivo");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
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
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Fecha de nacimiento</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-0">
                      <TableSkeleton cols={7} rows={5} />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Inbox className="h-8 w-8 opacity-40" />
                        <p>No hay miembros en Esperanza.</p>
                        <Button size="sm" variant="outline" onClick={openNew}>
                          <Plus className="mr-2 h-4 w-4" />
                          Nuevo miembro
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.full_name}</TableCell>
                      <TableCell>{m.dni ?? "—"}</TableCell>
                      <TableCell>{m.telefono ?? "—"}</TableCell>
                      <TableCell>{formatDate(m.fecha_nacimiento)}</TableCell>
                      <TableCell>{m.email ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={m.activo ? "default" : "secondary"}>
                          {m.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Editar miembro ${m.full_name}`}
                          onClick={() => openEdit(m)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <DeleteDialog
                            title={`¿Eliminar a ${m.full_name}?`}
                            description="Esta acción eliminará permanentemente el registro del miembro."
                            trigger={
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label={`Eliminar miembro ${m.full_name}`}
                                disabled={remove.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            }
                            onConfirm={() => remove.mutate(m.id)}
                            isPending={remove.isPending}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
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
                  <p>No hay miembros en Esperanza.</p>
                  <Button size="sm" variant="outline" onClick={openNew}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo miembro
                  </Button>
                </div>
              </div>
            ) : (
              paginated.map((m) => (
                <Card key={m.id} className="shadow-soft">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{m.full_name}</span>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Editar miembro ${m.full_name}`}
                          onClick={() => openEdit(m)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <DeleteDialog
                            title={`¿Eliminar a ${m.full_name}?`}
                            description="Esta acción eliminará permanentemente el registro del miembro."
                            trigger={
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label={`Eliminar miembro ${m.full_name}`}
                                disabled={remove.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            }
                            onConfirm={() => remove.mutate(m.id)}
                            isPending={remove.isPending}
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">DNI</span>
                      <span>{m.dni ?? "—"}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">Teléfono</span>
                      <span>{m.telefono ?? "—"}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">Fecha de nacimiento</span>
                      <span>{formatDate(m.fecha_nacimiento)}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">Email</span>
                      <span>{m.email ?? "—"}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">Estado</span>
                      <Badge variant={m.activo ? "default" : "secondary"}>
                        {m.activo ? "Activo" : "Inactivo"}
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
            itemLabel="miembros"
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Editar miembro" : "Nuevo miembro"}
        className="max-w-2xl"
      >
        <form
          onSubmit={form.handleSubmit((v) => save.mutate(v))}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2 space-y-1">
            <Label htmlFor="full_name">
              Nombre completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="full_name"
              {...form.register("full_name")}
              aria-invalid={!!form.formState.errors.full_name}
            />
            <FieldError name="full_name" form={form} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="dni">DNI</Label>
            <Input id="dni" {...form.register("dni")} aria-invalid={!!form.formState.errors.dni} />
            <FieldError name="dni" form={form} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="fecha_nacimiento">Fecha nacimiento</Label>
            <Input
              id="fecha_nacimiento"
              type="date"
              {...form.register("fecha_nacimiento")}
              aria-invalid={!!form.formState.errors.fecha_nacimiento}
            />
            <FieldError name="fecha_nacimiento" form={form} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              {...form.register("telefono")}
              aria-invalid={!!form.formState.errors.telefono}
            />
            <FieldError name="telefono" form={form} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              aria-invalid={!!form.formState.errors.email}
            />
            <FieldError name="email" form={form} />
          </div>

          <div className="sm:col-span-2 space-y-1">
            <Label htmlFor="notas">Notas</Label>
            <Input
              id="notas"
              {...form.register("notas")}
              aria-invalid={!!form.formState.errors.notas}
            />
            <FieldError name="notas" form={form} />
          </div>

          <div className="flex items-center gap-2 pt-6">
            <Checkbox
              id="activo"
              checked={form.watch("activo")}
              onCheckedChange={(c) => form.setValue("activo", !!c)}
            />
            <Label htmlFor="activo">Activo</Label>
          </div>

          <div className="flex flex-wrap gap-2 justify-end mt-4 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </form>
      </ResponsiveDialog>
    </div>
  );
}
