import senyawaCsv from "@/data/senyawa.csv";
import larutanMetaCsv from "@/data/larutan_meta.csv";
import larutanKomposisiCsv from "@/data/larutan_komposisi.csv";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Senyawa {
  nama: string;
  rumus: string;
  mr: number;
  kategori: string;
}

export interface KomposisiItem {
  senyawa: string;
  mr: number;
  konsentrasi_mM: number;
}

export interface Larutan {
  id: string;
  nama: string;
  deskripsi: string;
  ph_target: number;
  komposisi_per_liter: KomposisiItem[];
}

// ─── CSV parser ────────────────────────────────────────────────────────────────

function parseLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

function parseCsv(raw: string): Record<string, string>[] {
  const lines = raw.trim().split(/\r?\n/);
  const headers = parseLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseLine(line);
    return headers.reduce<Record<string, string>>((obj, key, i) => {
      obj[key] = values[i] ?? "";
      return obj;
    }, {});
  });
}

// ─── Parsed exports (same shape as the old JSON imports) ──────────────────────

const senyawaRows = parseCsv(senyawaCsv);

export const senyawaData: { senyawa: Senyawa[] } = {
  senyawa: senyawaRows.map((r) => ({
    nama: r.nama,
    rumus: r.rumus,
    mr: parseFloat(r.mr),
    kategori: r.kategori,
  })),
};

const metaRows = parseCsv(larutanMetaCsv);
const komposisiRows = parseCsv(larutanKomposisiCsv);

export const larutanResep: { larutan: Larutan[] } = {
  larutan: metaRows.map((m) => ({
    id: m.id,
    nama: m.nama,
    deskripsi: m.deskripsi,
    ph_target: parseFloat(m.ph_target),
    komposisi_per_liter: komposisiRows
      .filter((k) => k.id_larutan === m.id)
      .map((k) => ({
        senyawa: k.senyawa,
        mr: parseFloat(k.mr),
        konsentrasi_mM: parseFloat(k.konsentrasi_mM),
      })),
  })),
};
