import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          🧪 Komputasi Dasar Sains — Mol, Molaritas & Larutan Biologis
        </div>
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
              Konversi massa ↔ mol, hitung molaritas, dilusi C₁V₁=C₂V₂, dan serial dilusi
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
              Generator resep larutan biologis standar (PBS, TAE, TBE, Tris-HCl) + kalkulator
              buffer Henderson-Hasselbalch + simulasi lab interaktif.
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
        <h2 className="text-xl font-bold text-slate-800 mb-4">Tentang Aplikasi</h2>
        <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
          <p>
            <strong>BioSolution Calculator</strong> menjawab masalah nyata di laboratorium biologi:
            kesalahan perhitungan manual dalam menyiapkan larutan. Kesalahan konsentrasi, bahkan
            sebesar 5%, bisa merusak eksperimen berjam-jam. Aplikasi ini mengotomatisasi
            seluruh alur perhitungan stoikiometri secara akurat.
          </p>
          <p>
            Metode komputasi yang digunakan mencakup tiga rumus fundamental: <code className="bg-slate-100 px-1 rounded text-xs">n = m/Mr</code> untuk
            konversi massa ke mol, <code className="bg-slate-100 px-1 rounded text-xs">M = n/V</code> untuk molaritas,
            dan <code className="bg-slate-100 px-1 rounded text-xs">pH = pKa + log([A⁻]/[HA])</code> (Henderson-Hasselbalch) untuk
            kalkulasi komposisi buffer. Semua kalkulasi dijalankan oleh Python serverless functions
            dengan hasil akurat 4 desimal.
          </p>
          <p>
            Database mencakup 30 senyawa biologis umum dengan berat molekul (Mr) akurat, serta
            5 resep larutan standar laboratorium berdasarkan protokol Cold Spring Harbor / Sambrook &amp; Russell.
          </p>
        </div>
      </section>

      {/* Academic Context */}
      <section className="bg-emerald-50 rounded-xl p-6 border border-emerald-100">
        <h2 className="text-lg font-bold text-emerald-800 mb-2">📚 Konteks Akademik</h2>
        <p className="text-emerald-700 text-sm leading-relaxed">
          Aplikasi ini dikembangkan sebagai <strong>Tugas Besar Mata Kuliah Komputasi Dasar Sains (KDS)</strong>,
          topik <em>Mol, Molaritas, dan Larutan Biologis</em>. Pertanyaan penelitian yang dijawab:
          &ldquo;Bagaimana sistem kalkulasi berbasis web dapat mengotomatisasi konversi satuan stoikiometri
          dan persiapan larutan biologis standar untuk mengurangi kesalahan manusia dalam praktik laboratorium?&rdquo;
        </p>
        <p className="text-emerald-600 text-xs mt-3">
          Kelompok 6 — K02 — 2026
        </p>
      </section>
    </div>
  );
}
