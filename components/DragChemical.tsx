"use client";

import React from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface DragChemicalProps {
  senyawa: string;
  massa: number;
  unit: string;
  konsentrasi: number;
  kategori: string;
  isDropped: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, senyawa: string) => void;
  onTap: (senyawa: string) => void;
}

// ─── Category color map ────────────────────────────────────────────────────────

const KATEGORI_STYLE: Record<
  string,
  { bg: string; border: string; badge: string; icon: string; glow: string }
> = {
  garam: {
    bg: "bg-blue-50 hover:bg-blue-100",
    border: "border-blue-200 hover:border-blue-400",
    badge: "bg-blue-100 text-blue-700",
    icon: "🧂",
    glow: "hover:shadow-blue-200",
  },
  buffer: {
    bg: "bg-emerald-50 hover:bg-emerald-100",
    border: "border-emerald-200 hover:border-emerald-400",
    badge: "bg-emerald-100 text-emerald-700",
    icon: "🛡️",
    glow: "hover:shadow-emerald-200",
  },
  asam: {
    bg: "bg-rose-50 hover:bg-rose-100",
    border: "border-rose-200 hover:border-rose-400",
    badge: "bg-rose-100 text-rose-700",
    icon: "⚗️",
    glow: "hover:shadow-rose-200",
  },
  basa: {
    bg: "bg-purple-50 hover:bg-purple-100",
    border: "border-purple-200 hover:border-purple-400",
    badge: "bg-purple-100 text-purple-700",
    icon: "🔷",
    glow: "hover:shadow-purple-200",
  },
  chelator: {
    bg: "bg-orange-50 hover:bg-orange-100",
    border: "border-orange-200 hover:border-orange-400",
    badge: "bg-orange-100 text-orange-700",
    icon: "🔗",
    glow: "hover:shadow-orange-200",
  },
  deterjen: {
    bg: "bg-pink-50 hover:bg-pink-100",
    border: "border-pink-200 hover:border-pink-400",
    badge: "bg-pink-100 text-pink-700",
    icon: "🫧",
    glow: "hover:shadow-pink-200",
  },
  gula: {
    bg: "bg-amber-50 hover:bg-amber-100",
    border: "border-amber-200 hover:border-amber-400",
    badge: "bg-amber-100 text-amber-700",
    icon: "🍬",
    glow: "hover:shadow-amber-200",
  },
  default: {
    bg: "bg-slate-50 hover:bg-slate-100",
    border: "border-slate-200 hover:border-slate-400",
    badge: "bg-slate-100 text-slate-600",
    icon: "🧪",
    glow: "hover:shadow-slate-200",
  },
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function DragChemical({
  senyawa,
  massa,
  unit,
  konsentrasi,
  kategori,
  isDropped,
  onDragStart,
  onTap,
}: DragChemicalProps) {
  const style = KATEGORI_STYLE[kategori] ?? KATEGORI_STYLE.default;

  // Dropped state — fully completed look
  if (isDropped) {
    return (
      <div
        className="relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-emerald-300
          bg-emerald-50 opacity-60 select-none cursor-default transition-all duration-300"
        aria-label={`${senyawa} sudah ditambahkan`}
      >
        {/* Checkmark overlay */}
        <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-300">
          <svg viewBox="0 0 20 20" fill="white" className="w-5 h-5">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-emerald-700 truncate">{senyawa}</p>
          <p className="text-xs text-emerald-500">Ditambahkan ✓</p>
        </div>
        <span className="ml-auto shrink-0 text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-mono">
          {massa} {unit}
        </span>
      </div>
    );
  }

  // Normal / draggable state
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, senyawa)}
      onClick={() => onTap(senyawa)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onTap(senyawa)}
      aria-label={`Drag atau tap untuk menambahkan ${senyawa}`}
      className={`
        relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-grab active:cursor-grabbing
        select-none transition-all duration-200 group
        ${style.bg} ${style.border}
        hover:shadow-lg ${style.glow}
        hover:-translate-y-0.5 active:scale-95
      `}
    >
      {/* Category icon bubble */}
      <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 text-lg shadow-sm border border-white/80">
        {style.icon}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-800 truncate leading-tight">{senyawa}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${style.badge}`}>
            {kategori}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">{konsentrasi} mM</span>
        </div>
      </div>

      {/* Massa chip */}
      <div className="shrink-0 text-right">
        <span className="font-mono text-sm font-bold text-slate-700">{massa}</span>
        <span className="text-xs text-slate-400 ml-0.5">{unit}</span>
      </div>

      {/* Drag hint — shown on hover */}
      <div className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100
        transition-opacity duration-200 pointer-events-none">
        <span className="bg-white/80 backdrop-blur-sm text-xs text-slate-500 px-2 py-1 rounded-full shadow-sm border border-slate-200">
          Drag / Tap ↓
        </span>
      </div>
    </div>
  );
}
