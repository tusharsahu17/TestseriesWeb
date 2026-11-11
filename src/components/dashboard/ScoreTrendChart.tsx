'use client';

import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import type { ScoreTrendPoint } from '../../types/dashboard';
import { formatDisplayDate } from '../../services/dashboardService';

interface ScoreTrendChartProps {
  points: ScoreTrendPoint[];
  height?: number;
}

export function ScoreTrendChart({ points, height = 210 }: ScoreTrendChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!points || points.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 py-10 text-center">
        <BarChart3 size={28} className="text-slate-300 mb-2" />
        <p className="text-xs font-medium text-slate-600">No evaluated test trend yet</p>
        <p className="mt-1 text-[11px] text-slate-400">
          Complete and evaluate tests to track your T1–T10 score trend.
        </p>
      </div>
    );
  }

  const activePoint =
    hoveredIdx !== null ? points[hoveredIdx] : points[points.length - 1];

  return (
    <div>
      {activePoint && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3.5 py-2 text-xs">
          <div className="min-w-0">
            <span className="font-bold text-indigo-600 mr-2">{activePoint.label}</span>
            <span className="font-medium text-slate-800 truncate">{activePoint.testTitle}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {activePoint.submittedAt && (
              <span className="text-[11px] text-slate-400">
                {formatDisplayDate(activePoint.submittedAt)}
              </span>
            )}
            <span className="rounded-md bg-indigo-100 px-2 py-0.5 font-bold text-indigo-700">
              {Number(activePoint.percentage).toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      <div
        className="relative flex items-end justify-between gap-2 pt-4 pb-1 px-2 border-b border-slate-200"
        style={{ height }}
      >
        {/* Horizontal reference lines */}
        <div className="pointer-events-none absolute inset-x-0 top-4 bottom-7 flex flex-col justify-between">
          {[100, 75, 50, 25].map((tick) => (
            <div key={tick} className="flex items-center gap-2 w-full">
              <span className="w-7 text-[9px] text-slate-400 text-right">{tick}%</span>
              <div className="flex-1 border-t border-dashed border-slate-200/80" />
            </div>
          ))}
        </div>

        <div className="relative z-10 flex w-full items-end justify-around gap-2 pl-8 h-full">
          {points.map((pt, idx) => {
            const pct = Math.min(100, Math.max(0, pt.percentage));
            const isActive = hoveredIdx === idx;
            const barColor =
              pct >= 80
                ? 'from-emerald-500 to-emerald-400'
                : pct >= 60
                  ? 'from-indigo-600 to-violet-500'
                  : 'from-amber-500 to-orange-400';

            return (
              <div
                key={`${pt.label}-${idx}`}
                className="flex flex-1 max-w-[44px] flex-col items-center justify-end h-full cursor-pointer group"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <span className="mb-1 text-[10px] font-semibold text-slate-600 opacity-90 group-hover:text-indigo-700">
                  {Math.round(pct)}%
                </span>
                <div className="w-full flex-1 flex items-end justify-center pb-1">
                  <div
                    className={`w-full max-w-[28px] rounded-t-lg bg-gradient-to-t ${barColor} transition-all duration-300 ${
                      isActive ? 'ring-2 ring-indigo-300 brightness-105' : 'opacity-90'
                    }`}
                    style={{ height: `${Math.max(6, pct)}%` }}
                    title={`${pt.label}: ${pt.testTitle} (${pct.toFixed(1)}%)`}
                  />
                </div>
                <span className="mt-1 text-[11px] font-semibold text-slate-500">{pt.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

