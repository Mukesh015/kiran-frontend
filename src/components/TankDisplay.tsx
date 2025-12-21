// src/components/TankDisplay.tsx
import TankCard from "./TankCard";
import type { Tank } from "../types";

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 animate-pulse">
      <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mt-4"></div>
    </div>
  );
}

interface TankDisplayProps {
  tanks: Tank[];
  loading?: boolean;
  error?: string | null;
  title?: string;
  subtitle?: string;
}

export default function TankDisplay({
  tanks,
  loading = false,
  error = null,
  title = "Tank Overview",
  subtitle = "Real-time status of all monitored DSP tanks.",
}: TankDisplayProps) {
  const hasTanks = Array.isArray(tanks) && tanks.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        {hasTanks && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Total Tanks:{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {tanks.length}
            </span>
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          ❌ {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      ) : !hasTanks ? (
        // Empty
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-8 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
          No tanks to display.
        </div>
      ) : (
        // Tank cards grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tanks.map((tank, index) => (
            <TankCard
              key={
                ((tank as any).device_id || "") +
                "_" +
                ((tank as any).tank_no || (tank as any).tankNo || index)
              }
              tank={tank}
            />
          ))}
        </div>
      )}
    </div>
  );
}
