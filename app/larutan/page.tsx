"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { callApi } from "@/lib/api-client";
import larutanResep from "@/data/larutan_resep.json";
import LabSimulation from "@/components/LabSimulation";

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

// ─── Icons (inline SVG, Flaticon-style line art, 24×24 viewBox) ───────────────

function Svg({ children, className = "w-5 h-5" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      {children}
    </svg>
  );
}

const IcFlask = () => (
  <Svg>
    <path d="M9 3h6M9 3v7.5L5 20h14L15 10.5V3" />
    <path d="M7.5 16.5h4.5" strokeWidth="1.25" />
  </Svg>
);
const IcDrop = () => (
  <Svg>
    <path d="M12 3L5.5 12.5A6.5 6.5 0 0018.5 12.5L12 3z" />
  </Svg>
);
const IcStir = () => (
  <Svg>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l3 2" />
  </Svg>
);
const IcPH = () => (
  <Svg>
    <path d="M10 3h4v10.5" />
    <circle cx="12" cy="17" r="4" />
    <path d="M10 7h4" strokeWidth="1.25" />
  </Svg>
);
const IcCylinder = () => (
  <Svg>
    <path d="M8 4h8v13a4 4 0 01-8 0V4z" />
    <path d="M8 9h4M8 13h3" strokeWidth="1.25" />
  </Svg>
);
const IcFlame = () => (
  <Svg>
    <path d="M12 2C9.5 7.5 6 9.5 6 14a6 6 0 0012 0c0-4.5-3.5-6.5-6-12z" />
    <path d="M12 17a2 2 0 002-2c0-2-2-3-2-3s-2 1-2 3a2 2 0 002 2z" fill="currentColor" stroke="none" />
  </Svg>
);
const IcBox = () => (
  <Svg>
    <path d="M5 8h14v11a2 2 0 01-2 2H7a2 2 0 01-2-2V8z" />
    <path d="M3 8h18M12 8v13" strokeWidth="1.25" />
    <path d="M7 5h10" />
  </Svg>
);
const IcEye = () => (
  <Svg>
    <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);
const IcGlove = () => (
  <Svg>
    <path d="M9 12V6a1.5 1.5 0 013 0v4" />
    <path d="M12 10V5a1.5 1.5 0 013 0v4" />
    <path d="M15 9V7a1.5 1.5 0 013 0v5.5A6 6 0 0112 18.5H9a6 6 0 01-6-6v-1a1.5 1.5 0 013 0" />
  </Svg>
);
const IcCoat = () => (
  <Svg>
    <path d="M3 7l4-3h10l4 3v14H3V7z" />
    <path d="M12 4v8M9 7l3 5 3-5" strokeWidth="1.25" />
  </Svg>
);

// Per-step icons for Recipe instructions (index 0–6)
const STEP_ICONS = [<IcFlask key={0} />, <IcDrop key={1} />, <IcStir key={2} />,
  <IcPH key={3} />, <IcCylinder key={4} />, <IcFlame key={5} />, <IcBox key={6} />];

const SAFETY_ITEMS = [
  { icon: <IcEye />, label: "Kacamata Pelindung", desc: "Lindungi mata dari percikan reagen" },
  { icon: <IcGlove />, label: "Sarung Tangan", desc: "Hindari kontak kulit dengan bahan kimia" },
  { icon: <IcCoat />, label: "Jas Laboratorium", desc: "Cegah kontaminasi pakaian" },
];

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
    <input {...props}
      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-800
        focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-400"
    />
  );
}

