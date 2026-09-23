import { createFileRoute, Navigate } from "@tanstack/react-router";

/**
 * Redirect de compatibilidad: la ruta canónica del retiro es /app/pagos-retiro.
 * Se mantiene para que links viejos o bookmarks a /app/pagos no caigan en 404.
 */
export const Route = createFileRoute("/app/pagos")({
  component: () => <Navigate to="/app/pagos-retiro" replace />,
});
