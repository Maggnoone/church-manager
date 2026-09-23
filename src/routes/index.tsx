import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Users,
  CalendarDays,
  Wallet,
  ShieldCheck,
  ArrowRight,
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
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <img
              src={logoESP}
              alt="Esperanza de San Pablo"
              className="h-9 w-9 rounded-lg object-contain"
            />
            <div className="leading-tight">
              <p className="font-display text-lg font-semibold">Esperanza de San Pablo</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Una Confirmación de Fe
              </p>
            </div>
          </div>
          <Button asChild variant="default">
            <Link to="/auth">Ingresar</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-24">
        <div className="mx-auto max-w-3xl text-center motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-medium text-gold-foreground">
            <Sparkles className="h-3 w-3" /> Movimiento Esperanza · Parroquia San Pablo
          </span>
          <h1 className="mt-6 text-balance font-display text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
            Acompañando cada paso hacia la{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">Confirmación</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Plataforma integral para registrar confirmandos y padrinos, tomar asistencia, organizar
            charlas y retiros, y administrar los pagos del proceso de formación.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="shadow-elegant">
              <Link to="/auth">
                Acceder al sistema <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Features grid */}
        <div className="mt-20 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Users,
              t: "Confirmandos & Padrinos",
              d: "Fichas completas con sacramentos previos, contacto y validaciones.",
            },
            {
              icon: CalendarDays,
              t: "Charlas y Retiros",
              d: "Calendario editable de catequesis, convivencias y retiro espiritual.",
            },
            {
              icon: ShieldCheck,
              t: "Asistencia móvil",
              d: "Pase de lista rápido optimizado para celular durante cada encuentro.",
            },
            {
              icon: Wallet,
              t: "Pagos del Retiro",
              d: "Control financiero con saldos, métodos de pago y reportes exportables.",
            },
          ].map((f, index) => (
            <div
              key={f.t}
              className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft backdrop-blur transition hover:shadow-elegant motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:fill-mode-backwards"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Movimiento Esperanza de San Pablo · Parroquia San Pablo
      </footer>
    </div>
  );
}
