import { NextResponse } from "next/server";

const RESEP_DB = {
  pbs_1x: {
    nama: "PBS 1× (Phosphate Buffered Saline)",
    deskripsi: "Larutan isotonik universal untuk biologi sel dan biokimia. pH 7.4.",
    ph_target: 7.4,
    komposisi_per_liter: [
      { senyawa: "NaCl", mr: 58.44, konsentrasi_mM: 137 },
      { senyawa: "KCl", mr: 74.55, konsentrasi_mM: 2.7 },
      { senyawa: "Na2HPO4", mr: 141.96, konsentrasi_mM: 10 },
      { senyawa: "KH2PO4", mr: 136.09, konsentrasi_mM: 1.8 },
    ],
  },
  tae_1x: {
    nama: "TAE 1× (Tris-Acetate-EDTA)",
    deskripsi: "Buffer untuk elektroforesis gel agarosa DNA.",
    ph_target: 8.3,
    komposisi_per_liter: [
      { senyawa: "Tris Base", mr: 121.14, konsentrasi_mM: 40 },
      { senyawa: "Asam Asetat", mr: 60.05, konsentrasi_mM: 20 },
      { senyawa: "EDTA Disodium", mr: 372.24, konsentrasi_mM: 1 },
    ],
  },
  tbe_1x: {
    nama: "TBE 1× (Tris-Borate-EDTA)",
    deskripsi: "Buffer alternatif elektroforesis DNA, resolusi lebih tinggi untuk fragmen kecil.",
    ph_target: 8.3,
    komposisi_per_liter: [
      { senyawa: "Tris Base", mr: 121.14, konsentrasi_mM: 89 },
      { senyawa: "Asam Borat", mr: 61.83, konsentrasi_mM: 89 },
      { senyawa: "EDTA Disodium", mr: 372.24, konsentrasi_mM: 2 },
    ],
  },
  tris_hcl_50mm: {
    nama: "Tris-HCl Buffer 50 mM",
    deskripsi: "Buffer protein umum. pH disesuaikan dengan HCl.",
    ph_target: 7.5,
    komposisi_per_liter: [
      { senyawa: "Tris Base", mr: 121.14, konsentrasi_mM: 50 },
    ],
  },
  phosphate_100mm: {
    nama: "Sodium Phosphate Buffer 100 mM",
    deskripsi: "Buffer pH fisiologis untuk biokimia protein.",
    ph_target: 7.0,
    komposisi_per_liter: [
      { senyawa: "Na2HPO4", mr: 141.96, konsentrasi_mM: 57.7 },
      { senyawa: "KH2PO4", mr: 136.09, konsentrasi_mM: 42.3 },
    ],
  },
} as const;

function r4(n: number) {
  return Math.round(n * 10000) / 10000;
}

function buildInstruksi(volumeMl: number, phTarget: number): string[] {
  const vol80 = Math.round(volumeMl * 0.8);
  return [
    `Siapkan gelas beaker bersih berkapasitas ≥${volumeMl} mL.`,
    `Tambahkan ±80% volume aquades (±${vol80} mL) ke dalam gelas beaker.`,
    "Tambahkan setiap komponen satu per satu sambil diaduk dengan magnetic stirrer hingga larut sempurna.",
    `Sesuaikan pH ke ${phTarget} menggunakan HCl 1 M (untuk menurunkan pH) atau NaOH 1 M (untuk menaikkan pH). Gunakan pH meter yang sudah dikalibrasi.`,
    `Tambahkan aquades hingga tepat volume akhir ${volumeMl} mL.`,
    "Sterilisasi dengan autoclave (121°C, 15 menit) atau filter steril 0.22 μm.",
    "Simpan pada suhu 4°C atau suhu ruang sesuai kebutuhan.",
  ];
}

export async function POST(req: Request) {
  let data: Record<string, unknown>;
  try {
    data = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Request body tidak valid JSON." }, { status: 400 });
  }

  const id_larutan = String(data.id_larutan ?? "").trim();
  const volume_akhir_ml = parseFloat(String(data.volume_akhir_ml ?? ""));
  const konsentrasi_x = parseFloat(String(data.konsentrasi_x ?? "1"));

  if (!id_larutan)
    return NextResponse.json({ error: "Field 'id_larutan' wajib diisi." }, { status: 400 });
  if (!(id_larutan in RESEP_DB))
    return NextResponse.json(
      { error: `ID larutan '${id_larutan}' tidak ditemukan. Pilih: ${Object.keys(RESEP_DB).join(", ")}.` },
      { status: 400 }
    );
  if (isNaN(volume_akhir_ml) || isNaN(konsentrasi_x))
    return NextResponse.json({ error: "volume_akhir_ml dan konsentrasi_x harus berupa angka." }, { status: 400 });
  if (volume_akhir_ml <= 0)
    return NextResponse.json({ error: "Volume akhir harus bernilai positif." }, { status: 400 });
  if (konsentrasi_x <= 0)
    return NextResponse.json({ error: "Konsentrasi (x) harus bernilai positif." }, { status: 400 });

  const resep = RESEP_DB[id_larutan as keyof typeof RESEP_DB];
  const volumeL = volume_akhir_ml / 1000;

  const komponen = resep.komposisi_per_liter.map((k) => {
    const massa_g = (k.konsentrasi_mM * konsentrasi_x * volumeL * k.mr) / 1000;
    return {
      senyawa: k.senyawa,
      mr: k.mr,
      massa_g: r4(massa_g),
      massa_mg: r4(massa_g * 1000),
      konsentrasi_final_mM: r4(k.konsentrasi_mM * konsentrasi_x),
    };
  });

  return NextResponse.json({
    status: "ok",
    data: {
      nama_larutan: resep.nama,
      deskripsi: resep.deskripsi,
      volume_akhir_ml,
      konsentrasi_x,
      ph_target: resep.ph_target,
      komponen,
      instruksi: buildInstruksi(volume_akhir_ml, resep.ph_target),
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
