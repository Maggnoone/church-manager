import { useEffect, useState } from "react";
import { createFileRoute, Outlet, Navigate, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppTopbar } from "@/components/app-topbar";
import { CommandPalette } from "@/components/command-palette";
import { useAuth } from "@/hooks/use-auth";
import { pageVariants } from "@/lib/motion";
import { ErrorFallback } from "@/components/ErrorFallback";

export const Route = createFileRoute("/app")({
  component: AppLayout,
  errorComponent: AppError,
});

function AppError({ error, reset }: { error: unknown; reset: () => void }) {
  const normalizedError = error instanceof Error ? error : new Error(String(error));
  return (
    <ErrorFallback
      error={normalizedError}
      reset={reset}
      message="Ocurrió un error al cargar esta sección. Intentá de nuevo."
    />
  );
}

function AppLayout() {
  const { user } = useAuth();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!user) return <Navigate to="/auth" />;

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <a href="#main-content" className="skip-link">
            Saltar al contenido
          </a>
          <AppTopbar
            onSearchClick={() => setPaletteOpen(true)}
            searchSlot={
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="hidden lg:flex h-10 w-[320px] items-center gap-2 rounded-full border border-border bg-card px-4 text-sm text-muted-foreground shadow-soft transition hover:shadow-elegant"
              >
                <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="flex-1 text-left">Buscar...</span>
                <kbd className="pointer-events-none rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-[10px] font-medium tracking-wide">
                  ⌘K
                </kbd>
              </button>
            }
          />
          <main id="main-content" className="flex-1 p-6 min-w-0">
            {reduceMotion ? (
              <Outlet />
            ) : (
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={pathname}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="min-w-0"
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            )}
          </main>
        </div>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </SidebarProvider>
  );
}
