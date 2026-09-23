import type { BalanceRow } from "@/lib/balances";
import type { ChartCategory } from "@/lib/dashboard-chart-data";

/**
 * Deterministic aggregators for the payment report charts.
 *
 * They only reshape rows the app already loads from Supabase. No mock or
 * sample data lives here: every figure comes from the caller's real rows.
 */

const PAYMENT_STATUS_CATEGORIES = [
  { key: "al-dia", label: "Al día", color: "var(--chart-3)" },
  { key: "parcial", label: "Parcial", color: "var(--chart-4)" },
  { key: "sin-pagar", label: "Sin pagar", color: "var(--chart-5)" },
] as const;

type PaymentStatusKey = (typeof PAYMENT_STATUS_CATEGORIES)[number]["key"];

/**
 * Buckets per-confirmando balances into the three paid-status categories.
 *
 * The breakdown only applies when a retreat cost is configured. Without a
 * positive cost every unpaid balance resolves to `pendiente = 0`, which would
 * mislabel it as `sin-pagar`, so an empty array is returned instead.
 *
 * Boundary rules (with a configured cost):
 * - `sin-pagar`: nothing paid (`abonado <= 0`).
 * - `al-dia`: some amount paid and nothing pending (fully paid or overpaid).
 * - `parcial`: some amount paid and still pending.
 *
 * Always returns the three categories in the same order, zero-filled.
 */
export function buildPaymentStatusBreakdown(
  balances: readonly BalanceRow[],
  costAmount: number,
): ChartCategory[] {
  if (!Number.isFinite(costAmount) || costAmount <= 0) return [];

  const counts: Record<PaymentStatusKey, number> = {
    "al-dia": 0,
    parcial: 0,
    "sin-pagar": 0,
  };

  for (const balance of balances) {
    if (balance.abonado <= 0) {
      counts["sin-pagar"] += 1;
    } else if (balance.pendiente <= 0) {
      counts["al-dia"] += 1;
    } else {
      counts.parcial += 1;
    }
  }

  return PAYMENT_STATUS_CATEGORIES.map((category) => ({
    key: category.key,
    label: category.label,
    value: counts[category.key],
    color: category.color,
  }));
}

interface PaymentMethodRecord {
  metodo?: string | null;
  monto?: number | string | null;
}

const PAYMENT_METHOD_CATEGORIES = [
  { key: "efectivo", label: "Efectivo", color: "var(--chart-1)" },
  { key: "transferencia", label: "Transferencia", color: "var(--chart-2)" },
  { key: "tarjeta", label: "Tarjeta", color: "var(--chart-4)" },
] as const;

type PaymentMethodKey = (typeof PAYMENT_METHOD_CATEGORIES)[number]["key"];

function isKnownPaymentMethod(value: string): value is PaymentMethodKey {
  return value === "efectivo" || value === "transferencia" || value === "tarjeta";
}

/**
 * Sums retreat payments per method.
 *
 * Unknown, blank, or missing methods are ignored, and non-finite amounts are
 * skipped so a bad row can never poison a total. Returns the three known
 * methods in a stable order, zero-filled.
 */
export function buildPaymentMethodBreakdown(
  payments: readonly PaymentMethodRecord[],
): ChartCategory[] {
  const totals: Record<PaymentMethodKey, number> = {
    efectivo: 0,
    transferencia: 0,
    tarjeta: 0,
  };

  for (const payment of payments) {
    const method = payment.metodo?.trim();
    if (!method || !isKnownPaymentMethod(method)) continue;

    const amount = Number(payment.monto ?? 0);
    if (!Number.isFinite(amount)) continue;

    totals[method] += amount;
  }

  return PAYMENT_METHOD_CATEGORIES.map((category) => ({
    key: category.key,
    label: category.label,
    value: totals[category.key],
    color: category.color,
  }));
}
