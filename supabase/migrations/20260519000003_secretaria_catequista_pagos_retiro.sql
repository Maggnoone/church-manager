-- Secretaria y catequista: ver y registrar pagos del retiro
-- SOLO para confirmandos (concepto = 'retiro').
--
-- Reemplaza las policies amplias de la migración 20260519000002
-- (que permitían cualquier concepto) por versiones restringidas a retiro,
-- y suma a catequista con el mismo alcance.
--
-- Alcance final para ambos roles:
--   - public.pagos: SELECT + INSERT solo WHERE concepto = 'retiro'.
--     UPDATE/DELETE siguen siendo admin/tesorero.
--   - public.costo_retiro: solo SELECT de concepto = 'retiro'
--     (ver el monto para calcular saldos; configurarlo sigue siendo
--     admin/tesorero).
--   - Boleta y tablas de Esperanza: SIN acceso.

DROP POLICY IF EXISTS "Secretaria view pagos" ON public.pagos;
DROP POLICY IF EXISTS "Secretaria insert pagos" ON public.pagos;
DROP POLICY IF EXISTS "Secretaria view costo" ON public.costo_retiro;

DROP POLICY IF EXISTS "Secretaria view pagos retiro" ON public.pagos;
DROP POLICY IF EXISTS "Secretaria insert pagos retiro" ON public.pagos;
DROP POLICY IF EXISTS "Secretaria view costo retiro" ON public.costo_retiro;
DROP POLICY IF EXISTS "Catequista view pagos retiro" ON public.pagos;
DROP POLICY IF EXISTS "Catequista insert pagos retiro" ON public.pagos;
DROP POLICY IF EXISTS "Catequista view costo retiro" ON public.costo_retiro;

CREATE POLICY "Secretaria view pagos retiro" ON public.pagos FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'secretaria') AND concepto = 'retiro');

CREATE POLICY "Secretaria insert pagos retiro" ON public.pagos FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'secretaria') AND concepto = 'retiro');

CREATE POLICY "Secretaria view costo retiro" ON public.costo_retiro FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'secretaria') AND concepto = 'retiro');

CREATE POLICY "Catequista view pagos retiro" ON public.pagos FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'catequista') AND concepto = 'retiro');

CREATE POLICY "Catequista insert pagos retiro" ON public.pagos FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'catequista') AND concepto = 'retiro');

CREATE POLICY "Catequista view costo retiro" ON public.costo_retiro FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'catequista') AND concepto = 'retiro');
