-- ============================================================
-- Esperanza Sacramento members and attendance
-- ============================================================
-- This migration creates two new tables that live outside the
-- confirmandos/padrinos model. They track adult community members
-- (miembros) and their Sunday-mass attendance independently.
--
-- Sunday constraint: attendance rows are only accepted when
-- fecha falls on a Sunday (EXTRACT(DOW FROM fecha) = 0).
-- ============================================================

-- =========== MIEMBROS ESPERANZA ===========
CREATE TABLE public.miembros_esperanza (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  dni TEXT UNIQUE,
  fecha_nacimiento DATE,
  telefono TEXT,
  email TEXT,
  notas TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.miembros_esperanza ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER miembros_esperanza_updated_at
  BEFORE UPDATE ON public.miembros_esperanza
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Staff can view miembros"
  ON public.miembros_esperanza
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admin or catequista can manage miembros"
  ON public.miembros_esperanza
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'catequista'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'catequista'));

-- =========== ASISTENCIA ESPERANZA ===========
CREATE TABLE public.asistencia_esperanza (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  miembro_id UUID NOT NULL REFERENCES public.miembros_esperanza(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  presente BOOLEAN NOT NULL DEFAULT false,
  notas TEXT,
  registered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (miembro_id, fecha),
  CONSTRAINT asistencia_fecha_domingo CHECK (EXTRACT(DOW FROM fecha) = 0)
);

ALTER TABLE public.asistencia_esperanza ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER asistencia_esperanza_updated_at
  BEFORE UPDATE ON public.asistencia_esperanza
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Staff can view asistencia"
  ON public.asistencia_esperanza
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admin or catequista can manage asistencia"
  ON public.asistencia_esperanza
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'catequista'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'catequista'));

-- =========== INDEXES ===========
CREATE INDEX idx_asistencia_miembro_id ON public.asistencia_esperanza(miembro_id);
CREATE INDEX idx_asistencia_fecha ON public.asistencia_esperanza(fecha);
