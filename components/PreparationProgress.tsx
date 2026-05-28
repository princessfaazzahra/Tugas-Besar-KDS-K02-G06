"use client";

import React from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface KomponenStep {
  senyawa: string;
  isDropped: boolean;
}

export interface PreparationProgressProps {
  current: number;
  total: number;
  isCompleted: boolean;
  elapsedSeconds: number;
  wrongAttempts: number;
  komponenList: KomponenStep[];
  onReset: () => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getBadge(seconds: number, accuracy: number): { label: string; emoji: string; color: string } {
  if (accuracy === 100 && seconds < 10) return { label: "Laboran Kilat",    emoji: "⚡", color: "text-amber-600 bg-amber-50 border-amber-200"   };
  if (accuracy === 100 && seconds < 25) return { label: "Asisten Teliti",   emoji: "🧪", color: "text-sky-600 bg-sky-50 border-sky-200"         };
  if (accuracy >= 80)                   return { label: "Praktikan Handal", emoji: "🎓", color: "text-violet-600 bg-violet-50 border-violet-200" };
  if (accuracy >= 60)                   return { label: "Masih Belajar",    emoji: "📚", color: "text-blue-600 bg-blue-50 border-blue-200"       };
  return                                       { label: "Perlu Latihan",    emoji: "💪", color: "text-orange-600 bg-orange-50 border-orange-200" };
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(1);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function PreparationProgress({
  current,
  total,
  isCompleted,
  elapsedSeconds,
  wrongAttempts,
  komponenList,
  onReset,
}: PreparationProgressProps) {
  const pct = total > 0 ? (current / total) * 100 : 0;

  // Accuracy: each wrong attempt costs 10 points, floor at 0
  const accuracy = Math.max(0, 100 - wrongAttempts * 10);
  const badge = isCompleted ? getBadge(elapsedSeconds, accuracy) : null;

  // Accuracy color
  const accuracyColor =
    accuracy === 100 ? "text-emerald-600" :
    accuracy >= 70   ? "text-sky-600"     :
    accuracy >= 40   ? "text-amber-600"   : "text-red-500";

  return (
    <div className="space-y-4">

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Progress Preparasi</p>
          <p className="text-sm font-bold text-slate-700 mt-0.5">{current} / {total} bahan benar</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">Waktu</p>
          <p className={`font-mono text-lg font-bold leading-none ${isCompleted ? "text-emerald-600" : "text-slate-600"}`}>
            {formatTime(elapsedSeconds)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out relative
            ${isCompleted ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : "bg-gradient-to-r from-sky-400 to-cyan-400"}`}
          style={{ width: `${pct}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-full" />
          {pct > 0 && pct < 100 && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-md shadow-sky-300 ring-2 ring-sky-400" />
          )}
        </div>
      </div>

      {/* Live mistake counter */}
      {wrongAttempts > 0 && !isCompleted && (
        <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg">
          <span>❌</span>
          <span>
            <strong>{wrongAttempts}</strong> kesalahan —{" "}
            akurasi saat ini: <strong>{accuracy}%</strong>
          </span>
        </div>
      )}

      {/* Step checklist */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Komponen yang diperlukan:</p>
        {komponenList.map((k, i) => (
          <div key={k.senyawa}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all duration-300
              ${k.isDropped ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-100"}`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all duration-300
              ${k.isDropped ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200" : "bg-slate-100 text-slate-400"}`}>
              {k.isDropped ? (
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : i + 1}
            </div>
            <span className={`text-sm flex-1 ${k.isDropped ? "text-emerald-700 line-through decoration-emerald-400" : "text-slate-600"}`}>
              {k.senyawa}
            </span>
            {k.isDropped && <span className="text-[10px] text-emerald-500 font-semibold">✓</span>}
          </div>
        ))}
      </div>

      {/* ── Completion panel ─────────────────────────────────────────────────── */}
      {isCompleted && badge && (
        <div className="rounded-xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 space-y-4 shadow-lg shadow-emerald-100 animate-bounce-in">
          {/* Trophy banner */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center text-2xl shadow-md">
              🏆
            </div>
            <div>
              <p className="font-bold text-emerald-800 text-base">Larutan Berhasil Disiapkan!</p>
              <p className="text-xs text-emerald-600">Semua komponen benar sudah ditambahkan.</p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Accuracy */}
            <div className="bg-white rounded-xl p-3 border border-slate-100 text-center shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-1">Akurasi</p>
              <p className={`text-xl font-bold ${accuracyColor}`}>{accuracy}%</p>
            </div>
            {/* Time */}
            <div className="bg-white rounded-xl p-3 border border-sky-100 text-center shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-1">Waktu</p>
              <p className="text-base font-bold font-mono text-sky-600">{formatTime(elapsedSeconds)}</p>
            </div>
            {/* Mistakes */}
            <div className="bg-white rounded-xl p-3 border border-red-50 text-center shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-1">Kesalahan</p>
              <p className={`text-xl font-bold ${wrongAttempts === 0 ? "text-emerald-600" : "text-red-500"}`}>
                {wrongAttempts}
              </p>
            </div>
          </div>

          {/* Perfect accuracy bonus */}
          {wrongAttempts === 0 && (
            <div className="flex items-center gap-2 bg-emerald-100 border border-emerald-200 rounded-xl px-3 py-2 text-emerald-700">
              <span className="text-lg">⭐</span>
              <p className="text-xs font-semibold">Sempurna! Tidak ada bahan yang salah dipilih.</p>
            </div>
          )}

          {/* Achievement badge */}
          <div className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 ${badge.color}`}>
            <span className="text-2xl">{badge.emoji}</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Pencapaian</p>
              <p className="font-bold text-sm">{badge.label}</p>
            </div>
          </div>

          {/* Reset */}
          <button onClick={onReset}
            className="w-full py-2.5 rounded-xl border-2 border-emerald-300 text-emerald-700 font-semibold text-sm
              hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all duration-200 flex items-center justify-center gap-2">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Ulangi Simulasi
          </button>
        </div>
      )}
    </div>
  );
}
