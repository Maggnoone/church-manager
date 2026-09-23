-- Drop the old Sunday-only check constraint so attendance can be registered
-- on any calendar day, not just Sundays.
ALTER TABLE public.asistencia_esperanza
  DROP CONSTRAINT IF EXISTS asistencia_fecha_domingo;
