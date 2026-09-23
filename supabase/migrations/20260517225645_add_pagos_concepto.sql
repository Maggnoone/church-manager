-- Add concepto (retiro | boleta) to pagos and costo_retiro
-- This allows distinguishing between retreat payments and confirmation certificate payments

ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS concepto TEXT NOT NULL DEFAULT 'retiro';
ALTER TABLE public.costo_retiro ADD COLUMN IF NOT EXISTS concepto TEXT NOT NULL DEFAULT 'retiro';

-- Add cost for confirmation certificate (boleta)
INSERT INTO public.costo_retiro (descripcion, monto, activo, concepto)
VALUES ('Boleta de Confirmación', 5000, true, 'boleta');
