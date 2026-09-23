/**
 * Non-destructive Esperanza seed script for esperanza-sacramento-manager.
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment.
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * This script only inserts/upserts Esperanza test data into miembros_esperanza
 * and asistencia_esperanza. It does NOT delete any existing data.
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

try {
  const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed
      .slice(eqIdx + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (key) process.env[key] = val;
  }
} catch {
  /* .env not found, rely on existing env */
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing env vars. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabaseUntyped = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function latestDates(count: number, upTo: Date = new Date()): Date[] {
  const dates: Date[] = [];
  const d = new Date(Date.UTC(upTo.getUTCFullYear(), upTo.getUTCMonth(), upTo.getUTCDate()));
  while (dates.length < count) {
    dates.push(new Date(d));
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return dates;
}

// ------------------------------------------------------------------
// Data
// ------------------------------------------------------------------
const miembros = [
  {
    dni: "ESP-001",
    full_name: "Sofía García Rodríguez",
    email: "sofia.garcia@esperanza.example.com",
    telefono: "11 2345678",
    fecha_nacimiento: "1985-03-15",
    notas: "Miembro fundador",
    activo: true,
  },
  {
    dni: "ESP-002",
    full_name: "Martina López Fernández",
    email: "martina.lopez@esperanza.example.com",
    telefono: "221 3456789",
    fecha_nacimiento: "1990-07-22",
    notas: null,
    activo: true,
  },
  {
    dni: "ESP-003",
    full_name: "Catalina Martínez Pérez",
    email: "catalina.martinez@esperanza.example.com",
    telefono: "341 4567890",
    fecha_nacimiento: "1978-11-05",
    notas: "Canta en el coro",
    activo: true,
  },
  {
    dni: "ESP-004",
    full_name: "Emilia González Sánchez",
    email: "emilia.gonzalez@esperanza.example.com",
    telefono: "351 5678901",
    fecha_nacimiento: "1982-01-30",
    notas: null,
    activo: true,
  },
  {
    dni: "ESP-005",
    full_name: "Valentina Romero Torres",
    email: "valentina.romero@esperanza.example.com",
    telefono: "381 6789012",
    fecha_nacimiento: "1995-05-18",
    notas: "Encargada de liturgia",
    activo: true,
  },
  {
    dni: "ESP-006",
    full_name: "Benjamín Ruiz Vázquez",
    email: "benjamin.ruiz@esperanza.example.com",
    telefono: "0261 7890123",
    fecha_nacimiento: "1988-09-10",
    notas: null,
    activo: true,
  },
  {
    dni: "ESP-007",
    full_name: "Mateo Ramírez Flores",
    email: "mateo.ramirez@esperanza.example.com",
    telefono: "11 8901234",
    fecha_nacimiento: "1975-12-25",
    notas: "Miembro fundador",
    activo: true,
  },
  {
    dni: "ESP-008",
    full_name: "Lorenzo Benítez Acosta",
    email: "lorenzo.benitez@esperanza.example.com",
    telefono: "221 9012345",
    fecha_nacimiento: "1992-04-08",
    notas: null,
    activo: true,
  },
  {
    dni: "ESP-009",
    full_name: "Juan Medina Herrera",
    email: "juan.medina@esperanza.example.com",
    telefono: "341 0123456",
    fecha_nacimiento: "1980-06-20",
    notas: "Coordinador de jóvenes",
    activo: true,
  },
  {
    dni: "ESP-010",
    full_name: "Tomás Fernández García",
    email: "tomas.fernandez@esperanza.example.com",
    telefono: "351 1234567",
    fecha_nacimiento: "1998-08-14",
    notas: null,
    activo: true,
  },
];

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------
async function main() {
  console.log("\n🌱 Esperanza non-destructive seed");
  console.log("This script only inserts/upserts Esperanza test data.");
  console.log("It does NOT delete any existing data.\n");

  // 1. Upsert miembros
  console.log("🌱 Upserting miembros_esperanza...");
  const { data: upsertedMembers, error: mErr } = await supabaseUntyped
    .from("miembros_esperanza")
    .upsert(miembros, { onConflict: "dni" })
    .select("id,dni");

  if (mErr) throw mErr;
  if (!upsertedMembers || upsertedMembers.length === 0) {
    throw new Error("No members returned after upsert.");
  }
  console.log(`   → ${upsertedMembers.length} miembros`);

  // 2. Upsert asistencia
  console.log("🌱 Upserting asistencia_esperanza...");
  const dates = latestDates(12);
  const asistenciaRows = upsertedMembers.flatMap((miembro, i) =>
    dates.map((fecha, j) => {
      const presente = (i * 7 + j * 13) % 5 !== 0;
      const notas = presente && (i * 3 + j * 11) % 17 === 0 ? "Llegó tarde" : null;
      return {
        miembro_id: miembro.id,
        fecha: fecha.toISOString().split("T")[0],
        presente,
        notas,
      };
    }),
  );

  const chunk = 500;
  for (let i = 0; i < asistenciaRows.length; i += chunk) {
    const { error: aErr } = await supabaseUntyped
      .from("asistencia_esperanza")
      .upsert(asistenciaRows.slice(i, i + chunk), { onConflict: "miembro_id,fecha" });
    if (aErr) throw aErr;
  }
  console.log(`   → ${asistenciaRows.length} registros de asistencia`);

  console.log("\n🎉 Seed completed successfully!");
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err);
  process.exit(1);
});
