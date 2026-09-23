import type { Confirmando } from "@/integrations/supabase/types";

export interface BalanceRow extends Pick<Confirmando, "id" | "full_name"> {
  abonado: number;
  pendiente: number;
  pct: number;
}

export function buildBalance(
  pagos: { confirmando_id: string; monto: number | string }[],
  confirmandos: Pick<Confirmando, "id" | "full_name">[],
  costoMonto: number,
): BalanceRow[] {
  const map = new Map<string, number>();
  pagos.forEach((p) =>
    map.set(p.confirmando_id, (map.get(p.confirmando_id) ?? 0) + Number(p.monto)),
  );
  return confirmandos.map((c) => {
    const abonado = map.get(c.id) ?? 0;
    const total = costoMonto;
    return {
      id: c.id,
      full_name: c.full_name,
      abonado,
      pendiente: Math.max(total - abonado, 0),
      pct: total ? Math.min(100, (abonado / total) * 100) : 0,
    };
  });
}

export function buildTotals(
  balances: BalanceRow[],
  costoMonto: number,
  confirmandoCount: number,
) {
  const totalRecaudado = balances.reduce((s, b) => s + b.abonado, 0);
  const metaTotal = costoMonto * confirmandoCount;
  return {
    totalRecaudado,
    metaTotal,
    pendienteTotal: Math.max(metaTotal - totalRecaudado, 0),
    progressPct: metaTotal ? Math.min(100, (totalRecaudado / metaTotal) * 100) : 0,
  };
}
