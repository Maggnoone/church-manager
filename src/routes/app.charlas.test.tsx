import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ComponentType } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route } from "@/routes/app.charlas";

const mocks = vi.hoisted(() => ({
  insert: vi.fn(),
  update: vi.fn(),
  invalidateQueries: vi.fn(),
  rows: [{ id: "11111111-1111-4111-8111-111111111111", titulo: "Encuentro semanal", fecha: "2026-06-15T18:00:00.000Z", tipo: "charla", duracion_min: 60, descripcion: null, ponente: null, ubicacion: null, group_id: "22222222-2222-4222-8222-222222222222", grupos: { nombre: "Grupo Norte" } }],
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => ({ insert: mocks.insert, update: mocks.update, delete: () => ({ eq: vi.fn().mockResolvedValue({ error: null }) }) }) },
}));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ isAdmin: false }) }));
vi.mock("@/hooks/use-data", () => ({
  useCharlas: () => ({ data: mocks.rows, isLoading: false }),
  useGruposSimple: () => ({ data: [{ id: "22222222-2222-4222-8222-222222222222", nombre: "Grupo Norte" }] }),
}));
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return { ...actual, useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }) };
});

const Page = (Route as unknown as { options: { component: ComponentType } }).options.component;

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><Page /></QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.insert.mockResolvedValue({ error: null });
  mocks.update.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
});

describe("/app/charlas optional group assignment", () => {
  it("submits the selected group when creating a charla and refreshes attendance summary", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Nueva/ }));
    fireEvent.change(screen.getByLabelText(/Título/), { target: { value: "Charla para grupos" } });
    fireEvent.click(screen.getByRole("combobox", { name: /Grupo/i }));
    fireEvent.click(await screen.findByRole("option", { name: "Grupo Norte" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(mocks.insert).toHaveBeenCalled());
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ group_id: "22222222-2222-4222-8222-222222222222" }));
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["asistencia-resumen"] });
  });

  it("preselects and saves the assigned group when editing, and displays it in desktop and mobile lists", async () => {
    renderPage();
    const desktopRow = screen.getByRole("row", { name: /Encuentro semanal/ });
    expect(within(desktopRow).getByText("Grupo Norte")).toBeVisible();
    expect(screen.getAllByText("Grupo Norte").length).toBeGreaterThanOrEqual(2);

    fireEvent.click(screen.getAllByRole("button", { name: "Editar charla Encuentro semanal" })[0]);
    const groupSelector = screen.getByRole("combobox", { name: /Grupo/i });
    expect(groupSelector).toHaveTextContent("Grupo Norte");
    fireEvent.click(groupSelector);
    fireEvent.click(await screen.findByRole("option", { name: "Sin grupo" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(mocks.update).toHaveBeenCalled());
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ group_id: null }));
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["asistencia-resumen"] });
  });
});
