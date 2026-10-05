import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  CalendarDays,
  List,
  Plus,
  Clock,
  User,
  MapPin,
  Timer,
  Tag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { formatDateTime } from "@/lib/export";
import { cn } from "@/lib/utils";
import { useCharlasCalendario } from "@/hooks/use-data";
import type { Charla } from "@/integrations/supabase/types";
import { toDateKey, getMonthGridDays, WEEKDAYS } from "@/lib/calendar-grid";

export const Route = createFileRoute("/app/calendario")({ component: CalendarioPage });

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseLocalDate(value: string): Date {
  if (DATE_ONLY_PATTERN.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const tipoColor: Record<string, string> = {
  retiro: "bg-gradient-primary text-primary-foreground",
  convivencia: "bg-success text-primary-foreground",
  charla: "bg-success text-primary-foreground",
  celebracion: "bg-accent text-accent-foreground",
};

function SelectedDateDetail({ charla }: { charla: Charla }) {
  const date = parseLocalDate(charla.fecha);
  const timeLabel = date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="rounded-lg border p-4 transition hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-tight">{charla.titulo}</h3>
        <Badge className={tipoColor[charla.tipo] ?? "bg-muted text-muted-foreground"}>
          {charla.tipo}
        </Badge>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span>Hora: {timeLabel}</span>
        </div>

        {charla.duracion_min ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Timer className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>Duración: {charla.duracion_min} min</span>
          </div>
        ) : null}

        {charla.ponente ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="font-medium text-foreground">Charlista: {charla.ponente}</span>
          </div>
        ) : null}

        {charla.ubicacion ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>Ubicación: {charla.ubicacion}</span>
          </div>
        ) : null}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Tag className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="capitalize">{charla.tipo}</span>
        </div>
      </div>
    </div>
  );
}

function SessionItem({ charla }: { charla: Charla }) {
  const date = parseLocalDate(charla.fecha);
  return (
    <div className="flex items-start gap-4 rounded-lg border p-4 transition hover:shadow-soft">
      <div className="flex flex-col items-center justify-center rounded-lg bg-secondary px-4 py-2 text-center">
        <span className="font-display text-2xl font-semibold leading-none">{date.getDate()}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {date.toLocaleDateString("es-AR", { weekday: "short" })}
        </span>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{charla.titulo}</h3>
          <Badge className={tipoColor[charla.tipo]}>{charla.tipo}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatDateTime(charla.fecha)} · {charla.duracion_min} min
        </p>
        {charla.ponente && (
          <p className="mt-1 text-sm">
            Ponente: <span className="font-medium">{charla.ponente}</span>
          </p>
        )}
        {charla.ubicacion && <p className="text-sm text-muted-foreground">📍 {charla.ubicacion}</p>}
      </div>
    </div>
  );
}

