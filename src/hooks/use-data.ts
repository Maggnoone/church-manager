import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ConfirmandoWithRelations,
  Confirmando,
  Padrino,
  Charla,
  Grupo,
  Asistencia,
  PagoWithRelations,
  CostoRetiro,
  Profile,
  UserRole,
  PaymentMethod,
} from "@/integrations/supabase/types";

/* ── Pagos Esperanza ── */

export interface PagoEsperanza {
  id: string;
  miembro_id: string;
  monto: number;
  metodo: PaymentMethod;
  fecha: string;
  referencia: string | null;
  notas: string | null;
  registered_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CostoRetiroEsperanza {
  id: string;
  monto: number;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export function usePagosEsperanza(options?: { enabled?: boolean }) {
  return useQuery<PagoEsperanza[]>({
    queryKey: ["pagos-esperanza"],
    queryFn: async () => {
      const client = supabase as unknown as SupabaseClient;
      const { data, error } = await client
        .from("pagos_esperanza")
        .select("*")
        .order("fecha", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PagoEsperanza[];
    },
    enabled: options?.enabled ?? true,
  });
}

export function useCostoRetiroEsperanza(options?: { enabled?: boolean }) {
  return useQuery<CostoRetiroEsperanza | null>({
    queryKey: ["costo-retiro-esperanza"],
    queryFn: async () => {
      const client = supabase as unknown as SupabaseClient;
      const { data, error } = await client
        .from("costo_retiro_esperanza")
        .select("*")
        .eq("activo", true)
        .maybeSingle();
      if (error) throw error;
      return data as CostoRetiroEsperanza | null;
    },
    enabled: options?.enabled ?? true,
  });
}

/* ── Confirmandos ── */

/* ── Miembros Esperanza ── */

export interface MiembroEsperanza {
  id: string;
  full_name: string;
  dni: string | null;
  fecha_nacimiento: string | null;
  telefono: string | null;
  email: string | null;
  notas: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export function useMiembrosEsperanza(options?: { enabled?: boolean }) {
  return useQuery<MiembroEsperanza[]>({
    queryKey: ["miembros-esperanza"],
    queryFn: async () => {
      const client = supabase as unknown as SupabaseClient;
      const { data, error } = await client
        .from("miembros_esperanza")
        .select("*")
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as MiembroEsperanza[];
    },
    enabled: options?.enabled ?? true,
  });
}

/* ── Asistencia Esperanza ── */

export interface AsistenciaEsperanza {
  id: string;
  miembro_id: string;
  fecha: string;
  presente: boolean;
  notas: string | null;
  registered_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useAsistenciaEsperanza(options?: { enabled?: boolean }) {
  return useQuery<AsistenciaEsperanza[]>({
    queryKey: ["asistencia-esperanza"],
    queryFn: async () => {
      const client = supabase as unknown as SupabaseClient;
      const { data, error } = await client
        .from("asistencia_esperanza")
        .select("*")
        .order("fecha", { ascending: true });
      if (error) throw error;
      return (data ?? []) as AsistenciaEsperanza[];
    },
    enabled: options?.enabled ?? true,
  });
}

/* ── Confirmandos ── */

export function useConfirmandos(options?: { enabled?: boolean }) {
  return useQuery<ConfirmandoWithRelations[]>({
    queryKey: ["confirmandos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("confirmandos")
        .select("*, grupos(nombre), padrinos(full_name)")
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as ConfirmandoWithRelations[];
    },
    enabled: options?.enabled ?? true,
  });
}

export function useConfirmandosSimple(options?: { enabled?: boolean }) {
  return useQuery<Pick<Confirmando, "id" | "full_name" | "group_id">[]>({
    queryKey: ["confirmandos-simple"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("confirmandos")
        .select("id, full_name, group_id")
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as Pick<Confirmando, "id" | "full_name" | "group_id">[];
    },
    enabled: options?.enabled ?? true,
  });
}

export interface ConfirmandoActivo {
  id: string;
  full_name: string;
  group_id: string | null;
  grupos: { nombre: string | null } | null;
}

export function useConfirmandosActivos() {
  return useQuery<ConfirmandoActivo[]>({
    queryKey: ["confirmandos-activos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("confirmandos")
        .select("id, full_name, group_id, grupos(nombre)")
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as ConfirmandoActivo[];
    },
  });
}

/* ── Padrinos ── */

export function usePadrinos() {
  return useQuery<Padrino[]>({
    queryKey: ["padrinos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("padrinos").select("*").order("full_name");
      if (error) throw error;
      return (data ?? []) as Padrino[];
    },
  });
}

export function usePadrinosSimple(options?: { enabled?: boolean }) {
  return useQuery<Pick<Padrino, "id" | "full_name">[]>({
    queryKey: ["padrinos-simple"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("padrinos")
        .select("id, full_name")
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as Pick<Padrino, "id" | "full_name">[];
    },
    enabled: options?.enabled ?? true,
  });
}

/* ── Charlas ── */

export function useCharlas(options?: { enabled?: boolean }) {
  return useQuery<Charla[]>({
    queryKey: ["charlas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("charlas")
        .select("*")
        .order("fecha", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Charla[];
    },
    enabled: options?.enabled ?? true,
  });
}

export function useCharlasList() {
  return useQuery<Pick<Charla, "id" | "titulo" | "fecha" | "tipo">[]>({
    queryKey: ["charlas-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("charlas")
        .select("id, titulo, fecha, tipo")
        .order("fecha", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Pick<Charla, "id" | "titulo" | "fecha" | "tipo">[];
    },
  });
}

export function useCharlasCalendario() {
  return useQuery<Charla[]>({
    queryKey: ["calendario-charlas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("charlas").select("*").order("fecha");
      if (error) throw error;
      return (data ?? []) as Charla[];
    },
  });
}

/* ── Grupos ── */

export function useGrupos() {
  return useQuery<Grupo[]>({
    queryKey: ["grupos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grupos")
        .select("*")
        .order("anio", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Grupo[];
    },
  });
}

export function useGruposSimple() {
  return useQuery<Pick<Grupo, "id" | "nombre">[]>({
    queryKey: ["grupos-simple"],
    queryFn: async () => {
      const { data, error } = await supabase.from("grupos").select("id, nombre").order("nombre");
      if (error) throw error;
      return (data ?? []) as Pick<Grupo, "id" | "nombre">[];
    },
  });
}

/* ── Asistencia ── */

export function useAsistencias(options?: { enabled?: boolean }) {
  return useQuery<Asistencia[]>({
    queryKey: ["asistencias"],
    queryFn: async () => {
      const { data, error } = await supabase.from("asistencia").select("*");
      if (error) throw error;
      return (data ?? []) as Asistencia[];
    },
    enabled: options?.enabled ?? true,
  });
}

export function useAsistencia(charlaId: string) {
  return useQuery<Asistencia[]>({
    queryKey: ["asistencia", charlaId],
    queryFn: async () => {
      if (!charlaId) return [];
      const { data, error } = await supabase
        .from("asistencia")
        .select("*")
        .eq("charla_id", charlaId);
      if (error) throw error;
      return (data ?? []) as Asistencia[];
    },
    enabled: !!charlaId,
  });
}

/* ── Pagos ── */

export function usePagos(options?: { enabled?: boolean }) {
  return useQuery<PagoWithRelations[]>({
    queryKey: ["pagos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pagos")
        .select("*, confirmandos(full_name)")
        .order("fecha", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PagoWithRelations[];
    },
    enabled: options?.enabled ?? true,
  });
}

/* ── Costo retiro ── */

export function useCostoRetiro(options?: { enabled?: boolean }) {
  return useQuery<CostoRetiro[]>({
    queryKey: ["costo-retiro"],
    queryFn: async () => {
      const { data, error } = await supabase.from("costo_retiro").select("*").eq("activo", true);
      if (error) throw error;
      return (data ?? []) as CostoRetiro[];
    },
    enabled: options?.enabled ?? true,
  });
}

export function useCostoPorConcepto(concepto: string) {
  return useQuery<CostoRetiro | null>({
    queryKey: ["costo-retiro", concepto],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("costo_retiro")
        .select("*")
        .eq("activo", true)
        .eq("concepto", concepto)
        .maybeSingle();
      if (error) throw error;
      return data as CostoRetiro | null;
    },
  });
}

/* ── Pagos por concepto ── */

export function usePagosPorConcepto(concepto: string) {
  return useQuery<PagoWithRelations[]>({
    queryKey: ["pagos", concepto],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pagos")
        .select("*, confirmandos(full_name)")
        .eq("concepto", concepto)
        .order("fecha", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PagoWithRelations[];
    },
  });
}

/* ── Asistencia resumida ── */

export interface AsistenciaResumen {
  charla_id: string;
  titulo: string;
  fecha: string;
  tipo: string;
  grupo: string | null;
  total_confirmandos: number;
  presentes: number;
  ausentes: number;
  pct: number;
}

export function useAsistenciaResumen() {
  const { data: asistencia = [] } = useAsistencias();
  return useQuery<AsistenciaResumen[]>({
    queryKey: ["asistencia-resumen", asistencia],
    queryFn: async () => {
      const [
        { data: charlas, error: charlaErr },
        { data: confirmandos, error: confErr },
      ] = await Promise.all([
        supabase.from("charlas").select("*, grupos(nombre)").order("fecha", { ascending: false }),
        supabase.from("confirmandos").select("id, group_id"),
      ]);
      if (charlaErr) throw charlaErr;
      if (confErr) throw confErr;

      const confirmandoIds = new Set((confirmandos ?? []).map((c) => c.id));
      const confirmandoMap = new Map((confirmandos ?? []).map((c) => [c.id, c]));

      return (charlas ?? []).map((c) => {
        const charla = c as Charla & { grupos: { nombre: string | null } | null };

        const relevantConfirmandos = (confirmandos ?? []).filter((conf) => {
          if (charla.group_id === null) return true;
          return conf.group_id === charla.group_id;
        });

        const asistencias = (asistencia ?? []).filter((a) => {
          if (a.charla_id !== charla.id) return false;
          if (!confirmandoIds.has(a.confirmando_id)) return false;
          const conf = confirmandoMap.get(a.confirmando_id);
          if (!conf) return false;
          if (charla.group_id === null) return true;
          return conf.group_id === charla.group_id;
        });

        const presentePorConfirmando = new Map<string, boolean>();
        for (const row of asistencias) {
          presentePorConfirmando.set(
            row.confirmando_id,
            (presentePorConfirmando.get(row.confirmando_id) ?? false) || row.presente,
          );
        }
        const presentes = [...presentePorConfirmando.values()].filter(Boolean).length;
        const total_confirmandos = relevantConfirmandos.length;

        return {
          charla_id: charla.id,
          titulo: charla.titulo,
          fecha: charla.fecha,
          tipo: charla.tipo,
          grupo: charla.grupos?.nombre ?? null,
          total_confirmandos,
          presentes,
          ausentes: total_confirmandos - presentes,
          pct: total_confirmandos ? Math.round((presentes / total_confirmandos) * 100) : 0,
        };
      });
    },
  });
}

export interface AsistenciaPorConfirmando {
  confirmando_id: string;
  full_name: string;
  grupo: string | null;
  total_sesiones: number;
  asistidas: number;
  ausencias: number;
  pct: number;
}

export function useAsistenciaPorConfirmando() {
  const { data: asistencia = [] } = useAsistencias();
  return useQuery<AsistenciaPorConfirmando[]>({
    queryKey: ["asistencia-por-confirmando", asistencia],
    queryFn: async () => {
      const { data: confirmandos, error: cErr } = await supabase
        .from("confirmandos")
        .select("id, full_name, group_id, grupos(nombre)")
        .order("full_name");
      if (cErr) throw cErr;

      const { data: charlas, error: chErr } = await supabase.from("charlas").select("id, group_id");
      if (chErr) throw chErr;

      return (confirmandos ?? []).map((c) => {
        const registeredCharlas = charlas ?? [];
        const registeredCharlaIds = new Set(registeredCharlas.map((ch) => ch.id));

        const asistenciaPorCharla = new Map<string, boolean>();
        for (const row of asistencia ?? []) {
          if (row.confirmando_id !== c.id || !registeredCharlaIds.has(row.charla_id)) continue;
          asistenciaPorCharla.set(
            row.charla_id,
            (asistenciaPorCharla.get(row.charla_id) ?? false) || row.presente,
          );
        }
        const asistidas = [...asistenciaPorCharla.values()].filter(Boolean).length;
        const total = registeredCharlas.length;
        const fullName = c.full_name;
        const grupo =
          (c as unknown as { grupos: { nombre: string | null } | null }).grupos?.nombre ?? null;
        return {
          confirmando_id: c.id,
          full_name: fullName,
          grupo,
          total_sesiones: total,
          asistidas,
          ausencias: total - asistidas,
          pct: total ? Math.round((asistidas / total) * 100) : 0,
        };
      });
    },
  });
}

export interface AsistenciaHistorialItem {
  id: string;
  charla_id: string;
  confirmando_id: string;
  presente: boolean;
  notas: string | null;
  created_at: string;
  charlas: {
    id: string;
    titulo: string;
    fecha: string;
    tipo: string;
  } | null;
}

export function useAsistenciaHistorial(confirmandoId: string | null) {
  return useQuery<AsistenciaHistorialItem[]>({
    queryKey: ["asistencia-historial", confirmandoId],
    queryFn: async () => {
      if (!confirmandoId) return [];
      const [{ data: asistencia, error: asistenciaError }, { data: charlas, error: charlasError }] =
        await Promise.all([
          supabase
            .from("asistencia")
            .select("*")
            .eq("confirmando_id", confirmandoId),
          supabase.from("charlas").select("id, titulo, fecha, tipo").order("fecha", { ascending: false }),
        ]);
      if (asistenciaError) throw asistenciaError;
      if (charlasError) throw charlasError;

      const attendanceByTalk = new Map<string, (typeof asistencia)[number]>();
      for (const row of asistencia ?? []) {
        const existing = attendanceByTalk.get(row.charla_id);
        if (!existing || (!existing.presente && row.presente)) {
          attendanceByTalk.set(row.charla_id, row);
        }
      }

      return (charlas ?? []).map((charla) => {
        const row = attendanceByTalk.get(charla.id);
        return {
          id: row?.id ?? `missing-${charla.id}`,
          charla_id: charla.id,
          confirmando_id: confirmandoId,
          presente: row?.presente ?? false,
          notas: row?.notas ?? null,
          created_at: row?.created_at ?? "",
          charlas: charla,
        };
      }) as AsistenciaHistorialItem[];
    },
    enabled: !!confirmandoId,
  });
}

/* ── Configuración ── */

export function useProfiles() {
  return useQuery<Profile[]>({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("full_name");
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });
}

export function useUserRoles() {
  return useQuery<UserRole[]>({
    queryKey: ["user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return (data ?? []) as UserRole[];
    },
  });
}

/* ── Mutations genéricas (reutilizables) ── */

export function useInvalidateQueries() {
  const qc = useQueryClient();
  return (keys: string[]) => qc.invalidateQueries({ queryKey: keys });
}
