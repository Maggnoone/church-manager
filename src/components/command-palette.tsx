import { useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileBarChart,
  HeartHandshake,
  LayoutDashboard,
  Settings,
  SunMoon,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useAuth } from "@/hooks/use-auth";
import { useConfirmandosSimple, usePadrinosSimple } from "@/hooks/use-data";

const MAX_CONFIRMANDOS = 8;
const MAX_PADRINOS = 6;

type AppRoute =
  | "/app"
  | "/app/confirmandos"
  | "/app/padrinos"
  | "/app/asistencia"
  | "/app/charlas"
  | "/app/calendario"
  | "/app/pagos-retiro"
  | "/app/reportes"
  | "/app/configuracion";

interface NavItem {
  label: string;
  to: AppRoute;
  icon: LucideIcon;
  requires?: "pagos" | "admin";
}

const NAV_ITEMS: NavItem[] = [
  { label: "Inicio", to: "/app", icon: LayoutDashboard },
  { label: "Confirmandos", to: "/app/confirmandos", icon: Users },
  { label: "Padrinos", to: "/app/padrinos", icon: HeartHandshake },
  { label: "Asistencia", to: "/app/asistencia", icon: ClipboardCheck },
  { label: "Charlas", to: "/app/charlas", icon: BookOpen },
  { label: "Calendario", to: "/app/calendario", icon: CalendarDays },
  { label: "Pagos del Retiro", to: "/app/pagos-retiro", icon: Wallet, requires: "pagos" },
  { label: "Reportes", to: "/app/reportes", icon: FileBarChart },
  { label: "Configuración", to: "/app/configuracion", icon: Settings, requires: "admin" },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { canSeePagos, isAdmin } = useAuth();
  const { toggle } = useTheme();
  const confirmandosQuery = useConfirmandosSimple({ enabled: open });
  const padrinosQuery = usePadrinosSimple({ enabled: open });

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.requires === "pagos") return canSeePagos;
    if (item.requires === "admin") return isAdmin;
    return true;
  });
  const confirmandos = (confirmandosQuery.data ?? []).slice(0, MAX_CONFIRMANDOS);
  const padrinos = (padrinosQuery.data ?? []).slice(0, MAX_PADRINOS);

  const goTo = (to: AppRoute) => {
    onOpenChange(false);
    void navigate({ to });
  };

  const toggleTheme = () => {
    onOpenChange(false);
    toggle();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar páginas, confirmandos, padrinos..." />
      <CommandList>
        <CommandEmpty>Sin resultados.</CommandEmpty>

        <CommandGroup heading="Navegación">
          {visibleNavItems.map((item) => (
            <CommandItem key={item.to} value={item.label} onSelect={() => goTo(item.to)}>
              <item.icon />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {confirmandos.length > 0 ? (
          <CommandGroup heading="Confirmandos">
            {confirmandos.map((confirmando) => (
              <CommandItem
                key={confirmando.id}
                value={confirmando.full_name}
                onSelect={() => goTo("/app/confirmandos")}
              >
                <Users />
                <span>{confirmando.full_name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {padrinos.length > 0 ? (
          <CommandGroup heading="Padrinos">
            {padrinos.map((padrino) => (
              <CommandItem
                key={padrino.id}
                value={padrino.full_name}
                onSelect={() => goTo("/app/padrinos")}
              >
                <HeartHandshake />
                <span>{padrino.full_name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        <CommandGroup heading="Acciones">
          {canSeePagos ? (
            <CommandItem value="Registrar pago" onSelect={() => goTo("/app/pagos-retiro")}>
              <Wallet />
              <span>Registrar pago</span>
            </CommandItem>
          ) : null}
          <CommandItem value="Nueva charla" onSelect={() => goTo("/app/charlas")}>
            <BookOpen />
            <span>Nueva charla</span>
          </CommandItem>
          <CommandItem value="Ver reportes" onSelect={() => goTo("/app/reportes")}>
            <FileBarChart />
            <span>Ver reportes</span>
          </CommandItem>
          <CommandItem value="Cambiar tema" onSelect={toggleTheme}>
            <SunMoon />
            <span>Cambiar tema</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
