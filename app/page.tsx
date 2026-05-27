import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4 tracking-tight">
          BioSolution Calculator
        </h1>
        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Otomatisasi perhitungan mol, molaritas, dan persiapan larutan biologis untuk
          mengurangi kesalahan manusia dalam praktik laboratorium.
        </p>
      </section>

      {/* Feature Cards */}
      <section className="grid md:grid-cols-2 gap-6">
        <Link href="/molaritas" className="group">
          <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-all duration-200 border border-slate-100 hover:border-emerald-200 h-full">
            <div className="text-4xl mb-4">⚗️</div>
            <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-emerald-700 transition-colors">
              Kalkulator Molaritas
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              Konversi massa ke mol, hitung molaritas, dilusi C₁V₁=C₂V₂, dan serial dilusi
              dengan breakdown rumus langkah per langkah.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Massa ↔ Mol", "Molaritas", "Dilusi", "Serial Dilusi"].map((tag) => (
                <span key={tag} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-1 text-sm font-medium text-emerald-600 group-hover:gap-2 transition-all">
              Buka Kalkulator <span>→</span>
            </div>
          </div>
        </Link>

        <Link href="/larutan" className="group">
          <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-all duration-200 border border-slate-100 hover:border-sky-200 h-full">
            <div className="text-4xl mb-4">🧬</div>
            <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-sky-700 transition-colors">
              Larutan & Buffer
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              Generator resep larutan biologis standar (PBS, TAE, TBE, Tris-HCl) dengan kalkulator
              buffer Henderson-Hasselbalch dan simulasi lab interaktif.
            </p>
            <div className="flex flex-wrap gap-2">
              {["PBS", "TAE/TBE", "Buffer H-H", "Simulasi Lab"].map((tag) => (
                <span key={tag} className="text-xs bg-sky-50 text-sky-700 px-2 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-1 text-sm font-medium text-sky-600 group-hover:gap-2 transition-all">
              Buka Modul <span>→</span>
            </div>
          </div>
        </Link>
      </section>

      {/* About Section */}
      <section className="bg-white rounded-xl shadow-md p-8 border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 bg-emerald-500 rounded-full" />
          <h2 className="text-xl font-bold text-slate-800">About BioSolution</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-xl">⚠️</div>
            <h3 className="font-semibold text-slate-700 text-sm">Masalah</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Kesalahan konsentrasi sebesar 5% saja sudah cukup merusak eksperimen berjam-jam.
              Perhitungan manual membuka celah human error yang besar.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-xl">🔬</div>
            <h3 className="font-semibold text-slate-700 text-sm">Metode</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Tiga rumus inti:{" "}
              <code className="bg-slate-100 px-1 rounded text-xs">n = m/Mr</code>,{" "}
              <code className="bg-slate-100 px-1 rounded text-xs">M = n/V</code>, dan{" "}
              <code className="bg-slate-100 px-1 rounded text-xs">pH = pKa + log([A⁻]/[HA])</code>.
              Dijalankan Python serverless dengan presisi 4 desimal.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center text-xl">🗄️</div>
            <h3 className="font-semibold text-slate-700 text-sm">Database</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              30 senyawa biologis umum dengan Mr akurat, serta 5 resep larutan standar
              berdasarkan protokol Cold Spring Harbor.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
