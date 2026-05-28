import React from "react";

type BreakdownItem = {
  label: string;
  value: string;
};

type ResultCardProps = {
  title: string;
  value: string | number;
  unit?: string;
  formula?: string;
  breakdown?: BreakdownItem[];
  color?: "emerald" | "sky" | "violet";
};

const colorMap = {
  emerald: {
    border: "border-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    label: "text-emerald-600",
    value: "text-emerald-900",
    code: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  },
  sky: {
    border: "border-sky-500",
    badge: "bg-sky-50 text-sky-700 ring-sky-200",
    label: "text-sky-600",
    value: "text-sky-900",
    code: "bg-sky-50 text-sky-800 ring-sky-200",
  },
  violet: {
    border: "border-violet-500",
    badge: "bg-violet-50 text-violet-700 ring-violet-200",
    label: "text-violet-600",
    value: "text-violet-900",
    code: "bg-violet-50 text-violet-800 ring-violet-200",
  },
};

export default function ResultCard({
  title,
  value,
  unit,
  formula,
  breakdown,
  color = "emerald",
}: ResultCardProps) {
  const c = colorMap[color];

  return (
    <div
      className={`bg-white rounded-xl shadow-md border-l-4 ${c.border} p-5 space-y-4 transition-all duration-300`}
    >
      {/* Title badge */}
      <span
        className={`inline-block text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full ring-1 ${c.badge}`}
      >
        {title}
      </span>

      {/* Main value */}
      <div className="flex items-baseline gap-2">
        <span className={`text-4xl font-bold tabular-nums ${c.value}`}>
          {typeof value === "number" ? value.toLocaleString("id-ID", { maximumFractionDigits: 6 }) : value}
        </span>
        {unit && (
          <span className="text-lg font-medium text-slate-500">{unit}</span>
        )}
      </div>

      {/* Formula */}
      {formula && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Rumus
          </p>
          <code
            className={`block text-sm font-mono px-3 py-2 rounded-lg ring-1 whitespace-pre-wrap break-all ${c.code}`}
          >
            {formula}
          </code>
        </div>
      )}

      {/* Breakdown */}
      {breakdown && breakdown.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Rincian
          </p>
          <dl className="divide-y divide-slate-100">
            {breakdown.map((item, i) => (
              <div key={i} className="flex justify-between items-center py-1.5">
                <dt className={`text-sm ${c.label}`}>{item.label}</dt>
                <dd className="text-sm font-semibold text-slate-700 tabular-nums">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
