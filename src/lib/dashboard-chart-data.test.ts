import { describe, expect, it } from "vitest";
import {
  buildAttendanceTrend,
  buildAttendanceTrendFromResumen,
  sortCharlasChronologically,
  buildConfirmandoAttendanceTrend,
  buildConfirmandoStatusCounts,
  buildPendingRequirements,
  type AttendanceResumenPoint,
} from "@/lib/dashboard-chart-data";

describe("buildPendingRequirements", () => {
  it("counts overlapping requirements, excludes baja, and keeps zero categories", () => {
    const result = buildPendingRequirements([
      {
        status: "activo",
        has_baptism: false,
        has_communion: false,
        padrino_id: null,
        dni: " ",
        direccion: "Calle 1",
        contacto_padres: "111",
      },
      {
        status: "confirmado",
        has_baptism: true,
        has_communion: false,
        padrino_id: "padrino-1",
        dni: "123",
        direccion: "Calle 2",
        contacto_padres: null,
      },
      {
        status: "baja",
        has_baptism: false,
        has_communion: false,
        padrino_id: null,
        dni: null,
        direccion: null,
        contacto_padres: null,
      },
    ]);

    expect(result).toEqual([
      { key: "baptism", label: "Bautismo pendiente", value: 1 },
      { key: "communion", label: "Comunión pendiente", value: 2 },
      { key: "padrino", label: "Padrino pendiente", value: 1 },
      { key: "documentation", label: "Datos incompletos", value: 2 },
    ]);
    expect(buildPendingRequirements([]).map((category) => category.value)).toEqual([0, 0, 0, 0]);
  });
});

describe("buildConfirmandoStatusCounts", () => {
  it("returns stable labeled categories and counts, including zeros", () => {
    expect(
      buildConfirmandoStatusCounts([
        { status: "activo" },
        { status: "apto" },
        { status: "activo" },
        { status: "baja" },
        { status: "apto" },
      ]),
    ).toEqual([
      { key: "activo", label: "Activo", value: 2 },
      { key: "apto", label: "Apto", value: 2 },
      { key: "confirmado", label: "Confirmado", value: 0 },
      { key: "baja", label: "Baja", value: 1 },
    ]);
  });
});

describe("buildAttendanceTrend", () => {
  it("sorts the latest eight recorded meetings and excludes future or unrecorded meetings", () => {
    const meetings = Array.from({ length: 11 }, (_, index) => ({
      id: `meeting-${String(index + 1).padStart(2, "0")}`,
      fecha: `2026-01-${String(index + 1).padStart(2, "0")}T12:00:00.000Z`,
      titulo: `Meeting ${index + 1}`,
    })).reverse();
    const attendance = meetings
      .filter((meeting) => meeting.id !== "meeting-10")
      .flatMap((meeting) => [
        { charla_id: meeting.id, presente: true },
        { charla_id: meeting.id, presente: meeting.id === "meeting-09" },
        { charla_id: meeting.id, presente: false },
      ]);

    const result = buildAttendanceTrend(meetings, attendance, new Date("2026-01-10T12:00:00.000Z"));

    expect(result.map((point) => point.key)).toEqual([
      "meeting-02",
      "meeting-03",
      "meeting-04",
      "meeting-05",
      "meeting-06",
      "meeting-07",
      "meeting-08",
      "meeting-09",
    ]);
    expect(result.at(-1)).toEqual({
      key: "meeting-09",
      date: "2026-01-09T12:00:00.000Z",
      label: "9 ene",
      title: "Meeting 9",
      present: 2,
      absent: 1,
      total: 3,
      attendancePercentage: 67,
    });
    expect(result.some((point) => point.key === "meeting-10")).toBe(false);
    expect(result.some((point) => point.key === "meeting-11")).toBe(false);
  });
});

