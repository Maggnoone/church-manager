import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  HeartHandshake,
  CalendarDays,
  ClipboardCheck,
  BookOpen,
  Wallet,
  Receipt,
  FileBarChart,
  Settings,
  LogOut,
  Heart,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import logoESP from "@/assets/logoESP.png";

export function AppSidebar() {
  const { isMobile, setOpenMobile } = useSidebar();
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const { user, roles, signOut, canSeePagos, canAccessPagosRetiro, isAdmin, isCatequista, isSecretaria } = useAuth();
  const navigate = useNavigate();

  const handleNav = () => {
    if (isMobile) setOpenMobile(false);
  };

  const isActive = (path: string) =>
    path === "/app"
      ? currentPath === "/app"
      : currentPath === path || currentPath.startsWith(`${path}/`);

  const mainItems = [
    { title: "Inicio", url: "/app", icon: LayoutDashboard },
    { title: "Confirmandos", url: "/app/confirmandos", icon: Users },
    { title: "Padrinos", url: "/app/padrinos", icon: HeartHandshake },
    { title: "Asistencia", url: "/app/asistencia", icon: ClipboardCheck },
    ...(!((isCatequista || isSecretaria) && !isAdmin)
      ? [
          { title: "Esperanza", url: "/app/esperanza", icon: Heart },
          {
            title: "Asistencia Esperanza",
            url: "/app/asistencia-esperanza",
            icon: ClipboardCheck,
          },
        ]
      : []),
  ];

  const formacionItems = [
    { title: "Charlas", url: "/app/charlas", icon: BookOpen },
    { title: "Calendario", url: "/app/calendario", icon: CalendarDays },
  ];

  const adminItems = [
    ...(canAccessPagosRetiro
      ? [{ title: "Pagos del Retiro", url: "/app/pagos-retiro", icon: Wallet }]
      : []),
    ...(canSeePagos
      ? [{ title: "Pagos de la Boleta", url: "/app/pagos-boleta", icon: Receipt }]
      : []),
    { title: "Reportes", url: "/app/reportes", icon: FileBarChart },
    ...(isAdmin ? [{ title: "Configuración", url: "/app/configuracion", icon: Settings }] : []),
  ];

  const handleLogout = async () => {
    await signOut();
    if (isMobile) setOpenMobile(false);
    navigate({ to: "/auth" });
  };

  return (
    <Sidebar collapsible="icon" className="sidebar-rail top-3 bottom-3 h-auto p-4">
      <SidebarHeader>
        <Link
          to="/app"
          onClick={handleNav}
          title="Esperanza de San Pablo"
          className="sidebar-rail-item flex items-center"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center">
            <img
              src={logoESP}
              alt="Esperanza de San Pablo"
              className="h-11 w-11 rounded-lg object-contain"
            />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="sidebar-label truncate font-display text-base font-semibold">
              Esperanza de San Pablo
            </span>
            <span className="sidebar-label truncate text-[10px] uppercase tracking-wider text-sidebar-foreground/70">
              Una Confirmación de Fe
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gestión</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    title={item.title}
                    className="sidebar-rail-item data-[active=true]:bg-foreground data-[active=true]:text-background data-[active=true]:shadow-soft data-[active=true]:hover:bg-foreground data-[active=true]:hover:text-background"
                  >
                    <Link to={item.url} onClick={handleNav}>
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center">
                        <item.icon className="h-[18px] w-[18px]" strokeWidth={2} />
                      </span>
                      <span className="sidebar-label min-w-0 truncate pr-4">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Formación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {formacionItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    title={item.title}
                    className="sidebar-rail-item data-[active=true]:bg-foreground data-[active=true]:text-background data-[active=true]:shadow-soft data-[active=true]:hover:bg-foreground data-[active=true]:hover:text-background"
                  >
                    <Link to={item.url} onClick={handleNav}>
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center">
                        <item.icon className="h-[18px] w-[18px]" strokeWidth={2} />
                      </span>
                      <span className="sidebar-label min-w-0 truncate pr-4">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Administración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    title={item.title}
                    className="sidebar-rail-item data-[active=true]:bg-foreground data-[active=true]:text-background data-[active=true]:shadow-soft data-[active=true]:hover:bg-foreground data-[active=true]:hover:text-background"
                  >
                    <Link to={item.url} onClick={handleNav}>
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center">
                        <item.icon className="h-[18px] w-[18px]" strokeWidth={2} />
                      </span>
                      <span className="sidebar-label min-w-0 truncate pr-4">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {user ? (
          <div className="sidebar-rail-item flex items-center" title={user.email}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold uppercase text-accent-foreground ring-2 ring-sidebar">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </span>
            <span className="sidebar-label min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-sidebar-foreground">
                {user.email}
              </span>
              <span className="block truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                {roles.join(" · ") || "Sin rol"}
              </span>
            </span>
          </div>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          title="Cerrar sesión"
          className="sidebar-rail-item w-full justify-start"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center">
            <LogOut className="!h-[18px] !w-[18px]" strokeWidth={2} />
          </span>
          <span className="sidebar-label min-w-0 truncate pr-4">Cerrar sesión</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
