import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, CalendarDays, Wallet } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";
import { useCharlas, useConfirmandos, useCostoRetiro, usePagos } from "@/hooks/use-data";
import type { Charla } from "@/integrations/supabase/types";
import { buildBalance, type BalanceRow } from "@/lib/balances";
import { formatCurrency, formatDate } from "@/lib/format";

const MAX_ITEMS = 3;

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function parseFecha(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isTodayOrLater(value: string, todayStart: number): boolean {
  const parsed = parseFecha(value);
  return parsed !== null && startOfLocalDay(parsed) >= todayStart;
}

export function NotificationsPopover() {
  const [open, setOpen] = useState(false);
  const { canSeePagos } = useAuth();

  const charlasQuery = useCharlas({ enabled: open });
  const pagosQuery = usePagos({ enabled: open });
  const confirmandosQuery = useConfirmandos({ enabled: open });
  const costoRetiroQuery = useCostoRetiro({ enabled: open });

  const close = () => setOpen(false);

  const upcoming = useMemo<Charla[]>(() => {
    const charlas = charlasQuery.data ?? [];
    if (charlas.length === 0) return [];
    const todayStart = startOfLocalDay(new Date());
    return charlas
      .filter((charla) => isTodayOrLater(charla.fecha, todayStart))
      .sort((a, b) => (parseFecha(a.fecha)?.getTime() ?? 0) - (parseFecha(b.fecha)?.getTime() ?? 0))
      .slice(0, MAX_ITEMS);
  }, [charlasQuery.data]);

  const pendingBalances = useMemo<BalanceRow[]>(() => {
    if (!canSeePagos) return [];
    const confirmandos = confirmandosQuery.data ?? [];
    if (confirmandos.length === 0) return [];
    const costos = costoRetiroQuery.data ?? [];
    const costo = costos.find((item) => item.concepto === "retiro") ?? costos[0];
    const costoMonto = Number(costo?.monto ?? 0);
    if (costoMonto <= 0) return [];
    return buildBalance(pagosQuery.data ?? [], confirmandos, costoMonto)
      .filter((row) => row.pendiente > 0)
      .sort((a, b) => b.pendiente - a.pendiente);
  }, [canSeePagos, confirmandosQuery.data, costoRetiroQuery.data, pagosQuery.data]);

  const pending = pendingBalances.slice(0, MAX_ITEMS);
  const pendingCount = pendingBalances.length;
  const totalCount = upcoming.length + pendingCount;
  const hasNotifications = totalCount > 0;

  const pendingLoading =
    canSeePagos &&
    (pagosQuery.isLoading || confirmandosQuery.isLoading || costoRetiroQuery.isLoading);
  const showLoading =
    (charlasQuery.isLoading || pendingLoading) && upcoming.length === 0 && pending.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <IconButton dot={hasNotifications} aria-label="Notificaciones" title="Notificaciones">
          <Bell />
        </IconButton>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[380px] max-w-[calc(100vw-2rem)] rounded-3xl border border-border bg-popover p-2 shadow-elegant"
      >
        <div className="flex items-center justify-between px-3 py-2">
          <p className="font-display text-sm font-semibold">Notificaciones</p>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
            {totalCount}
          </span>
        </div>

        {showLoading ? (
          <div className="space-y-2 p-1" aria-hidden="true">
            <div className="h-3 w-28 animate-pulse rounded-full bg-muted" />
            <div className="h-12 animate-pulse rounded-2xl bg-muted" />
            <div className="h-12 animate-pulse rounded-2xl bg-muted" />
          </div>
        ) : null}

        {upcoming.length > 0 ? (
          <section aria-labelledby="notifications-upcoming">
            <h2
              id="notifications-upcoming"
              className="px-3 pt-1 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground"
            >
              Próximas charlas
            </h2>
            <ul>
              {upcoming.map((charla) => (
                <li key={charla.id}>
                  <Link
                    to="/app/calendario"
                    onClick={close}
                    className="flex items-start gap-3 rounded-2xl p-3 transition-colors hover:bg-accent"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <CalendarDays className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{charla.titulo}</span>
                      <span className="block text-xs text-muted-foreground">
                        {formatDate(charla.fecha)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {canSeePagos && pending.length > 0 ? (
          <section aria-labelledby="notifications-pending">
            <h2
              id="notifications-pending"
              className="px-3 pt-1 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground"
            >
              Pagos pendientes
            </h2>
            <ul>
              {pending.map((row) => (
                <li key={row.id}>
                  <Link
                    to="/app/pagos-retiro"
                    onClick={close}
                    className="flex items-start gap-3 rounded-2xl p-3 transition-colors hover:bg-accent"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Wallet className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{row.full_name}</span>
                      <span className="block text-xs text-muted-foreground">
                        Pendiente: {formatCurrency(row.pendiente)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!showLoading && upcoming.length === 0 && pending.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            Sin novedades por ahora.
          </p>
        ) : null}

        <div className="mt-1 flex items-center justify-between gap-2 border-t border-border px-3 pt-2 pb-1">
          <Link
            to="/app/calendario"
            onClick={close}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Ver calendario
          </Link>
          {canSeePagos ? (
            <Link
              to="/app/pagos-retiro"
              onClick={close}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Ver pagos
            </Link>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
