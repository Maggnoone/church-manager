import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useConfirmandos,
  useAsistenciaHistorial,
  useAsistenciaPorConfirmando,
  useAsistenciaResumen,
} from "@/hooks/use-data";
import type { ReactNode } from "react";

function createMockChain(returnData: unknown) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    then: vi
      .fn()
      .mockImplementation((cb: (v: unknown) => unknown) =>
        Promise.resolve(cb({ data: returnData, error: null })),
      ),
  };
  return chain;
}

const mockResponses = vi.hoisted(() => ({
  confirmandos: [{ id: "1", full_name: "Juan Pérez" }] as Record<string, unknown>[],
  charlas: [] as Record<string, unknown>[],
  asistencia: [
    {
      id: "a1",
      charla_id: "c1",
      confirmando_id: "conf-1",
      presente: true,
      notas: null,
      charlas: { id: "c1", titulo: "Charla 1", fecha: "2026-01-15", tipo: "teorica" },
    },
  ] as Record<string, unknown>[],
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "confirmandos") return createMockChain(mockResponses.confirmandos);
      if (table === "charlas") return createMockChain(mockResponses.charlas);
      if (table === "asistencia") return createMockChain(mockResponses.asistencia);
      return createMockChain([{ id: "1", full_name: "Juan Pérez" }]);
    }),
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

function createWrapper(queryClient: QueryClient) {
  return function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockResponses.confirmandos = [{ id: "1", full_name: "Juan Pérez" }];
  mockResponses.charlas = [];
  mockResponses.asistencia = [
    {
      id: "a1",
      charla_id: "c1",
      confirmando_id: "conf-1",
      presente: true,
      notas: null,
      charlas: { id: "c1", titulo: "Charla 1", fecha: "2026-01-15", tipo: "teorica" },
    },
  ];
});