function SubmitButton({ loading, label, loadingLabel, color = "emerald" }: {
  loading: boolean; label: string; loadingLabel?: string; color?: "emerald" | "sky";
}) {
  const bg = color === "sky"
    ? "bg-sky-500 hover:bg-sky-600 disabled:bg-sky-200"
    : "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-200";
  return (
    <button type="submit" disabled={loading}
      className={`w-full ${bg} text-white font-semibold rounded-lg py-2.5 text-sm transition-colors flex items-center justify-center gap-2`}>
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

// ─── Custom dropdown ──────────────────────────────────────────────────────────

interface DropdownOption { id: string; nama: string; deskripsi: string; ph_target: number; }

function LarutanDropdown({ value, onChange, options }: {
  value: string; onChange: (id: string) => void; options: DropdownOption[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value) ?? options[0];

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border text-sm bg-white transition-colors text-left ${
          open ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200 hover:border-slate-300"
        }`}>
        <span className="font-medium text-slate-800 truncate">{selected.nama}</span>
        <svg className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {options.map((opt) => (
            <button key={opt.id} type="button"
              onClick={() => { onChange(opt.id); setOpen(false); }}
              className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 ${
                opt.id === value ? "bg-emerald-50" : ""}`}>
              <div className={`text-sm font-medium ${opt.id === value ? "text-emerald-700" : "text-slate-700"}`}>{opt.nama}</div>
              <div className="text-xs text-slate-400 mt-0.5">{opt.deskripsi}</div>
              <div className="text-xs text-slate-400">pH target: {opt.ph_target}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Math fraction helper ─────────────────────────────────────────────────────

function Frac({ top, bottom, size = "base" }: { top: React.ReactNode; bottom: React.ReactNode; size?: "sm" | "base" }) {
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  return (
    <span className={`inline-flex flex-col items-center mx-1 leading-none align-middle ${textSize}`}>
      <span className="border-b border-current px-1 pb-[2px] whitespace-nowrap">{top}</span>
      <span className="px-1 pt-[2px] whitespace-nowrap">{bottom}</span>
    </span>
  );
}

// ─── Section A: Recipe Generator ─────────────────────────────────────────────

function RecipeGenerator({ onRecipeGenerated }: { onRecipeGenerated?: (result: LarutanResult) => void }) {
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
        id_larutan: idLarutan, volume_akhir_ml: volumeMl, konsentrasi_x: konsentrasiX,
      });
      setResult(res.data);
      onRecipeGenerated?.(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally { setLoading(false); }
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
          <Field label="Jenis Larutan">
            <LarutanDropdown value={idLarutan} onChange={(id) => { setIdLarutan(id); setResult(null); }} options={LARUTAN_OPTIONS} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Volume Akhir" htmlFor="volume_ml">
              <div className="relative">
                <TextInput id="volume_ml" type="number" min={1} step={1} value={volumeMl}
                  onChange={(e) => setVolumeMl(Number(e.target.value))} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">mL</span>
              </div>
            </Field>

            <Field label="Konsentrasi">
              <div className="flex gap-1.5">
                {KONSENTRASI_OPTIONS.map((k) => (
                  <button key={k.value} type="button" onClick={() => setKonsentrasiX(k.value)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      konsentrasiX === k.value
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700"}`}>
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

      {result && <div className="border-t border-slate-100"><RecipeResult result={result} /></div>}
    </Card>
  );
}

// ─── Recipe Result ─────────────────────────────────────────────────────────────

function RecipeResult({ result }: { result: LarutanResult }) {
  return (
    <div className="p-6 space-y-6">
      {/* Meta badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-700">{result.nama_larutan}</span>
        {[
          { val: `${result.volume_akhir_ml} mL`, cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
          { val: `${result.konsentrasi_x}×`, cls: "bg-slate-50 text-slate-600 border-slate-100" },
          { val: `pH ${result.ph_target}`, cls: "bg-sky-50 text-sky-600 border-sky-100" },
        ].map(({ val, cls }) => (
          <span key={val} className={`text-xs border px-2 py-0.5 rounded-full ${cls}`}>{val}</span>
        ))}
      </div>

      {/* Komponen table — improved */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Komponen</p>
        <div className="rounded-xl overflow-hidden border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-emerald-600 text-white text-xs">
                <th className="text-left px-4 py-3 font-semibold">Senyawa</th>
                <th className="text-right px-4 py-3 font-semibold">Massa (g)</th>
                <th className="text-right px-4 py-3 font-semibold hidden sm:table-cell">Massa (mg)</th>
                <th className="text-right px-4 py-3 font-semibold">Konsentrasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.komponen.map((k, i) => (
                <tr key={i} className={`transition-colors hover:bg-emerald-50/40 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                  <td className="px-4 py-3.5">
                    <span className="font-bold text-slate-700">{k.senyawa}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-lg font-bold font-mono text-emerald-600">{k.massa_g}</span>
                    <span className="text-xs text-slate-400 ml-1">g</span>
                  </td>
                  <td className="px-4 py-3.5 text-right hidden sm:table-cell">
                    <span className="font-mono text-slate-400 text-xs">{k.massa_mg} mg</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
                      {k.konsentrasi_final_mM} mM
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Step-by-step instruction cards */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Langkah Preparasi</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {result.instruksi.map((step, i) => (
            <div key={i} className="flex gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                {STEP_ICONS[i] ?? <span className="text-xs font-bold">{i + 1}</span>}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Langkah {i + 1}</p>
                <p className="text-sm text-slate-700 leading-snug">{step.replace(/^\d+\.\s*/, "")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safety APD cards */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Keselamatan Kerja — APD Wajib</p>
        <div className="grid grid-cols-3 gap-3">
          {SAFETY_ITEMS.map(({ icon, label, desc }) => (
            <div key={label} className="flex flex-col items-center text-center p-3.5 rounded-xl bg-amber-50 border border-amber-100 gap-2">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                {icon}
              </div>
              <div>
                <p className="text-xs font-bold text-amber-800">{label}</p>
                <p className="text-[10px] text-amber-600 mt-0.5 leading-snug">{desc}</p>
              </div>
            </div>
          ))}
        </div>
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
        ph_target: phTarget, pka: resolvedPka,
        buffer_system: useManualPka ? undefined : bufferSystem,
        konsentrasi_total_mM: konsentrasiTotal, volume_ml: volumeMl,
      });
      setResult(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally { setLoading(false); }
  }

  return (
    <Card>
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">⚗️</span>
          <div>
            <h2 className="font-semibold text-slate-800">Buffer Calculator</h2>
            <p className="text-xs text-slate-400 mt-0.5">Henderson-Hasselbalch — rasio asam/basa untuk pH target</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Sistem Buffer</Label>
              <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                <input type="checkbox" checked={useManualPka}
                  onChange={(e) => { setUseManualPka(e.target.checked); setResult(null); }}
                  className="accent-sky-500 w-3.5 h-3.5" />
                Input pKa manual
              </label>
            </div>
            {useManualPka ? (
              <div className="relative">
                <TextInput type="number" step="0.01" placeholder="cth: 7.21"
                  value={manualPka} onChange={(e) => setManualPka(e.target.value)} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">pKa</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Object.entries(BUFFER_PRESETS).map(([name, pka]) => (
                  <button key={name} type="button"
                    onClick={() => { setBufferSystem(name); setResult(null); }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      bufferSystem === name
                        ? "bg-sky-500 text-white border-sky-500"
                        : "bg-white text-slate-600 border-slate-200 hover:border-sky-300 hover:text-sky-700"}`}>
                    {name} <span className="opacity-70">pKa {pka}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="pH Target" htmlFor="ph_target">
              <TextInput id="ph_target" type="number" step="0.01" min={0} max={14}
                value={phTarget} onChange={(e) => setPhTarget(Number(e.target.value))} />
            </Field>
            <Field label="Konsentrasi Total" htmlFor="konsentrasi_total">
              <div className="relative">
                <TextInput id="konsentrasi_total" type="number" step="1" min={1}
                  value={konsentrasiTotal} onChange={(e) => setKonsentrasiTotal(Number(e.target.value))} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">mM</span>
              </div>
            </Field>
            <Field label="Volume" htmlFor="volume_buffer">
              <div className="relative">
                <TextInput id="volume_buffer" type="number" step="1" min={1}
                  value={volumeMl} onChange={(e) => setVolumeMl(Number(e.target.value))} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">mL</span>
              </div>
            </Field>
          </div>

          {bufferWarning && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">⚠️ {bufferWarning}</p>
          )}

          <SubmitButton loading={loading} label="Hitung Komposisi Buffer" color="sky" />
        </form>
        {error && <ErrorBanner message={error} />}
      </div>

      {result && <div className="border-t border-slate-100"><BufferResult result={result} /></div>}
    </Card>
  );
}

// ─── Buffer Result ─────────────────────────────────────────────────────────────

function BufferResult({ result }: { result: BufferResult }) {
  const phDiff = (result.ph_target - result.pka).toFixed(2);
  const denom = (1 + result.ratio_basa_asam).toFixed(4);

  return (
    <div className="p-6 space-y-6">

      {/* ① Math derivation */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Penyelesaian Matematis</p>
        <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">

          {/* Formula bar */}
          <div className="px-5 py-4 border-b border-slate-200 bg-white">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-2">Persamaan Henderson-Hasselbalch</p>
            <div className="flex items-center gap-1 font-mono text-slate-700 text-base flex-wrap">
              <span>pH</span>
              <span className="text-slate-400">=</span>
              <span>pKa</span>
              <span className="text-slate-400">+</span>
              <span>log</span>
              <Frac top="[A⁻]" bottom="[HA]" />
            </div>
          </div>

          {/* Steps */}
          <div className="divide-y divide-slate-200">
            {/* Step 1 */}
            <div className="px-5 py-3.5 flex gap-4">
              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
              <div className="font-mono text-sm text-slate-700 space-y-0.5">
                <p className="text-[10px] font-sans text-slate-400 uppercase tracking-wide font-semibold mb-1">Hitung Ratio [A⁻]/[HA]</p>
                <p><span className="text-slate-500">ratio</span> = 10<sup>(pH − pKa)</sup></p>
                <p className="text-slate-400 pl-10">= 10<sup>({result.ph_target} − {result.pka})</sup></p>
                <p className="text-slate-400 pl-10">= 10<sup>({phDiff})</sup></p>
                <p className="pl-10 font-bold text-sky-600">= {result.ratio_basa_asam}</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="px-5 py-3.5 flex gap-4">
              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
              <div className="font-mono text-sm text-slate-700 space-y-0.5">
                <p className="text-[10px] font-sans text-slate-400 uppercase tracking-wide font-semibold mb-1">Hitung [A⁻] — Konjugat Basa</p>
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-slate-500">[A⁻]</span>
                  <span className="text-slate-400">=</span>
                  <span>C</span>
                  <span className="text-slate-400">×</span>
                  <Frac size="sm" top="ratio" bottom="1 + ratio" />
                </div>
                <p className="text-slate-400 pl-8">
                  = {result.konsentrasi_total_mM} ×{" "}
                  <Frac size="sm" top={String(result.ratio_basa_asam)} bottom={denom} />
                </p>
                <p className="pl-8 font-bold text-sky-600">= {result.konjugat_basa.konsentrasi_mM} mM</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="px-5 py-3.5 flex gap-4">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
              <div className="font-mono text-sm text-slate-700 space-y-0.5">
                <p className="text-[10px] font-sans text-slate-400 uppercase tracking-wide font-semibold mb-1">Hitung [HA] — Asam</p>
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-slate-500">[HA]</span>
                  <span className="text-slate-400">=</span>
                  <span>C</span>
                  <span className="text-slate-400">×</span>
                  <Frac size="sm" top="1" bottom="1 + ratio" />
                </div>
                <p className="text-slate-400 pl-8">
                  = {result.konsentrasi_total_mM} ×{" "}
                  <Frac size="sm" top="1" bottom={denom} />
                </p>
                <p className="pl-8 font-bold text-emerald-600">= {result.asam.konsentrasi_mM} mM</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ② Result cards */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Hasil Kalkulasi</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Konjugat Basa */}
          <div className="rounded-xl border-2 border-sky-200 bg-sky-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-sky-400 shrink-0" />
              <span className="text-xs font-bold text-sky-700 uppercase tracking-wide">Konjugat Basa (A⁻)</span>
            </div>
            <div className="text-3xl font-bold text-sky-700 font-mono leading-none">
              {result.konjugat_basa.konsentrasi_mM}
              <span className="text-base font-normal text-slate-500 ml-1.5">mM</span>
            </div>
            <div className="mt-3 pt-3 border-t border-sky-200 text-xs text-slate-600 space-y-1">
              <p className="text-[10px] text-sky-500 uppercase tracking-wide font-semibold">Untuk {result.volume_ml} mL larutan:</p>
              <div className="flex gap-3">
                <span className="bg-white rounded px-2 py-0.5 border border-sky-100">
                  <strong>{result.konjugat_basa.mmol}</strong> mmol
                </span>
                <span className="bg-white rounded px-2 py-0.5 border border-sky-100">
                  <strong>{result.konjugat_basa.mol}</strong> mol
                </span>
              </div>
            </div>
          </div>

          {/* Asam */}
          <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Asam (HA)</span>
            </div>
            <div className="text-3xl font-bold text-emerald-700 font-mono leading-none">
              {result.asam.konsentrasi_mM}
              <span className="text-base font-normal text-slate-500 ml-1.5">mM</span>
            </div>
            <div className="mt-3 pt-3 border-t border-emerald-200 text-xs text-slate-600 space-y-1">
              <p className="text-[10px] text-emerald-600 uppercase tracking-wide font-semibold">Untuk {result.volume_ml} mL larutan:</p>
              <div className="flex gap-3">
                <span className="bg-white rounded px-2 py-0.5 border border-emerald-100">
                  <strong>{result.asam.mmol}</strong> mmol
                </span>
                <span className="bg-white rounded px-2 py-0.5 border border-emerald-100">
                  <strong>{result.asam.mol}</strong> mol
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary strip */}
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 px-1 text-xs text-slate-500">
          <span>pH target: <strong className="text-slate-700">{result.ph_target}</strong></span>
          <span>pKa: <strong className="text-slate-700">{result.pka}</strong></span>
          <span>Rasio [A⁻]/[HA]: <strong className="text-slate-700">{result.ratio_basa_asam}</strong></span>
          <span>pH verifikasi: <strong className="text-slate-700">{result.ph_check}</strong></span>
        </div>
      </div>

      {/* ③ Instructions */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Instruksi Mixing</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {result.instruksi.map((step, i) => (
            <div key={i} className="flex gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-sky-200 hover:bg-sky-50/30 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                {STEP_ICONS[i] ?? <span className="text-xs font-bold">{i + 1}</span>}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Langkah {i + 1}</p>
                <p className="text-sm text-slate-700 leading-snug">{step.replace(/^\d+\.\s*/, "")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function LarutanPage() {
  const [simulasiRecipe, setSimulasiRecipe] = useState<LarutanResult | null>(null);
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-emerald-600 transition-colors group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform group-hover:-translate-x-0.5"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Kembali
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Larutan &amp; Buffer</h1>
          <p className="text-sm text-slate-400 mt-1">
            Generator resep larutan biologis standar dan kalkulator buffer Henderson-Hasselbalch.
          </p>
        </div>
      </div>

      <RecipeGenerator onRecipeGenerated={(result) => setSimulasiRecipe(result)} />
      <BufferCalculator />

      {/* Section C — Simulasi Drag & Drop (Naila) */}
      <LabSimulation recipe={simulasiRecipe} />
    </div>
  );
}
