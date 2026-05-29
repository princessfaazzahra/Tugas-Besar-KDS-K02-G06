"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import DragChemical from "./DragChemical";
import BeakerDropzone from "./BeakerDropzone";
import PreparationProgress from "./PreparationProgress";
import { senyawaData } from "@/lib/data-loader";

interface KomponenResult {
  senyawa: string;
  mr: number;
  massa_g: number;
  massa_mg: number;
  konsentrasi_final_mM: number;
}

interface LarutanResult {
  nama_larutan: string;
  deskripsi?: string;
  volume_akhir_ml: number;
  konsentrasi_x: number;
  ph_target: number;
  komponen: KomponenResult[];
  instruksi: string[];
}

export interface LabSimulationProps {
  recipe: LarutanResult | null;
}

interface SimChemical {
  senyawa: string;         // display name / formula
  massa?: number;          // only for real chemicals
  konsentrasi?: number;    // only for real chemicals
  kategori: string;
  isDecoy: boolean;
}

const NAMA_KATEGORI: Record<string, string> = {
  NaCl: "garam", KCl: "garam", "Na2HPO4": "buffer", "KH2PO4": "buffer",
  "Tris Base": "buffer", "Asam Asetat": "asam", "EDTA Disodium": "chelator",
  "Asam Borat": "asam",
};

function getKategori(senyawa: string): string {
  if (NAMA_KATEGORI[senyawa]) return NAMA_KATEGORI[senyawa];
  const match = senyawaData.senyawa.find(
    (s) => s.rumus === senyawa || s.nama === senyawa
  );
  return match?.kategori ?? "default";
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDecoys(recipe: LarutanResult, count: number): SimChemical[] {
  const recipeNames = new Set(recipe.komponen.map((k) => k.senyawa));
  const recipeKategori = new Set(recipe.komponen.map((k) => getKategori(k.senyawa)));

  const all = senyawaData.senyawa.filter(
    (s) => !recipeNames.has(s.rumus) && !recipeNames.has(s.nama)
  );

  // Prefer same-category decoys (harder), fall back to any
  const sameKat = all.filter((s) => recipeKategori.has(s.kategori));
  const otherKat = all.filter((s) => !recipeKategori.has(s.kategori));

  const pool = shuffle([...sameKat, ...otherKat]);
  return pool.slice(0, count).map((s) => ({
    senyawa: s.rumus,   // use the formula (like "NaCl", "HCl") as the display name
    kategori: s.kategori,
    isDecoy: true,
  }));
}

function decoyCount(recipeSize: number): number {
  if (recipeSize === 1) return 4;
  if (recipeSize === 2) return 4;
  if (recipeSize === 3) return 3;
  return 4; // 4+ components → still add 4 decoys
}

function SimulasiLocked() {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-3xl shadow-inner">
        🔒
      </div>
      <div>
        <p className="font-semibold text-slate-600">Simulasi Belum Aktif</p>
        <p className="text-sm text-slate-400 mt-1 max-w-xs">
          Generate resep larutan di <strong>Section A</strong> terlebih dahulu untuk membuka simulasi.
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 border border-slate-100 px-4 py-2 rounded-full">
        <span>⬆️</span>
        <span>Pilih larutan → klik <strong>Generate Resep</strong></span>
      </div>
    </div>
  );
}

function ScoreLegend() {
  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 space-y-2">
      <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">📋 Cara Bermain</p>
      <ul className="text-xs text-amber-700 space-y-1 list-none">
        <li>✅ Drag atau tap bahan yang <strong>benar</strong> ke dalam beaker</li>
        <li>❌ Bahan yang <strong>salah</strong> → beaker berguncang, akurasi berkurang 10%</li>
        <li>⭐ Akurasi 100% = tidak ada bahan yang salah dipilih</li>
        <li>🔢 Beberapa kartu adalah <strong>bahan pengecoh</strong> — pilih dengan teliti!</li>
      </ul>
    </div>
  );
}

