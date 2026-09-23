-- ============================================================
-- Independent retreat payments for Esperanza members
-- ============================================================
-- These tables intentionally remain separate from confirmandos/pagos.

CREATE TABLE IF NOT EXISTS public.pagos_esperanza (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  miembro_id UUID NOT NULL
    REFERENCES public.miembros_esperanza(id)
    ON DELETE CASCADE,
  monto NUMERIC(10,2) NOT NULL CHECK (monto > 0),
  metodo public.payment_method NOT NULL DEFAULT 'efectivo',
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  referencia TEXT,
  notas TEXT,
  registered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pagos_esperanza ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER pagos_esperanza_updated_at
  BEFORE UPDATE ON public.pagos_esperanza
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Tesorero/admin view pagos esperanza"
  ON public.pagos_esperanza
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'tesorero')
  );

CREATE POLICY "Tesorero/admin manage pagos esperanza"
  ON public.pagos_esperanza
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'tesorero')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'tesorero')
  );

CREATE INDEX IF NOT EXISTS idx_pagos_esperanza_miembro_id
  ON public.pagos_esperanza(miembro_id);

CREATE INDEX IF NOT EXISTS idx_pagos_esperanza_fecha
  ON public.pagos_esperanza(fecha);

CREATE TABLE IF NOT EXISTS public.costo_retiro_esperanza (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monto NUMERIC(10,2) NOT NULL DEFAULT 0,
  descripcion TEXT NOT NULL DEFAULT 'Retiro de Esperanza',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.costo_retiro_esperanza ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER costo_retiro_esperanza_updated_at
  BEFORE UPDATE ON public.costo_retiro_esperanza
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Tesorero/admin view costo retiro esperanza"
  ON public.costo_retiro_esperanza
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'tesorero')
  );

CREATE POLICY "Tesorero/admin manage costo retiro esperanza"
  ON public.costo_retiro_esperanza
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'tesorero')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'tesorero')
  );
