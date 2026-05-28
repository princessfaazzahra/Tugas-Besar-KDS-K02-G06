"use client";

import React, { useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface BeakerDropzoneProps {
  fillPercentage: number;
  isCompleted: boolean;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  droppedItems: string[];
  targetNama?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getFluidColor(pct: number, completed: boolean): string {
  if (completed) return "bg-gradient-to-t from-emerald-500 via-emerald-400 to-teal-300";
  if (pct < 30) return "bg-gradient-to-t from-sky-600 via-sky-400 to-cyan-300";
  if (pct < 60) return "bg-gradient-to-t from-sky-500 via-sky-400 to-teal-300";
  return "bg-gradient-to-t from-teal-500 via-teal-400 to-cyan-300";
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function BeakerDropzone({
  fillPercentage,
  isCompleted,
  onDrop,
  droppedItems,
  targetNama,
}: BeakerDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    // Only reset if leaving the beaker entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(e);
  }

  const fluidColor = getFluidColor(fillPercentage, isCompleted);

  // Graduation ticks: 0%, 20%, 40%, 60%, 80%, 100%
  const ticks = [100, 80, 60, 40, 20, 0];

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Target label */}
      {targetNama && (
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {targetNama}
        </p>
      )}

      {/* Beaker wrapper — outer row: tick labels + beaker */}
      <div className="flex items-end gap-2">
        {/* Graduation labels (left side) */}
        <div className="flex flex-col justify-between h-[240px] pb-1 pr-1 text-right">
          {ticks.map((t) => (
            <span key={t} className="text-[9px] font-mono text-slate-400 leading-none">
              {t}%
            </span>
          ))}
        </div>

        {/* The beaker */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative w-36 h-60 flex flex-col justify-end overflow-hidden select-none
            border-[3px] rounded-b-[2.5rem]
            transition-all duration-300
            ${isDragOver
              ? "border-emerald-400 shadow-xl shadow-emerald-200 scale-[1.04] bg-emerald-50/30"
              : isCompleted
                ? "border-emerald-500 shadow-lg shadow-emerald-100"
                : "border-slate-300 bg-white/50 shadow-inner"
            }
          `}
        >
          {/* Tick marks inside the beaker */}
          {[20, 40, 60, 80].map((t) => (
            <div
              key={t}
              className="absolute left-0 right-0 border-t border-dashed border-slate-200/60"
              style={{ bottom: `${t}%` }}
            />
          ))}

          {/* Fluid fill */}
          <div
            className={`
              absolute bottom-0 left-0 right-0 transition-all duration-700 ease-in-out
              ${fluidColor}
            `}
            style={{ height: `${fillPercentage}%` }}
          >
            {/* Wave surface effect */}
            {fillPercentage > 0 && (
              <div className="absolute top-0 left-0 right-0 h-3 opacity-50 overflow-hidden">
                <div
                  className="w-[200%] h-full animate-[wave_2.5s_linear_infinite]"
                  style={{
                    backgroundImage:
                      "radial-gradient(ellipse 60px 8px at 50px 8px, rgba(255,255,255,0.6) 0%, transparent 60%)",
                    backgroundRepeat: "repeat-x",
                    backgroundSize: "100px 16px",
                  }}
                />
              </div>
            )}

            {/* Bubble particles when fill is happening */}
            {fillPercentage > 0 && fillPercentage < 100 && (
              <>
                <div className="absolute bottom-2 left-3 w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDuration: "1.8s" }} />
                <div className="absolute bottom-4 left-10 w-1 h-1 bg-white/30 rounded-full animate-bounce" style={{ animationDuration: "2.2s", animationDelay: "0.4s" }} />
                <div className="absolute bottom-1 right-4 w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDuration: "2.0s", animationDelay: "0.8s" }} />
              </>
            )}
          </div>

          {/* Content overlay */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full pointer-events-none px-2 gap-2">
            {isCompleted ? (
              <>
                <div className="w-10 h-10 rounded-full bg-emerald-500/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <svg viewBox="0 0 20 20" fill="white" className="w-6 h-6">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-xs font-bold text-emerald-700 text-center bg-white/80 backdrop-blur-sm rounded-lg px-2 py-1">
                  Larutan Siap! 🎉
                </p>
              </>
            ) : isDragOver ? (
              <div className="flex flex-col items-center gap-1">
                <div className="text-2xl animate-bounce">💧</div>
                <p className="text-xs font-semibold text-emerald-600 bg-white/90 px-2 py-0.5 rounded-full">
                  Lepaskan!
                </p>
              </div>
            ) : fillPercentage === 0 ? (
              <div className="text-center">
                <div className="text-3xl mb-1 opacity-30">🧪</div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Drag bahan<br />ke sini
                </p>
              </div>
            ) : (
              <div className="bg-white/70 backdrop-blur-sm rounded-lg px-2 py-1 text-center">
                <p className="text-sm font-bold text-slate-700 font-mono">
                  {Math.round(fillPercentage)}%
                </p>
                <p className="text-[10px] text-slate-500">
                  {droppedItems.length} bahan
                </p>
              </div>
            )}
          </div>

          {/* Drag-over shimmer border */}
          {isDragOver && (
            <div className="absolute inset-0 rounded-b-[2rem] ring-4 ring-emerald-400/50 animate-pulse pointer-events-none" />
          )}
        </div>

        {/* Right side: dropped items list */}
        <div className="flex flex-col justify-end h-[240px] pl-1 pb-1 text-left">
          <div className="flex flex-col gap-1 max-h-[240px] overflow-auto">
            {droppedItems.map((item) => (
              <span
                key={item}
                className="text-[9px] font-mono bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-full whitespace-nowrap"
              >
                ✓ {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Fill percentage caption */}
      <div className="flex items-center gap-2">
        <div className="h-1 w-24 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${isCompleted ? "bg-emerald-500" : "bg-sky-400"}`}
            style={{ width: `${fillPercentage}%` }}
          />
        </div>
        <span className="text-xs font-mono text-slate-500">{Math.round(fillPercentage)}%</span>
      </div>
    </div>
  );
}
