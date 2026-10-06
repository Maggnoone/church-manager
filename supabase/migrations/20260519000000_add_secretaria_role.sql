-- Agrega el rol 'secretaria' al enum de roles de la app.
--
-- NOTA: ALTER TYPE ... ADD VALUE no puede usarse en la misma transacción
-- donde se referencia el valor nuevo. Si `supabase db push` falla con
-- "unsafe use of new value", ejecutar SOLO esta línea en el SQL Editor
-- del Dashboard (autocommit) y luego volver a pushear: el resto vive en
-- la migración siguiente (20260519000001_allow_secretaria_attendance).
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'secretaria';
