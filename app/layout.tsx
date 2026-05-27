import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "BioSolution Calculator",
  description:
    "Otomatisasi perhitungan mol, molaritas, dan persiapan larutan biologis untuk laboratorium. Tugas Besar Komputasi Dasar Sains.",
  keywords: ["molaritas", "larutan biologis", "PBS", "TAE", "TBE", "Henderson-Hasselbalch", "kimia biologi"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-slate-50 min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white py-4 text-center text-sm text-slate-500">
          Tugas Besar KDS — Kelompok 6 K02 — © 2026
        </footer>
      </body>
    </html>
  );
}
