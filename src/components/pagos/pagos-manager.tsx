import { Navigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Wallet, Download } from "lucide-react";
import { TableSkeleton } from "@/components/TableSkeleton";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, formatDate, exportToXLSX, exportToPDF } from "@/lib/export";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReceiptDownloadButton } from "@/components/pdf/receipt-download-button";
import { ListPagination, LIST_PAGE_SIZE } from "@/components/ListPagination";
import {
  useConfirmandosSimple,
  usePagosPorConcepto,
  useCostoPorConcepto,
  useMiembrosEsperanza,
  usePagosEsperanza,
  useCostoRetiroEsperanza,
} from "@/hooks/use-data";
import type { PagoWithRelations, PaymentMethod } from "@/integrations/supabase/types";
import type { PagoEsperanza } from "@/hooks/use-data";
import { buildBalance, buildTotals, type BalanceRow } from "@/lib/balances";

interface PagosManagerProps {
  concepto: "retiro" | "boleta";
}

interface TxView {
  id: string;
  personName: string;
  monto: number;
  metodo: string;
  fecha: string;
  referencia: string | null;
  concepto: string;
}

export function PagosManager({ concepto }: PagosManagerProps) {
  const isRetiro = concepto === "retiro";
  const title = isRetiro ? "Pagos del Retiro" : "Pagos de la Boleta";
  const description = isRetiro
    ? "Control financiero del retiro de confirmación."
    : "Control financiero de la boleta de confirmación.";
  const costDialogTitle = isRetiro
    ? "Configurar costo del retiro"
    : "Configurar costo de la boleta";
  const pdfTitle = isRetiro ? "Estado de Pagos del Retiro" : "Estado de Pagos de la Boleta";

  const { canSeePagos } = useAuth();
  const qc = useQueryClient();
  const [openCosto, setOpenCosto] = useState(false);
  const [openPago, setOpenPago] = useState(false);
  const [costoMonto, setCostoMonto] = useState("");
  const [pagoForm, setPagoForm] = useState({
    person_id: "",
    monto: "",
    metodo: "efectivo",
    referencia: "",
    fecha: new Date().toISOString().slice(0, 10),
  });

  const [modo, setModo] = useState<"confirmandos" | "esperanza">("confirmandos");

  const { data: confirmandos = [], isLoading: loadingConfirmandos } = useConfirmandosSimple();
  const { data: pagos = [], isLoading: loadingPagos } = usePagosPorConcepto(concepto);
  const { data: costo } = useCostoPorConcepto(concepto);

  const { data: miembrosEsperanza = [], isLoading: loadingMiembrosEsperanza } =
    useMiembrosEsperanza({ enabled: isRetiro });
  const { data: pagosEsperanza = [], isLoading: loadingPagosEsperanza } = usePagosEsperanza({
    enabled: isRetiro && modo === "esperanza",
  });
  const { data: costoEsperanza } = useCostoRetiroEsperanza({
    enabled: isRetiro && modo === "esperanza",
  });

  const isEsperanza = modo === "esperanza";
  const activePeople = isEsperanza ? miembrosEsperanza : confirmandos;
  const activePagos = isEsperanza ? pagosEsperanza : pagos;
  const activeCosto = isEsperanza ? costoEsperanza : costo;
  const costoPorPersona = Number(activeCosto?.monto ?? 0);

  const loadingPeople = isEsperanza ? loadingMiembrosEsperanza : loadingConfirmandos;
  const loadingPagosActive = isEsperanza ? loadingPagosEsperanza : loadingPagos;

  const normalizedPagosForBalance = useMemo(
    () =>
      activePagos.map((p) => ({
        confirmando_id:
          "confirmando_id" in p
            ? (p as PagoWithRelations).confirmando_id
            : (p as PagoEsperanza).miembro_id,
        monto: p.monto,
      })),
    [activePagos],
  );

  const balances = useMemo<BalanceRow[]>(
    () => buildBalance(normalizedPagosForBalance, activePeople, costoPorPersona),
    [normalizedPagosForBalance, activePeople, costoPorPersona],
  );

  const [balancePage, setBalancePage] = useState(1);
  const balanceTotalPages = Math.max(1, Math.ceil(balances.length / LIST_PAGE_SIZE));
  const balanceCurrentPage = Math.min(balancePage, balanceTotalPages);
  const paginatedBalances = balances.slice(
    (balanceCurrentPage - 1) * LIST_PAGE_SIZE,
    balanceCurrentPage * LIST_PAGE_SIZE,
  );

  const personNameById = useMemo(
    () => new Map(activePeople.map((c) => [c.id, c.full_name])),
    [activePeople],
  );

  const transactions: TxView[] = useMemo(() => {
    if (isEsperanza) {
      return (activePagos as PagoEsperanza[]).map((p) => ({
        id: p.id,
        personName: personNameById.get(p.miembro_id) || "Miembro",
        monto: p.monto,
        metodo: p.metodo,
        fecha: p.fecha,
        referencia: p.referencia,
        concepto: "retiro",
      }));
    }
    return (activePagos as PagoWithRelations[]).map((p) => ({
      id: p.id,
      personName:
        p.confirmandos?.full_name || personNameById.get(p.confirmando_id) || "Confirmando",
      monto: p.monto,
      metodo: p.metodo,
      fecha: p.fecha,
      referencia: p.referencia,
      concepto: p.concepto,
    }));
  }, [activePagos, personNameById, isEsperanza]);

  const [txPage, setTxPage] = useState(1);
  const txTotalPages = Math.max(1, Math.ceil(transactions.length / LIST_PAGE_SIZE));
  const txCurrentPage = Math.min(txPage, txTotalPages);
  const paginatedTransactions = transactions.slice(
    (txCurrentPage - 1) * LIST_PAGE_SIZE,
    txCurrentPage * LIST_PAGE_SIZE,
  );

  const { totalRecaudado, metaTotal, pendienteTotal } = useMemo(
    () => buildTotals(balances, costoPorPersona, activePeople.length),
    [balances, costoPorPersona, activePeople.length],
  );

  const exportFilename = isEsperanza
    ? "pagos-retiro-esperanza"
    : isRetiro
      ? "pagos-retiro"
      : "pagos-boleta";

  const personColumnLabel = isEsperanza ? "Miembro" : "Confirmando";

  const handleModoChange = (v: "confirmandos" | "esperanza") => {
    setModo(v);
    setBalancePage(1);
    setTxPage(1);
    setPagoForm((prev) => ({ ...prev, person_id: "" }));
  };

  const saveCosto = useMutation({
    mutationFn: async () => {
      const monto = Number(costoMonto);
      if (!monto || monto < 0) throw new Error("Monto inválido");
      if (isEsperanza) {
        const client = supabase as unknown as SupabaseClient;
        if (costoEsperanza) {
          const { error } = await client
            .from("costo_retiro_esperanza")
            .update({ monto })
            .eq("id", costoEsperanza.id);
          if (error) throw error;
        } else {
          const { error } = await client
            .from("costo_retiro_esperanza")
            .insert({ monto, activo: true });
          if (error) throw error;
        }
      } else {
        if (costo) {
          const { error } = await supabase
            .from("costo_retiro")
            .update({ monto })
            .eq("id", costo.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("costo_retiro")
            .insert({ monto, activo: true, concepto });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      toast.success("Costo actualizado");
      if (isEsperanza) {
        qc.invalidateQueries({ queryKey: ["costo-retiro-esperanza"] });
      } else {
        qc.invalidateQueries({ queryKey: ["costo-retiro"] });
      }
      setOpenCosto(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const savePago = useMutation({
    mutationFn: async () => {
      const monto = Number(pagoForm.monto);
      if (!pagoForm.person_id || !monto || monto <= 0) throw new Error("Datos incompletos");
      const { data: u } = await supabase.auth.getUser();
      if (isEsperanza) {
        const client = supabase as unknown as SupabaseClient;
        const { error } = await client.from("pagos_esperanza").insert({
          miembro_id: pagoForm.person_id,
          monto,
          metodo: pagoForm.metodo as PaymentMethod,
          referencia: pagoForm.referencia || null,
          fecha: pagoForm.fecha,
          registered_by: u.user?.id ?? null,
          notas: null,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pagos").insert({
          confirmando_id: pagoForm.person_id,
          monto,
          metodo: pagoForm.metodo as PaymentMethod,
          referencia: pagoForm.referencia || null,
          fecha: pagoForm.fecha,
          registered_by: u.user?.id,
          concepto,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Pago registrado");
      if (isEsperanza) {
        qc.invalidateQueries({ queryKey: ["pagos-esperanza"] });
      } else {
        qc.invalidateQueries({ queryKey: ["pagos"] });
      }
      setOpenPago(false);
      setPagoForm({
        person_id: "",
        monto: "",
        metodo: "efectivo",
        referencia: "",
        fecha: new Date().toISOString().slice(0, 10),
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!canSeePagos) return <Navigate to="/app" />;

  const handleExport = (kind: "xlsx" | "pdf") => {
    const data = balances.map((b) => ({
      [personColumnLabel]: b.full_name,
      Total: Number(activeCosto?.monto ?? 0),
      Abonado: b.abonado,
      Pendiente: b.pendiente,
      Cumplimiento: `${Math.round(b.pct)}%`,
    }));
    if (kind === "xlsx") exportToXLSX(data, exportFilename, "Pagos");
    else
      exportToPDF(
        pdfTitle,
        Object.keys(data[0] ?? { x: 1 }),
        data.map((d) => Object.values(d) as (string | number)[]),
        exportFilename,
        `Recaudado: ${formatCurrency(totalRecaudado)} · Pendiente: ${formatCurrency(pendienteTotal)}`,
      );
  };

  const emptyBalanceMessage = isEsperanza
    ? "Aún no hay miembros en Esperanza."
    : "No hay confirmandos registrados.";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex w-full flex-col gap-2 max-sm:w-full sm:ml-auto sm:w-auto sm:min-w-[22rem]">
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-1 max-sm:flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("xlsx")}>Excel</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("pdf")}>PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              className="flex-1 max-sm:flex-1"
              onClick={() => {
                setCostoMonto(String(activeCosto?.monto ?? ""));
                setOpenCosto(true);
              }}
            >
              <Wallet className="mr-2 h-4 w-4" />
              Costo: {formatCurrency(activeCosto?.monto ?? 0)}
            </Button>
          </div>
          <Button onClick={() => setOpenPago(true)} className="w-full max-sm:w-full">
            <Plus className="mr-2 h-4 w-4" />
            Registrar pago
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 max-sm:w-full">
        <span className="shrink-0 text-sm text-muted-foreground">Ver:</span>
        <Select
          value={modo}
          onValueChange={(v) => handleModoChange(v as "confirmandos" | "esperanza")}
        >
          <SelectTrigger className="w-40 max-sm:min-w-0 max-sm:flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="confirmandos">Confirmandos</SelectItem>
            {isRetiro && <SelectItem value="esperanza">Esperanza</SelectItem>}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-soft border-transparent bg-gradient-brand">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/80">Recaudado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display text-2xl font-semibold text-white">
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

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Estado por {personColumnLabel.toLowerCase()}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{personColumnLabel}</TableHead>
                  <TableHead>Abonado</TableHead>
                  <TableHead>Pendiente</TableHead>
                  <TableHead className="min-w-[12rem]">Cumplimiento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingPeople ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-0">
                      <TableSkeleton cols={4} rows={5} />
                    </TableCell>
                  </TableRow>
                ) : balances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                      {emptyBalanceMessage}
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
            {loadingPeople ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="shadow-soft">
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))
            ) : balances.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">{emptyBalanceMessage}</p>
            ) : (
              paginatedBalances.map((b) => (
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
                        className={b.pendiente === 0 ? "text-success font-medium" : "text-warning"}
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
              ))
            )}
          </div>
          <ListPagination
            page={balanceCurrentPage}
            totalPages={balanceTotalPages}
            total={balances.length}
            itemLabel={isEsperanza ? "miembros" : "confirmandos"}
            onPageChange={setBalancePage}
          />
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Últimas transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>{personColumnLabel}</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead className="text-right">Recibo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingPagosActive ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-0">
                      <TableSkeleton cols={6} rows={5} />
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                      Sin pagos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTransactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{formatDate(t.fecha)}</TableCell>
                      <TableCell>{t.personName}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(t.monto)}</TableCell>
                      <TableCell className="capitalize">{t.metodo}</TableCell>
                      <TableCell className="text-muted-foreground">{t.referencia ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <ReceiptDownloadButton
                          pagoId={t.id}
                          monto={t.monto}
                          fecha={t.fecha}
                          metodo={t.metodo}
                          concepto={t.concepto}
                          confirmandoNombre={t.personName}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {loadingPagosActive ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="shadow-soft">
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))
            ) : transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">Sin pagos registrados</p>
            ) : (
              paginatedTransactions.map((t) => (
                <Card key={t.id} className="shadow-soft">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{formatCurrency(t.monto)}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(t.fecha)}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">{personColumnLabel}</span>
                      <span>{t.personName}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">Método</span>
                      <span className="capitalize">{t.metodo}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">Referencia</span>
                      <span className="text-muted-foreground">{t.referencia ?? "—"}</span>
                    </div>
                    <div className="flex justify-end pt-1">
                      <ReceiptDownloadButton
                        pagoId={t.id}
                        monto={t.monto}
                        fecha={t.fecha}
                        metodo={t.metodo}
                        concepto={t.concepto}
                        confirmandoNombre={t.personName}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <ListPagination
            page={txCurrentPage}
            totalPages={txTotalPages}
            total={transactions.length}
            itemLabel="transacciones"
            onPageChange={setTxPage}
          />
        </CardContent>
      </Card>

      <ResponsiveDialog open={openCosto} onOpenChange={setOpenCosto} title={costDialogTitle}>
        <div className="space-y-2">
          <Label>{isEsperanza ? "Monto por miembro" : "Monto por confirmando"}</Label>
          <Input type="number" value={costoMonto} onChange={(e) => setCostoMonto(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2 justify-end mt-4">
          <Button variant="outline" onClick={() => setOpenCosto(false)}>
            Cancelar
          </Button>
          <Button onClick={() => saveCosto.mutate()}>Guardar</Button>
        </div>
      </ResponsiveDialog>

      <ResponsiveDialog open={openPago} onOpenChange={setOpenPago} title="Registrar pago">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>{isEsperanza ? "Miembro de Esperanza *" : "Confirmando *"}</Label>
            <Select
              value={pagoForm.person_id}
              onValueChange={(v) => setPagoForm({ ...pagoForm, person_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {activePeople.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Monto *</Label>
            <Input
              type="number"
              value={pagoForm.monto}
              onChange={(e) => setPagoForm({ ...pagoForm, monto: e.target.value })}
            />
          </div>
          <div>
            <Label>Fecha</Label>
            <Input
              type="date"
              value={pagoForm.fecha}
              onChange={(e) => setPagoForm({ ...pagoForm, fecha: e.target.value })}
            />
          </div>
          <div>
            <Label>Método</Label>
            <Select
              value={pagoForm.metodo}
              onValueChange={(v) => setPagoForm({ ...pagoForm, metodo: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="tarjeta">Tarjeta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Referencia</Label>
            <Input
              value={pagoForm.referencia}
              onChange={(e) => setPagoForm({ ...pagoForm, referencia: e.target.value })}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-end mt-4">
          <Button variant="outline" onClick={() => setOpenPago(false)}>
            Cancelar
          </Button>
          <Button onClick={() => savePago.mutate()}>Registrar</Button>
        </div>
      </ResponsiveDialog>
    </div>
  );
}