describe("sortCharlasChronologically", () => {
  it("sorts unsorted charlas by date then charla_id without mutating the input", () => {
    const charlas = [
      { charla_id: "c", fecha: "2026-02-01T12:00:00.000Z" },
      { charla_id: "b", fecha: "2026-01-01T12:00:00.000Z" },
      { charla_id: "z", fecha: "2026-01-01T12:00:00.000Z" },
      { charla_id: "a", fecha: "2026-01-01T12:00:00.000Z" },
    ];
    const original = [...charlas];

    expect(sortCharlasChronologically(charlas).map(({ charla_id }) => charla_id)).toEqual([
      "a", "b", "z", "c",
    ]);
    expect(charlas).toEqual(original);
    expect(sortCharlasChronologically(charlas)).not.toBe(charlas);
  });
});

describe("buildAttendanceTrendFromResumen", () => {
  const resumenItem = (
    overrides: Partial<AttendanceResumenPoint> = {},
  ): AttendanceResumenPoint => ({
    charla_id: "charla-1",
    titulo: "Charla 1",
    fecha: "2026-01-01T12:00:00.000Z",
    total_confirmandos: 3,
    presentes: 2,
    ausentes: 1,
    ...overrides,
  });

  it("sorts unsorted multi-year data chronologically", () => {
    const result = buildAttendanceTrendFromResumen(
      [
        resumenItem({ charla_id: "jan-2026", fecha: "2026-01-02T12:00:00.000Z" }),
        resumenItem({ charla_id: "dec-2024", fecha: "2024-12-31T12:00:00.000Z" }),
        resumenItem({ charla_id: "jan-2025", fecha: "2025-01-01T12:00:00.000Z" }),
        resumenItem({ charla_id: "dec-2025", fecha: "2025-12-31T12:00:00.000Z" }),
      ],
    );

    expect(result.map((point) => point.key)).toEqual(["dec-2024", "jan-2025", "dec-2025", "jan-2026"]);
  });

  it("keeps all eligible past charlas, sorted chronological ascending", () => {
    const resumen = Array.from({ length: 11 }, (_, index) =>
      resumenItem({
        charla_id: `charla-${String(index + 1).padStart(2, "0")}`,
        titulo: `Charla ${index + 1}`,
        fecha: `2026-01-${String(index + 1).padStart(2, "0")}T12:00:00.000Z`,
      }),
    ).reverse();

    const result = buildAttendanceTrendFromResumen(resumen, new Date("2026-01-11T12:00:00.000Z"));

    expect(result.map((point) => point.key)).toEqual([
      "charla-01",
      "charla-02",
      "charla-03",
      "charla-04",
      "charla-05",
      "charla-06",
      "charla-07",
      "charla-08",
      "charla-09",
      "charla-10",
      "charla-11",
    ]);
    expect(result.map((point) => point.date)).toEqual(
      ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"].map(
        (day) => `2026-01-${day}T12:00:00.000Z`,
      ),
    );
  });

  it("includes future and zero-confirmando charlas, using 0% for a zero denominator", () => {
    const resumen = [
      resumenItem({
        charla_id: "past",
        titulo: "Past",
        fecha: "2026-01-02T12:00:00.000Z",
      }),
      resumenItem({
        charla_id: "future",
        titulo: "Future",
        fecha: "2026-02-01T12:00:00.000Z",
      }),
      resumenItem({
        charla_id: "empty",
        titulo: "Empty",
        fecha: "2026-01-03T12:00:00.000Z",
        total_confirmandos: 0,
        presentes: 0,
        ausentes: 0,
      }),
    ];

    const result = buildAttendanceTrendFromResumen(resumen, new Date("2026-01-15T12:00:00.000Z"));

    expect(result.map((point) => point.key)).toEqual(["past", "empty", "future"]);
    expect(result.find((point) => point.key === "empty")).toMatchObject({
      total: 0,
      present: 0,
      absent: 0,
      attendancePercentage: 0,
    });
  });

  it("excludes only invalid dates", () => {
    const result = buildAttendanceTrendFromResumen(
      [
        resumenItem({ charla_id: "valid", fecha: "2026-01-02T12:00:00.000Z" }),
        resumenItem({ charla_id: "invalid", fecha: "not-a-date" }),
      ],
      new Date("2026-01-01T12:00:00.000Z"),
    );

    expect(result.map((point) => point.key)).toEqual(["valid"]);
  });

  it("computes attendance percentage and maps every field", () => {
    const result = buildAttendanceTrendFromResumen([
      resumenItem({
        charla_id: "charla-a",
        titulo: "Charla A",
        fecha: "2026-01-09T12:00:00.000Z",
        total_confirmandos: 4,
        presentes: 2,
        ausentes: 2,
      }),
    ]);

    expect(result).toEqual([
      {
        key: "charla-a",
        date: "2026-01-09T12:00:00.000Z",
        label: "9 ene",
        title: "Charla A",
        present: 2,
        absent: 2,
        total: 4,
        attendancePercentage: 50,
      },
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(buildAttendanceTrendFromResumen([])).toEqual([]);
  });
});

describe("buildConfirmandoAttendanceTrend", () => {
  it("maps presente to 100% and ausente to 0% per session", () => {
    const result = buildConfirmandoAttendanceTrend(
      [
        { charla_id: "c1", titulo: "Charla 1", fecha: "2026-01-01T12:00:00.000Z", presente: true },
        { charla_id: "c2", titulo: "Charla 2", fecha: "2026-01-02T12:00:00.000Z", presente: false },
        { charla_id: "c3", titulo: "Charla 3", fecha: "2026-01-03T12:00:00.000Z", presente: true },
      ],
      new Date("2026-01-10T12:00:00.000Z"),
    );

    expect(result).toEqual([
      {
        key: "c1",
        date: "2026-01-01T12:00:00.000Z",
        label: "1 ene",
        title: "Charla 1",
        present: 1,
        absent: 0,
        total: 1,
        attendancePercentage: 100,
      },
      {
        key: "c2",
        date: "2026-01-02T12:00:00.000Z",
        label: "2 ene",
        title: "Charla 2",
        present: 0,
        absent: 1,
        total: 1,
        attendancePercentage: 0,
      },
      {
        key: "c3",
        date: "2026-01-03T12:00:00.000Z",
        label: "3 ene",
        title: "Charla 3",
        present: 1,
        absent: 0,
        total: 1,
        attendancePercentage: 100,
      },
    ]);
  });

  it("keeps all eligible historical items, sorted chronological ascending", () => {
    const items = Array.from({ length: 11 }, (_, index) => ({
      charla_id: `charla-${String(index + 1).padStart(2, "0")}`,
      titulo: `Charla ${index + 1}`,
      fecha: `2026-01-${String(index + 1).padStart(2, "0")}T12:00:00.000Z`,
      presente: index % 2 === 0,
    }));

    const result = buildConfirmandoAttendanceTrend(items, new Date("2026-01-11T12:00:00.000Z"));

    expect(result.map((point) => point.key)).toEqual([
      "charla-01",
      "charla-02",
      "charla-03",
      "charla-04",
      "charla-05",
      "charla-06",
      "charla-07",
      "charla-08",
      "charla-09",
      "charla-10",
      "charla-11",
    ]);
    expect(result.at(-1)).toEqual({
      key: "charla-11",
      date: "2026-01-11T12:00:00.000Z",
      label: "11 ene",
      title: "Charla 11",
      present: 1,
      absent: 0,
      total: 1,
      attendancePercentage: 100,
    });
  });

  it("excludes future charlas", () => {
    const result = buildConfirmandoAttendanceTrend(
      [
        { charla_id: "past", titulo: "Past", fecha: "2026-01-02T12:00:00.000Z", presente: true },
        {
          charla_id: "future",
          titulo: "Future",
          fecha: "2026-02-01T12:00:00.000Z",
          presente: false,
        },
      ],
      new Date("2026-01-15T12:00:00.000Z"),
    );

    expect(result.map((point) => point.key)).toEqual(["past"]);
  });

  it("returns an empty array for empty input", () => {
    expect(buildConfirmandoAttendanceTrend([])).toEqual([]);
  });
});
