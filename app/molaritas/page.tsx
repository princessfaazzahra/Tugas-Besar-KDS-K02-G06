"use client";

import { useState, useCallback } from "react";
import ResultCard from "@/components/ResultCard";
import InfoTooltip from "@/components/InfoTooltip";
import { callApi } from "@/lib/api-client";
import { senyawaData } from "@/lib/data-loader";

type Senyawa = { nama: string; rumus: string; mr: number; kategori: string };
type BreakdownItem = { label: string; value: string };
type ApiResult = {
  status: string;
  mode: string;
  data: {
    [key: string]: unknown;
    formula?: string;
    breakdown?: BreakdownItem[];
    steps?: SerialStep[];
  };
};
type SerialStep = {
  tahap: number;
  konsentrasi: number;
  v_stock_ml: number;
  v_pelarut_ml: number;
  instruksi: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  {
    id: "massa_ke_mol",
    label: "Massa → Mol",
    icon: "⚗️",
    short: "m→n",
    color: "emerald" as const,
  },
  {
    id: "mol_ke_massa",
    label: "Mol → Massa",
    icon: "🧮",
    short: "n→m",
    color: "sky" as const,
  },
  {
    id: "molaritas",
    label: "Molaritas",
    icon: "🔬",
    short: "M",
    color: "violet" as const,
  },
  {
    id: "dilusi",
    label: "Dilusi",
    icon: "💧",
    short: "C₁V₁",
    color: "sky" as const,
  },
  {
    id: "serial_dilusi",
    label: "Serial Dilusi",
    icon: "🧪",
    short: "Serial",
    color: "emerald" as const,
  },
] as const;

type TabId = (typeof TABS)[number]["id"];
type TabColor = (typeof TABS)[number]["color"];

const senyawaList: Senyawa[] = senyawaData.senyawa;

// ─── Sub-components ───────────────────────────────────────────────────────────

function Label({
  children,
  tooltip,
}: {
  children: React.ReactNode;
  tooltip?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700 mb-1">
      {children}
      {tooltip && <InfoTooltip text={tooltip} />}
    </label>
  );
}

function Input({
  id,
  value,
  onChange,
  placeholder,
  type = "number",
  min = "0",
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  min?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      min={min}
      step="any"
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
    />
  );
}

function SenyawaSelect({
  onSelect,
}: {
  onSelect: (mr: number, nama: string) => void;
}) {
  return (
    <div>
      <Label tooltip="Pilih senyawa untuk mengisi Mr secara otomatis">
        Pilih Senyawa (opsional)
      </Label>
      <select
        defaultValue=""
        onChange={(e) => {
          const found = senyawaList.find((s) => s.rumus === e.target.value);
          if (found) onSelect(found.mr, found.nama);
        }}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
      >
        <option value="">— Pilih senyawa —</option>
        {senyawaList.map((s) => (
          <option key={s.rumus} value={s.rumus}>
            {s.nama} ({s.rumus}) — Mr: {s.mr}
          </option>
        ))}
      </select>
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
      ⚠️ {msg}
    </div>
  );
}

function SubmitButton({ loading }: { loading: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold py-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Menghitung…
        </>
      ) : (
        "Hitung"
      )}
    </button>
  );
}

// ─── Tab Forms ────────────────────────────────────────────────────────────────

function MassaKeMolForm({ onResult }: { onResult: (r: ApiResult) => void }) {
  const [massa, setMassa] = useState("");
  const [mr, setMr] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!massa || !mr) return setError("Semua field wajib diisi.");
    if (+massa <= 0 || +mr <= 0) return setError("Nilai harus positif (> 0).");
    setLoading(true);
    try {
      const res = await callApi<ApiResult>("molaritas", {
        mode: "massa_ke_mol",
        massa_g: +massa,
        mr: +mr,
      });
      onResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SenyawaSelect onSelect={(mrVal) => setMr(String(mrVal))} />
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label tooltip="Massa zat dalam gram">Massa (g)</Label>
          <Input id="massa" value={massa} onChange={setMassa} placeholder="Contoh: 5.844" />
        </div>
        <div>
          <Label tooltip="Massa relatif molekul (g/mol)">Mr (g/mol)</Label>
          <Input id="mr" value={mr} onChange={setMr} placeholder="Contoh: 58.44" />
        </div>
      </div>
      {error && <ErrorBanner msg={error} />}
      <SubmitButton loading={loading} />
    </form>
  );
}

function MolKeMassaForm({ onResult }: { onResult: (r: ApiResult) => void }) {
  const [mol, setMol] = useState("");
  const [mr, setMr] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!mol || !mr) return setError("Semua field wajib diisi.");
    if (+mol <= 0 || +mr <= 0) return setError("Nilai harus positif (> 0).");
    setLoading(true);
    try {
      const res = await callApi<ApiResult>("molaritas", { mode: "mol_ke_massa", mol: +mol, mr: +mr });
      onResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SenyawaSelect onSelect={(mrVal) => setMr(String(mrVal))} />
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label tooltip="Jumlah mol zat">Jumlah Mol (mol)</Label>
          <Input id="mol" value={mol} onChange={setMol} placeholder="Contoh: 0.1" />
        </div>
        <div>
          <Label tooltip="Massa relatif molekul (g/mol)">Mr (g/mol)</Label>
          <Input id="mr" value={mr} onChange={setMr} placeholder="Contoh: 58.44" />
        </div>
      </div>
      {error && <ErrorBanner msg={error} />}
      <SubmitButton loading={loading} />
    </form>
  );
}

