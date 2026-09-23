import { describe, expect, it } from "vitest";

import type { BalanceRow } from "@/lib/balances";
import { buildPaymentMethodBreakdown, buildPaymentStatusBreakdown } from "@/lib/payment-chart-data";

function balance(partial: Partial<BalanceRow> & Pick<BalanceRow, "id">): BalanceRow {
  return { full_name: partial.id, abonado: 0, pendiente: 0, pct: 0, ...partial };
}

const STATUS_KEYS = ["al-dia", "parcial", "sin-pagar"];

const COST = 100;

describe("buildPaymentStatusBreakdown", () => {
  it("buckets nothing paid, partially paid, fully paid, and overpaid", () => {
    const result = buildPaymentStatusBreakdown(
      [
        balance({ id: "nothing", abonado: 0, pendiente: COST, pct: 0 }),
        balance({ id: "partial", abonado: 40, pendiente: 60, pct: 40 }),
        balance({ id: "full", abonado: COST, pendiente: 0, pct: 100 }),
        balance({ id: "overpaid", abonado: 150, pendiente: 0, pct: 100 }),
      ],
      COST,
    );

    expect(result).toEqual([
      { key: "al-dia", label: "Al día", value: 2, color: "var(--chart-3)" },
      { key: "parcial", label: "Parcial", value: 1, color: "var(--chart-4)" },
      { key: "sin-pagar", label: "Sin pagar", value: 1, color: "var(--chart-5)" },
    ]);
  });

  it("keeps a stable category order with zero-filled buckets", () => {
    const result = buildPaymentStatusBreakdown(
      [balance({ id: "full", abonado: COST, pendiente: 0, pct: 100 })],
      COST,
    );

    expect(result.map((item) => item.key)).toEqual(STATUS_KEYS);
    expect(result).toEqual([
      { key: "al-dia", label: "Al día", value: 1, color: "var(--chart-3)" },
      { key: "parcial", label: "Parcial", value: 0, color: "var(--chart-4)" },
      { key: "sin-pagar", label: "Sin pagar", value: 0, color: "var(--chart-5)" },
    ]);
  });

  it("returns an empty breakdown when the cost is missing or not positive", () => {
    const balances = [balance({ id: "any", abonado: 0, pendiente: 0, pct: 0 })];

    expect(buildPaymentStatusBreakdown(balances, 0)).toEqual([]);
    expect(buildPaymentStatusBreakdown(balances, -5)).toEqual([]);
    expect(buildPaymentStatusBreakdown(balances, Number.NaN)).toEqual([]);
    expect(buildPaymentStatusBreakdown(balances, Number.POSITIVE_INFINITY)).toEqual([]);
  });

  it("returns all three zero-filled categories for empty input with a real cost", () => {
    expect(buildPaymentStatusBreakdown([], COST)).toEqual([
      { key: "al-dia", label: "Al día", value: 0, color: "var(--chart-3)" },
      { key: "parcial", label: "Parcial", value: 0, color: "var(--chart-4)" },
      { key: "sin-pagar", label: "Sin pagar", value: 0, color: "var(--chart-5)" },
    ]);
  });
});

const METHOD_KEYS = ["efectivo", "transferencia", "tarjeta"];

describe("buildPaymentMethodBreakdown", () => {
  it("sums the three known methods in a stable order", () => {
    const result = buildPaymentMethodBreakdown([
      { metodo: "efectivo", monto: 100 },
      { metodo: "transferencia", monto: "50.5" },
      { metodo: "tarjeta", monto: 25 },
      { metodo: "efectivo", monto: 10 },
    ]);

    expect(result.map((item) => item.key)).toEqual(METHOD_KEYS);
    expect(result).toEqual([
      { key: "efectivo", label: "Efectivo", value: 110, color: "var(--chart-1)" },
      {
        key: "transferencia",
        label: "Transferencia",
        value: 50.5,
        color: "var(--chart-2)",
      },
      { key: "tarjeta", label: "Tarjeta", value: 25, color: "var(--chart-4)" },
    ]);
  });

  it("ignores unknown, blank, and missing methods", () => {
    const result = buildPaymentMethodBreakdown([
      { metodo: "efectivo", monto: 100 },
      { metodo: "cheque", monto: 999 },
      { metodo: "", monto: 999 },
      { metodo: "   ", monto: 999 },
      { metodo: null, monto: 999 },
      { metodo: undefined, monto: 999 },
      {},
    ]);

    expect(result).toEqual([
      { key: "efectivo", label: "Efectivo", value: 100, color: "var(--chart-1)" },
      {
        key: "transferencia",
        label: "Transferencia",
        value: 0,
        color: "var(--chart-2)",
      },
      { key: "tarjeta", label: "Tarjeta", value: 0, color: "var(--chart-4)" },
    ]);
  });

  it("ignores non-finite amounts without dropping the rest of the row set", () => {
    const result = buildPaymentMethodBreakdown([
      { metodo: "efectivo", monto: Number.POSITIVE_INFINITY },
      { metodo: "transferencia", monto: Number.NaN },
      { metodo: "tarjeta", monto: 40 },
      { metodo: "efectivo", monto: 15 },
    ]);

    expect(result).toEqual([
      { key: "efectivo", label: "Efectivo", value: 15, color: "var(--chart-1)" },
      {
        key: "transferencia",
        label: "Transferencia",
        value: 0,
        color: "var(--chart-2)",
      },
      { key: "tarjeta", label: "Tarjeta", value: 40, color: "var(--chart-4)" },
    ]);
  });

  it("keeps a stable zero-filled set when only one method is present", () => {
    const result = buildPaymentMethodBreakdown([{ metodo: "tarjeta", monto: 7 }]);

    expect(result.map((item) => item.key)).toEqual(METHOD_KEYS);
    expect(result.every((item) => item.label.length > 0)).toBe(true);
    expect(result.filter((item) => item.value > 0)).toHaveLength(1);
  });

  it("returns all three zero-filled categories for empty input", () => {
    expect(buildPaymentMethodBreakdown([])).toEqual([
      { key: "efectivo", label: "Efectivo", value: 0, color: "var(--chart-1)" },
      {
        key: "transferencia",
        label: "Transferencia",
        value: 0,
        color: "var(--chart-2)",
      },
      { key: "tarjeta", label: "Tarjeta", value: 0, color: "var(--chart-4)" },
    ]);
  });
});
