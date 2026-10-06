-- Permite a 'secretaria' ver costos y registrar pagos de confirmandos.
--
-- Alcance (least privilege):
--   - public.costo_retiro: solo SELECT (ver el monto para calcular saldos).
--     Configurar el costo sigue siendo admin/tesorero.
--   - public.pagos: SELECT + INSERT (ver saldos y registrar pagos).
--     UPDATE/DELETE siguen siendo admin/tesorero (policy "manage" existente).
--   - Tablas de Esperanza (pagos_esperanza, costo_retiro_esperanza): SIN cambios.
--     Secretaria no accede a pagos de Esperanza.
--
-- Requiere que el valor 'secretaria' ya exista en el enum
-- (migración 20260519000000).

DROP POLICY IF EXISTS "Secretaria view costo" ON public.costo_retiro;
CREATE POLICY "Secretaria view costo" ON public.costo_retiro FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'secretaria'));

DROP POLICY IF EXISTS "Secretaria view pagos" ON public.pagos;
CREATE POLICY "Secretaria view pagos" ON public.pagos FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'secretaria'));

DROP POLICY IF EXISTS "Secretaria insert pagos" ON public.pagos;
CREATE POLICY "Secretaria insert pagos" ON public.pagos FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'secretaria'));