function MolaritasForm({ onResult }: { onResult: (r: ApiResult) => void }) {
  const [massa, setMassa] = useState("");
  const [mr, setMr] = useState("");
  const [volume, setVolume] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!massa || !mr || !volume) return setError("Semua field wajib diisi.");
    if (+massa <= 0 || +mr <= 0 || +volume <= 0) return setError("Nilai harus positif (> 0).");
    setLoading(true);
    try {
      const res = await callApi<ApiResult>("molaritas", {
        mode: "molaritas",
        massa_g: +massa,
        mr: +mr,
        volume_ml: +volume,
      });
      onResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SenyawaSelect onSelect={(mrVal) => setMr(String(mrVal))} />
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <Label tooltip="Massa zat terlarut dalam gram">Massa (g)</Label>
          <Input id="massa" value={massa} onChange={setMassa} placeholder="Contoh: 5.844" />
        </div>
        <div>
          <Label tooltip="Massa relatif molekul (g/mol)">Mr (g/mol)</Label>
          <Input id="mr" value={mr} onChange={setMr} placeholder="Contoh: 58.44" />
        </div>
        <div>
          <Label tooltip="Volume larutan dalam mililiter">Volume (mL)</Label>
          <Input id="vol" value={volume} onChange={setVolume} placeholder="Contoh: 500" />
        </div>
      </div>
      {error && <ErrorBanner msg={error} />}
      <SubmitButton loading={loading} />
    </form>
  );
}

function DilusiForm({ onResult }: { onResult: (r: ApiResult) => void }) {
  const [c1, setC1] = useState("");
  const [c2, setC2] = useState("");
  const [v2, setV2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!c1 || !c2 || !v2) return setError("Semua field wajib diisi.");
    if (+c1 <= 0 || +c2 <= 0 || +v2 <= 0) return setError("Nilai harus positif (> 0).");
    setLoading(true);
    try {
      const res = await callApi<ApiResult>("molaritas", { mode: "dilusi", c1: +c1, c2: +c2, v2_ml: +v2 });
      onResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg bg-sky-50 border border-sky-100 px-4 py-3 text-sm text-sky-700">
        <strong>Rumus:</strong> C₁V₁ = C₂V₂ &nbsp;→&nbsp; V₁ = (C₂ × V₂) / C₁
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <Label tooltip="Konsentrasi larutan stock (harus lebih tinggi dari C2)">C₁ — Konsentrasi Stock</Label>
          <Input id="c1" value={c1} onChange={setC1} placeholder="Contoh: 1" />
        </div>
        <div>
          <Label tooltip="Konsentrasi larutan kerja yang diinginkan">C₂ — Konsentrasi Akhir</Label>
          <Input id="c2" value={c2} onChange={setC2} placeholder="Contoh: 0.1" />
        </div>
        <div>
          <Label tooltip="Volume larutan akhir yang diinginkan (mL)">V₂ — Volume Akhir (mL)</Label>
          <Input id="v2" value={v2} onChange={setV2} placeholder="Contoh: 100" />
        </div>
      </div>
      {error && <ErrorBanner msg={error} />}
      <SubmitButton loading={loading} />
    </form>
  );
}

function SerialDilusiForm({ onResult }: { onResult: (r: ApiResult) => void }) {
  const [cAwal, setCawal] = useState("");
  const [faktor, setFaktor] = useState("");
  const [nTahap, setNTahap] = useState("");
  const [volTabung, setVolTabung] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!cAwal || !faktor || !nTahap || !volTabung) return setError("Semua field wajib diisi.");
    if (+cAwal <= 0 || +faktor <= 1 || +nTahap <= 0 || +volTabung <= 0)
      return setError("Nilai harus positif; faktor harus > 1.");
    setLoading(true);
    try {
      const res = await callApi<ApiResult>("molaritas", {
        mode: "serial_dilusi",
        c_awal: +cAwal,
        faktor: +faktor,
        n_tahap: Math.round(+nTahap),
        volume_per_tabung_ml: +volTabung,
      });
      onResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label tooltip="Konsentrasi larutan awal sebelum pengenceran serial">Konsentrasi Awal (C₀)</Label>
          <Input id="cawal" value={cAwal} onChange={setCawal} placeholder="Contoh: 1" />
        </div>
        <div>
          <Label tooltip="Faktor pengenceran setiap tahap, misalnya 2 berarti 1:2 (harus > 1)">Faktor Pengenceran</Label>
          <Input id="faktor" value={faktor} onChange={setFaktor} placeholder="Contoh: 2" />
        </div>
        <div>
          <Label tooltip="Jumlah tabung/tahap pengenceran (maks. 20)">Jumlah Tahap</Label>
          <Input id="ntahap" value={nTahap} onChange={setNTahap} placeholder="Contoh: 5" min="1" />
        </div>
        <div>
          <Label tooltip="Volume total setiap tabung setelah pengenceran (mL)">Volume per Tabung (mL)</Label>
          <Input id="voltabung" value={volTabung} onChange={setVolTabung} placeholder="Contoh: 1" />
        </div>
      </div>
      {error && <ErrorBanner msg={error} />}
      <SubmitButton loading={loading} />
    </form>
  );
}

