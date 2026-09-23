import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export interface ReceiptDownloadButtonProps {
  pagoId: string;
  monto: number;
  fecha: string;
  metodo: string | null;
  concepto?: string | null;
  confirmandoNombre: string;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function ReceiptDownloadButton({
  pagoId,
  monto,
  fecha,
  metodo,
  concepto,
  confirmandoNombre,
}: ReceiptDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const disabled = loading || !pagoId;

  async function handleDownload() {
    if (!pagoId) return;
    setLoading(true);
    let objectUrl: string | null = null;
    try {
      // Browser-only modules: keep them out of the initial bundle and out of SSR.
      const [{ pdf }, { ReceiptDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./receipt-document"),
      ]);
      const blob = await pdf(
        <ReceiptDocument
          pago={{ id: pagoId, monto, fecha, metodo, concepto }}
          confirmandoNombre={confirmandoNombre}
        />,
      ).toBlob();

      objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `recibo-${slugify(confirmandoNombre) || "confirmando"}-${fecha}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Recibo descargado");
    } catch {
      toast.error("No se pudo generar el recibo");
    } finally {
      // Revoke on a later task so Firefox/Safari are not aborted by an immediate revoke.
      if (objectUrl) {
        const urlToRevoke = objectUrl;
        setTimeout(() => URL.revokeObjectURL(urlToRevoke), 0);
      }
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={disabled}
      aria-busy={loading}
    >
      {loading ? <Loader2 className="animate-spin" /> : <FileDown />}
      Descargar recibo
    </Button>
  );
}
