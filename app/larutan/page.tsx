"use client";

import { useState } from "react";
import { callApi } from "@/lib/api-client";
import larutanResep from "@/data/larutan_resep.json";

// ─── Types ───────────────────────────────────────────────────────────────────

interface KomponenResult {
  senyawa: string;
  mr: number;
  massa_g: number;
  massa_mg: number;
  konsentrasi_final_mM: number;
}

interface LarutanResult {
  nama_larutan: string;
  deskripsi: string;
  volume_akhir_ml: number;
  konsentrasi_x: number;
  ph_target: number;
  komponen: KomponenResult[];
  instruksi: string[];
}

interface BufferResult {
  ph_target: number;
  pka: number;
  buffer_system: string;
  konsentrasi_total_mM: number;
  volume_ml: number;
  ratio_basa_asam: number;
  formula: string;
  ph_check: number;
  konjugat_basa: { label: string; konsentrasi_mM: number; mmol: number; mol: number };
  asam: { label: string; konsentrasi_mM: number; mmol: number; mol: number };
  instruksi: string[];
  pka_presets: Record<string, number>;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const LARUTAN_OPTIONS = larutanResep.larutan.map((l) => ({
  id: l.id,
  nama: l.nama,
  deskripsi: l.deskripsi,
  ph_target: l.ph_target,
}));

const KONSENTRASI_OPTIONS = [
  { value: 1, label: "1×" },
  { value: 2, label: "2×" },
  { value: 5, label: "5×" },
  { value: 10, label: "10×" },
];

const BUFFER_PRESETS: Record<string, number> = {
  Phosphate: 7.21,
  Tris: 8.06,
  Acetate: 4.76,
  HEPES: 7.55,
  MES: 6.10,
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      </div>
      <p className="text-sm text-slate-500 ml-10">{subtitle}</p>
    </div>
  );
}

function InputLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700 mb-1">
      {children}
    </label>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
      <span className="text-base leading-none mt-0.5">⚠️</span>
      <span>{message}</span>
    </div>
  );
}

// ─── Section A: Recipe Generator ─────────────────────────────────────────────

interface RecipeGeneratorProps {
  onRecipeGenerated?: (idLarutan: string) => void;
}