function CalendarioPage() {
  const { data: charlas = [], isLoading } = useCharlasCalendario();
  const [view, setView] = useState<"lista" | "calendario">("lista");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(new Date());

  const selectDateAndOpen = (date: Date) => {
    setSelectedDate(date);
    setOpen(true);
  };

  const byMonth = charlas.reduce<Record<string, Charla[]>>((acc, c) => {
    const key = parseLocalDate(c.fecha).toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric",
    });
    (acc[key] ||= []).push(c);
    return acc;
  }, {});

  const eventDates = charlas.map((c) => parseLocalDate(c.fecha));
  const charlasByDateKey = charlas.reduce<Record<string, Charla[]>>((acc, c) => {
    const key = toDateKey(parseLocalDate(c.fecha));
    (acc[key] ||= []).push(c);
    return acc;
  }, {});

  const handleViewChange = (value: "lista" | "calendario") => {
    if (!value) return;
    setView(value);
    if (value === "calendario" && !selectedDate && eventDates.length > 0) {
      const first = eventDates[0];
      setSelectedDate(first);
      setMonth(first);
    }
  };

  const selectedKey = selectedDate ? toDateKey(selectedDate) : undefined;
  const selectedCharlas = selectedKey ? (charlasByDateKey[selectedKey] ?? []) : [];

  const hasEvents = charlas.length > 0;

  return (
    <div className={cn("mx-auto space-y-4 sm:space-y-6", view === "lista" ? "max-w-5xl" : "max-w-7xl")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Calendario de Formación</h1>
          <p className="text-sm text-muted-foreground">
            Charlas, convivencias, retiro y celebraciones del año.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 max-sm:w-full">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => handleViewChange(v as "lista" | "calendario")}
            aria-label="Cambiar vista"
            className="max-sm:w-full max-sm:[&>button]:flex-1"
          >
            <ToggleGroupItem value="lista" aria-label="Vista lista">
              <List className="mr-2 h-4 w-4" />
              Lista
            </ToggleGroupItem>
            <ToggleGroupItem value="calendario" aria-label="Vista calendario">
              <CalendarDays className="mr-2 h-4 w-4" />
              Calendario
            </ToggleGroupItem>
          </ToggleGroup>
          <Button asChild className="max-sm:w-full">
            <Link to="/app/charlas">
              <Plus className="mr-2 h-4 w-4" />
              Nueva sesión
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card className="shadow-soft">
          <CardContent className="space-y-4 py-8">
            <div className="h-6 w-32 animate-pulse rounded bg-primary/10" />
            <div className="h-20 w-full animate-pulse rounded bg-primary/10" />
            <div className="h-20 w-full animate-pulse rounded bg-primary/10" />
          </CardContent>
        </Card>
      ) : !hasEvents ? (
        <Card className="shadow-soft">
          <CardContent className="py-12 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">Aún no hay sesiones cargadas.</p>
            <Button asChild className="mt-4">
              <Link to="/app/charlas">Crear la primera</Link>
            </Button>
          </CardContent>
        </Card>
      ) : view === "lista" ? (
        Object.entries(byMonth).map(([monthLabel, items]) => (
          <Card key={monthLabel} className="shadow-soft">
            <CardHeader>
              <CardTitle className="font-display text-xl capitalize">{monthLabel}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((c) => (
                <SessionItem key={c.id} charla={c} />
              ))}
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="space-y-6">
          <Card className="min-w-0 overflow-hidden shadow-soft">
            <CardContent className="p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-base font-semibold capitalize sm:text-lg">
                  {month.toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
                </h2>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                    aria-label="Mes anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      const today = new Date();
                      setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                      selectDateAndOpen(today);
                    }}
                  >
                    Hoy
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                    aria-label="Mes siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid min-w-0 grid-cols-7 gap-0.5 sm:gap-1">
                {WEEKDAYS.map((d) => (
                  <div
                    key={d}
                    className="py-1 text-center text-[10px] font-medium text-muted-foreground sm:text-xs"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="mt-0.5 grid min-w-0 grid-cols-7 gap-0.5 sm:mt-1 sm:gap-1 max-sm:h-[calc((100dvh-380px)*0.85)] max-sm:auto-rows-fr">
                {getMonthGridDays(month).map((day) => {
                  const key = toDateKey(day);
                  const hasEvents = (charlasByDateKey[key] ?? []).length > 0;
                  const isCurrentMonth = day.getMonth() === month.getMonth();
                  const isSelected = selectedDate ? toDateKey(selectedDate) === key : false;
                  const isToday = key === toDateKey(new Date());

                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={!isCurrentMonth}
                      onClick={() => {
                        if (isCurrentMonth) selectDateAndOpen(day);
                      }}
                      className={cn(
                        "flex min-h-8 min-w-0 flex-col items-center justify-center rounded-md border p-1 text-[10px] transition-colors sm:min-h-12 sm:p-2 sm:text-xs md:min-h-14 max-sm:min-h-0",
                        isSelected && "border-primary bg-primary text-primary-foreground",
                        !isSelected && isToday && "border-primary",
                        !isSelected && !isToday && "border-transparent bg-secondary/40",
                        !isCurrentMonth && "invisible",
                        isCurrentMonth && !isSelected && "hover:bg-accent/60",
                      )}
                      aria-label={day.toLocaleDateString("es-AR", { day: "numeric", month: "long" })}
                      aria-pressed={isSelected}
                    >
                      <span className="relative">
                        {day.getDate()}
                        {hasEvents && !isSelected && (
                          <span className="absolute -right-1.5 -top-0.5 block h-1.5 w-1.5 rounded-full bg-primary sm:h-2 sm:w-2" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <ResponsiveDialog
            open={open}
            onOpenChange={setOpen}
            title={
              selectedDate
                ? `${capitalize(selectedDate.toLocaleDateString("es-AR", { weekday: "long" }))} - ${selectedDate.toLocaleDateString(
                    "es-AR",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    },
                  )}`
                : "Sesiones"
            }
            description={
              selectedCharlas.length > 0
                ? `${selectedCharlas.length} sesión${selectedCharlas.length > 1 ? "es" : ""} programada${selectedCharlas.length > 1 ? "s" : ""}`
                : selectedDate
                  ? "No hay sesiones para esta fecha."
                  : "Seleccioná una fecha para ver las sesiones."
            }
            className="sm:max-w-lg"
          >
            <div className="max-h-[60vh] space-y-4 overflow-y-auto py-2">
              {selectedCharlas.length > 0 ? (
                selectedCharlas.map((c) => <SelectedDateDetail key={c.id} charla={c} />)
              ) : selectedDate ? (
                <div className="py-8 text-center">
                  <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-3 text-muted-foreground">No hay sesiones para esta fecha.</p>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-3 text-muted-foreground">
                    Seleccioná una fecha para ver las sesiones.
                  </p>
                </div>
              )}
            </div>
          </ResponsiveDialog>
        </div>
      )}
    </div>
  );
}
