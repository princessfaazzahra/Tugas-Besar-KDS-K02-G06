"use client";

import { useState } from "react";

type InfoTooltipProps = {
  text: string;
};

export default function InfoTooltip({ text }: InfoTooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative inline-flex items-center ml-1.5 align-middle">
      <button
        type="button"
        aria-label="Informasi tambahan"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="w-4 h-4 rounded-full bg-slate-200 hover:bg-emerald-500 text-slate-600 hover:text-white text-[10px] font-bold flex items-center justify-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-400"
      >
        ?
      </button>

      {visible && (
        <span
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-xl leading-relaxed pointer-events-none"
        >
          {text}
          {/* Arrow */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </span>
      )}
    </span>
  );
}
