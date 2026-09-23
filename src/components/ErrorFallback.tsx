import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorFallbackProps {
  error?: Error | null;
  reset?: () => void;
  message?: string;
}

export function ErrorFallback({ error, reset, message = "Hubo un error al cargar los datos." }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <div>
        <p className="font-medium text-foreground">{message}</p>
        {error?.message && (
          <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
        )}
      </div>
      {reset && (
        <Button variant="outline" size="sm" onClick={reset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      )}
    </div>
  );
}
