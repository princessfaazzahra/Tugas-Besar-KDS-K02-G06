"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import DragChemical from "./DragChemical";
import BeakerDropzone from "./BeakerDropzone";
import PreparationProgress from "./PreparationProgress";
import senyawaData from "@/data/senyawa.json";

// ─── Types ─────────────────────────────────────────────────────────────────────

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

// ─── Category lookup from senyawa.json ────────────────────────────────────────

const SENYAWA_MAP: Record<string, string> = Object.fromEntries(
  senyawaData.senyawa.map((s) => [s.rumus, s.kategori])
);

// Additional known aliases (recipe uses display names, not always rumus)
const NAMA_KATEGORI: Record<string, string> = {
  NaCl: "garam",
  KCl: "garam",
  "Na2HPO4": "buffer",
  "KH2PO4": "buffer",
  "Tris Base": "buffer",
  "Asam Asetat": "asam",
  "EDTA Disodium": "chelator",
  "Asam Borat": "asam",
};

function getKategori(senyawa: string): string {
  return (
    NAMA_KATEGORI[senyawa] ??
    SENYAWA_MAP[senyawa] ??
    "default"
  );
}

// ─── Locked placeholder (before recipe is generated) ──────────────────────────

function SimulasiLocked() {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-3xl shadow-inner">
        🔒
      </div>
      <div>
        <p className="font-semibold text-slate-600">Simulasi Belum Aktif</p>
        <p className="text-sm text-slate-400 mt-1 max-w-xs">
          Generate resep larutan di <strong>Section A</strong> terlebih dahulu untuk membuka simulasi drag &amp; drop.
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 border border-slate-100 px-4 py-2 rounded-full">
        <span>⬆️</span>
        <span>Pilih jenis larutan → klik <strong>Generate Resep</strong></span>
      </div>
    </div>
  );
}

// ─── Main LabSimulation component ─────────────────────────────────────────────

export default function LabSimulation({ recipe }: LabSimulationProps) {
  const [droppedItems, setDroppedItems] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset everything when recipe changes
  useEffect(() => {
    setDroppedItems([]);
    setIsCompleted(false);
    setStartTime(null);
    setElapsedSeconds(0);
    setDuplicateWarning(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
  }, [recipe]);

  // Timer logic
  useEffect(() => {
    if (startTime !== null && !isCompleted) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(+(((Date.now() - startTime) / 1000).toFixed(1)));
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTime, isCompleted]);

  const handleDrop = useCallback(
    (senyawa: string) => {
      if (!recipe) return;

      // Validate that the senyawa is in the recipe
      const isValid = recipe.komponen.some((k) => k.senyawa === senyawa);
      if (!isValid) return;

      // Duplicate check
      if (droppedItems.includes(senyawa)) {
        setDuplicateWarning(`${senyawa} sudah ada di beaker!`);
        if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
        warnTimerRef.current = setTimeout(() => setDuplicateWarning(null), 2500);
        return;
      }

      // Start timer on first drop
      if (startTime === null) {
        setStartTime(Date.now());
      }

      const newDropped = [...droppedItems, senyawa];
      setDroppedItems(newDropped);

      // Check completion
      if (newDropped.length === recipe.komponen.length) {
        setIsCompleted(true);
      }
    },
    [recipe, droppedItems, startTime]
  );

  // HTML5 DnD handlers
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
    setDuplicateWarning(null);
  }

  // Derived values
  const totalKomponen = recipe?.komponen.length ?? 0;
  const fillPercentage = totalKomponen > 0 ? (droppedItems.length / totalKomponen) * 100 : 0;

  const komponenList =
    recipe?.komponen.map((k) => ({
      senyawa: k.senyawa,
      isDropped: droppedItems.includes(k.senyawa),
    })) ?? [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Section header */}
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-indigo-50">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🧬</span>
            <div>
              <h2 className="font-semibold text-slate-800">Simulasi Lab — Drag &amp; Drop</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Seret bahan kimia ke dalam beaker untuk menyiapkan larutan
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
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {!recipe ? (
          <SimulasiLocked />
        ) : (
          <div className="space-y-6">
            {/* Duplicate warning banner */}
            {duplicateWarning && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-2.5 rounded-xl animate-pulse">
                <span>⚠️</span>
                <span className="font-medium">{duplicateWarning}</span>
              </div>
            )}

            {/* Mobile instruction hint */}
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg md:hidden">
              <span>📱</span>
              <span>Di mobile: <strong>Tap</strong> bahan kimia untuk langsung memasukkannya ke beaker.</span>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg">
              <span>🖱️</span>
              <span><strong>Drag</strong> bahan kimia ke beaker, atau <strong>klik</strong> untuk memasukkan secara langsung.</span>
            </div>

            {/* Main simulation layout */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">

              {/* Left: Chemical cards */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Bahan Kimia ({totalKomponen} komponen)
                </p>
                <div className="flex flex-col gap-2">
                  {recipe.komponen.map((k) => (
                    <DragChemical
                      key={k.senyawa}
                      senyawa={k.senyawa}
                      massa={k.massa_g}
                      unit="g"
                      konsentrasi={k.konsentrasi_final_mM}
                      kategori={getKategori(k.senyawa)}
                      isDropped={droppedItems.includes(k.senyawa)}
                      onDragStart={handleDragStart}
                      onTap={handleDrop}
                    />
                  ))}
                </div>
              </div>

              {/* Center: Beaker */}
              <div className="flex flex-col items-center gap-4 shrink-0">
                <BeakerDropzone
                  fillPercentage={fillPercentage}
                  isCompleted={isCompleted}
                  onDrop={handleDropOnBeaker}
                  droppedItems={droppedItems}
                  targetNama={recipe.nama_larutan}
                />

                {/* pH badge */}
                <div className="flex items-center gap-1.5 text-xs bg-sky-50 border border-sky-200 text-sky-700 px-3 py-1.5 rounded-full">
                  <span>🎯</span>
                  <span className="font-semibold">pH Target: {recipe.ph_target}</span>
                </div>
              </div>

              {/* Right: Progress */}
              <div className="flex-1 min-w-0">
                <PreparationProgress
                  current={droppedItems.length}
                  total={totalKomponen}
                  isCompleted={isCompleted}
                  elapsedSeconds={elapsedSeconds}
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
