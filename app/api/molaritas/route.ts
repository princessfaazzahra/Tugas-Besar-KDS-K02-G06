import { NextResponse } from "next/server";

function r4(n: number) {
  return Math.round(n * 10000) / 10000;
}

type BreakdownItem = { label: string; value: string };

function requirePositive(fields: [string, number][]): string | null {
  for (const [name, val] of fields) {
    if (isNaN(val)) return `Field '${name}' harus berupa angka.`;
    if (val <= 0) return `Field '${name}' harus bernilai positif (> 0).`;
  }
  return null;
}

function num(v: unknown): number {
  return parseFloat(String(v ?? ""));
}

// ─── Mode handlers ─────────────────────────────────────────────────────────────

function massaKeMol(data: Record<string, unknown>) {
  const massa_g = num(data.massa_g);
  const mr = num(data.mr);
  const err = requirePositive([["massa_g", massa_g], ["mr", mr]]);
  if (err) return { error: err };

  const mol = massa_g / mr;
  const milimol = mol * 1000;
  return {
    mol: r4(mol),
    milimol: r4(milimol),
    formula: `n = m/Mr → n = ${massa_g}/${mr} = ${r4(mol)} mol`,
    breakdown: [
      { label: "Mol (n)", value: `${r4(mol)} mol` },
      { label: "Milimol (mmol)", value: `${r4(milimol)} mmol` },
      { label: "Mr yang digunakan", value: `${mr} g/mol` },
    ] as BreakdownItem[],
  };
}

function molKeMassa(data: Record<string, unknown>) {
  const mol = num(data.mol);
  const mr = num(data.mr);
  const err = requirePositive([["mol", mol], ["mr", mr]]);
  if (err) return { error: err };

  const massa_g = mol * mr;
  const massa_mg = massa_g * 1000;
  return {
    massa_g: r4(massa_g),
    massa_mg: r4(massa_mg),
    formula: `m = n × Mr → m = ${mol} × ${mr} = ${r4(massa_g)} g`,
    breakdown: [
      { label: "Massa (g)", value: `${r4(massa_g)} g` },
      { label: "Massa (mg)", value: `${r4(massa_mg)} mg` },
      { label: "Mr yang digunakan", value: `${mr} g/mol` },
    ] as BreakdownItem[],
  };
}

function molaritas(data: Record<string, unknown>) {
  const massa_g = num(data.massa_g);
  const mr = num(data.mr);
  const volume_ml = num(data.volume_ml);
  const err = requirePositive([["massa_g", massa_g], ["mr", mr], ["volume_ml", volume_ml]]);
  if (err) return { error: err };

  const volume_l = volume_ml / 1000;
  const mol = massa_g / mr;
  const molaritas_M = mol / volume_l;
  const milimolaritas_mM = molaritas_M * 1000;
  return {
    molaritas_M: r4(molaritas_M),
    milimolaritas_mM: r4(milimolaritas_mM),
    mol: r4(mol),
    formula: `M = (m/Mr)/V(L) → M = (${massa_g}/${mr})/${volume_l} = ${r4(molaritas_M)} M`,
    breakdown: [
      { label: "Molaritas (M)", value: `${r4(molaritas_M)} M` },
      { label: "Milimolaritas (mM)", value: `${r4(milimolaritas_mM)} mM` },
      { label: "Jumlah mol", value: `${r4(mol)} mol` },
      { label: "Volume larutan", value: `${volume_ml} mL = ${volume_l} L` },
    ] as BreakdownItem[],
  };
}

function dilusi(data: Record<string, unknown>) {
  const c1 = num(data.c1);
  const c2 = num(data.c2);
  const v2_ml = num(data.v2_ml);
  const err = requirePositive([["c1", c1], ["c2", c2], ["v2_ml", v2_ml]]);
  if (err) return { error: err };
  if (c1 <= c2) return { error: "Konsentrasi stock (C1) harus lebih tinggi dari working solution (C2)." };

  const v1_ml = (c2 * v2_ml) / c1;
  const v_pelarut_ml = v2_ml - v1_ml;
  return {
    v1_ml: r4(v1_ml),
    v_pelarut_ml: r4(v_pelarut_ml),
    formula: `C₁V₁ = C₂V₂ → V₁ = (C₂×V₂)/C₁ = (${c2}×${v2_ml})/${c1} = ${r4(v1_ml)} mL`,
    breakdown: [
      { label: "Volume stock (V₁)", value: `${r4(v1_ml)} mL` },
      { label: "Volume pelarut ditambahkan", value: `${r4(v_pelarut_ml)} mL` },
      { label: "Volume akhir (V₂)", value: `${v2_ml} mL` },
      { label: "Faktor pengenceran", value: `${r4(c1 / c2)}×` },
    ] as BreakdownItem[],
  };
}

function serialDilusi(data: Record<string, unknown>) {
  const c_awal = num(data.c_awal);
  const faktor = num(data.faktor);
  const n_tahap = parseInt(String(data.n_tahap ?? ""), 10);
  const volume_per_tabung_ml = num(data.volume_per_tabung_ml);

  const err = requirePositive([
    ["c_awal", c_awal],
    ["faktor", faktor],
    ["volume_per_tabung_ml", volume_per_tabung_ml],
  ]);
  if (err) return { error: err };
  if (!n_tahap || n_tahap <= 0) return { error: "Jumlah tahap harus bilangan bulat positif." };
  if (n_tahap > 20) return { error: "Jumlah tahap maksimum adalah 20." };
  if (faktor <= 1) return { error: "Faktor pengenceran harus lebih besar dari 1." };

  const steps = [];
  let c_prev = c_awal;
  for (let i = 1; i <= n_tahap; i++) {
    const c_curr = c_prev / faktor;
    const v_stock = volume_per_tabung_ml / faktor;
    const v_pelarut = volume_per_tabung_ml - v_stock;
    steps.push({
      tahap: i,
      konsentrasi: r4(c_curr),
      v_stock_ml: r4(v_stock),
      v_pelarut_ml: r4(v_pelarut),
      instruksi: `Ambil ${r4(v_stock)} mL dari tabung sebelumnya, tambahkan ${r4(v_pelarut)} mL pelarut → [C] = ${r4(c_curr)}`,
    });
    c_prev = c_curr;
  }

  return {
    c_awal,
    faktor,
    n_tahap,
    steps,
    formula: `Cn = C₀ / faktor^n → faktor = ${faktor}×, ${n_tahap} tahap`,
    breakdown: [
      { label: "Konsentrasi awal", value: String(c_awal) },
      { label: "Faktor pengenceran", value: `${faktor}×` },
      { label: "Jumlah tahap", value: String(n_tahap) },
      { label: "Konsentrasi akhir", value: String(r4(steps[steps.length - 1].konsentrasi)) },
    ] as BreakdownItem[],
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────

const MODES: Record<string, (d: Record<string, unknown>) => object> = {
  massa_ke_mol: massaKeMol,
  mol_ke_massa: molKeMassa,
  molaritas,
  dilusi,
  serial_dilusi: serialDilusi,
};

export async function POST(req: Request) {
  let data: Record<string, unknown>;
  try {
    data = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Request body tidak valid JSON." }, { status: 400 });
  }

  const mode = String(data.mode ?? "").trim();
  if (!mode || !(mode in MODES)) {
    return NextResponse.json(
      { error: `Mode tidak dikenal: '${mode}'. Pilihan valid: ${Object.keys(MODES).join(", ")}` },
      { status: 400 }
    );
  }

  const result = MODES[mode](data) as Record<string, unknown>;
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ status: "ok", mode, data: result });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