function RecipeGenerator({ onRecipeGenerated }: RecipeGeneratorProps) {
  const [idLarutan, setIdLarutan] = useState(LARUTAN_OPTIONS[0].id);
  const [volumeMl, setVolumeMl] = useState(500);
  const [konsentrasiX, setKonsentrasiX] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LarutanResult | null>(null);
  const [error, setError] = useState("");

  const selectedLarutan = LARUTAN_OPTIONS.find((l) => l.id === idLarutan) ?? LARUTAN_OPTIONS[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (volumeMl <= 0) {
      setError("Volume harus bernilai positif.");
      return;
    }

    setLoading(true);
    try {
      const res = await callApi<{ status: string; data: LarutanResult }>("larutan", {
        id_larutan: idLarutan,
        volume_akhir_ml: volumeMl,
        konsentrasi_x: konsentrasiX,
      });
      setResult(res.data);
      onRecipeGenerated?.(idLarutan);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <SectionHeader
        icon="🧫"
        title="Recipe Generator"
        subtitle="Hitung kebutuhan bahan untuk membuat larutan biologis standar."
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Larutan Dropdown */}
        <div>
          <InputLabel htmlFor="id_larutan">Jenis Larutan</InputLabel>
          <select
            id="id_larutan"
            value={idLarutan}
            onChange={(e) => setIdLarutan(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {LARUTAN_OPTIONS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nama}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">{selectedLarutan.deskripsi}</p>
        </div>

        {/* Volume + Konsentrasi row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Volume */}
          <div>
            <InputLabel htmlFor="volume_ml">Volume Akhir (mL)</InputLabel>
            <input
              id="volume_ml"
              type="number"
              min={1}
              step={1}
              value={volumeMl}
              onChange={(e) => setVolumeMl(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="range"
              min={10}
              max={2000}
              step={10}
              value={volumeMl}
              onChange={(e) => setVolumeMl(Number(e.target.value))}
              className="w-full mt-2 accent-emerald-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-0.5">
              <span>10 mL</span>
              <span>2000 mL</span>
            </div>
          </div>

          {/* Konsentrasi */}
          <div>
            <InputLabel>Konsentrasi</InputLabel>
            <div className="flex gap-2 flex-wrap mt-1">
              {KONSENTRASI_OPTIONS.map((k) => (
                <label key={k.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="konsentrasi_x"
                    value={k.value}
                    checked={konsentrasiX === k.value}
                    onChange={() => setKonsentrasiX(k.value)}
                    className="sr-only"
                  />
                  <span
                    className={`inline-block px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      konsentrasiX === k.value
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-slate-600 border-slate-300 hover:border-emerald-400"
                    }`}
                  >
                    {k.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Menghitung…
            </span>
          ) : (
            "Generate Resep"
          )}
        </button>
      </form>

      {error && <ErrorBanner message={error} />}

      {result && <RecipeResult result={result} />}
    </div>
  );
}

function RecipeResult({ result }: { result: LarutanResult }) {
  return (
    <div className="mt-6 space-y-4">
      {/* Header */}
      <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
        <p className="font-bold text-emerald-800 text-base">{result.nama_larutan}</p>
        <p className="text-sm text-emerald-700 mt-0.5">{result.deskripsi}</p>
        <div className="flex flex-wrap gap-3 mt-2 text-xs text-emerald-700">
          <span className="bg-emerald-100 px-2 py-0.5 rounded">Volume: {result.volume_akhir_ml} mL</span>
          <span className="bg-emerald-100 px-2 py-0.5 rounded">Konsentrasi: {result.konsentrasi_x}×</span>
          <span className="bg-emerald-100 px-2 py-0.5 rounded">pH target: {result.ph_target}</span>
        </div>
      </div>

      {/* Komponen Table */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Komponen yang Dibutuhkan</h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Senyawa</th>
                <th className="text-right px-3 py-2 font-medium">Massa (g)</th>
                <th className="text-right px-3 py-2 font-medium">Massa (mg)</th>
                <th className="text-right px-3 py-2 font-medium">Konsentrasi Final</th>
              </tr>
            </thead>
            <tbody>
              {result.komponen.map((k, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="px-3 py-2 font-medium text-slate-800">{k.senyawa}</td>
                  <td className="px-3 py-2 text-right font-mono text-emerald-700">{k.massa_g}</td>
                  <td className="px-3 py-2 text-right font-mono text-sky-600">{k.massa_mg}</td>
                  <td className="px-3 py-2 text-right text-slate-600">{k.konsentrasi_final_mM} mM</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instructions */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Langkah Preparasi</h3>
        <ol className="space-y-1.5">
          {result.instruksi.map((step, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-600">
              <span className="text-emerald-600 shrink-0 font-medium">{i + 1}.</span>
              <span>{step.replace(/^\d+\.\s*/, "")}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Safety Note */}
      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex gap-2">
        <span>⚠️</span>
        <span>
          Selalu gunakan APD (sarung tangan, kacamata pelindung) saat mempersiapkan larutan kimia.
          Beberapa reagen bersifat iritan atau korosif.
        </span>
      </div>
    </div>
  );
}

// ─── Section B: Buffer Calculator ────────────────────────────────────────────

function BufferCalculator() {
  const [bufferSystem, setBufferSystem] = useState("Phosphate");
  const [manualPka, setManualPka] = useState("");
  const [useManualPka, setUseManualPka] = useState(false);
  const [phTarget, setPhTarget] = useState(7.4);
  const [konsentrasiTotal, setKonsentrasiTotal] = useState(100);
  const [volumeMl, setVolumeMl] = useState(500);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BufferResult | null>(null);
  const [error, setError] = useState("");

  const resolvedPka = useManualPka ? parseFloat(manualPka) : BUFFER_PRESETS[bufferSystem];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (isNaN(resolvedPka) || resolvedPka <= 0 || resolvedPka >= 14) {
      setError("pKa harus berupa angka antara 0 dan 14.");
      return;
    }
    if (phTarget <= 0 || phTarget >= 14) {
      setError("pH target harus antara 0 dan 14.");
      return;
    }
    if (konsentrasiTotal <= 0) {
      setError("Konsentrasi total harus positif.");
      return;
    }
    if (volumeMl <= 0) {
      setError("Volume harus positif.");
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        ph_target: phTarget,
        konsentrasi_total_mM: konsentrasiTotal,
        volume_ml: volumeMl,
      };
      if (useManualPka) {
        payload.pka = resolvedPka;
      } else {
        payload.buffer_system = bufferSystem;
        payload.pka = resolvedPka;
      }

      const res = await callApi<{ status: string; data: BufferResult }>("buffer", payload);
      setResult(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  const pkaEffective = isNaN(resolvedPka) ? "—" : resolvedPka;
  const phDiff = isNaN(resolvedPka) ? null : Math.abs(phTarget - resolvedPka);
  const bufferWarning =
    phDiff !== null && phDiff > 1
      ? `pH target (${phTarget}) jauh dari pKa (${pkaEffective}). Buffer kurang efektif di luar rentang pKa ± 1.`
      : null;

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <SectionHeader
        icon="⚗️"
        title="Buffer Calculator"
        subtitle="Henderson-Hasselbalch: tentukan rasio asam/basa konjugat untuk pH target."
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Buffer System */}
        <div>
          <InputLabel>Sistem Buffer</InputLabel>
          <div className="flex items-center gap-3 mb-2">
            <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={useManualPka}
                onChange={(e) => setUseManualPka(e.target.checked)}
                className="accent-emerald-600"
              />
              Input pKa manual
            </label>
          </div>

          {useManualPka ? (
            <div>
              <input
                type="number"
                step="0.01"
                placeholder="cth: 7.21"
                value={manualPka}
                onChange={(e) => setManualPka(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {Object.entries(BUFFER_PRESETS).map(([name, pka]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setBufferSystem(name)}
                  className={`p-2 rounded-lg border text-xs font-medium text-center transition-colors ${
                    bufferSystem === name
                      ? "bg-sky-500 text-white border-sky-500"
                      : "bg-white text-slate-600 border-slate-300 hover:border-sky-400"
                  }`}
                >
                  <div className="font-semibold">{name}</div>
                  <div className="opacity-75">pKa {pka}</div>
                </button>
              ))}
            </div>
          )}

          {!useManualPka && (
            <p className="mt-1 text-xs text-slate-500">
              pKa efektif: <strong>{pkaEffective}</strong>
            </p>
          )}
        </div>

        {/* pH, Konsentrasi, Volume */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <InputLabel htmlFor="ph_target">pH Target</InputLabel>
            <input
              id="ph_target"
              type="number"
              step="0.01"
              min={0}
              max={14}
              value={phTarget}
              onChange={(e) => setPhTarget(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <InputLabel htmlFor="konsentrasi_total">Konsentrasi Total (mM)</InputLabel>
            <input
              id="konsentrasi_total"
              type="number"
              step="1"
              min={1}
              value={konsentrasiTotal}
              onChange={(e) => setKonsentrasiTotal(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <InputLabel htmlFor="volume_buffer">Volume (mL)</InputLabel>
            <input
              id="volume_buffer"
              type="number"
              step="1"
              min={1}
              value={volumeMl}
              onChange={(e) => setVolumeMl(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {bufferWarning && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            ⚠️ {bufferWarning}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Menghitung…
            </span>
          ) : (
            "Hitung Komposisi Buffer"
          )}
        </button>
      </form>

      {error && <ErrorBanner message={error} />}

      {result && <BufferResult result={result} />}
    </div>
  );
}

function BufferResult({ result }: { result: BufferResult }) {
  const totalMmolCheck = result.konjugat_basa.mmol + result.asam.mmol;

  return (
    <div className="mt-6 space-y-4">
      {/* Formula display */}
      <div className="p-4 rounded-lg bg-sky-50 border border-sky-200">
        <p className="text-xs text-sky-600 font-medium mb-1">Persamaan Henderson-Hasselbalch</p>
        <code className="text-sm font-mono text-sky-800 break-all">{result.formula}</code>
        <div className="flex flex-wrap gap-3 mt-2 text-xs text-sky-700">
          <span className="bg-sky-100 px-2 py-0.5 rounded">
            Rasio [A⁻]/[HA] = {result.ratio_basa_asam}
          </span>
          <span className="bg-sky-100 px-2 py-0.5 rounded">
            pH check: {result.ph_check}
          </span>
        </div>
      </div>

      {/* Result cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Konjugat Basa */}
        <div className="border-l-4 border-sky-500 bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1 font-medium">Konjugat Basa (A⁻)</p>
          <p className="text-sm text-slate-700 mb-2">{result.konjugat_basa.label}</p>
          <p className="text-2xl font-bold text-sky-600">
            {result.konjugat_basa.konsentrasi_mM}
            <span className="text-sm font-normal text-slate-500 ml-1">mM</span>
          </p>
          <div className="mt-2 text-xs text-slate-500 space-y-0.5">
            <div>{result.konjugat_basa.mmol} mmol untuk {result.volume_ml} mL</div>
            <div>{result.konjugat_basa.mol} mol</div>
          </div>
        </div>

        {/* Asam */}
        <div className="border-l-4 border-emerald-500 bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1 font-medium">Asam (HA)</p>
          <p className="text-sm text-slate-700 mb-2">{result.asam.label}</p>
          <p className="text-2xl font-bold text-emerald-600">
            {result.asam.konsentrasi_mM}
            <span className="text-sm font-normal text-slate-500 ml-1">mM</span>
          </p>
          <div className="mt-2 text-xs text-slate-500 space-y-0.5">
            <div>{result.asam.mmol} mmol untuk {result.volume_ml} mL</div>
            <div>{result.asam.mol} mol</div>
          </div>
        </div>
      </div>

      {/* Summary row */}
      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm">
        <div className="flex flex-wrap gap-4 text-slate-600">
          <span>Konsentrasi total: <strong>{result.konsentrasi_total_mM} mM</strong></span>
          <span>Total dalam {result.volume_ml} mL: <strong>{totalMmolCheck.toFixed(4)} mmol</strong></span>
          <span>pH target: <strong>{result.ph_target}</strong></span>
          <span>pKa: <strong>{result.pka}</strong></span>
        </div>
      </div>

      {/* Instructions */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Instruksi Mixing</h3>
        <ol className="space-y-1.5">
          {result.instruksi.map((step, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-600">
              <span className="text-sky-500 shrink-0 font-medium">{i + 1}.</span>
              <span>{step.replace(/^\d+\.\s*/, "")}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LarutanPage() {
  const [simulasiIdLarutan, setSimulasiIdLarutan] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Larutan &amp; Buffer</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Generator resep larutan biologis standar dan kalkulator buffer Henderson-Hasselbalch.
        </p>
      </div>

      {/* Section A */}
      <RecipeGenerator onRecipeGenerated={(id) => setSimulasiIdLarutan(id)} />

      {/* Section B */}
      <BufferCalculator />

      {/* Section C placeholder — Naila akan mengisi bagian ini */}
      <div
        id="simulasi-section"
        data-larutan-id={simulasiIdLarutan ?? ""}
      />
    </div>
  );
}
