-- Fix search_path on remaining functions
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.validate_confirmando_status() SET search_path = public;

-- Restrict EXECUTE on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.has_any_role(UUID) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(UUID) TO authenticated;