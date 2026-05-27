"use client";

import { useState, useRef, useEffect } from "react";
import { callApi } from "@/lib/api-client";
import larutanResep from "@/data/larutan_resep.json";

// ─── Types ────────────────────────────────────────────────────────────────────

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
}

// ─── Data ─────────────────────────────────────────────────────────────────────

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

// ─── Shared primitives ────────────────────────────────────────────────────────

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
      {children}
    </label>
  );
}

function Field({ label, children, htmlFor }: { label: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-400"
    />
  );
}

function SubmitButton({ loading, label, loadingLabel, color = "emerald" }: {
  loading: boolean;
  label: string;
  loadingLabel?: string;
  color?: "emerald" | "sky";
}) {
  const bg = color === "sky"
    ? "bg-sky-500 hover:bg-sky-600 disabled:bg-sky-200"
    : "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-200";
  return (
    <button
      type="submit"
      disabled={loading}
      className={`w-full ${bg} text-white font-semibold rounded-lg py-2.5 text-sm transition-colors flex items-center justify-center gap-2`}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {loading ? (loadingLabel ?? "Menghitung…") : label}
    </button>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 flex gap-2">
      <span className="shrink-0">⚠️</span>
      <span>{message}</span>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

interface DropdownOption {
  id: string;
  nama: string;
  deskripsi: string;
  ph_target: number;
}

function LarutanDropdown({ value, onChange, options }: {
  value: string;
  onChange: (id: string) => void;
  options: DropdownOption[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value) ?? options[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border text-sm bg-white transition-colors text-left ${
          open ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <div className="min-w-0">
          <span className="font-medium text-slate-800 block truncate">{selected.nama}</span>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20" fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => { onChange(opt.id); setOpen(false); }}
              className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 ${
                opt.id === value ? "bg-emerald-50" : ""
              }`}
            >
              <div className={`text-sm font-medium ${opt.id === value ? "text-emerald-700" : "text-slate-700"}`}>
                {opt.nama}
              </div>
              <div className="text-xs text-slate-400 mt-0.5 leading-snug">{opt.deskripsi}</div>
              <div className="text-xs text-slate-400 mt-0.5">pH target: {opt.ph_target}</div>
            </button>
          ))}
        </div>
      )}
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!volumeMl || volumeMl <= 0) { setError("Volume harus bernilai positif."); return; }
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
    <Card>
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🧫</span>
          <div>
            <h2 className="font-semibold text-slate-800">Recipe Generator</h2>
            <p className="text-xs text-slate-400 mt-0.5">Hitung kebutuhan bahan untuk larutan biologis standar</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Larutan */}
          <Field label="Jenis Larutan">
            <LarutanDropdown
              value={idLarutan}
              onChange={(id) => { setIdLarutan(id); setResult(null); }}
              options={LARUTAN_OPTIONS}
            />
          </Field>

          {/* Volume + Konsentrasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Volume Akhir" htmlFor="volume_ml">
              <div className="relative">
                <TextInput
                  id="volume_ml"
                  type="number"
                  min={1}
                  step={1}
                  value={volumeMl}
                  onChange={(e) => setVolumeMl(Number(e.target.value))}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">mL</span>
              </div>
            </Field>

            <Field label="Konsentrasi">
              <div className="flex gap-1.5">
                {KONSENTRASI_OPTIONS.map((k) => (
                  <button
                    key={k.value}
                    type="button"
                    onClick={() => setKonsentrasiX(k.value)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      konsentrasiX === k.value
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700"
                    }`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <SubmitButton loading={loading} label="Generate Resep" />
        </form>

        {error && <ErrorBanner message={error} />}
      </div>

      {result && (
        <div className="border-t border-slate-100">
          <RecipeResult result={result} />
        </div>
      )}
    </Card>
  );
}

function RecipeResult({ result }: { result: LarutanResult }) {
  return (
    <div className="p-6 space-y-5">
      {/* Meta */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-700">{result.nama_larutan}</span>
        <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">
          {result.volume_akhir_ml} mL
        </span>
        <span className="text-xs bg-slate-50 text-slate-600 border border-slate-100 px-2 py-0.5 rounded-full">
          {result.konsentrasi_x}×
        </span>
        <span className="text-xs bg-sky-50 text-sky-600 border border-sky-100 px-2 py-0.5 rounded-full">
          pH {result.ph_target}
        </span>
      </div>

      {/* Table */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Komponen</p>
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs">
                <th className="text-left px-3 py-2 font-medium">Senyawa</th>
                <th className="text-right px-3 py-2 font-medium">Massa (g)</th>
                <th className="text-right px-3 py-2 font-medium hidden sm:table-cell">Massa (mg)</th>
                <th className="text-right px-3 py-2 font-medium">Konsentrasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.komponen.map((k, i) => (
                <tr key={i} className="bg-white hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2.5 font-medium text-slate-700">{k.senyawa}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-emerald-600 font-semibold">{k.massa_g}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-400 hidden sm:table-cell">{k.massa_mg}</td>
                  <td className="px-3 py-2.5 text-right text-slate-500 text-xs">{k.konsentrasi_final_mM} mM</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instructions */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Langkah Preparasi</p>
        <ol className="space-y-2">
          {result.instruksi.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-600">
              <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold mt-0.5">
                {i + 1}
              </span>
              <span className="leading-relaxed">{step.replace(/^\d+\.\s*/, "")}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Safety */}
      <div className="flex gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-700">
        <span className="shrink-0">⚠️</span>
        <span>Gunakan APD (sarung tangan, kacamata pelindung) saat mempersiapkan larutan kimia.</span>
      </div>
    </div>
  );
}

// ─── Section B: Buffer Calculator ─────────────────────────────────────────────

function BufferCalculator() {
  const [bufferSystem, setBufferSystem] = useState("Phosphate");
  const [useManualPka, setUseManualPka] = useState(false);
  const [manualPka, setManualPka] = useState("");
  const [phTarget, setPhTarget] = useState(7.4);
  const [konsentrasiTotal, setKonsentrasiTotal] = useState(100);
  const [volumeMl, setVolumeMl] = useState(500);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BufferResult | null>(null);
  const [error, setError] = useState("");

  const resolvedPka = useManualPka ? parseFloat(manualPka) : BUFFER_PRESETS[bufferSystem];

  const phDiff = !isNaN(resolvedPka) ? Math.abs(phTarget - resolvedPka) : null;
  const bufferWarning = phDiff !== null && phDiff > 1
    ? `pH target (${phTarget}) jauh dari pKa (${resolvedPka}). Buffer kurang efektif di luar pKa ± 1.`
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (isNaN(resolvedPka) || resolvedPka <= 0 || resolvedPka >= 14) { setError("pKa harus berupa angka antara 0–14."); return; }
    if (phTarget <= 0 || phTarget >= 14) { setError("pH target harus antara 0–14."); return; }
    if (konsentrasiTotal <= 0) { setError("Konsentrasi total harus positif."); return; }
    if (volumeMl <= 0) { setError("Volume harus positif."); return; }

    setLoading(true);
    try {
      const res = await callApi<{ status: string; data: BufferResult }>("buffer", {
        ph_target: phTarget,
        pka: resolvedPka,
        buffer_system: useManualPka ? undefined : bufferSystem,
        konsentrasi_total_mM: konsentrasiTotal,
        volume_ml: volumeMl,
      });
      setResult(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">⚗️</span>
          <div>
            <h2 className="font-semibold text-slate-800">Buffer Calculator</h2>
            <p className="text-xs text-slate-400 mt-0.5">Henderson-Hasselbalch — rasio asam/basa konjugat untuk pH target</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Buffer system */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Sistem Buffer</Label>
              <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useManualPka}
                  onChange={(e) => { setUseManualPka(e.target.checked); setResult(null); }}
                  className="accent-sky-500 w-3.5 h-3.5"
                />
                Input pKa manual
              </label>
            </div>

            {useManualPka ? (
              <div className="relative">
                <TextInput
                  type="number"
                  step="0.01"
                  placeholder="cth: 7.21"
                  value={manualPka}
                  onChange={(e) => setManualPka(e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">pKa</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Object.entries(BUFFER_PRESETS).map(([name, pka]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => { setBufferSystem(name); setResult(null); }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      bufferSystem === name
                        ? "bg-sky-500 text-white border-sky-500"
                        : "bg-white text-slate-600 border-slate-200 hover:border-sky-300 hover:text-sky-700"
                    }`}
                  >
                    {name} <span className="opacity-70">pKa {pka}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* pH, Konsentrasi, Volume */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="pH Target" htmlFor="ph_target">
              <TextInput
                id="ph_target"
                type="number"
                step="0.01"
                min={0}
                max={14}
                value={phTarget}
                onChange={(e) => setPhTarget(Number(e.target.value))}
              />
            </Field>
            <Field label="Konsentrasi Total" htmlFor="konsentrasi_total">
              <div className="relative">
                <TextInput
                  id="konsentrasi_total"
                  type="number"
                  step="1"
                  min={1}
                  value={konsentrasiTotal}
                  onChange={(e) => setKonsentrasiTotal(Number(e.target.value))}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">mM</span>
              </div>
            </Field>
            <Field label="Volume" htmlFor="volume_buffer">
              <div className="relative">
                <TextInput
                  id="volume_buffer"
                  type="number"
                  step="1"
                  min={1}
                  value={volumeMl}
                  onChange={(e) => setVolumeMl(Number(e.target.value))}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">mL</span>
              </div>
            </Field>
          </div>

          {bufferWarning && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              ⚠️ {bufferWarning}
            </p>
          )}

          <SubmitButton loading={loading} label="Hitung Komposisi Buffer" color="sky" />
        </form>

        {error && <ErrorBanner message={error} />}
      </div>

      {result && (
        <div className="border-t border-slate-100">
          <BufferResult result={result} />
        </div>
      )}
    </Card>
  );
}

function BufferResult({ result }: { result: BufferResult }) {
  return (
    <div className="p-6 space-y-5">
      {/* Formula */}
      <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
        <p className="text-xs text-slate-400 mb-1 font-medium">Henderson-Hasselbalch</p>
        <code className="text-sm font-mono text-slate-700">{result.formula}</code>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-xs bg-sky-50 text-sky-600 border border-sky-100 px-2 py-0.5 rounded-full">
            Rasio [A⁻]/[HA] = {result.ratio_basa_asam}
          </span>
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
            pH check: {result.ph_check}
          </span>
        </div>
      </div>

      {/* Result cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-lg border-l-4 border-sky-400 bg-sky-50/50 border border-sky-100">
          <p className="text-xs font-semibold text-sky-500 uppercase tracking-wide mb-0.5">Konjugat Basa (A⁻)</p>
          <p className="text-2xl font-bold text-sky-700 mt-1">
            {result.konjugat_basa.konsentrasi_mM}
            <span className="text-sm font-normal text-slate-500 ml-1">mM</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">{result.konjugat_basa.mmol} mmol · {result.konjugat_basa.mol} mol</p>
        </div>

        <div className="p-4 rounded-lg border-l-4 border-emerald-400 bg-emerald-50/50 border border-emerald-100">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-0.5">Asam (HA)</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {result.asam.konsentrasi_mM}
            <span className="text-sm font-normal text-slate-500 ml-1">mM</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">{result.asam.mmol} mmol · {result.asam.mol} mol</p>
        </div>
      </div>

      {/* Instructions */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Instruksi Mixing</p>
        <ol className="space-y-2">
          {result.instruksi.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-600">
              <span className="shrink-0 w-5 h-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs font-bold mt-0.5">
                {i + 1}
              </span>
              <span className="leading-relaxed">{step.replace(/^\d+\.\s*/, "")}</span>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Larutan &amp; Buffer</h1>
        <p className="text-sm text-slate-400 mt-1">
          Generator resep larutan biologis standar dan kalkulator buffer Henderson-Hasselbalch.
        </p>
      </div>

      <RecipeGenerator onRecipeGenerated={(id) => setSimulasiIdLarutan(id)} />
      <BufferCalculator />

      {/* Section C — Naila tambahkan simulasi drag & drop di sini */}
      <div id="simulasi-section" data-larutan-id={simulasiIdLarutan ?? ""} />
    </div>
  );
}
