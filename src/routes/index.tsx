import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Users,
  Wallet,
  ClipboardCheck,
  ArrowRight,
  ArrowDown,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import logoESP from "@/assets/logoESP.png";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  if (loading && user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (user) return <Navigate to="/app" />;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img
              src={logoESP}
              alt="Esperanza de San Pablo"
              className="h-9 w-9 rounded-lg object-contain"
            />
            <div className="leading-tight">
              <p className="font-display text-lg font-semibold">Esperanza de San Pablo</p>
              <p className="text-xs text-muted-foreground">Parroquia San Pablo</p>
            </div>
          </div>
          <Button asChild>
            <Link to="/auth">Ingresar</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-14 md:grid-cols-[1.05fr_0.95fr] md:pt-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Catequesis de confirmación
          </p>
          <h1 className="mt-4 text-balance font-display text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
            El registro del grupo, sin planillas sueltas
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Las fichas de confirmandos y padrinos, el pase de lista de cada encuentro, el
            calendario de charlas y los pagos del retiro, todo en un mismo lugar. Lo que antes
            estaba repartido entre cuadernos y chats, ahora lo ve cada rol cuando lo necesita.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth">
                Ingresar a la plataforma <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#como-funciona">
                Cómo funciona <ArrowDown className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Product mock */}
        <div aria-hidden="true" className="relative">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold">Pase de lista · Sábado 10:00</p>
              <span className="shrink-0 rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
                2 presentes
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {[
                { name: "Sofía G.", present: true },
                { name: "Mateo R.", present: true },
                { name: "Lucía F.", present: false },
              ].map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/70 px-3 py-2"
                >
                  <span className="truncate text-sm font-medium">{c.name}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span
                      className={`text-xs font-semibold ${c.present ? "text-success" : "text-destructive"}`}
                    >
                      {c.present ? "Presente" : "Ausente"}
                    </span>
                    <span
                      className={`inline-flex h-5 w-9 items-center rounded-full px-0.5 ${c.present ? "justify-end bg-primary" : "justify-start bg-muted"}`}
                    >
                      <span className="h-4 w-4 rounded-full bg-background shadow" />
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mx-auto -mt-3 w-[92%] rounded-b-2xl border border-t-0 border-border bg-muted/60 px-4 py-2">
            <p className="truncate text-xs text-muted-foreground">
              Charlas · Calendario · Pagos del retiro · Reportes
            </p>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Para cada rol
          </p>
          <h2 className="mt-3 max-w-xl text-balance font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Cada uno ve lo suyo, nada más
          </h2>
          <div className="mt-8 divide-y divide-border/60 border-y border-border/60">
            <div className="grid gap-2 py-5 md:grid-cols-[220px_1fr] md:gap-6">
              <p className="flex items-center gap-2 font-display text-base font-semibold">
                <Users className="h-4 w-4 text-primary" /> Catequistas
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Fichas de sus confirmandos, pase de lista desde el celular en cada encuentro y
                calendario de charlas y convivencias.
              </p>
            </div>
            <div className="grid gap-2 py-5 md:grid-cols-[220px_1fr] md:gap-6">
              <p className="flex items-center gap-2 font-display text-base font-semibold">
                <Wallet className="h-4 w-4 text-primary" /> Tesorería
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Pagos del retiro y la boleta por persona, costos, saldos pendientes y reportes
                exportables en Excel o PDF.
              </p>
            </div>
            <div className="grid gap-2 py-5 md:grid-cols-[220px_1fr] md:gap-6">
              <p className="flex items-center gap-2 font-display text-base font-semibold">
                <ClipboardCheck className="h-4 w-4 text-primary" /> Coordinación
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Grupos, requisitos para la confirmación, usuarios y permisos, todo administrable
                desde un solo panel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="border-t border-border/60 scroll-mt-4">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Cómo funciona
          </p>
          <h2 className="mt-3 max-w-xl text-balance font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Tres momentos del ciclo
          </h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            {[
              {
                n: "01",
                t: "Se registra el grupo",
                d: "Confirmandos, padrinos, datos de contacto y sacramentos previos quedan en fichas ordenadas por grupo.",
              },
              {
                n: "02",
                t: "Se sigue cada encuentro",
                d: "Asistencia desde el celular, calendario de charlas y control de requisitos a lo largo del año.",
              },
              {
                n: "03",
                t: "Se cierra el ciclo",
                d: "Pagos del retiro al día, reportes por grupo y constancia de quién cumplió cada requisito.",
              },
            ].map((s) => (
              <li key={s.n} className="border-t-2 border-primary/60 pt-4">
                <p className="font-display text-sm font-semibold text-muted-foreground">{s.n}</p>
                <p className="mt-2 font-display text-lg font-semibold">{s.t}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10">
            <Button asChild size="lg">
              <Link to="/auth">
                Ingresar a la plataforma <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Movimiento Esperanza de San Pablo · Parroquia San Pablo
          </p>
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Ingresar</Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}
