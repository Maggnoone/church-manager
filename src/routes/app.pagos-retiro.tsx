import { createFileRoute } from "@tanstack/react-router";
import { PagosManager } from "@/components/pagos/pagos-manager";

export const Route = createFileRoute("/app/pagos-retiro")({
  component: () => <PagosManager concepto="retiro" />,
});