describe("useConfirmandos", () => {
  it("should fetch confirmandos with correct query key", async () => {
    const { result } = renderHook(() => useConfirmandos(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: "1", full_name: "Juan Pérez" }]);

    const { supabase } = await import("@/integrations/supabase/client");
    expect(supabase.from).toHaveBeenCalledWith("confirmandos");
  });

  it("is disabled when enabled option is false", () => {
    const { result } = renderHook(() => useConfirmandos({ enabled: false }), { wrapper });
    expect(result.current.isPending).toBe(true);
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useAsistenciaHistorial", () => {
  it("is disabled when confirmandoId is null", () => {
    const { result } = renderHook(() => useAsistenciaHistorial(null), { wrapper });
    expect(result.current.isPending).toBe(true);
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("fetches historial with correct query key when confirmandoId is provided", async () => {
    mockResponses.charlas = [
      { id: "c1", titulo: "Charla 1", fecha: "2026-01-15", tipo: "teorica" },
    ];
    const { result } = renderHook(() => useAsistenciaHistorial("conf-1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].charlas?.titulo).toBe("Charla 1");

    const { supabase } = await import("@/integrations/supabase/client");
    expect(supabase.from).toHaveBeenCalledWith("asistencia");
  });

  it("includes every registered talk and marks missing attendance as absent", async () => {
    mockResponses.charlas = [
      { id: "c1", titulo: "Charla 1", fecha: "2026-01-15", tipo: "teorica", group_id: "g1" },
      { id: "c2", titulo: "Charla 2", fecha: "2026-01-22", tipo: "teorica", group_id: "g2" },
    ];
    mockResponses.asistencia = [
      { id: "a1", charla_id: "c1", confirmando_id: "conf-1", presente: true },
    ];

    const { result } = renderHook(() => useAsistenciaHistorial("conf-1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map(({ charla_id, presente, charlas: charla }) => ({
      charla_id,
      presente,
      titulo: charla?.titulo,
    }))).toEqual([
      { charla_id: "c1", presente: true, titulo: "Charla 1" },
      { charla_id: "c2", presente: false, titulo: "Charla 2" },
    ]);
  });
});

describe("attendance report summaries", () => {
  it("derives both summaries from canonical cached attendance rows", async () => {
    mockResponses.confirmandos = [
      { id: "conf-1", full_name: "Juan Pérez", group_id: "g1", grupos: { nombre: "Grupo A" } },
      { id: "conf-2", full_name: "Ana López", group_id: "g2", grupos: { nombre: "Grupo B" } },
    ];
    mockResponses.charlas = [
      { id: "c1", titulo: "Charla 1", fecha: "2026-01-15", tipo: "teorica", group_id: "g1", grupos: { nombre: "Grupo A" } },
      { id: "c2", titulo: "Charla 2", fecha: "2026-01-22", tipo: "teorica", group_id: "g2", grupos: { nombre: "Grupo B" } },
    ];
    mockResponses.asistencia = [
      { id: "direct-c1", charla_id: "c1", confirmando_id: "conf-1", presente: false },
      { id: "direct-c2", charla_id: "c2", confirmando_id: "conf-2", presente: true },
    ];

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 30_000 } } });
    queryClient.setQueryData(["asistencias"], [
      { id: "cached-c1", charla_id: "c1", confirmando_id: "conf-1", presente: true },
      { id: "cached-c2", charla_id: "c2", confirmando_id: "conf-2", presente: false },
    ]);
    const options = { wrapper: createWrapper(queryClient) };
    const { result: resumen } = renderHook(() => useAsistenciaResumen(), options);
    const { result: porConfirmando } = renderHook(() => useAsistenciaPorConfirmando(), options);

    await waitFor(() => {
      expect(resumen.current.isSuccess).toBe(true);
      expect(porConfirmando.current.isSuccess).toBe(true);
    });

    expect.soft(
      resumen.current.data
        ?.map(({ charla_id, presentes, ausentes }) => ({ charla_id, presentes, ausentes }))
        .sort((a, b) => a.charla_id.localeCompare(b.charla_id)),
    ).toEqual([
      { charla_id: "c1", presentes: 1, ausentes: 0 },
      { charla_id: "c2", presentes: 0, ausentes: 1 },
    ]);
    expect.soft(porConfirmando.current.data?.map(({ confirmando_id, total_sesiones, asistidas, ausencias }) => ({
      confirmando_id,
      total_sesiones,
      asistidas,
      ausencias,
    }))).toEqual([
      { confirmando_id: "conf-1", total_sesiones: 2, asistidas: 1, ausencias: 1 },
      { confirmando_id: "conf-2", total_sesiones: 2, asistidas: 0, ausencias: 2 },
    ]);
  });
});

describe("useAsistenciaPorConfirmando", () => {
  beforeEach(() => {
    mockResponses.confirmandos = [
      { id: "conf-1", full_name: "Juan Pérez", group_id: "g1", grupos: { nombre: "Grupo A" } },
    ];
    mockResponses.charlas = [
      { id: "c1", group_id: "g1" },
      { id: "c2", group_id: "g1" },
      { id: "c3", group_id: null },
      { id: "c4", group_id: null },
      { id: "c5", group_id: "g1" },
      { id: "c6", group_id: null },
      { id: "c7", group_id: "g1" },
      { id: "c8", group_id: null },
      { id: "c9", group_id: "g1" },
      { id: "c10", group_id: "g2" },
    ];
    mockResponses.asistencia = [
      { id: "a1", charla_id: "c1", confirmando_id: "conf-1", presente: true },
      { id: "a1-duplicate", charla_id: "c1", confirmando_id: "conf-1", presente: true },
      { id: "a2", charla_id: "c2", confirmando_id: "conf-1", presente: true },
      { id: "a3", charla_id: "c3", confirmando_id: "conf-1", presente: true },
      { id: "a4", charla_id: "c5", confirmando_id: "conf-1", presente: true },
    ];
  });

  it("counts all registered charlas across groups including those without attendance", async () => {
    const { result } = renderHook(() => useAsistenciaPorConfirmando(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    const r = result.current.data![0];
    expect(r.confirmando_id).toBe("conf-1");
    expect(r.total_sesiones).toBe(10);
    expect(r.asistidas).toBe(4);
    expect(r.ausencias).toBe(6);
    expect(r.pct).toBe(40);
  });
});