export default function LabSimulation({ recipe }: LabSimulationProps) {
  const [droppedItems, setDroppedItems] = useState<string[]>([]);
  const [isCompleted, setIsCompleted]   = useState(false);
  const [startTime, setStartTime]       = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [wrongAttempts, setWrongAttempts]   = useState(0);

  const [errorCard, setErrorCard]   = useState<string | null>(null);
  const [beakerError, setBeakerError] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const intervalRef   = useRef<ReturnType<typeof setInterval>  | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout>   | null>(null);
  const warnTimerRef  = useRef<ReturnType<typeof setTimeout>   | null>(null);

  const simChemicals = useMemo<SimChemical[]>(() => {
    if (!recipe) return [];
    const realCards: SimChemical[] = recipe.komponen.map((k) => ({
      senyawa: k.senyawa,
      massa: k.massa_g,
      konsentrasi: k.konsentrasi_final_mM,
      kategori: getKategori(k.senyawa),
      isDecoy: false,
    }));
    const decoysNeeded = decoyCount(recipe.komponen.length);
    const decoys = pickDecoys(recipe, decoysNeeded);
    return shuffle([...realCards, ...decoys]);
  }, [recipe]);

  useEffect(() => {
    setDroppedItems([]);
    setIsCompleted(false);
    setStartTime(null);
    setElapsedSeconds(0);
    setWrongAttempts(0);
    setErrorCard(null);
    setBeakerError(false);
    setDuplicateWarning(null);
    if (intervalRef.current)   clearInterval(intervalRef.current);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    if (warnTimerRef.current)  clearTimeout(warnTimerRef.current);
  }, [recipe]);

  useEffect(() => {
    if (startTime !== null && !isCompleted) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(+(((Date.now() - startTime) / 1000).toFixed(1)));
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [startTime, isCompleted]);

  const handleDrop = useCallback(
    (senyawa: string) => {
      if (!recipe || isCompleted) return;

      const isCorrect = recipe.komponen.some((k) => k.senyawa === senyawa);

      if (!isCorrect) {
        setWrongAttempts((n) => n + 1);

        // Trigger beaker shake
        setBeakerError(true);
        // Trigger card error flash
        setErrorCard(senyawa);

        if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
        errorTimerRef.current = setTimeout(() => {
          setBeakerError(false);
          setErrorCard(null);
        }, 700);
        return;
      }

      if (droppedItems.includes(senyawa)) {
        setDuplicateWarning(`${senyawa} sudah ada di beaker!`);
        if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
        warnTimerRef.current = setTimeout(() => setDuplicateWarning(null), 2500);
        return;
      }

      if (startTime === null) setStartTime(Date.now());

      const newDropped = [...droppedItems, senyawa];
      setDroppedItems(newDropped);
      if (newDropped.length === recipe.komponen.length) setIsCompleted(true);
    },
    [recipe, droppedItems, startTime, isCompleted]
  );

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, senyawa: string) {
    e.dataTransfer.setData("text/plain", senyawa);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDropOnBeaker(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const senyawa = e.dataTransfer.getData("text/plain");
    if (senyawa) handleDrop(senyawa);
  }

  function handleReset() {
    setDroppedItems([]);
    setIsCompleted(false);
    setStartTime(null);
    setElapsedSeconds(0);
    setWrongAttempts(0);
    setErrorCard(null);
    setBeakerError(false);
    setDuplicateWarning(null);
  }

  const totalKomponen  = recipe?.komponen.length ?? 0;
  const fillPercentage = totalKomponen > 0 ? (droppedItems.length / totalKomponen) * 100 : 0;
  const komponenList   = recipe?.komponen.map((k) => ({
    senyawa: k.senyawa,
    isDropped: droppedItems.includes(k.senyawa),
  })) ?? [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-indigo-50">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🧬</span>
            <div>
              <h2 className="font-semibold text-slate-800">Simulasi Lab — Drag &amp; Drop</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pilih bahan yang tepat dan seret ke beaker — awas pengecoh!
              </p>
            </div>
          </div>
          {recipe && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200 px-2.5 py-1 rounded-full">
                {recipe.nama_larutan}
              </span>
              <span className="text-xs bg-slate-100 text-slate-500 border border-slate-200 px-2 py-1 rounded-full">
                {recipe.volume_akhir_ml} mL
              </span>
              <span className="text-xs bg-red-50 text-red-500 border border-red-100 px-2 py-1 rounded-full font-medium">
                {simChemicals.filter(c => c.isDecoy).length} pengecoh
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {!recipe ? (
          <SimulasiLocked />
        ) : (
          <div className="space-y-5">

            {/* How-to legend */}
            <ScoreLegend />

            {/* Duplicate warning */}
            {duplicateWarning && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-2.5 rounded-xl">
                <span>⚠️</span>
                <span className="font-medium">{duplicateWarning}</span>
              </div>
            )}

            {/* Wrong-drop flash banner */}
            {beakerError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl animate-bounce-in">
                <span>❌</span>
                <span className="font-medium">
                  Bahan <strong>{errorCard}</strong> bukan komponen larutan ini! Akurasi berkurang 10%.
                </span>
              </div>
            )}

            {/* Mobile hint */}
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg md:hidden">
              <span>📱</span>
              <span><strong>Tap</strong> kartu bahan untuk memasukkannya ke beaker.</span>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg">
              <span>🖱️</span>
              <span><strong>Drag</strong> ke beaker, atau <strong>klik</strong> untuk memasukkan langsung.</span>
            </div>

            {/* Main layout */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">

              {/* ── Left: Chemical cards (correct + decoys shuffled) ── */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Bahan Kimia ({simChemicals.length} kartu)
                  </p>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full">
                      ✓ {totalKomponen} benar
                    </span>
                    <span className="bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-full">
                      ✗ {simChemicals.filter(c => c.isDecoy).length} pengecoh
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {simChemicals.map((c) => (
                    <DragChemical
                      key={c.senyawa}
                      senyawa={c.senyawa}
                      massa={c.massa}
                      unit="g"
                      konsentrasi={c.konsentrasi}
                      kategori={c.kategori}
                      isDropped={droppedItems.includes(c.senyawa)}
                      isDecoy={c.isDecoy}
                      isError={errorCard === c.senyawa}
                      onDragStart={handleDragStart}
                      onTap={handleDrop}
                    />
                  ))}
                </div>

                {/* Reveal key after completion */}
                {isCompleted && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 animate-bounce-in">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">🔍 Kunci Jawaban</p>
                    <div className="flex flex-wrap gap-2">
                      {simChemicals.map((c) => (
                        <span key={c.senyawa}
                          className={`text-xs px-2.5 py-1 rounded-full border font-medium
                            ${c.isDecoy
                              ? "bg-red-50 text-red-500 border-red-100 line-through"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}>
                          {c.isDecoy ? "✗ " : "✓ "}{c.senyawa}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Center: Beaker ── */}
              <div className="flex flex-col items-center gap-4 shrink-0">
                <BeakerDropzone
                  fillPercentage={fillPercentage}
                  isCompleted={isCompleted}
                  hasError={beakerError}
                  onDrop={handleDropOnBeaker}
                  droppedItems={droppedItems}
                  targetNama={recipe.nama_larutan}
                />
                <div className="flex items-center gap-1.5 text-xs bg-sky-50 border border-sky-200 text-sky-700 px-3 py-1.5 rounded-full">
                  <span>🎯</span>
                  <span className="font-semibold">pH Target: {recipe.ph_target}</span>
                </div>
              </div>

              {/* ── Right: Progress + score ── */}
              <div className="flex-1 min-w-0">
                <PreparationProgress
                  current={droppedItems.length}
                  total={totalKomponen}
                  isCompleted={isCompleted}
                  elapsedSeconds={elapsedSeconds}
                  wrongAttempts={wrongAttempts}
                  komponenList={komponenList}
                  onReset={handleReset}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
