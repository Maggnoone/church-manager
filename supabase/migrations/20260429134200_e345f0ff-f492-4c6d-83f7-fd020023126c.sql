-- =========== ENUMS ===========
CREATE TYPE public.app_role AS ENUM ('admin', 'catequista', 'tesorero');
CREATE TYPE public.payment_method AS ENUM ('efectivo', 'transferencia', 'tarjeta');
CREATE TYPE public.session_type AS ENUM ('charla', 'convivencia', 'retiro', 'celebracion');
CREATE TYPE public.confirmando_status AS ENUM ('activo', 'apto', 'confirmado', 'baja');

-- =========== PROFILES ===========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =========== USER ROLES ===========
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer to check roles without RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

-- Auto-create profile + default catequista role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  -- Bootstrap: first user becomes admin, otherwise catequista
  IF NOT EXISTS (SELECT 1 FROM public.user_roles) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'catequista');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Profiles policies
CREATE POLICY "Users see all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Admin manages profiles" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manages roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========== GRUPOS ===========
CREATE TABLE public.grupos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  anio INTEGER NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All staff can view grupos" ON public.grupos FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));
CREATE POLICY "Admin manages grupos" ON public.grupos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========== PADRINOS ===========
CREATE TABLE public.padrinos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  dni TEXT,
  telefono TEXT,
  email TEXT,
  parentesco TEXT,
  has_confirmation BOOLEAN NOT NULL DEFAULT true,
  is_married_church BOOLEAN,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.padrinos ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER padrinos_updated_at BEFORE UPDATE ON public.padrinos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "Staff view padrinos" ON public.padrinos FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));
CREATE POLICY "Catequista/admin manage padrinos" ON public.padrinos FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'catequista'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'catequista'));

-- =========== CONFIRMANDOS ===========
CREATE TABLE public.confirmandos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  dni TEXT UNIQUE,
  fecha_nacimiento DATE,
  telefono TEXT,
  email TEXT,
  direccion TEXT,
  nombre_padre TEXT,
  nombre_madre TEXT,
  contacto_padres TEXT,
  has_baptism BOOLEAN NOT NULL DEFAULT false,
  fecha_bautismo DATE,
  parroquia_bautismo TEXT,
  has_communion BOOLEAN NOT NULL DEFAULT false,
  fecha_comunion DATE,
  group_id UUID REFERENCES public.grupos(id) ON DELETE SET NULL,
  padrino_id UUID REFERENCES public.padrinos(id) ON DELETE SET NULL,
  status public.confirmando_status NOT NULL DEFAULT 'activo',
  fecha_confirmacion DATE,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.confirmandos ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER confirmandos_updated_at BEFORE UPDATE ON public.confirmandos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "Staff view confirmandos" ON public.confirmandos FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));
CREATE POLICY "Catequista/admin insert confirmandos" ON public.confirmandos FOR INSERT TO authenticated 
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'catequista'));
CREATE POLICY "Catequista/admin update confirmandos" ON public.confirmandos FOR UPDATE TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'catequista'));
CREATE POLICY "Admin delete confirmandos" ON public.confirmandos FOR DELETE TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- Validation: cannot mark 'apto' or 'confirmado' without baptism
CREATE OR REPLACE FUNCTION public.validate_confirmando_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IN ('apto', 'confirmado') AND NEW.has_baptism = false THEN
    RAISE EXCEPTION 'No se puede marcar como % sin tener bautismo registrado', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER confirmandos_validate_status BEFORE INSERT OR UPDATE ON public.confirmandos
FOR EACH ROW EXECUTE FUNCTION public.validate_confirmando_status();

-- =========== CHARLAS ===========
CREATE TABLE public.charlas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha TIMESTAMPTZ NOT NULL,
  duracion_min INTEGER DEFAULT 60,
  ponente TEXT,
  ubicacion TEXT,
  tipo public.session_type NOT NULL DEFAULT 'charla',
  group_id UUID REFERENCES public.grupos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.charlas ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER charlas_updated_at BEFORE UPDATE ON public.charlas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "Staff view charlas" ON public.charlas FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));
CREATE POLICY "Catequista/admin manage charlas" ON public.charlas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'catequista'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'catequista'));

-- =========== MATERIALES ===========
CREATE TABLE public.materiales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charla_id UUID REFERENCES public.charlas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'link',
  url TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.materiales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view materiales" ON public.materiales FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));
CREATE POLICY "Catequista/admin manage materiales" ON public.materiales FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'catequista'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'catequista'));

-- =========== ASISTENCIA ===========
CREATE TABLE public.asistencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  confirmando_id UUID NOT NULL REFERENCES public.confirmandos(id) ON DELETE CASCADE,
  charla_id UUID NOT NULL REFERENCES public.charlas(id) ON DELETE CASCADE,
  presente BOOLEAN NOT NULL DEFAULT false,
  notas TEXT,
  registered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(confirmando_id, charla_id)
);
ALTER TABLE public.asistencia ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER asistencia_updated_at BEFORE UPDATE ON public.asistencia FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "Staff view asistencia" ON public.asistencia FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));
CREATE POLICY "Catequista/admin manage asistencia" ON public.asistencia FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'catequista'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'catequista'));

-- =========== PAGOS ===========
CREATE TABLE public.costo_retiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monto NUMERIC(10,2) NOT NULL DEFAULT 0,
  descripcion TEXT NOT NULL DEFAULT 'Retiro de Confirmación',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.costo_retiro ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tesorero/admin view costo" ON public.costo_retiro FOR SELECT TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'tesorero'));
CREATE POLICY "Tesorero/admin manage costo" ON public.costo_retiro FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'tesorero'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'tesorero'));

CREATE TABLE public.pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  confirmando_id UUID NOT NULL REFERENCES public.confirmandos(id) ON DELETE CASCADE,
  monto NUMERIC(10,2) NOT NULL CHECK (monto > 0),
  metodo public.payment_method NOT NULL DEFAULT 'efectivo',
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  referencia TEXT,
  notas TEXT,
  registered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tesorero/admin view pagos" ON public.pagos FOR SELECT TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'tesorero'));
CREATE POLICY "Tesorero/admin manage pagos" ON public.pagos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'tesorero'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'tesorero'));

-- =========== AUDIT ===========
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  table_name TEXT NOT NULL,
  action TEXT NOT NULL,
  record_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin views audit" ON public.audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_confirmandos_group ON public.confirmandos(group_id);
CREATE INDEX idx_confirmandos_status ON public.confirmandos(status);
CREATE INDEX idx_asistencia_charla ON public.asistencia(charla_id);
CREATE INDEX idx_asistencia_confirmando ON public.asistencia(confirmando_id);
CREATE INDEX idx_pagos_confirmando ON public.pagos(confirmando_id);
CREATE INDEX idx_charlas_fecha ON public.charlas(fecha);

-- Seed: default group and costo
INSERT INTO public.grupos (nombre, anio, descripcion) VALUES ('Grupo General', EXTRACT(YEAR FROM CURRENT_DATE)::INT, 'Grupo por defecto');
INSERT INTO public.costo_retiro (monto, descripcion, activo) VALUES (0, 'Retiro de Confirmación', true);