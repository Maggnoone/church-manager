-- Permite a 'secretaria' registrar asistencia de confirmandos
-- (tabla public.asistencia). Requiere que el valor 'secretaria' ya exista
-- en el enum (migración 20260519000000).
--
-- La asistencia de Esperanza (public.asistencia_esperanza) queda SIN
-- cambios: secretaria solo toma asistencia de confirmandos.

DROP POLICY IF EXISTS "Catequista/admin manage asistencia" ON public.asistencia;

CREATE POLICY "Catequista/admin manage asistencia" ON public.asistencia FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'catequista')
    OR public.has_role(auth.uid(), 'secretaria')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'catequista')
    OR public.has_role(auth.uid(), 'secretaria')
  );