// ─── Result Renderer ──────────────────────────────────────────────────────────

function ResultPanel({ result, color }: { result: ApiResult | null; color: TabColor }) {
  if (!result) return null;
  const d = result.data;

  // Serial dilusi: special table view
  if (result.mode === "serial_dilusi" && d.steps) {
    const steps = d.steps as SerialStep[];
    return (
      <div className="space-y-4 mt-6">
        <ResultCard
          title="Ringkasan Serial Dilusi"
          value={`${steps.length} Tahap`}
          formula={d.formula}
          breakdown={d.breakdown}
          color={color}
        />
        <div className="overflow-x-auto rounded-xl shadow-md border border-slate-100">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3 text-left">Tahap</th>
                <th className="px-4 py-3 text-right">Konsentrasi</th>
                <th className="px-4 py-3 text-right">Vol Stock (mL)</th>
                <th className="px-4 py-3 text-right">Vol Pelarut (mL)</th>
                <th className="px-4 py-3 text-left">Instruksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {steps.map((s) => (
                <tr key={s.tahap} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-700">{s.tahap}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-mono text-emerald-700">{s.konsentrasi}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{s.v_stock_ml}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{s.v_pelarut_ml}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{s.instruksi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Determine main value/unit/title based on mode
  const configs: Record<string, { title: string; value: string; unit: string }> = {
    massa_ke_mol: { title: "Hasil Konversi Massa → Mol", value: String(d.mol ?? ""), unit: "mol" },
    mol_ke_massa: { title: "Hasil Konversi Mol → Massa", value: String(d.massa_g ?? ""), unit: "g" },
    molaritas: { title: "Molaritas Larutan", value: String(d.molaritas_M ?? ""), unit: "M" },
    dilusi: { title: "Volume Stock yang Dibutuhkan", value: String(d.v1_ml ?? ""), unit: "mL" },
  };

  const cfg = configs[result.mode] ?? { title: "Hasil", value: "-", unit: "" };

  return (
    <div className="mt-6">
      <ResultCard
        title={cfg.title}
        value={cfg.value}
        unit={cfg.unit}
        formula={d.formula}
        breakdown={d.breakdown}
        color={color}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MolaritasPage() {
  const [activeTab, setActiveTab] = useState<TabId>("massa_ke_mol");
  const [result, setResult] = useState<ApiResult | null>(null);

  const handleResult = useCallback((r: ApiResult) => setResult(r), []);
  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setResult(null);
  };

  const currentTab = TABS.find((t) => t.id === activeTab)!;

  const formMap: Record<TabId, React.ReactNode> = {
    massa_ke_mol: <MassaKeMolForm onResult={handleResult} />,
    mol_ke_massa: <MolKeMassaForm onResult={handleResult} />,
    molaritas: <MolaritasForm onResult={handleResult} />,
    dilusi: <DilusiForm onResult={handleResult} />,
    serial_dilusi: <SerialDilusiForm onResult={handleResult} />,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Kalkulator Molaritas</h1>
        <p className="text-slate-500 mt-1.5">
          Hitung mol, molaritas, dilusi, dan serial dilusi secara otomatis.
        </p>
      </div>

      {/* Tab bar — scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <span className="hidden sm:inline">{tab.icon}</span>
            <span className="sm:hidden">{tab.short}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-md p-6 space-y-2">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">{currentTab.icon}</span>
          <h2 className="text-xl font-bold text-slate-800">{currentTab.label}</h2>
        </div>

        {formMap[activeTab]}
        <ResultPanel result={result} color={currentTab.color} />
      </div>

      {/* Reference */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
        <h3 className="font-semibold text-slate-700 mb-3">Referensi Cepat Rumus</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
          {[
            { label: "Massa → Mol", formula: "n = m / Mr" },
            { label: "Mol → Massa", formula: "m = n × Mr" },
            { label: "Molaritas", formula: "M = (m / Mr) / V(L)" },
            { label: "Dilusi", formula: "C₁V₁ = C₂V₂" },
            { label: "Milimol", formula: "mmol = mol × 1000" },
            { label: "mM", formula: "mM = M × 1000" },
          ].map((r) => (
            <div key={r.label} className="bg-white rounded-lg border border-slate-200 px-3 py-2">
              <p className="text-xs text-slate-400 font-medium">{r.label}</p>
              <code className="text-emerald-700 font-mono">{r.formula}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
