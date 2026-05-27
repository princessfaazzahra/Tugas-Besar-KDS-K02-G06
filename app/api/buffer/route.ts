import { NextResponse } from "next/server";

const PKA_PRESETS: Record<string, number> = {
  Phosphate: 7.21,
  Tris: 8.06,
  Acetate: 4.76,
  HEPES: 7.55,
  MES: 6.10,
};

function r4(n: number) { return Math.round(n * 10000) / 10000; }
function r6(n: number) { return Math.round(n * 1000000) / 1000000; }

export async function POST(req: Request) {
  let data: Record<string, unknown>;
  try {
    data = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Request body tidak valid JSON." }, { status: 400 });
  }

  const ph_target = parseFloat(String(data.ph_target ?? ""));
  let pka = parseFloat(String(data.pka ?? ""));
  const buffer_system = String(data.buffer_system ?? "").trim();
  const konsentrasi_total_mM = parseFloat(String(data.konsentrasi_total_mM ?? ""));
  const volume_ml = parseFloat(String(data.volume_ml ?? ""));

  if (isNaN(pka) && buffer_system) {
    if (!(buffer_system in PKA_PRESETS))
      return NextResponse.json(
        { error: `Buffer system '${buffer_system}' tidak dikenal. Pilih: ${Object.keys(PKA_PRESETS).join(", ")}.` },
        { status: 400 }
      );
    pka = PKA_PRESETS[buffer_system];
  }

  if (isNaN(pka))
    return NextResponse.json({ error: "Wajib menyertakan 'pka' atau 'buffer_system'." }, { status: 400 });
  if (isNaN(ph_target) || isNaN(konsentrasi_total_mM) || isNaN(volume_ml))
    return NextResponse.json({ error: "ph_target, konsentrasi_total_mM, dan volume_ml harus berupa angka." }, { status: 400 });
  if (konsentrasi_total_mM <= 0)
    return NextResponse.json({ error: "Konsentrasi total harus bernilai positif." }, { status: 400 });
  if (volume_ml <= 0)
    return NextResponse.json({ error: "Volume harus bernilai positif." }, { status: 400 });
  if (ph_target <= 0 || ph_target >= 14)
    return NextResponse.json({ error: "pH target harus berada di antara 0 dan 14." }, { status: 400 });

  // Henderson-Hasselbalch: pH = pKa + log([A-]/[HA])
  const ratio = Math.pow(10, ph_target - pka);
  const konsentrasi_basa_mM = r4(konsentrasi_total_mM * ratio / (1 + ratio));
  const konsentrasi_asam_mM = r4(konsentrasi_total_mM / (1 + ratio));

  const volumeL = volume_ml / 1000;
  const mmol_basa = r4(konsentrasi_basa_mM * volumeL);
  const mmol_asam = r4(konsentrasi_asam_mM * volumeL);
  const mol_basa = r6(konsentrasi_basa_mM * volumeL / 1000);
  const mol_asam = r6(konsentrasi_asam_mM * volumeL / 1000);

  const ratio_display = r4(ratio);
  const ph_check = r4(pka + Math.log10(ratio));
  const buf_name = buffer_system || `Buffer (pKa=${pka})`;

  const instruksi = [
    "Siapkan komponen berdasarkan hasil kalkulasi di atas.",
    `Timbang/ukur konjugat basa (A⁻) sejumlah ${konsentrasi_basa_mM} mM.`,
    `Timbang/ukur asam (HA) sejumlah ${konsentrasi_asam_mM} mM.`,
    "Larutkan kedua komponen dalam ±80% volume aquades target.",
    `Periksa pH dengan pH meter terkalibrasi — target pH ${ph_target}.`,
    "Sesuaikan pH jika perlu dengan menambah sedikit asam atau basa pekat.",
    `Tambahkan aquades hingga volume akhir ${volume_ml} mL.`,
    "Sterilisasi dengan filter 0.22 μm atau autoclave sesuai kebutuhan.",
  ];

  return NextResponse.json({
    status: "ok",
    data: {
      ph_target,
      pka,
      buffer_system: buf_name,
      konsentrasi_total_mM,
      volume_ml,
      ratio_basa_asam: ratio_display,
      formula: `pH = pKa + log([A⁻]/[HA]) → ${ph_target} = ${pka} + log(${ratio_display})`,
      ph_check,
      konjugat_basa: {
        label: `${buf_name} (konjugat basa, A⁻)`,
        konsentrasi_mM: konsentrasi_basa_mM,
        mmol: mmol_basa,
        mol: mol_basa,
      },
      asam: {
        label: `${buf_name} (asam, HA)`,
        konsentrasi_mM: konsentrasi_asam_mM,
        mmol: mmol_asam,
        mol: mol_asam,
      },
      instruksi,
      pka_presets: PKA_PRESETS,
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
